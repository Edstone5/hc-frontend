// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { calcularIndices } from '../src/pages/hc/ExamenFisico/indicesOdonto';

describe('calcularIndices (CPO-D / CEO-D)', () => {
  it('devuelve sinDatos cuando no hay entradas', () => {
    const r = calcularIndices([]);
    expect(r.sinDatos).toBe(true);
    expect(r.cpod.total).toBe(0);
    expect(r.ceod.total).toBe(0);
  });

  it('ignora hallazgos no clasificables (ej. corona Co)', () => {
    const r = calcularIndices([{ numero_diente: 16, codigo_hallazgo: 'Co' }]);
    expect(r.sinDatos).toBe(true);
  });

  it('cuenta C, P (DEX) y O en permanentes', () => {
    const r = calcularIndices([
      { numero_diente: 16, codigo_hallazgo: 'C' },
      { numero_diente: 26, codigo_hallazgo: 'DEX' },
      { numero_diente: 36, codigo_hallazgo: 'O' },
      { numero_diente: 46, codigo_hallazgo: 'R' }, // obturado
    ]);
    expect(r.cpod).toEqual({ c: 1, p: 1, o: 2, total: 4 });
  });

  it('no cuenta dos veces el mismo diente; prioriza Cariado sobre Obturado', () => {
    const r = calcularIndices([
      { numero_diente: 16, codigo_hallazgo: 'O' },
      { numero_diente: 16, codigo_hallazgo: 'C' },
    ]);
    expect(r.cpod).toEqual({ c: 1, p: 0, o: 0, total: 1 });
  });

  it('clasifica deciduos (FDI 51-85) en CEO-D', () => {
    const r = calcularIndices([
      { numero_diente: 55, codigo_hallazgo: 'C' },
      { numero_diente: 75, codigo_hallazgo: 'DEX' },
    ]);
    expect(r.ceod).toEqual({ c: 1, e: 1, o: 0, total: 2 });
    expect(r.cpod.total).toBe(0);
  });

  it('separa permanentes de deciduos', () => {
    const r = calcularIndices([
      { numero_diente: 11, codigo_hallazgo: 'C' },
      { numero_diente: 51, codigo_hallazgo: 'C' },
    ]);
    expect(r.cpod.c).toBe(1);
    expect(r.ceod.c).toBe(1);
  });
});
