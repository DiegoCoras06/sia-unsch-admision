import { inject } from '@angular/core';
import { Router, type CanActivateFn, type Routes } from '@angular/router';
import { AdminSession } from '../../core/admin-session';

/** Exige sesión del personal y, si se indica, un permiso (la verificación real ocurre en el servidor). */
const staff = (permission?: string): CanActivateFn => async () => {
  const session = inject(AdminSession);
  const router = inject(Router);
  if (!(await session.restore())) return router.parseUrl('/admin/ingreso');
  return !permission || session.can(permission) ? true : router.parseUrl('/admin');
};

/** Panel administrativo (spec 008, ADR-018), con carga diferida. */
export const adminRoutes: Routes = [
  { path: 'ingreso', title: 'Ingreso del personal - Admisión UNSCH', loadComponent: () => import('./admin-login').then((m) => m.AdminLoginPage) },
  {
    path: '',
    canActivate: [staff('panel.ver')],
    loadComponent: () => import('./admin-shell').then((m) => m.AdminShell),
    children: [
      { path: '', title: 'Panel - Admisión UNSCH', loadComponent: () => import('./pages/dashboard').then((m) => m.DashboardPage) },
      { path: 'inscripciones', canActivate: [staff('inscripciones.ver')], title: 'Inscripciones - Panel de Admisión UNSCH', loadComponent: () => import('./pages/inscriptions').then((m) => m.InscriptionsAdminPage) },
      { path: 'expedientes', canActivate: [staff('expedientes.evaluar')], title: 'Expedientes - Panel de Admisión UNSCH', loadComponent: () => import('./pages/dossiers').then((m) => m.DossiersAdminPage) },
      { path: 'examenes', canActivate: [staff('examenes.gestionar')], title: 'Exámenes - Panel de Admisión UNSCH', loadComponent: () => import('./pages/exams').then((m) => m.ExamsAdminPage) },
      { path: 'sedes', canActivate: [staff('examenes.gestionar')], title: 'Sedes y aulas - Panel de Admisión UNSCH', loadComponent: () => import('./pages/venues').then((m) => m.VenuesAdminPage) },
      { path: 'asistencia', canActivate: [staff('asistencia.registrar')], title: 'Asistencia - Panel de Admisión UNSCH', loadComponent: () => import('./pages/attendance').then((m) => m.AttendanceAdminPage) },
      { path: 'resultados', canActivate: [staff('resultados.gestionar')], title: 'Resultados - Panel de Admisión UNSCH', loadComponent: () => import('./pages/results').then((m) => m.ResultsAdminPage) },
      // «ingresantes» y no «ingreso»: /admin/ingreso es la pantalla de inicio de sesión del personal.
      { path: 'ingresantes', canActivate: [staff('ingreso.registrar')], title: 'Ingresantes - Panel de Admisión UNSCH', loadComponent: () => import('./pages/admissions').then((m) => m.AdmissionsAdminPage) },
      { path: 'notificaciones', canActivate: [staff('notificaciones.gestionar')], title: 'Notificaciones - Panel de Admisión UNSCH', loadComponent: () => import('./pages/notifications').then((m) => m.NotificationsAdminPage) },
      { path: 'tesoreria', canActivate: [staff('pagos.conciliar')], title: 'Tesorería - Panel de Admisión UNSCH', loadComponent: () => import('./pages/treasury').then((m) => m.TreasuryAdminPage) },
      { path: 'pagos', canActivate: [staff('pagos.ver')], title: 'Pagos - Panel de Admisión UNSCH', loadComponent: () => import('./pages/payments').then((m) => m.PaymentsAdminPage) },
      { path: 'convocatoria', canActivate: [staff('convocatoria.gestionar')], title: 'Convocatoria - Panel de Admisión UNSCH', loadComponent: () => import('./pages/call').then((m) => m.CallAdminPage) },
      { path: 'catalogo', canActivate: [staff('convocatoria.gestionar')], title: 'Catálogo - Panel de Admisión UNSCH', loadComponent: () => import('./pages/catalog').then((m) => m.CatalogAdminPage) },
      { path: 'contenido', canActivate: [staff('contenido.gestionar')], title: 'Contenido - Panel de Admisión UNSCH', loadComponent: () => import('./pages/content').then((m) => m.ContentAdminPage) },
      { path: 'asistente', canActivate: [staff('asistente.gestionar')], title: 'Asistente - Panel de Admisión UNSCH', loadComponent: () => import('./pages/knowledge').then((m) => m.KnowledgeAdminPage) },
      { path: 'casos', canActivate: [staff('casos.gestionar')], title: 'Casos - Panel de Admisión UNSCH', loadComponent: () => import('./pages/cases').then((m) => m.CasesAdminPage) },
      { path: 'inhabilitados', canActivate: [staff('inhabilitados.gestionar')], title: 'Inhabilitados - Panel de Admisión UNSCH', loadComponent: () => import('./pages/disqualified').then((m) => m.DisqualifiedAdminPage) },
      { path: 'usuarios', canActivate: [staff('usuarios.gestionar')], title: 'Usuarios - Panel de Admisión UNSCH', loadComponent: () => import('./pages/users').then((m) => m.UsersAdminPage) },
      { path: 'auditoria', canActivate: [staff('auditoria.ver')], title: 'Auditoría - Panel de Admisión UNSCH', loadComponent: () => import('./pages/audit').then((m) => m.AuditAdminPage) },
      { path: 'seguridad', title: 'Mi seguridad - Panel de Admisión UNSCH', loadComponent: () => import('./pages/security').then((m) => m.SecurityPage) },
      { path: 'configuracion', canActivate: [staff('configuracion.gestionar')], title: 'Configuración - Panel de Admisión UNSCH', loadComponent: () => import('./pages/system').then((m) => m.SystemAdminPage) },
    ],
  },
];
