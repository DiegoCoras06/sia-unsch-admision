import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AdminSession, type StaffStep } from '../../core/admin-session';
import { apiErrorMessage } from '../../core/api.service';
import { CallStore } from '../../core/call.store';
import { longDate } from '../../core/format';

/** Pasos visibles del ingreso; el cambio de contraseña y la activación del TOTP solo aparecen la primera vez. */
const STEP_LABEL: Record<string, string> = {
  CREDENTIALS: 'Correo y contraseña',
  CHANGE_PASSWORD: 'Contraseña propia',
  SETUP_MFA: 'Segundo factor',
  MFA: 'Código de verificación',
};

/**
 * Ingreso del personal en pasos (ADR-018): contraseña → cambio obligatorio → activar TOTP → código.
 * Pantalla dividida: a la izquierda la carátula de la Dirección de Admisión con el proceso vigente;
 * a la derecha el formulario del paso actual.
 */
@Component({
  selector: 'app-admin-login',
  imports: [FormsModule, RouterLink],
  template: `
    <main class="login">
      <aside class="cover" aria-label="Dirección de Admisión">
        <div class="cover__top">
          <img class="cover__crest" src="img/escudo-unsch-1677-500.webp" alt="Escudo de la UNSCH" width="500" height="465">
          <p class="cover__uni">Universidad Nacional de San Cristóbal de Huamanga</p>
          <p class="cover__office">Dirección de Admisión</p>
        </div>
        @if (process(); as p) {
          <dl class="cover__file">
            <div><dt>Proceso</dt><dd>Admisión {{ p.code }}</dd></div>
            @for (e of p.exams; track e.name) { <div><dt>{{ e.name }}</dt><dd>{{ e.date }}</dd></div> }
          </dl>
        }
        <p class="cover__note">Uso exclusivo del personal autorizado. Cada ingreso queda registrado con fecha, hora y equipo.</p>
      </aside>

      <section class="panel" aria-labelledby="lg-title">
        <div class="panel__inner">
          <header class="panel__head">
            <h1 id="lg-title">Panel de Admisión</h1>
            <p class="panel__step">
              @if (steps().length > 1) { <span class="panel__count">Paso {{ stepIndex() + 1 }} de {{ steps().length }}:</span> }
              {{ label(current()) }}
            </p>
          </header>

          @switch (step()?.step) {
            @case ('CHANGE_PASSWORD') {
              <form (ngSubmit)="changePassword()" class="form">
                <p class="lead">Hola, {{ step()!.fullName }}. Es tu primer ingreso: reemplaza la contraseña temporal por una propia de al menos 10 caracteres.</p>
                <div class="field">
                  <label for="lg-new">Nueva contraseña</label>
                  <div class="pass">
                    <input id="lg-new" class="input" [type]="show() ? 'text' : 'password'" name="np" [(ngModel)]="newPassword" autocomplete="new-password" minlength="10" required
                      (keyup)="caps($event)" aria-describedby="lg-new-hint">
                    <button type="button" class="pass__toggle" (click)="show.set(!show())" [attr.aria-pressed]="show()">{{ show() ? 'Ocultar' : 'Mostrar' }}</button>
                  </div>
                  <span id="lg-new-hint" class="hint">{{ newPassword.length }} de 10 caracteres como mínimo</span>
                </div>
                @if (capsOn()) { <p class="caps" role="status">Las mayúsculas están activadas.</p> }
                <button class="btn submit" type="submit" [disabled]="busy() || newPassword.length < 10">{{ busy() ? 'Guardando…' : 'Guardar y continuar' }}</button>
              </form>
            }
            @case ('SETUP_MFA') {
              <form (ngSubmit)="verify()" class="form">
                <p class="lead">Escanea el código con Google Authenticator, Microsoft Authenticator u otra aplicación TOTP y escribe los 6 dígitos que muestra.</p>
                <img class="qr" [src]="step()!.mfaSetup!.qrDataUrl" alt="Código QR para la aplicación de autenticación" width="200" height="200">
                <p class="secret">¿No puedes escanear? Clave: <code>{{ step()!.mfaSetup!.secret }}</code></p>
                <div class="field">
                  <label for="lg-code1">Código de 6 dígitos</label>
                  <input id="lg-code1" class="input code" name="c1" [(ngModel)]="code" inputmode="numeric" maxlength="6" autocomplete="one-time-code" required>
                </div>
                <button class="btn submit" type="submit" [disabled]="busy() || code.length !== 6">{{ busy() ? 'Verificando…' : 'Activar y entrar' }}</button>
              </form>
            }
            @case ('MFA') {
              <form (ngSubmit)="verify()" class="form">
                <p class="lead">Abre tu aplicación de autenticación y escribe el código de 6 dígitos de la Dirección de Admisión.</p>
                <div class="field">
                  <label for="lg-code2">Código</label>
                  <input id="lg-code2" class="input code" name="c2" [(ngModel)]="code" inputmode="numeric" maxlength="6" autocomplete="one-time-code" required>
                </div>
                <button class="btn submit" type="submit" [disabled]="busy() || code.length !== 6">{{ busy() ? 'Verificando…' : 'Entrar al panel' }}</button>
                <button class="btn btn--quiet" type="button" (click)="reset()">Usar otra cuenta</button>
              </form>
            }
            @default {
              <form (ngSubmit)="login()" class="form">
                <div class="field">
                  <label for="lg-mail">Correo institucional</label>
                  <input id="lg-mail" class="input" type="email" name="mail" [(ngModel)]="email" autocomplete="username" placeholder="nombre@unsch.edu.pe" required>
                </div>
                <div class="field">
                  <label for="lg-pass">Contraseña</label>
                  <div class="pass">
                    <input id="lg-pass" class="input" [type]="show() ? 'text' : 'password'" name="pass" [(ngModel)]="password" autocomplete="current-password" required (keyup)="caps($event)">
                    <button type="button" class="pass__toggle" (click)="show.set(!show())" [attr.aria-pressed]="show()">{{ show() ? 'Ocultar' : 'Mostrar' }}</button>
                  </div>
                </div>
                @if (capsOn()) { <p class="caps" role="status">Las mayúsculas están activadas.</p> }
                <button class="btn submit" type="submit" [disabled]="busy()">{{ busy() ? 'Verificando…' : 'Continuar' }}</button>
                <p class="help">¿Olvidaste tu contraseña o perdiste tu aplicación de autenticación? Pide el restablecimiento al administrador del sistema.</p>
              </form>
            }
          }
          @if (error()) { <p class="alert alert--error" role="alert">{{ error() }}</p> }
          <p class="foot"><a routerLink="/">Volver al portal de Admisión</a></p>
        </div>
      </section>
    </main>
  `,
  styles: `
    .login { min-height: 100vh; display: grid; grid-template-columns: minmax(0, 5fr) minmax(0, 6fr); background: var(--ground); }

    /* Carátula: el guinda institucional como portada de expediente; el dorado solo en los datos del proceso. */
    .cover { display: flex; flex-direction: column; justify-content: space-between; gap: 2.5rem; padding: clamp(2rem, 5vw, 4.5rem);
      background: var(--accent); color: var(--accent-ink); }
    .cover__top { display: grid; gap: 1rem; justify-items: start; }
    .cover__crest { width: clamp(7rem, 12vw, 10rem); height: auto; filter: drop-shadow(0 6px 18px rgb(0 0 0 / 0.25)); }
    .cover__uni { margin: 0.75rem 0 0; font-size: 0.9375rem; opacity: 0.85; max-width: 28ch; }
    .cover__office { margin: 0; font-size: clamp(2rem, 3.6vw, 3rem); font-weight: 800; line-height: 1.05; letter-spacing: -0.03em; text-wrap: balance; }
    .cover__file { margin: 0; display: grid; gap: 0; max-width: 28rem; border-top: 1px solid rgb(255 255 255 / 0.25); }
    .cover__file div { display: flex; justify-content: space-between; gap: 1rem; padding: 0.7rem 0; border-bottom: 1px solid rgb(255 255 255 / 0.25); }
    .cover__file dt { opacity: 0.85; white-space: nowrap; }
    .cover__file dd { margin: 0; font-weight: 700; color: var(--gold); text-align: right; white-space: nowrap; font-variant-numeric: tabular-nums; }
    .cover__note { margin: 0; font-size: 0.875rem; opacity: 0.8; max-width: 40ch; }

    /* Formulario: centrado en su mitad, con un solo foco (el botón del paso). */
    .panel { display: grid; place-items: center; padding: clamp(2rem, 5vw, 4rem) clamp(1.25rem, 4vw, 3rem); }
    .panel__inner { width: min(25rem, 100%); display: grid; gap: 1.5rem; }
    .panel__head { display: grid; gap: 0.35rem; }
    .panel__head h1 { font-size: clamp(1.75rem, 2.4vw, 2.125rem); letter-spacing: -0.03em; }
    .panel__step { margin: 0; color: var(--ink-soft); font-weight: 500; }
    .panel__count { font-weight: 700; color: var(--accent); }
    .form { display: grid; gap: 1.1rem; }
    .lead { margin: 0; color: var(--ink-soft); }
    .field label { font-weight: 600; }
    .pass { position: relative; }
    .pass .input { padding-right: 6rem; }
    .pass__toggle { position: absolute; top: 50%; right: 0.35rem; transform: translateY(-50%); min-height: 2.5rem; min-width: 5rem; padding: 0 0.75rem;
      font: inherit; font-size: 0.875rem; font-weight: 600; color: var(--accent); background: transparent; border: 0; border-radius: var(--radius); cursor: pointer; }
    .pass__toggle:hover { background: var(--stone); }
    .caps { margin: -0.4rem 0 0; font-size: var(--size-note); font-weight: 600; color: var(--warn); }
    .submit { width: 100%; min-height: 3.25rem; font-size: 1.0625rem; }
    .btn--quiet { width: 100%; }
    .help { margin: 0; font-size: var(--size-note); color: var(--ink-soft); }
    .qr { justify-self: center; background: #fff; padding: 0.5rem; border: 1px solid var(--stone-deep); border-radius: var(--radius-lg); }
    .secret { margin: 0; font-size: 0.8125rem; color: var(--ink-soft); word-break: break-all; }
    .code { font-size: 1.75rem; letter-spacing: 0.45em; text-align: center; font-variant-numeric: tabular-nums; padding-left: 0.45em; }
    .foot { margin: 0; font-size: 0.9375rem; }

    @media (max-width: 860px) {
      .login { grid-template-columns: minmax(0, 1fr); }
      .cover { flex-direction: row; align-items: center; padding: 1.25rem; gap: 1rem; }
      .cover__top { grid-template-columns: auto 1fr; align-items: center; gap: 0 0.9rem; }
      .cover__crest { width: 3.5rem; grid-row: span 2; }
      .cover__uni { margin: 0; font-size: 0.8125rem; }
      .cover__office { font-size: 1.375rem; }
      .cover__file, .cover__note { display: none; }
      .panel { place-items: start center; }
    }
    @media (prefers-reduced-motion: reduce) { .pass__toggle { transition: none; } }
  `,
})
export class AdminLoginPage {
  private readonly session = inject(AdminSession);
  private readonly router = inject(Router);
  private readonly calls = inject(CallStore);
  protected readonly step = signal<StaffStep | null>(null);
  protected readonly busy = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly show = signal(false);
  protected readonly capsOn = signal(false);
  protected email = '';
  protected password = '';
  protected newPassword = '';
  protected code = '';

  /** Proceso vigente y fechas de examen, del cronograma oficial (sin datos inventados). */
  protected readonly process = computed(() => {
    const call = this.calls.call();
    if (!call) return null;
    const exams = call.stages
      .filter((s) => s.code === 'EXAM_EXO' || s.code === 'EXAM_ORD')
      .map((s) => ({ name: s.code === 'EXAM_EXO' ? 'Examen de exonerados' : 'Examen ordinario', date: longDate(s.startsAt) }));
    return { code: call.code, exams };
  });

  protected readonly current = computed(() => this.step()?.step ?? 'CREDENTIALS');
  /** El primer ingreso tiene cuatro pasos; los siguientes, dos. */
  protected readonly steps = computed(() => {
    const s = this.current();
    return s === 'CHANGE_PASSWORD' || s === 'SETUP_MFA' ? ['CREDENTIALS', 'CHANGE_PASSWORD', 'SETUP_MFA'] : ['CREDENTIALS', 'MFA'];
  });
  protected readonly stepIndex = computed(() => Math.max(0, this.steps().indexOf(this.current())));
  protected label(s: string): string {
    return STEP_LABEL[s] ?? s;
  }

  protected caps(e: KeyboardEvent): void {
    this.capsOn.set(e.getModifierState?.('CapsLock') ?? false);
  }

  protected login() { return this.run(async () => this.step.set(await this.session.login(this.email.trim(), this.password))); }
  protected changePassword() { return this.run(async () => this.step.set(await this.session.changePassword(this.step()!.challenge, this.newPassword))); }
  protected verify() {
    return this.run(async () => {
      await this.session.verifyMfa(this.step()!.challenge, this.code.trim());
      await this.router.navigateByUrl('/admin');
    });
  }
  protected reset() {
    this.step.set(null);
    this.code = '';
    this.error.set(null);
  }

  private async run(fn: () => Promise<void>) {
    this.error.set(null);
    this.busy.set(true);
    try {
      await fn();
      this.password = '';
      this.newPassword = '';
      this.show.set(false);
    } catch (e) {
      this.error.set(apiErrorMessage(e));
      if ((e as { error?: { error?: { code?: string } } })?.error?.error?.code === 'CHALLENGE_INVALID') this.step.set(null);
    } finally {
      this.busy.set(false);
      this.code = '';
    }
  }
}
