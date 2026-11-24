import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import crypto from 'node:crypto';
import { Wallet } from '../src/domain/entities/wallet.entity.js';

describe('FLH-BE-DELIVERY & FLH-BE-RELEASE: Entregas SHA-256 y Liberación Escrow', () => {
  it('1. Debe calcular correctamente la comisión del 10% y el neto transferido', () => {
    const grossAmount = 1600;
    const { gross, fee, net } = Wallet.calculateServiceFee(grossAmount);

    assert.equal(gross, 1600);
    assert.equal(fee, 160); // 10% de comisión
    assert.equal(net, 1440); // 90% para el freelancer
    assert.equal(gross, fee + net);
  });

  it('2. Debe generar un hash criptográfico SHA-256 válido e inmutable de 64 caracteres', () => {
    const fileBuffer = Buffer.from('Contenido de prueba del entregable de hito técnico');
    const hash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

    assert.equal(hash.length, 64);
    assert.match(hash, /^[a-f0-9]{64}$/);

    // Mismo buffer debe arrojar idéntico hash (inmutabilidad)
    const hash2 = crypto.createHash('sha256').update(fileBuffer).digest('hex');
    assert.equal(hash, hash2);
  });

  it('3. Debe detectar alteraciones si el archivo es modificado (prueba de integridad)', () => {
    const fileOriginal = Buffer.from('Versión original aprobada');
    const fileModificado = Buffer.from('Versión alterada');

    const hashOrig = crypto.createHash('sha256').update(fileOriginal).digest('hex');
    const hashMod = crypto.createHash('sha256').update(fileModificado).digest('hex');

    assert.notEqual(hashOrig, hashMod);
  });
});
