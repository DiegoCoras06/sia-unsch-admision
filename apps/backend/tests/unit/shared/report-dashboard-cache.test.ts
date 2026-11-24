import { describe, expect, it, jest } from '@jest/globals';
import type { Db } from '../../../src/shared/db/prisma.js';
import { ReportQueries } from '../../../src/modules/reportes/application/report-queries.js';

describe('ReportQueries: caché breve del dashboard', () => {
  it('comparte las agregaciones para el mismo filtro y permisos', async () => {
    const reports = new ReportQueries({} as Db, 15_000);
    const inscriptions = jest.spyOn(reports, 'inscriptionStats').mockResolvedValue({} as never);
    const dossiers = jest.spyOn(reports, 'dossierStats').mockResolvedValue([]);
    const exams = jest.spyOn(reports, 'examStats').mockResolvedValue([]);
    const results = jest.spyOn(reports, 'resultStats').mockResolvedValue({} as never);
    const permissions = { inscripciones: true, pagos: false, asistente: false, casos: false };

    const [first, second] = await Promise.all([
      reports.dashboard({ modality: 'ORD' }, permissions),
      reports.dashboard({ modality: 'ORD' }, permissions),
    ]);
    const third = await reports.dashboard({ modality: 'ORD' }, permissions);

    expect(second).toBe(first);
    expect(third).toBe(first);
    expect(inscriptions).toHaveBeenCalledTimes(1);
    expect(dossiers).toHaveBeenCalledTimes(1);
    expect(exams).toHaveBeenCalledTimes(1);
    expect(results).toHaveBeenCalledTimes(1);
  });

  it('no mezcla filtros ni permisos diferentes', async () => {
    const reports = new ReportQueries({} as Db, 15_000);
    const inscriptions = jest.spyOn(reports, 'inscriptionStats').mockResolvedValue({} as never);
    jest.spyOn(reports, 'dossierStats').mockResolvedValue([]);
    jest.spyOn(reports, 'examStats').mockResolvedValue([]);
    jest.spyOn(reports, 'resultStats').mockResolvedValue({} as never);

    await reports.dashboard({ modality: 'ORD' }, { inscripciones: true, pagos: false, asistente: false, casos: false });
    await reports.dashboard({ modality: 'EXO' }, { inscripciones: true, pagos: false, asistente: false, casos: false });
    await reports.dashboard({ modality: 'EXO' }, { inscripciones: false, pagos: false, asistente: false, casos: false });

    expect(inscriptions).toHaveBeenCalledTimes(2);
  });
});
