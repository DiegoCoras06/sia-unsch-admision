import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminSession } from '../../../core/admin-session';
import { apiErrorMessage } from '../../../core/api.service';
import { ActiveSessions } from '../../../shared/active-sessions';
import { RecoveryCodes } from '../recovery-codes';

/** Mi seguridad (ADR-022): cuántos códigos de respaldo quedan y generarlos de nuevo con el código actual. */
@Component({
  selector: 'app-admin-security',
  imports: [FormsModule, RecoveryCodes, ActiveSessions],
  template: `
    <header class="adm-head"><div><h1>Mi seguridad</h1><p>Si pierdes el celular con tu aplicación de autenticación, un código de respaldo te permite entrar.</p></div></header>
    @if (error()) { <p class="adm-msg err" role="alert">{{ error() }}</p> }
    <section class="adm-panel sec">
      @if (fresh(); as codes) {
        <app-recovery-codes [codes]="codes" doneLabel="Terminar" (done)="finish()" />
      } @else {
        <h2>Códigos de respaldo</h2>
        @if (remaining() !== null) {
          <p class="sec__count" [class.is-low]="remaining()! <= 2"><strong>{{ remaining() }}</strong> {{ remaining() === 1 ? 'código disponible' : 'códigos disponibles' }} de 10</p>
          @if (remaining() === 0) { <p class="adm-muted">Aún no tienes códigos. Genéralos ahora para no quedarte fuera del panel.</p> }
        }
        <form class="adm-form" (ngSubmit)="generate()">
          <div class="field">
            <label for="sec-code">Código de tu aplicación de autenticación</label>
            <input id="sec-code" class="input" name="code" [(ngModel)]="code" inputmode="numeric" maxlength="6" autocomplete="one-time-code" required>
          </div>
          <button class="btn" type="submit" [disabled]="busy() || code.length !== 6">{{ busy() ? 'Generando…' : remaining() ? 'Generar códigos nuevos' : 'Generar códigos' }}</button>
          @if (remaining()) { <p class="adm-muted">Los códigos anteriores dejarán de funcionar.</p> }
        </form>
      }
    </section>
    <section class="adm-panel sec">
      <h2>Dispositivos con sesión abierta</h2>
      <app-active-sessions [load]="loadSessions" [close]="closeSession" />
    </section>
  `,
  styles: `
    .sec { max-width: 32rem; }
    .sec__count { margin: 0; color: var(--ink-soft); font-weight: 600; font-variant-numeric: tabular-nums; }
    .sec__count strong { font-size: 2rem; letter-spacing: -0.03em; color: var(--accent); }
    .sec__count.is-low strong { color: var(--warn); }
  `,
})
export class SecurityPage implements OnInit {
  private readonly session = inject(AdminSession);
  protected readonly remaining = signal<number | null>(null);
  protected readonly fresh = signal<string[] | null>(null);
  protected readonly busy = signal(false);
  protected readonly error = signal<string | null>(null);
  protected code = '';
  protected readonly loadSessions = () => this.session.sessions();
  protected readonly closeSession = (id: string) => this.session.closeSession(id);

  ngOnInit() { void this.load(); }

  private async load() {
    try {
      this.remaining.set((await this.session.recoveryStatus()).remaining);
    } catch (e) {
      this.error.set(apiErrorMessage(e));
    }
  }

  protected async generate() {
    this.error.set(null);
    this.busy.set(true);
    try {
      this.fresh.set((await this.session.regenerateRecovery(this.code.trim())).codes);
    } catch (e) {
      this.error.set(apiErrorMessage(e));
    } finally {
      this.busy.set(false);
      this.code = '';
    }
  }

  protected finish() {
    this.fresh.set(null);
    void this.load();
  }
}
