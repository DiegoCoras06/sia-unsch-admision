// API pública del módulo M12 Reportes (spec 008, Historia 2): solo lectura.
import type { Db } from '../../shared/db/prisma.js';
import { ReportQueries } from './application/report-queries.js';
import { toExcel, toPdf, type Column } from './infrastructure/exporters.js';

export const INSCRIPTION_COLUMNS: Column[] = [
  { key: 'codigo', header: 'Código', width: 11 }, { key: 'documento', header: 'Documento', width: 14 },
  { key: 'postulante', header: 'Postulante', width: 34 }, { key: 'modalidad', header: 'Modalidad', width: 13 },
  { key: 'programa', header: 'Programa', width: 34 }, { key: 'estado', header: 'Estado', width: 22 },
  { key: 'tasa', header: 'Tasa S/', width: 9 }, { key: 'pago', header: 'Pago', width: 10 }, { key: 'registrada', header: 'Registrada', width: 16 },
];

export const PAYMENT_COLUMNS: Column[] = [
  { key: 'codigo', header: 'Código', width: 11 }, { key: 'pedido', header: 'Pedido', width: 12 }, { key: 'transaccion', header: 'Transacción', width: 20 },
  { key: 'proveedor', header: 'Pasarela', width: 9 }, { key: 'estado', header: 'Estado', width: 12 }, { key: 'monto', header: 'Monto S/', width: 10 },
  { key: 'medio', header: 'Medio', width: 10 }, { key: 'operacion', header: 'Operación', width: 14 }, { key: 'tarjeta', header: 'Tarjeta', width: 20 },
  { key: 'fecha', header: 'Fecha', width: 16 },
];

export const DOSSIER_COLUMNS: Column[] = [
  { key: 'codigo', header: 'Código', width: 11 }, { key: 'postulante', header: 'Postulante', width: 34 }, { key: 'submodalidad', header: 'Submodalidad', width: 13 },
  { key: 'estado', header: 'Estado', width: 14 }, { key: 'enviado', header: 'Enviado', width: 16 }, { key: 'dictamen', header: 'Dictamen', width: 16 },
  { key: 'presencial', header: 'Presencial', width: 10 }, { key: 'nota', header: 'Nota del dictamen', width: 40 },
];

export const ATTENDANCE_COLUMNS: Column[] = [
  { key: 'examen', header: 'Examen', width: 22 }, { key: 'aula', header: 'Aula', width: 20 }, { key: 'asiento', header: 'Asiento', width: 8 },
  { key: 'codigo', header: 'Código', width: 11 }, { key: 'postulante', header: 'Postulante', width: 34 }, { key: 'asistencia', header: 'Asistencia', width: 22 },
  { key: 'ingreso', header: 'Hora de ingreso', width: 14 },
];

export function createReportesModule(db: Db) {
  return { queries: new ReportQueries(db), toExcel, toPdf };
}

export type { ReportFilter, ReportQueries } from './application/report-queries.js';
export type { Column } from './infrastructure/exporters.js';
