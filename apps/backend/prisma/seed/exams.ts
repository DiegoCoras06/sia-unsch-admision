// Semilla de M07/M08 (spec 006): sede, aulas y los dos exámenes del cronograma 2027-I.
// Pabellones, pisos y capacidades son ILUSTRATIVOS (no tenemos el inventario oficial de aulas):
// la Dirección de Admisión los ajusta en el panel. Las ventanas de ingreso son las del Art. 25 (RN-36).

export const venue = { code: 'CU', name: 'Ciudad Universitaria UNSCH', address: 'Ciudad Universitaria de la UNSCH, Huamanga, Ayacucho' };

const BUILDINGS = ['A', 'B', 'C', 'D', 'E', 'F'];
export const rooms = BUILDINGS.flatMap((b, i) =>
  [1, 2, 3].flatMap((floor) =>
    [1, 2, 3, 4, 5].map((n) => ({
      building: `Pabellón ${b}`,
      floor,
      code: `${b}-${floor}0${n}`,
      capacity: 40,
      gate: i < 3 ? 'Puerta 1' : 'Puerta 2',
      // Primer piso con rampa: aulas accesibles para quien pidió adecuación (RN-39).
      accessible: floor === 1,
    })),
  ),
);

export const exams = [
  {
    code: 'EXO', name: 'Examen de Exonerados', modalities: ['EXO'],
    entryOpensAt: '2026-11-15T07:00:00-05:00', entryClosesAt: '2026-11-15T08:30:00-05:00', durationMinutes: 180,
  },
  {
    code: 'ORD', name: 'Examen Ordinario', modalities: ['ORD'],
    entryOpensAt: '2026-11-22T06:30:00-05:00', entryClosesAt: '2026-11-22T08:30:00-05:00', durationMinutes: 180,
  },
];
