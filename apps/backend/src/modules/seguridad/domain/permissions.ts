/**
 * Permisos del panel por rol (ADR-018, spec 008 Historia 3). Es la fuente de verdad: la semilla
 * copia estos roles y permisos a la base para listarlos; el servidor decide con esta tabla.
 */
export const PERMISSIONS = {
  'panel.ver': 'Entrar al panel e indicadores básicos',
  'reportes.inscripciones': 'Indicadores y reportes de inscripciones',
  'reportes.pagos': 'Indicadores y reportes de pagos',
  'inscripciones.ver': 'Ver inscripciones',
  'inscripciones.anular': 'Anular inscripciones',
  'pagos.ver': 'Ver pagos y transacciones',
  'convocatoria.gestionar': 'Etapas, tasas, vacantes y copia de convocatoria',
  'contenido.gestionar': 'Comunicados, contenido del portal y funciones por etapa',
  'inhabilitados.gestionar': 'Registro de inhabilitados',
  'casos.gestionar': 'Casos de atención y denuncias',
  'asistente.gestionar': 'Base de conocimientos y uso del asistente',
  'expedientes.evaluar': 'Revisar y dictaminar expedientes de exonerados',
  'expedientes.asignar': 'Ver todos los expedientes y asignarlos a evaluadores',
  'examenes.gestionar': 'Exámenes, sedes, aulas, distribución y cambios de aula',
  'asistencia.registrar': 'Asistencia e incidencias el día del examen',
  'resultados.gestionar': 'Importar calificaciones, procesar y enviar resultados a aprobación',
  'resultados.aprobar': 'Aprobar y programar la publicación de resultados (Comisión)',
  'ingreso.registrar': 'Entrega de documentos y constancias de ingreso',
  'notificaciones.gestionar': 'Registro de notificaciones, comunicados y plantillas',
  'pagos.conciliar': 'Conciliación de pagos con el proveedor y Tesorería',
  'pagos.anular': 'Anulaciones y devoluciones por error de cobro',
  'usuarios.gestionar': 'Usuarios internos y roles',
  'auditoria.ver': 'Consultar la auditoría',
  'configuracion.gestionar': 'Integraciones, fallas, respaldos y retención',
} as const;

export type Permission = keyof typeof PERMISSIONS;

const ALL = Object.keys(PERMISSIONS) as Permission[];

export const STAFF_ROLES: { code: string; name: string; permissions: Permission[] }[] = [
  { code: 'ADMIN', name: 'Administrador general', permissions: ALL },
  {
    code: 'ADMISION', name: 'Oficina de Admisión',
    permissions: ['panel.ver', 'reportes.inscripciones', 'reportes.pagos', 'inscripciones.ver', 'inscripciones.anular', 'pagos.ver',
      'convocatoria.gestionar', 'contenido.gestionar', 'inhabilitados.gestionar', 'casos.gestionar', 'asistente.gestionar', 'expedientes.evaluar', 'expedientes.asignar', 'examenes.gestionar', 'asistencia.registrar',
      'resultados.gestionar', 'resultados.aprobar', 'ingreso.registrar', 'notificaciones.gestionar'],
  },
  { code: 'TESORERIA', name: 'Tesorería', permissions: ['panel.ver', 'reportes.pagos', 'pagos.ver', 'pagos.conciliar', 'pagos.anular'] },
  { code: 'EVALUADOR', name: 'Evaluador documental', permissions: ['panel.ver', 'inscripciones.ver', 'expedientes.evaluar'] },
  { code: 'COORDINADOR_EXAMEN', name: 'Coordinador de examen', permissions: ['panel.ver', 'reportes.inscripciones', 'inscripciones.ver', 'examenes.gestionar', 'asistencia.registrar'] },
  { code: 'RESPONSABLE_AULA', name: 'Responsable de aula', permissions: ['panel.ver', 'asistencia.registrar'] },
  { code: 'OPERADOR_RESULTADOS', name: 'Operador de resultados', permissions: ['panel.ver', 'reportes.inscripciones', 'inscripciones.ver', 'resultados.gestionar'] },
  { code: 'SOPORTE', name: 'Soporte', permissions: ['panel.ver', 'casos.gestionar', 'asistente.gestionar', 'notificaciones.gestionar'] },
  { code: 'AUDITOR', name: 'Auditor', permissions: ['panel.ver', 'reportes.inscripciones', 'reportes.pagos', 'inscripciones.ver', 'pagos.ver', 'auditoria.ver'] },
];

const byRole = new Map(STAFF_ROLES.map((r) => [r.code, new Set<Permission>(r.permissions)]));

export function permissionsOf(roles: string[]): Permission[] {
  const out = new Set<Permission>();
  for (const r of roles) for (const p of byRole.get(r) ?? []) out.add(p);
  return [...out];
}

export const hasPermission = (roles: string[], permission: Permission) => roles.some((r) => byRole.get(r)?.has(permission));
