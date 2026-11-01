import type { Routes } from '@angular/router';

/** Carga diferida por página (ADR-003, RNF-14). Inscripción pública sin cuenta (ADR-015). */
export const routes: Routes = [
  // ── 001 Portal público ─────────────────────────────────────────
  { path: '', title: 'Admisión UNSCH 2027-I', loadComponent: () => import('./features/public/home/home').then((m) => m.HomePage) },
  { path: 'cronograma', title: 'Cronograma - Admisión UNSCH', loadComponent: () => import('./features/public/schedule/schedule').then((m) => m.SchedulePage) },
  { path: 'programas', title: 'Programas y vacantes - Admisión UNSCH', loadComponent: () => import('./features/public/programs/programs').then((m) => m.ProgramsPage) },
  { path: 'programas/:code', title: 'Programa - Admisión UNSCH', loadComponent: () => import('./features/public/programs/program-detail').then((m) => m.ProgramDetailPage) },
  { path: 'tasas', title: 'Tasas y simulador - Admisión UNSCH', loadComponent: () => import('./features/public/fees/fees').then((m) => m.FeesPage) },
  { path: 'requisitos', title: 'Requisitos - Admisión UNSCH', loadComponent: () => import('./features/public/requirements/requirements').then((m) => m.RequirementsPage) },
  { path: 'temario', title: 'Temario - Admisión UNSCH', loadComponent: () => import('./features/public/syllabus/syllabus').then((m) => m.SyllabusPage) },
  { path: 'comunicados', title: 'Comunicados - Admisión UNSCH', loadComponent: () => import('./features/public/announcements/announcements').then((m) => m.AnnouncementsPage) },
  { path: 'pasos', title: 'Cómo inscribirte - Admisión UNSCH', loadComponent: () => import('./features/public/steps/steps').then((m) => m.StepsPage) },
  { path: 'denuncias', title: 'Denuncias - Admisión UNSCH', loadComponent: () => import('./features/public/contact/complaints').then((m) => m.ComplaintsPage) },
  { path: 'observados', title: 'Relación de observados - Admisión UNSCH', loadComponent: () => import('./features/public/observed/observed').then((m) => m.ObservedPage) },
  { path: 'carta-aval', title: 'Modelo de carta aval - Admisión UNSCH', loadComponent: () => import('./features/public/documents/carta-aval').then((m) => m.CartaAvalPage) },
  { path: 'contacto', title: 'Contacto - Admisión UNSCH', loadComponent: () => import('./features/public/contact/contact').then((m) => m.ContactPage) },
  { path: 'documentos/:slug', title: 'Documento - Admisión UNSCH', loadComponent: () => import('./features/public/documents/document').then((m) => m.DocumentPage) },
  { path: 'reglamento', redirectTo: 'documentos/reglamento' },

  // ── 003 Inscripción pública ───────────────────────────────────
  { path: 'inscripcion', title: 'Inscripción - Admisión UNSCH 2027-I', loadComponent: () => import('./features/inscripcion/inscription').then((m) => m.InscriptionPage) },
  { path: 'mi-inscripcion', title: 'Mi inscripción - Admisión UNSCH', loadComponent: () => import('./features/inscripcion/my-inscription').then((m) => m.MyInscriptionPage) },
  { path: 'buscar-aula', title: 'Buscar aula - Admisión UNSCH', loadComponent: () => import('./features/aula/find-room').then((m) => m.FindRoomPage) },
  { path: 'resultados', title: 'Ver puntaje - Admisión UNSCH', loadComponent: () => import('./features/resultados/my-result').then((m) => m.MyResultPage) },
  { path: 'verificar-ingreso/:token', title: 'Verificación de constancia de ingreso - Admisión UNSCH', loadComponent: () => import('./features/resultados/verify-admission').then((m) => m.VerifyAdmissionPage) },
  { path: 'verificar/:token', title: 'Verificación de ficha - Admisión UNSCH', loadComponent: () => import('./features/inscripcion/verify-ficha').then((m) => m.VerifyFichaPage) },
  { path: 'reinscripcion', title: 'Reinscripción - Admisión UNSCH', loadComponent: () => import('./features/inscripcion/reinscription').then((m) => m.ReinscriptionPage) },

  // ── 002 Cuenta opcional del postulante (enmienda de ADR-015) ───
  { path: 'crear-cuenta', title: 'Crear cuenta - Admisión UNSCH', loadComponent: () => import('./features/cuenta/create-account').then((m) => m.CreateAccountPage) },
  { path: 'ingresar', title: 'Ingresar - Admisión UNSCH', loadComponent: () => import('./features/cuenta/login').then((m) => m.AccountLoginPage), data: { mode: 'login' } },
  { path: 'recuperar', title: 'Recuperar contraseña - Admisión UNSCH', loadComponent: () => import('./features/cuenta/login').then((m) => m.AccountLoginPage), data: { mode: 'forgot' } },
  { path: 'restablecer', title: 'Nueva contraseña - Admisión UNSCH', loadComponent: () => import('./features/cuenta/login').then((m) => m.AccountLoginPage), data: { mode: 'reset' } },
  { path: 'mi-cuenta', title: 'Mi cuenta - Admisión UNSCH', loadComponent: () => import('./features/cuenta/my-account').then((m) => m.MyAccountPage) },

  // ── 008 Panel administrativo (ADR-018) ─────────────────────────
  { path: 'admin', loadChildren: () => import('./features/admin/admin.routes').then((m) => m.adminRoutes) },

  { path: '**', title: 'Página no encontrada - Admisión UNSCH', loadComponent: () => import('./features/public/not-found').then((m) => m.NotFoundPage) },
];
