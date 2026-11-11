import { Component, ViewEncapsulation, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AdminSession } from '../../core/admin-session';

type NavItem = { path: string; label: string; permission: string; icon: string; exact?: boolean };

/** Menú agrupado por tarea: el personal busca «qué tengo que hacer», no una lista de 19 pantallas. */
const NAV: { group: string | null; items: NavItem[] }[] = [
  { group: null, items: [{ path: '/admin', label: 'Inicio', permission: 'panel.ver', icon: 'inicio', exact: true }] },
  { group: 'Postulantes y pagos', items: [
    { path: '/admin/inscripciones', label: 'Inscripciones', permission: 'inscripciones.ver', icon: 'inscripcion' },
    { path: '/admin/expedientes', label: 'Expedientes', permission: 'expedientes.evaluar', icon: 'expedientes' },
    { path: '/admin/pagos', label: 'Pagos', permission: 'pagos.ver', icon: 'pagar' },
    { path: '/admin/tesoreria', label: 'Tesorería', permission: 'pagos.conciliar', icon: 'tasas' },
    { path: '/admin/inhabilitados', label: 'Inhabilitados', permission: 'inhabilitados.gestionar', icon: 'inhabilitados' },
  ] },
  { group: 'Examen y resultados', items: [
    { path: '/admin/examenes', label: 'Exámenes y aulas', permission: 'examenes.gestionar', icon: 'examenes' },
    { path: '/admin/asistencia', label: 'Asistencia', permission: 'asistencia.registrar', icon: 'asistencia' },
    { path: '/admin/resultados', label: 'Resultados', permission: 'resultados.gestionar', icon: 'puntaje' },
    { path: '/admin/ingresantes', label: 'Ingresantes', permission: 'ingreso.registrar', icon: 'programas' },
  ] },
  { group: 'Atención', items: [
    { path: '/admin/casos', label: 'Casos de atención', permission: 'casos.gestionar', icon: 'casos' },
    { path: '/admin/notificaciones', label: 'Notificaciones', permission: 'notificaciones.gestionar', icon: 'notificaciones' },
    { path: '/admin/asistente', label: 'Asistente virtual', permission: 'asistente.gestionar', icon: 'asistente' },
  ] },
  { group: 'Concurso y portal', items: [
    { path: '/admin/convocatoria', label: 'Convocatoria', permission: 'convocatoria.gestionar', icon: 'cronograma' },
    { path: '/admin/catalogo', label: 'Catálogo del concurso', permission: 'convocatoria.gestionar', icon: 'reglamento' },
    { path: '/admin/contenido', label: 'Contenido del portal', permission: 'contenido.gestionar', icon: 'contenido' },
  ] },
  { group: 'Sistema', items: [
    { path: '/admin/usuarios', label: 'Usuarios y roles', permission: 'usuarios.gestionar', icon: 'vacantes' },
    { path: '/admin/auditoria', label: 'Auditoría', permission: 'auditoria.ver', icon: 'auditoria' },
    { path: '/admin/configuracion', label: 'Configuración', permission: 'configuracion.gestionar', icon: 'configuracion' },
  ] },
];

const ROLE_NAMES: Record<string, string> = {
  ADMIN: 'Administrador general', ADMISION: 'Oficina de Admisión', TESORERIA: 'Tesorería', EVALUADOR: 'Evaluador documental',
  COORDINADOR_EXAMEN: 'Coordinador de examen', OPERADOR_RESULTADOS: 'Operador de resultados', SOPORTE: 'Soporte', AUDITOR: 'Auditor',
};

/** Marco del panel: barra lateral según permisos y la sección elegida. Sus estilos alcanzan a todas las páginas del panel. */
@Component({
  selector: 'app-admin-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  encapsulation: ViewEncapsulation.None,
  styleUrl: './admin.scss',
  template: `
    <div class="adm">
      <aside class="adm-side" [class.is-open]="menu()">
        <a routerLink="/admin" class="adm-brand">
          <img src="img/escudo-unsch-80.webp" alt="" width="34" height="41">
          <span><strong>Panel de Admisión</strong><small>UNSCH, proceso 2027-I</small></span>
        </a>
        <nav aria-label="Secciones del panel">
          @for (g of nav(); track $index) {
            @if (g.group) { <p class="adm-group" [id]="'adm-g' + $index">{{ g.group }}</p> }
            <ul [attr.aria-labelledby]="g.group ? 'adm-g' + $index : null">
              @for (n of g.items; track n.path) {
                <li><a [routerLink]="n.path" [attr.data-icon]="n.icon" routerLinkActive="is-active" ariaCurrentWhenActive="page" [routerLinkActiveOptions]="{ exact: !!n.exact }" (click)="menu.set(false)">{{ n.label }}</a></li>
              }
            </ul>
          }
        </nav>
        <div class="adm-user">
          <p><strong>{{ session.me()?.fullName }}</strong></p>
          <p class="adm-muted">{{ roles() }}</p>
          <div class="adm-row">
            <a routerLink="/" class="adm-link">Ver portal</a>
            <a routerLink="/admin/seguridad" class="adm-link" (click)="menu.set(false)">Mi seguridad</a>
            <button type="button" class="adm-link" (click)="logout()">Cerrar sesión</button>
          </div>
        </div>
      </aside>
      <div class="adm-main" [class.is-loading]="session.busy()" [attr.aria-busy]="session.busy()">
        <div class="adm-progress" aria-hidden="true"></div>
        @if (session.loadFailed()) {
          <p class="adm-msg err adm-load-error" role="alert">
            No se pudo cargar la información. Revisa tu conexión e inténtalo de nuevo.
            <button type="button" class="adm-link" (click)="retry()">Reintentar</button>
          </p>
        }
        <button type="button" class="adm-burger" (click)="menu.update((v) => !v)" [attr.aria-expanded]="menu()">Menú del panel</button>
        <router-outlet />
      </div>
    </div>
  `,
})
export class AdminShell {
  protected readonly session = inject(AdminSession);
  private readonly router = inject(Router);
  protected readonly menu = signal(false);
  protected readonly nav = computed(() =>
    NAV.map((g) => ({ ...g, items: g.items.filter((n) => this.session.can(n.permission)) })).filter((g) => g.items.length),
  );
  protected readonly roles = computed(() => (this.session.me()?.roles ?? []).map((r) => ROLE_NAMES[r] ?? r).join(', '));

  /** La sesión se restaura con la cookie, así que recargar vuelve a pedir todo lo de la pantalla. */
  protected retry() {
    location.reload();
  }

  protected async logout() {
    await this.session.logout();
    await this.router.navigateByUrl('/admin/ingreso');
  }
}
