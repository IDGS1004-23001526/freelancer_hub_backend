import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import type { Server } from 'node:http';
import express from 'express';
import { createApp } from '../app.js';
import {
  PASSWORD_REGEX,
  passwordSchema,
  registerSchema,
} from '../application/validation/auth.schemas.js';
import {
  BcryptPasswordHasher,
  redactSensitiveData,
} from '../infrastructure/security/bcrypt-password-hasher.js';
import { authRateLimiter, createRateLimiter } from '../presentation/middlewares/rate-limit.middleware.js';
import { Container } from '../container.js';
import { Email } from '../domain/value-objects/email.vo.js';
import { UserRole } from '../domain/value-objects/user-role.enum.js';

/**
 * Helper ligero para realizar peticiones HTTP reales contra la app Express en pruebas de integración.
 */
async function sendHttpRequest(
  server: Server,
  path: string,
  options: {
    method?: string;
    headers?: Record<string, string>;
    body?: unknown;
  } = {}
): Promise<{ status: number; headers: Headers; body: Record<string, unknown> }> {
  const address = server.address();
  if (!address || typeof address === 'string') {
    throw new Error('El servidor de pruebas no tiene un puerto asignado');
  }

  const response = await fetch(`http://127.0.0.1:${address.port}${path}`, {
    method: options.method ?? 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const body = (await response.json()) as Record<string, unknown>;
  return {
    status: response.status,
    headers: response.headers,
    body,
  };
}

describe('Security & Quality Suite - Auth / Register Flow (OWASP)', () => {
  describe('1. Validación de Contraseña (Regex) y Esquemas DTO (Zod + Sanitización)', () => {
    it('debe rechazar contraseñas débiles o inválidas según la regex estricta', () => {
      const weakPasswords = [
        '', // Vacía
        'Ab1', // Menos de 8 caracteres (3 chars)
        'Pass123', // Menos de 8 caracteres (7 chars)
        'SoloLetrasSinNumeros', // Sin números
        '1234567890', // Sin letras
        '       1a', // Relleno con espacios en blanco
        'Pass123\n456', // Con salto de línea / carácter de control
      ];

      for (const invalidPassword of weakPasswords) {
        const result = passwordSchema.safeParse(invalidPassword);
        assert.equal(
          result.success,
          false,
          `Se esperaba que la contraseña débil "${invalidPassword}" fuera rechazada`
        );
        assert.equal(PASSWORD_REGEX.test(invalidPassword), false);
      }
    });

    it('debe aceptar contraseñas válidas con mínimo 8 caracteres, 1 letra y 1 número', () => {
      const validPasswords = [
        'Password1',
        'segura123',
        'A1b2c3d4',
        'Owasp#2026Secure99',
      ];

      for (const validPassword of validPasswords) {
        const result = passwordSchema.safeParse(validPassword);
        assert.equal(
          result.success,
          true,
          `Se esperaba que la contraseña "${validPassword}" fuera aceptada`
        );
        assert.equal(PASSWORD_REGEX.test(validPassword), true);
      }
    });

    it('debe sanitizar entradas en el DTO de registro para prevenir XSS e inyecciones', () => {
      const rawPayload = {
        email: '  ADMIN.User@Example.COM  ',
        password: 'SecurePassword123',
        fullName: '  <script>alert("xss")</script> Karla   Desarrolladora $; ',
        role: UserRole.FREELANCER,
      };

      const parsed = registerSchema.parse(rawPayload);

      assert.equal(parsed.email, 'admin.user@example.com');
      assert.equal(parsed.fullName, 'alert(xss) Karla Desarrolladora');
      assert.ok(!parsed.fullName.includes('<script>'));
      assert.ok(!parsed.fullName.includes(';'));
      assert.ok(!parsed.fullName.includes('$'));
    });

    it('debe rechazar propiedades no declaradas en el DTO (protección Mass Assignment)', () => {
      const maliciousPayload = {
        email: 'hacker@example.com',
        password: 'ValidPassword123',
        fullName: 'Hacker User',
        role: UserRole.CLIENT,
        isVerified: true, // Intento de inyección de propiedad interna
      };

      const result = registerSchema.safeParse(maliciousPayload);
      assert.equal(result.success, false);
    });
  });

  describe('2. Hashing Seguro (Bcrypt >= 10 rounds) y Protección de Contraseña en Texto Plano', () => {
    it('debe exigir un cost factor (salt rounds) >= 10 siguiendo OWASP', () => {
      assert.throws(
        () => new BcryptPasswordHasher(9),
        /saltRounds debe ser un entero >= 10/
      );

      const hasher = new BcryptPasswordHasher(10);
      assert.equal(hasher.costFactor, 10);
    });

    it('debe generar un hash Bcrypt válido, unidireccional y verificable sin exponer texto plano', async () => {
      const hasher = new BcryptPasswordHasher(10);
      const plainPassword = 'MySuperSecretPassword2026';

      const hash1 = await hasher.hash(plainPassword);
      const hash2 = await hasher.hash(plainPassword);

      // Formato estándar modular crypt de Bcrypt ($2a$ o $2b$ con cost factor 10)
      assert.match(hash1, /^\$2[abxy]\$10\$.{53}$/);
      assert.notEqual(hash1, plainPassword);
      // Dos hashes de la misma contraseña deben ser distintos por el salt aleatorio
      assert.notEqual(hash1, hash2);

      // Verificación positiva y negativa
      assert.equal(await hasher.compare(plainPassword, hash1), true);
      assert.equal(await hasher.compare('WrongPassword123', hash1), false);
    });

    it('nunca debe exponer la contraseña en texto plano ni el hash en la respuesta HTTP, DTO o logs', async () => {
      authRateLimiter.reset();
      const app = createApp();
      const server = app.listen(0);

      try {
        const plainPassword = 'PlainTextSecret99';
        const email = `security.test.${Date.now()}@freelancerhub.io`;

        const response = await sendHttpRequest(server, '/api/v1/auth/register', {
          body: {
            email,
            password: plainPassword,
            fullName: 'Usuario Seguridad',
            role: UserRole.FREELANCER,
          },
        });

        assert.equal(response.status, 201);

        // 1. Verificar que el payload final de respuesta nunca contiene la contraseña en texto plano ni passwordHash
        const serializedResponse = JSON.stringify(response.body);
        assert.ok(
          !serializedResponse.includes(plainPassword),
          'La contraseña en texto plano jamás debe aparecer en la respuesta HTTP'
        );
        assert.ok(
          !serializedResponse.includes('passwordHash'),
          'El campo passwordHash jamás debe exponerse en el DTO de respuesta'
        );
        assert.ok(
          !serializedResponse.includes('password'),
          'El campo password jamás debe exponerse en el DTO de respuesta'
        );

        // 2. Verificar que en la base de datos/repositorio solo persiste el hash Bcrypt y no el texto plano
        const storedUser = await Container.userRepository.findByEmail(new Email(email));
        assert.ok(storedUser, 'El usuario debe existir en persistencia');
        assert.notEqual(storedUser.passwordHash, plainPassword);
        assert.match(storedUser.passwordHash, /^\$2[abxy]\$\d{2}\$.{53}$/);

        // 3. Verificar que al serializar la entidad User o redactar logs no se filtra el hash ni el texto plano
        const serializedEntity = JSON.stringify(storedUser);
        assert.ok(!serializedEntity.includes(plainPassword));
        assert.ok(!serializedEntity.includes(storedUser.passwordHash));

        const redactedLog = redactSensitiveData({
          email,
          password: plainPassword,
          nested: { passwordHash: storedUser.passwordHash },
        });
        assert.equal(redactedLog.password, '[REDACTED]');
        assert.equal(
          (redactedLog.nested as Record<string, unknown>).passwordHash,
          '[REDACTED]'
        );
      } finally {
        server.close();
      }
    });
  });

  describe('3. Rate Limiting (Máximo 5 intentos por IP cada 15 minutos -> HTTP 429)', () => {
    beforeEach(() => {
      authRateLimiter.reset();
    });

    it('debe permitir 5 intentos y bloquear el 6.° intento desde la misma IP con HTTP 429 Too Many Requests', async () => {
      const app = createApp();
      const server = app.listen(0);
      const clientIp = '203.0.113.77';

      try {
        // Realizar los primeros 5 intentos dentro de la ventana de 15 minutos
        for (let attempt = 1; attempt <= 5; attempt++) {
          const res = await sendHttpRequest(server, '/api/v1/auth/register', {
            headers: { 'X-Forwarded-For': clientIp },
            body: {
              email: `attempt${attempt}.${Date.now()}@freelancerhub.io`,
              password: 'ValidPassword123',
              fullName: `Usuario Intento ${attempt}`,
              role: UserRole.CLIENT,
            },
          });

          assert.equal(
            res.status,
            201,
            `El intento #${attempt} debería ser permitido con HTTP 201`
          );
          assert.equal(res.headers.get('ratelimit-limit'), '5');
          assert.equal(res.headers.get('ratelimit-remaining'), String(5 - attempt));
        }

        // El 6.° intento desde la misma IP debe ser bloqueado inmediatamente con HTTP 429
        const sixthAttempt = await sendHttpRequest(server, '/api/v1/auth/register', {
          headers: { 'X-Forwarded-For': clientIp },
          body: {
            email: `attempt6.${Date.now()}@freelancerhub.io`,
            password: 'ValidPassword123',
            fullName: 'Usuario Bloqueado',
            role: UserRole.CLIENT,
          },
        });

        assert.equal(sixthAttempt.status, 429);
        assert.equal(sixthAttempt.body.statusCode, 429);
        assert.equal(sixthAttempt.body.error, 'TooManyRequests');
        assert.ok(sixthAttempt.headers.get('retry-after'));

        // Una dirección IP distinta no debe verse afectada por el bloqueo
        const differentIpAttempt = await sendHttpRequest(server, '/api/v1/auth/register', {
          headers: { 'X-Forwarded-For': '198.51.100.99' },
          body: {
            email: `other.ip.${Date.now()}@freelancerhub.io`,
            password: 'ValidPassword123',
            fullName: 'Usuario Otra IP',
            role: UserRole.CLIENT,
          },
        });

        assert.equal(differentIpAttempt.status, 201);
      } finally {
        server.close();
      }
    });

    it('debe restablecer el contador de intentos una vez expirada la ventana de tiempo', async () => {
      const shortWindowLimiter = createRateLimiter({
        windowMs: 250, // 250ms para simular expiración de ventana en test unitario
        maxRequests: 5,
      });

      const app = express();
      app.post('/test-rate-limit', shortWindowLimiter, (_req, res) => {
        res.status(200).json({ ok: true });
      });

      const server = app.listen(0);
      try {
        for (let i = 1; i <= 5; i++) {
          const r = await sendHttpRequest(server, '/test-rate-limit');
          assert.equal(r.status, 200);
        }

        const blocked = await sendHttpRequest(server, '/test-rate-limit');
        assert.equal(blocked.status, 429);

        // Esperar a que venza la ventana de 250ms
        await new Promise((resolve) => setTimeout(resolve, 300));

        const afterReset = await sendHttpRequest(server, '/test-rate-limit');
        assert.equal(afterReset.status, 200);
      } finally {
        server.close();
      }
    });
  });
});
