import { describe, expect, it } from 'vitest';
import { distribute, type Candidate, type Seatable } from '../../../src/modules/examenes/domain/distribution.js';
import { codeFromScan, occupiedWindow, overlaps } from '../../../src/modules/examenes/domain/exam-rules.js';

const room = (id: string, capacity: number, extra: Partial<Seatable> = {}): Seatable => ({ id, gate: 'Puerta 1', building: 'Pabellón A', floor: 1, code: id, capacity, accessible: false, ...extra });
const person = (n: number, extra: Partial<Candidate> = {}): Candidate => ({
  applicantCode: String(27000000 + n), surname: `APELLIDO${String(n).padStart(4, '0')}`, firstNames: 'NOMBRE', area: ['I', 'II', 'III'][n % 3]!, needsAccessible: false, ...extra,
});

describe('Distribución automática (spec 006, Historia 3)', () => {
  it('934 aptos en aulas de 1 000 asientos: cada uno con un asiento y ninguna aula con sobrecupo (H3-1, SC-002)', () => {
    const rooms = Array.from({ length: 25 }, (_, i) => room(`R${String(i).padStart(2, '0')}`, 40));
    const people = Array.from({ length: 934 }, (_, i) => person(i));
    const r = distribute(people, rooms);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.seats).toHaveLength(934);
    expect(new Set(r.seats.map((s) => s.applicantCode)).size).toBe(934);
    expect(new Set(r.seats.map((s) => `${s.roomId}:${s.seat}`)).size).toBe(934);
    for (const o of r.occupancy) expect(o.used).toBeLessThanOrEqual(o.capacity);
  });

  it('capacidad insuficiente: no asigna a nadie y dice cuántos asientos faltan (H3-2)', () => {
    const r = distribute(Array.from({ length: 105 }, (_, i) => person(i)), [room('A', 50), room('B', 50)]);
    expect(r).toEqual({ ok: false, reason: 'CAPACITY', missing: 5 });
  });

  it('quien pidió adecuación va primero a un aula accesible (H2-2)', () => {
    const people = [...Array.from({ length: 30 }, (_, i) => person(i)), person(99, { needsAccessible: true, surname: 'ZZZ' })];
    const r = distribute(people, [room('ALTA', 40, { floor: 3, building: 'Pabellón A' }), room('BAJA', 40, { floor: 1, building: 'Pabellón B', accessible: true })]);
    expect(r.ok && r.seats.find((s) => s.applicantCode === '27000099')?.roomId).toBe('BAJA');
  });

  it('postulante duplicado en la entrada: un solo asiento (RF-08.04)', () => {
    const r = distribute([person(1), person(1), person(2)], [room('A', 10)]);
    expect(r.ok && r.seats.length).toBe(2);
  });

  it('agrupa por área y orden alfabético, y es determinista', () => {
    const people = [person(3, { area: 'II', surname: 'BETA' }), person(1, { area: 'I', surname: 'ZETA' }), person(2, { area: 'I', surname: 'ALFA' })];
    const a = distribute(people, [room('A', 2), room('B', 2)]);
    const b = distribute([...people].reverse(), [room('B', 2), room('A', 2)]);
    expect(a).toEqual(b);
    expect(a.ok && a.seats.map((s) => s.applicantCode)).toEqual(['27000002', '27000001', '27000003']);
  });
});

describe('Reglas del examen', () => {
  it('detecta cruces de horario por la ventana ocupada (RF-07.07)', () => {
    const ord = occupiedWindow({ entryOpensAt: new Date('2026-11-22T06:30:00-05:00'), entryClosesAt: new Date('2026-11-22T08:30:00-05:00'), durationMinutes: 180 });
    const same = occupiedWindow({ entryOpensAt: new Date('2026-11-22T10:00:00-05:00'), entryClosesAt: new Date('2026-11-22T11:00:00-05:00'), durationMinutes: 60 });
    const later = occupiedWindow({ entryOpensAt: new Date('2026-11-22T12:00:00-05:00'), entryClosesAt: new Date('2026-11-22T12:30:00-05:00'), durationMinutes: 60 });
    expect(overlaps(ord, same)).toBe(true);
    expect(overlaps(ord, later)).toBe(false);
  });

  it('lee el código desde el enlace del QR, un token o el código escrito', () => {
    expect(codeFromScan('https://admision.example/admin/asistencia?c=27000017.AbC-12_x')).toBe('27000017');
    expect(codeFromScan('27000017.AbC')).toBe('27000017');
    expect(codeFromScan(' 27000017 ')).toBe('27000017');
    expect(codeFromScan('2700001')).toBeNull();
  });
});
