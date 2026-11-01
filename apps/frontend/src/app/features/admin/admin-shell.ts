import { Component, ViewEncapsulation, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AdminSession } from '../../core/admin-session';

const NAV = [
  { path: '/admin', label: 'Inicio', permission: 'panel.ver', exact: true },
  { path: '/admin/inscripciones', label: 'Inscripciones', permission: 'inscripciones.ver' },
  { path: '/admin/expedientes', label: 'Expedientes', permission: 'expedientes.evaluar' },
  { path: '/admin/examenes', label: 'Exámenes y aulas', permission: 'examenes.gestionar' },
  { path: '/admin/asistencia', label: 'Asistencia', permission: 'asistencia.registrar' },
  { path: '/admin/pagos', label: 'Pagos', permission: 'pagos.ver' },
  { path: '/admin/resultados', label: 'Resultados', permission: 'resultados.gestionar' },
  { path: '/admin/ingreso', label: 'Ingreso', permission: 'ingreso.registrar' },
  { path: '/admin/tesoreria', label: 'Tesorería', permission: 'pagos.conciliar' },
  { path: '/admin/notificaciones', label: 'Notificaciones', permission: 'notificaciones.gestionar' },
  { path: '/admin/convocatoria', label: 'Convocatoria', permission: 'convocatoria.gestionar' },
  { path: '/admin/catalogo', label: 'Catálogo del concurso', permission: 'convocatoria.gestionar' },
  { path: '/admin/contenido', label: 'Contenido del portal', permission: 'contenido.gestionar' },
  { path: '/admin/asistente', label: 'Asistente virtual', permission: 'asistente.gestionar' },
  { path: '/admin/casos', label: 'Casos de atención', permission: 'casos.gestionar' },
  { path: '/admin/inhabilitados', label: 'Inhabilitados', permission: 'inhabilitados.gestionar' },
  { path: '/admin/usuarios', label: 'Usuarios y roles', permission: 'usuarios.gestionar' },
  { path: '/admin/auditoria', label: 'Auditoría', permission: 'auditoria.ver' },
  { path: '/admin/configuracion', label: 'Configuración', permission: 'configuracion.gestionar' },
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
          <span><strong>Panel de Admisión</strong><small>UNSCH · 2027-I</small></span>
        </a>
        <nav aria-label="Secciones del panel">
          @for (n of nav(); track n.path) {
            <a [routerLink]="n.path" routerLinkActive="is-active" [routerLinkActiveOptions]="{ exact: !!n.exact }" (click)="menu.set(false)">{{ n.label }}</a>
          }
        </nav>
        <div class="adm-user">
          <p><strong>{{ session.me()?.fullName }}</strong></p>
          <p class="adm-muted">{{ roles() }}</p>
          <div class="adm-row">
            <a routerLink="/" class="adm-link">Ver portal</a>
            <button type="button" class="adm-link" (click)="logout()">Cerrar sesión</button>
          </div>
        </div>
      </aside>
      <div class="adm-main">
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
  protected readonly nav = computed(() => NAV.filter((n) => this.session.can(n.permission)));
  protected readonly roles = computed(() => (this.session.me()?.roles ?? []).map((r) => ROLE_NAMES[r] ?? r).join(' · '));

  protected async logout() {
    await this.session.logout();
    await this.router.navigateByUrl('/admin/ingreso');
  }
}
