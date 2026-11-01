/** Postulante apto a distribuir (RF-07.05). */
export interface Candidate {
  applicantCode: string;
  surname: string;
  firstNames: string;
  area: string;
  needsAccessible: boolean;
}

/** Aula habilitada para el examen, ya ordenada por el llamador si se desea otro criterio. */
export interface Seatable {
  id: string;
  gate: string;
  building: string;
  floor: number;
  code: string;
  capacity: number;
  accessible: boolean;
}

export interface Seat {
  applicantCode: string;
  roomId: string;
  seat: number;
}

export type DistributionResult =
  | { ok: true; seats: Seat[]; occupancy: { roomId: string; used: number; capacity: number }[] }
  | { ok: false; reason: 'CAPACITY' | 'ACCESSIBLE_CAPACITY'; missing: number };

const collator = new Intl.Collator('es', { sensitivity: 'base' });

/** Orden de llenado de aulas: puerta, pabellón, piso y código (los grupos quedan juntos y cerca de su puerta). */
export function roomOrder(a: Seatable, b: Seatable): number {
  return collator.compare(a.gate, b.gate) || collator.compare(a.building, b.building) || a.floor - b.floor || collator.compare(a.code, b.code);
}

/** Orden de los postulantes: área académica y luego apellidos y nombres (Art. 23, supuesto de la spec 006). */
export function candidateOrder(a: Candidate, b: Candidate): number {
  return collator.compare(a.area, b.area) || collator.compare(a.surname, b.surname) || collator.compare(a.firstNames, b.firstNames) || a.applicantCode.localeCompare(b.applicantCode);
}

/**
 * Distribución automática (spec 006, Historia 3; RF-08.03, RF-08.04).
 * 1. Quienes pidieron adecuación van primero a aulas accesibles (Historia 2, escenario 2).
 * 2. El resto, por área y orden alfabético, llena las aulas en orden sin pasar su capacidad.
 * Todo o nada: si no alcanzan los asientos no asigna a nadie y dice cuántos faltan (Historia 3, escenario 2).
 * Función pura: el mismo insumo produce siempre la misma distribución.
 */
export function distribute(candidates: Candidate[], rooms: Seatable[]): DistributionResult {
  const unique = [...new Map(candidates.map((c) => [c.applicantCode, c])).values()];
  const ordered = [...rooms].filter((r) => r.capacity > 0).sort(roomOrder);
  const total = ordered.reduce((s, r) => s + r.capacity, 0);
  if (unique.length > total) return { ok: false, reason: 'CAPACITY', missing: unique.length - total };

  const used = new Map(ordered.map((r) => [r.id, 0]));
  const seats: Seat[] = [];
  const place = (c: Candidate, room: Seatable) => {
    const n = used.get(room.id)! + 1;
    used.set(room.id, n);
    seats.push({ applicantCode: c.applicantCode, roomId: room.id, seat: n });
  };

  const needy = unique.filter((c) => c.needsAccessible).sort(candidateOrder);
  const accessible = ordered.filter((r) => r.accessible);
  const accessibleSeats = accessible.reduce((s, r) => s + r.capacity, 0);
  if (needy.length > accessibleSeats) return { ok: false, reason: 'ACCESSIBLE_CAPACITY', missing: needy.length - accessibleSeats };
  let i = 0;
  for (const c of needy) {
    while (used.get(accessible[i]!.id)! >= accessible[i]!.capacity) i++;
    place(c, accessible[i]!);
  }

  let j = 0;
  for (const c of unique.filter((x) => !x.needsAccessible).sort(candidateOrder)) {
    while (used.get(ordered[j]!.id)! >= ordered[j]!.capacity) j++;
    place(c, ordered[j]!);
  }
  return { ok: true, seats, occupancy: ordered.map((r) => ({ roomId: r.id, used: used.get(r.id)!, capacity: r.capacity })) };
}
