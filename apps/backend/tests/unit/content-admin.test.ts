import { describe, expect, it, jest } from '@jest/globals';
import { ContentAdmin, DEFAULT_PARAMETERS } from '../../src/modules/configuracion/application/content-admin.js';
import { fixedClock } from '../../src/shared/clock/clock.js';

type AsyncMock = ReturnType<typeof jest.fn<(input?: unknown) => Promise<unknown>>>;

function asyncMock(value?: unknown): AsyncMock {
  return jest.fn<(input?: unknown) => Promise<unknown>>(async () => value);
}

function setup() {
  const persistence = {
    announcement: {
      findMany: asyncMock([]),
      findUnique: asyncMock(null),
      create: asyncMock({ id: 'announcement-1', title: 'Aviso', type: 'COMUNICADO' }),
      update: asyncMock({ id: 'announcement-1', title: 'Aviso actualizado', type: 'COMUNICADO' }),
      delete: asyncMock({}),
    },
    contentBlock: {
      findMany: asyncMock([]),
      findUnique: asyncMock(null),
      update: asyncMock({}),
    },
    featureFlag: {
      findMany: asyncMock([]),
      findUnique: asyncMock(null),
      update: asyncMock({}),
    },
    systemParameter: {
      findMany: asyncMock([]),
      findUnique: asyncMock(null),
      upsert: asyncMock({}),
    },
    outboxEvent: {
      findMany: asyncMock([]),
      findUnique: asyncMock(null),
      update: asyncMock({}),
    },
  };
  const transaction = jest.fn<(callback: (tx: typeof persistence) => Promise<unknown>) => Promise<unknown>>(
    async (callback) => callback(persistence),
  );
  const audit = { record: jest.fn<(entry: unknown, tx?: unknown) => Promise<void>>(async () => undefined) };
  const outbox = { kick: jest.fn() };
  const service = new ContentAdmin({
    persistence: { ...persistence, $transaction: transaction } as never,
    clock: fixedClock('2026-10-25T15:00:00.000Z'),
    audit: audit as never,
    outbox: outbox as never,
  });
  return { service, persistence, transaction, audit, outbox };
}

const meta = { requestId: 'request-test', ipHash: 'ip-hash-test', userAgent: 'Jest' };

describe('Administración de contenido y configuración', () => {
  it('proyecta comunicados, bloques, funciones, parámetros y fallas sin filtrar modelos de persistencia', async () => {
    const { service, persistence } = setup();
    persistence.announcement.findMany.mockResolvedValue([
      {
        id: 'announcement-1',
        callCode: '2027-I',
        type: 'FE_ERRATAS',
        title: 'Corrección',
        bodyMd: 'Texto',
        affectsSection: 'Tasas',
        publishedAt: new Date('2026-10-25T14:00:00.000Z'),
      },
    ]);
    persistence.contentBlock.findMany.mockResolvedValue([
      { key: 'home.hero', bodyMd: 'Bienvenidos', updatedAt: new Date('2026-10-25T13:00:00.000Z') },
    ]);
    persistence.featureFlag.findMany.mockResolvedValue([
      { key: 'PAGOS', label: 'Pagos', enabled: true, linkedStageCodes: ['INSCRIPCION'] },
    ]);
    persistence.systemParameter.findMany.mockResolvedValue([
      {
        key: 'retencion.conversaciones_dias',
        value: '120',
        updatedAt: new Date('2026-10-25T12:00:00.000Z'),
      },
    ]);
    persistence.outboxEvent.findMany.mockResolvedValue([
      {
        id: 'event-1',
        eventType: 'CorreoPendiente',
        occurredAt: new Date('2026-10-25T11:00:00.000Z'),
        attempts: 3,
        lastError: 'SES no disponible',
      },
    ]);

    await expect(service.announcements()).resolves.toEqual([
      expect.objectContaining({ id: 'announcement-1', publishedAt: '2026-10-25T14:00:00.000Z' }),
    ]);
    await expect(service.blocks()).resolves.toEqual([
      { key: 'home.hero', bodyMd: 'Bienvenidos', updatedAt: '2026-10-25T13:00:00.000Z' },
    ]);
    await expect(service.flags()).resolves.toEqual([
      { key: 'PAGOS', label: 'Pagos', enabled: true, linkedStageCodes: ['INSCRIPCION'] },
    ]);
    const parameters = await service.parameters();
    expect(parameters).toContainEqual(expect.objectContaining({ key: 'retencion.conversaciones_dias', value: '120' }));
    expect(parameters).toContainEqual(expect.objectContaining({ key: 'retencion.inscripciones_anios', value: '5' }));
    await expect(service.failures()).resolves.toEqual([
      expect.objectContaining({ id: 'event-1', occurredAt: '2026-10-25T11:00:00.000Z' }),
    ]);
  });

  it('resuelve el valor persistido, el valor predeterminado y una clave desconocida', async () => {
    const { service, persistence } = setup();
    persistence.systemParameter.findUnique
      .mockResolvedValueOnce({ value: '30' })
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null);

    await expect(service.parameter('retencion.conversaciones_dias')).resolves.toBe('30');
    await expect(service.parameter('retencion.inscripciones_anios')).resolves.toBe('5');
    await expect(service.parameter('desconocido')).resolves.toBe('');
  });

  it('rechaza entradas inválidas y recursos inexistentes antes de mutar datos', async () => {
    const { service, persistence, transaction } = setup();

    await expect(
      service.saveAnnouncement({ type: 'FE_ERRATAS', title: 'Corrección', bodyMd: 'Texto' }, 'admin-1', meta),
    ).rejects.toMatchObject({ status: 400, code: 'VALIDATION_ERROR' });
    await expect(
      service.saveAnnouncement({ id: 'missing', type: 'COMUNICADO', title: 'Aviso', bodyMd: 'Texto' }, 'admin-1', meta),
    ).rejects.toMatchObject({ status: 404 });
    await expect(service.deleteAnnouncement('missing', 'admin-1', meta)).rejects.toMatchObject({ status: 404 });
    await expect(service.saveBlock('missing', 'Texto', 'admin-1', meta)).rejects.toMatchObject({ status: 404 });
    await expect(service.setFlag('missing', true, 'admin-1', meta)).rejects.toMatchObject({ status: 404 });
    await expect(service.setParameter('retencion.auditoria', '1', 'admin-1', meta)).rejects.toMatchObject({
      status: 400,
    });
    await expect(service.setParameter('desconocido', '1', 'admin-1', meta)).rejects.toMatchObject({ status: 400 });
    for (const value of ['0', '1.5', '3651', 'texto']) {
      await expect(service.setParameter('retencion.conversaciones_dias', value, 'admin-1', meta)).rejects.toMatchObject(
        { status: 400 },
      );
    }
    await expect(service.retry('missing', 'admin-1', meta)).rejects.toMatchObject({ status: 404 });
    persistence.outboxEvent.findUnique.mockResolvedValue({ processedAt: new Date(), eventType: 'Procesado' });
    await expect(service.retry('processed', 'admin-1', meta)).rejects.toMatchObject({ status: 404 });
    expect(transaction).toHaveBeenCalledTimes(1);
  });

  it('crea y actualiza comunicados con datos normalizados y auditoría', async () => {
    const { service, persistence, audit } = setup();

    await expect(
      service.saveAnnouncement({ type: 'COMUNICADO', title: '  Aviso  ', bodyMd: '  Contenido  ' }, 'admin-1', meta),
    ).resolves.toEqual({ id: 'announcement-1' });
    expect(persistence.announcement.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        title: 'Aviso',
        bodyMd: 'Contenido',
        publishedAt: new Date('2026-10-25T15:00:00.000Z'),
      }),
    });

    persistence.announcement.findUnique.mockResolvedValue({ title: 'Anterior' });
    await expect(
      service.saveAnnouncement(
        {
          id: 'announcement-1',
          callCode: '2027-I',
          type: 'FE_ERRATAS',
          title: 'Actualizado',
          bodyMd: 'Nuevo texto',
          affectsSection: 'Cronograma',
          publishedAt: '2026-11-01T10:00:00.000Z',
        },
        'admin-1',
        meta,
      ),
    ).resolves.toEqual({ id: 'announcement-1' });
    expect(persistence.announcement.update).toHaveBeenCalled();
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'announcement.updated', before: { title: 'Anterior' } }),
      persistence,
    );
  });

  it('elimina y actualiza contenido, funciones, parámetros y reintentos con auditoría', async () => {
    const { service, persistence, audit, outbox } = setup();
    persistence.announcement.findUnique.mockResolvedValue({ title: 'Aviso', bodyMd: 'Texto' });
    persistence.contentBlock.findUnique.mockResolvedValue({ bodyMd: 'Anterior' });
    persistence.featureFlag.findUnique.mockResolvedValue({ enabled: false });
    persistence.systemParameter.findUnique.mockResolvedValue({ value: '90' });
    persistence.outboxEvent.findUnique.mockResolvedValue({ processedAt: null, eventType: 'CorreoPendiente' });

    await expect(service.deleteAnnouncement('announcement-1', 'admin-1', meta)).resolves.toBeUndefined();
    await expect(service.saveBlock('home.hero', 'Nuevo', 'admin-1', meta)).resolves.toBeUndefined();
    await expect(service.setFlag('PAGOS', true, 'admin-1', meta)).resolves.toBeUndefined();
    await expect(
      service.setParameter('retencion.conversaciones_dias', '120', 'admin-1', meta),
    ).resolves.toBeUndefined();
    await expect(service.retry('event-1', 'admin-1', meta)).resolves.toBeUndefined();

    expect(persistence.announcement.delete).toHaveBeenCalledWith({ where: { id: 'announcement-1' } });
    expect(persistence.contentBlock.update).toHaveBeenCalledWith({
      where: { key: 'home.hero' },
      data: { bodyMd: 'Nuevo' },
    });
    expect(persistence.featureFlag.update).toHaveBeenCalledWith({ where: { key: 'PAGOS' }, data: { enabled: true } });
    expect(persistence.systemParameter.upsert).toHaveBeenCalledWith({
      where: { key: 'retencion.conversaciones_dias' },
      create: expect.objectContaining({
        value: '120',
        label: DEFAULT_PARAMETERS['retencion.conversaciones_dias']!.label,
      }),
      update: { value: '120', updatedBy: 'admin-1' },
    });
    expect(persistence.outboxEvent.update).toHaveBeenCalledWith({ where: { id: 'event-1' }, data: { attempts: 0 } });
    expect(outbox.kick).toHaveBeenCalledTimes(1);
    expect(audit.record).toHaveBeenCalledWith(expect.objectContaining({ action: 'integration.retry' }), persistence);
  });
});
