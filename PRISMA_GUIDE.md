# Guía Rápida de Prisma ORM para el Equipo - FreelancerHub

Este documento explica cómo funciona la base de datos con **Prisma ORM** en `freelancer_hub_backend`, qué significa cada archivo y los comandos que usarán día a día.

---

## 1. ¿Qué es Prisma ORM?

Prisma es un ORM moderno para Node.js y TypeScript que sustituye escribir consultas SQL manuales. Proporciona:
- Autocompletado tipado en TypeScript.
- Detección de errores en tiempo de compilación.
- Manejo declarativo del esquema de base de datos (`prisma/schema.prisma`).

---

## 2. Modelos creados según el Diagrama ER

El esquema se encuentra en: [`prisma/schema.prisma`](file:///run/media/paulobot/Datos/Projects/freelancer_hub/freelancer_hub_backend/prisma/schema.prisma)

### Tablas y Relaciones:

| Modelo Prisma | Tabla en PostgreSQL | Relación | Propósito |
| :--- | :--- | :--- | :--- |
| `User` | `users` | 1:1 con `Profile`<br>1:N con `PaymentMethod` | Cuentas, emails, contraseñas y proveedor de auth (Local/Google/Apple). |
| `Profile` | `profiles` | 1:1 con `User`<br>1:N con `ProfileSkill` | Nombres, bio, avatar, teléfono. |
| `Skill` | `skills` | 1:N con `ProfileSkill` | Catálogo de tecnologías (React, Node, etc.). |
| `ProfileSkill` | `profile_skills` | Join table (N:M) | Vincula las habilidades que cada perfil posee. Llave primaria compuesta `[profileId, skillId]`. |
| `PaymentMethod` | `payment_methods` | N:1 con `User` | Métodos de pago tokenizados (Stripe/gateway tokens, últimos 4 dígitos). |

---

## 3. Glosario de Atributos de Prisma

Para quienes no conocen la sintaxis de Prisma:

- `@id`: Define la llave primaria (Primary Key).
- `@default(uuid())`: Genera un UUID v4 automático si no se envía uno.
- `@unique`: Columna única en la base de datos (no permite duplicados).
- `@map("nombre_columna")`: Mapea el nombre en TypeScript (`camelCase`) al nombre de columna en PostgreSQL (`snake_case`).
- `@@map("nombre_tabla")`: Mapea el nombre del modelo al nombre real de la tabla en PostgreSQL.
- `@relation(...)`: Define la llave foránea y el comportamiento en cascada (`onDelete: Cascade`).
- `@updatedAt`: Actualiza automáticamente la fecha y hora cada vez que se modifica la fila.
- `String?`: El signo `?` indica que el campo es **opcional / nullable** (`NULL` en SQL).

---

## 4. Comandos de Prisma más utilizados

Ejecutar siempre desde la carpeta `freelancer_hub_backend`:

### A) Generar el cliente de TypeScript (después de editar el schema)
```bash
pnpm run prisma:generate
```
> Genera los tipos de TypeScript en `node_modules/@prisma/client`.

### B) Sincronizar el esquema con la base de datos de desarrollo
```bash
pnpm run prisma:push
```
> Aplica los cambios de `schema.prisma` directamente a PostgreSQL en Podman sin necesidad de crear archivos de migración manuales.

### C) Abrir Prisma Studio (Interfaz web visual para ver y editar datos)
```bash
pnpm run prisma:studio
```
> Abre un panel gráfico en el navegador (`http://localhost:5555`) para consultar, insertar y editar filas de la BD fácilmente.

---

## 5. Ejemplo de uso en código TypeScript

```typescript
import { prisma } from './infrastructure/persistence/prisma/prisma.client.js';

// 1. Crear un usuario con su perfil en una sola operación atómica:
const nuevoUsuario = await prisma.user.create({
  data: {
    email: 'freelancer@ejemplo.com',
    role: 'FREELANCER',
    profile: {
      create: {
        firstName: 'Paulo',
        lastName: 'Essau',
        bio: 'Senior Fullstack Engineer',
      },
    },
  },
  include: {
    profile: true,
  },
});

// 2. Buscar usuario con perfil y habilidades asociadas:
const usuarioConSkills = await prisma.user.findUnique({
  where: { email: 'freelancer@ejemplo.com' },
  include: {
    profile: {
      include: {
        skills: {
          include: { skill: true },
        },
      },
    },
    paymentMethods: true,
  },
});
```
