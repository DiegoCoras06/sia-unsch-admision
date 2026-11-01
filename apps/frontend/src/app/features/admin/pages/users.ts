import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminSession } from '../../../core/admin-session';
import { apiErrorMessage } from '../../../core/api.service';
import { shortDateTime } from '../../../core/format';

interface Role { code: string; name: string; permissions: string[] }
interface Staff { id: string; email: string; fullName: string; status: 'ACTIVE' | 'SUSPENDED' | 'DISABLED' | 'PENDING_EMAIL'; roles: string[]; mfaEnabled: boolean; mustChangePassword: boolean; lastLoginAt: string | null }

/** Spec 008, Historia 3: usuarios internos, roles, estado y segundo factor (RF-13.01 a RF-13.03, RF-13.06, RF-13.08). */
@Component({
  selector: 'app-admin-users',
  imports: [FormsModule],
  template: `
    <header class="adm-head"><div><h1>Usuarios y roles</h1><p>Cada persona entra con su contraseña y un código de su teléfono. Suspender cierra sus sesiones al instante.</p></div></header>
    @if (msg()) { <p class="adm-msg" [class.err]="msgErr()" role="status">{{ msg() }}</p> }
    @if (secret()) {
      <section class="adm-panel" role="alert">
        <h2>Contraseña temporal</h2>
        <p>Entrégala por un canal seguro a <strong>{{ secret()!.email }}</strong>. Se muestra una sola vez; al entrar deberá cambiarla y activar su segundo factor.</p>
        <p style="font-size:1.5rem; font-weight:800; letter-spacing:0.05em">{{ secret()!.password }}</p>
        <button class="btn btn--quiet" type="button" (click)="secret.set(null)">Ya la entregué</button>
      </section>
    }
    <div class="adm-grid">
      <form class="adm-panel adm-form" (ngSubmit)="create()">
        <h2>Nuevo usuario interno</h2>
        <div class="field"><label for="u-n">Nombre completo</label><input id="u-n" class="input" name="n" [(ngModel)]="f.fullName" required></div>
        <div class="field"><label for="u-e">Correo institucional</label><input id="u-e" class="input" type="email" name="e" [(ngModel)]="f.email" required></div>
        <fieldset class="field" style="border:0; padding:0; margin:0"><legend style="font-weight:600">Roles</legend>
          @for (r of roles(); track r.code) { <label class="adm-check"><input type="checkbox" [checked]="f.roles.includes(r.code)" (change)="toggleRole(f.roles, r.code)"> {{ r.name }}</label> }
        </fieldset>
        <button class="btn" type="submit">Crear y generar contraseña temporal</button>
      </form>
      <section class="adm-panel"><h2>Personal ({{ staff().length }})</h2>
        <div class="adm-table-wrap"><table class="adm-table">
          <thead><tr><th>Persona</th><th>Roles</th><th>Estado</th><th>Acciones</th></tr></thead>
          <tbody>@for (u of staff(); track u.id) {
            <tr><td><strong>{{ u.fullName }}</strong><br><span class="adm-muted">{{ u.email }}</span><br><span class="adm-muted">Último ingreso: {{ u.lastLoginAt ? when(u.lastLoginAt) : '-' }}</span></td>
              <td>@for (r of u.roles; track r) {<span class="adm-tag">{{ roleName(r) }}</span> }
                <br><button type="button" class="adm-link" (click)="editRoles(u)">Cambiar roles</button></td>
              <td><span class="adm-tag" [class.ok]="u.status === 'ACTIVE'" [class.bad]="u.status !== 'ACTIVE'">{{ statusLabel(u.status) }}</span>
                <br><span class="adm-muted">{{ u.mfaEnabled ? 'Segundo factor activo' : 'Sin segundo factor aún' }}</span></td>
              <td class="adm-row" style="flex-direction:column; align-items:flex-start">
                @if (u.status === 'ACTIVE') { <button type="button" class="adm-link" (click)="setStatus(u, 'SUSPENDED')">Suspender</button> }
                @else { <button type="button" class="adm-link" (click)="setStatus(u, 'ACTIVE')">Reactivar</button> }
                @if (u.status !== 'DISABLED') { <button type="button" class="adm-link" (click)="setStatus(u, 'DISABLED')">Desactivar</button> }
                <button type="button" class="adm-link" (click)="resetMfa(u)">Restablecer segundo factor</button>
                <button type="button" class="adm-link" (click)="resetPassword(u)">Nueva contraseña temporal</button>
              </td></tr>
          }</tbody>
        </table></div>
      </section>
    </div>
    @if (editing(); as u) {
      <section class="adm-panel adm-form">
        <h2>Roles de {{ u.fullName }}</h2>
        @for (r of roles(); track r.code) { <label class="adm-check"><input type="checkbox" [checked]="editRolesSel.includes(r.code)" (change)="toggleRole(editRolesSel, r.code)"> {{ r.name }} <span class="adm-muted">({{ r.permissions.length }} permisos)</span></label> }
        <div class="adm-row"><button class="btn" type="button" (click)="saveRoles(u)">Guardar roles</button><button class="btn btn--quiet" type="button" (click)="editing.set(null)">Cancelar</button></div>
      </section>
    }
  `,
})
export class UsersAdminPage implements OnInit {
  private readonly session = inject(AdminSession);
  protected readonly staff = signal<Staff[]>([]);
  protected readonly roles = signal<Role[]>([]);
  protected readonly editing = signal<Staff | null>(null);
  protected readonly secret = signal<{ email: string; password: string } | null>(null);
  protected readonly msg = signal<string | null>(null);
  protected readonly msgErr = signal(false);
  protected f = { fullName: '', email: '', roles: [] as string[] };
  protected editRolesSel: string[] = [];
  protected readonly when = shortDateTime;

  ngOnInit() { void this.reload(); }

  protected roleName = (c: string) => this.roles().find((r) => r.code === c)?.name ?? c;
  protected statusLabel = (s: string) => ({ ACTIVE: 'Activo', SUSPENDED: 'Suspendido', DISABLED: 'Desactivado', PENDING_EMAIL: 'Pendiente' } as Record<string, string>)[s] ?? s;
  protected toggleRole(list: string[], code: string) { const i = list.indexOf(code); if (i >= 0) list.splice(i, 1); else list.push(code); }

  private async reload() {
    const [s, r] = await Promise.all([this.session.get<Staff[]>('/admin/users'), this.session.get<Role[]>('/admin/roles')]);
    this.staff.set(s);
    this.roles.set(r);
  }

  protected create() {
    return this.act(async () => {
      const r = await this.session.postAuth<{ email: string; temporaryPassword: string }>('/admin/users', this.f);
      this.secret.set({ email: r.email, password: r.temporaryPassword });
      this.f = { fullName: '', email: '', roles: [] };
      return 'Usuario creado.';
    });
  }

  protected editRoles(u: Staff) { this.editRolesSel = [...u.roles]; this.editing.set(u); }
  protected saveRoles(u: Staff) {
    return this.act(async () => { await this.session.put(`/admin/users/${u.id}/roles`, { roles: this.editRolesSel }); this.editing.set(null); return `Roles de ${u.fullName} actualizados; sus sesiones se cerraron.`; });
  }
  protected setStatus(u: Staff, status: 'ACTIVE' | 'SUSPENDED' | 'DISABLED') {
    if (status !== 'ACTIVE' && !confirm(`¿${status === 'SUSPENDED' ? 'Suspender' : 'Desactivar'} a ${u.fullName}? Sus sesiones se cerrarán.`)) return;
    return this.act(async () => { await this.session.postAuth(`/admin/users/${u.id}/status`, { status }); return `${u.fullName}: ${this.statusLabel(status).toLowerCase()}.`; });
  }
  protected resetMfa(u: Staff) {
    if (!confirm(`¿Restablecer el segundo factor de ${u.fullName}? En su próximo ingreso deberá configurarlo de nuevo.`)) return;
    return this.act(async () => { await this.session.postAuth(`/admin/users/${u.id}/reset-mfa`); return 'Segundo factor restablecido.'; });
  }
  protected resetPassword(u: Staff) {
    if (!confirm(`¿Generar una nueva contraseña temporal para ${u.fullName}?`)) return;
    return this.act(async () => {
      const r = await this.session.postAuth<{ temporaryPassword: string }>(`/admin/users/${u.id}/reset-password`);
      this.secret.set({ email: u.email, password: r.temporaryPassword });
      return 'Contraseña temporal generada.';
    });
  }

  private async act(fn: () => Promise<string>) {
    try {
      this.msg.set(await fn());
      this.msgErr.set(false);
    } catch (e) {
      this.msg.set(apiErrorMessage(e));
      this.msgErr.set(true);
    }
    await this.reload();
  }
}
