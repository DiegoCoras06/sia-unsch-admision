import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AdminSession, type StaffStep } from '../../core/admin-session';
import { apiErrorMessage } from '../../core/api.service';
import { CallStore } from '../../core/call.store';
import { longDate } from '../../core/format';
import { RecoveryCodes } from './recovery-codes';

/** Pasos visibles del ingreso; el cambio de contraseña y la activación del TOTP solo aparecen la primera vez. */
const STEP_LABEL: Record<string, string> = {
  CREDENTIALS: 'Correo y contraseña',
  CHANGE_PASSWORD: 'Contraseña propia',
  SETUP_MFA: 'Segundo factor',
  MFA: 'Código de verificación',
  CODES: 'Códigos de respaldo',
};

/**
 * Ingreso del personal en pasos (ADR-018): contraseña → cambio obligatorio → activar TOTP → código.
 * Pantalla dividida: a la izquierda la carátula de la Dirección de Admisión con el proceso vigente;
 * a la derecha el formulario del paso actual.
 */
@Component({
  selector: 'app-admin-login',
  imports: [FormsModule, RouterLink, RecoveryCodes],
  template: `
    <main class="login" (pointermove)="tilt($event)" (pointerleave)="tiltStyle.set('')">
      <span class="login__orb login__orb--a" aria-hidden="true"></span>
      <span class="login__orb login__orb--b" aria-hidden="true"></span>
      <aside class="cover" aria-label="Dirección de Admisión">
        <div class="cover__top">
          <div class="crest3d"><img class="cover__crest" [style.transform]="tiltStyle()" src="img/escudo-unsch-oficial-240.webp" srcset="img/escudo-unsch-oficial-240.webp 1x, img/escudo-unsch-oficial.png 2x" alt="Escudo de la UNSCH" width="178" height="240"></div>
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
            <p class="panel__badge" data-icon="auditoria">Acceso seguro con doble factor</p>
            <h1 id="lg-title">Panel de Admisión</h1>
            <p class="panel__step">
              @if (steps().length > 1) { <span class="panel__count">Paso {{ stepIndex() + 1 }} de {{ steps().length }}:</span> }
              {{ label(current()) }}
            </p>
          </header>

          @if (codes(); as list) {
            <app-recovery-codes [codes]="list" doneLabel="Entrar al panel" (done)="enter()" />
          } @else {
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
                <button class="btn submit" type="submit" [disabled]="busy() || newPassword.length < 10" [attr.aria-busy]="busy()">{{ busy() ? 'Guardando…' : 'Guardar y continuar' }}</button>
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
                <button class="btn submit" type="submit" [disabled]="busy() || code.length !== 6" [attr.aria-busy]="busy()">{{ busy() ? 'Verificando…' : 'Activar y entrar' }}</button>
              </form>
            }
            @case ('MFA') {
              @if (recovery()) {
                <form (ngSubmit)="useRecovery()" class="form">
                  <p class="lead">Escribe uno de tus códigos de respaldo. Cada código sirve una sola vez.</p>
                  <div class="field">
                    <label for="lg-rec">Código de respaldo</label>
                    <input id="lg-rec" class="input code" name="rec" [(ngModel)]="recoveryCode" autocomplete="off" autocapitalize="characters" spellcheck="false" maxlength="16" placeholder="XXXXX-XXXXX" required>
                  </div>
                  <button class="btn submit" type="submit" [disabled]="busy() || recoveryCode.trim().length < 10" [attr.aria-busy]="busy()">{{ busy() ? 'Verificando…' : 'Entrar al panel' }}</button>
                  <button class="link" type="button" (click)="recovery.set(false)">Volver al código de la aplicación</button>
                </form>
              } @else {
                <form (ngSubmit)="verify()" class="form">
                  <p class="lead">Abre tu aplicación de autenticación y escribe el código de 6 dígitos de la Dirección de Admisión.</p>
                  <div class="field">
                    <label for="lg-code2">Código</label>
                    <input id="lg-code2" class="input code" name="c2" [(ngModel)]="code" inputmode="numeric" maxlength="6" autocomplete="one-time-code" required>
                  </div>
                  <button class="btn submit" type="submit" [disabled]="busy() || code.length !== 6" [attr.aria-busy]="busy()">{{ busy() ? 'Verificando…' : 'Entrar al panel' }}</button>
                  <button class="link" type="button" (click)="recovery.set(true)">¿Perdiste el celular? Usar un código de respaldo</button>
                  <button class="btn btn--quiet" type="button" (click)="reset()">Usar otra cuenta</button>
                </form>
              }
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
                <button class="btn submit" type="submit" [disabled]="busy()" [attr.aria-busy]="busy()">{{ busy() ? 'Verificando…' : 'Continuar' }}</button>
                <p class="help">¿Olvidaste tu contraseña o perdiste tu aplicación de autenticación? Pide el restablecimiento al administrador del sistema.</p>
              </form>
            }
          }
          }
          @if (error()) { <p class="alert alert--error" role="alert">{{ error() }}</p> }
          <p class="foot"><a routerLink="/">Volver al portal de Admisión</a></p>
        </div>
      </section>
    </main>
  `,
  styles: `
    /* Fondo: la fachada de la universidad bajo un velo guinda, con dos luces difusas que dan profundidad. */
    .login { position: relative; isolation: isolate; overflow: hidden; min-height: 100vh; display: grid; grid-template-columns: minmax(0, 5fr) minmax(0, 6fr);
      background: linear-gradient(115deg, rgb(70 12 17 / 0.96) 0%, rgb(122 28 34 / 0.9) 45%, rgb(122 28 34 / 0.62) 100%), url('/img/campus-fachada-1920.webp') center / cover no-repeat, var(--accent); }
    .login__orb { position: absolute; z-index: -1; border-radius: 50%; filter: blur(70px); opacity: 0.55; pointer-events: none; animation: orb 18s ease-in-out infinite alternate; }
    .login__orb--a { width: 34rem; height: 34rem; left: -10rem; bottom: -12rem; background: radial-gradient(circle, rgb(217 180 74 / 0.55), transparent 65%); }
    .login__orb--b { width: 30rem; height: 30rem; right: -8rem; top: -10rem; background: radial-gradient(circle, rgb(255 255 255 / 0.35), transparent 65%); animation-delay: -9s; }
    @keyframes orb { to { transform: translate(3rem, -2rem) scale(1.08); } }

    /* Carátula sobre la foto: escudo con relieve 3D que sigue suavemente al puntero. */
    .cover { display: flex; flex-direction: column; justify-content: space-between; gap: 2.5rem; padding: clamp(2rem, 5vw, 4.5rem); color: var(--accent-ink); }
    .cover__top { display: grid; gap: 1rem; justify-items: start; }
    .crest3d { perspective: 900px; }
    .cover__crest { display: block; width: clamp(7.5rem, 11vw, 10rem); height: auto; transform-style: preserve-3d; transition: transform 300ms var(--ease);
      filter: drop-shadow(0 18px 24px rgb(0 0 0 / 0.45)) drop-shadow(0 0 22px rgb(217 180 74 / 0.35)); animation: float 6s ease-in-out infinite; }
    @keyframes float { 50% { translate: 0 -8px; } }
    .cover__uni { margin: 0.75rem 0 0; font-size: 0.9375rem; opacity: 0.9; max-width: 28ch; }
    .cover__office { margin: 0; font-size: clamp(2rem, 3.6vw, 3rem); font-weight: 800; line-height: 1.05; letter-spacing: -0.03em; text-wrap: balance; text-shadow: 0 2px 18px rgb(0 0 0 / 0.25); }
    /* Datos del proceso en una placa de vidrio. */
    .cover__file { margin: 0; display: grid; max-width: 28rem; padding: 0.4rem 1.1rem; border-radius: 16px; background: rgb(255 255 255 / 0.1);
      border: 1px solid rgb(255 255 255 / 0.22); backdrop-filter: blur(10px) saturate(1.3); -webkit-backdrop-filter: blur(10px) saturate(1.3); box-shadow: 0 10px 30px -18px rgb(0 0 0 / 0.6); }
    .cover__file div { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 0.1rem 1rem; padding: 0.7rem 0; border-bottom: 1px solid rgb(255 255 255 / 0.18); }
    .cover__file div:last-child { border-bottom: 0; }
    .cover__file dt { opacity: 0.9; white-space: nowrap; }
    .cover__file dd { margin: 0; font-weight: 700; color: var(--gold); margin-left: auto; text-align: right; font-variant-numeric: tabular-nums; }
    .cover__note { margin: 0; font-size: 0.875rem; opacity: 0.85; max-width: 40ch; }

    /* Formulario en una tarjeta de vidrio esmerilado; casi opaca para que el texto se lea siempre bien. */
    .panel { display: grid; place-items: center; padding: clamp(2rem, 5vw, 4rem) clamp(1.25rem, 4vw, 3rem); }
    .panel__inner { width: min(28rem, 100%); display: grid; gap: 1.5rem; padding: clamp(1.75rem, 3.5vw, 2.75rem); border-radius: 22px;
      background: rgb(255 255 255 / 0.9); border: 1px solid rgb(255 255 255 / 0.7); backdrop-filter: blur(22px) saturate(1.4); -webkit-backdrop-filter: blur(22px) saturate(1.4);
      box-shadow: 0 40px 80px -30px rgb(20 6 8 / 0.7), 0 2px 0 rgb(255 255 255 / 0.9) inset; }
    .panel__head { display: grid; gap: 0.35rem; }
    .panel__badge { display: inline-flex; align-items: center; gap: 0.45rem; justify-self: start; margin: 0 0 0.6rem; padding: 0.3rem 0.75rem 0.3rem 0.55rem; border-radius: 999px;
      background: #f3ebe4; color: var(--accent); font-size: 0.8125rem; font-weight: 700; }
    .panel__badge::before { width: 1rem; height: 1rem; }
    .panel__head h1 { font-size: clamp(1.75rem, 2.4vw, 2.125rem); letter-spacing: -0.03em; }
    .panel__step { margin: 0; color: var(--ink-soft); font-weight: 500; }
    .panel__count { font-weight: 700; color: var(--accent); }
    /* Campos con relieve suave (neumorfismo ligero) y un borde visible al enfocar. */
    .panel__inner .input { background: #f6f1ec; border-color: #e4d9cf; box-shadow: inset 2px 2px 5px rgb(29 20 21 / 0.06), inset -2px -2px 5px rgb(255 255 255 / 0.9); }
    .panel__inner .input:focus { background: #fff; border-color: var(--accent); box-shadow: 0 0 0 4px rgb(122 28 34 / 0.14); }
    .panel__inner .submit { background: linear-gradient(180deg, #8a2229, #6a171d); border-color: #5e1419; box-shadow: 0 12px 24px -12px rgb(122 28 34 / 0.75), inset 0 1px 0 rgb(255 255 255 / 0.18); }
    .panel__inner .submit:not([disabled]):hover { filter: brightness(1.08); transform: translateY(-1px); }
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
    .link { justify-self: center; min-height: 2.75rem; padding: 0 0.5rem; font: inherit; font-size: var(--size-note); font-weight: 600; color: var(--accent); background: none; border: 0; text-decoration: underline; text-underline-offset: 0.25em; cursor: pointer; }
    .help { margin: 0; font-size: var(--size-note); color: var(--ink-soft); }
    .qr { justify-self: center; background: #fff; padding: 0.5rem; border: 1px solid var(--stone-deep); border-radius: var(--radius-lg); }
    .secret { margin: 0; font-size: 0.8125rem; color: var(--ink-soft); word-break: break-all; }
    .code { font-size: 1.75rem; letter-spacing: 0.45em; text-align: center; font-variant-numeric: tabular-nums; padding-left: 0.45em; }
    .foot { margin: 0; font-size: 0.9375rem; }

    @media (max-width: 860px) {
      .login { grid-template-columns: minmax(0, 1fr); align-content: start; }
      .cover { flex-direction: row; align-items: center; padding: 1.25rem; gap: 1rem; }
      .cover__top { grid-template-columns: auto 1fr; align-items: center; gap: 0 0.9rem; }
      .crest3d { grid-row: span 2; }
      .cover__crest { width: 3.5rem; animation: none; }
      .cover__uni { margin: 0; font-size: 0.8125rem; }
      .cover__office { font-size: 1.375rem; }
      .cover__file, .cover__note { display: none; }
      .panel { place-items: start center; }
    }
    @media (prefers-reduced-motion: reduce) { .pass__toggle, .cover__crest { transition: none; animation: none; } .login__orb { animation: none; } }
    @supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) { .panel__inner { background: #fff; } }
  `,
})
export class AdminLoginPage {
  private readonly session = inject(AdminSession);
  private readonly router = inject(Router);
  private readonly calls = inject(CallStore);
  /** Inclinación 3D del escudo según el puntero; sin movimiento si el usuario lo pidió o con pantalla táctil. */
  protected readonly tiltStyle = signal('');
  private readonly calm = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  protected tilt(e: PointerEvent): void {
    if (this.calm || e.pointerType !== 'mouse') return;
    const x = e.clientX / window.innerWidth - 0.5;
    const y = e.clientY / window.innerHeight - 0.5;
    this.tiltStyle.set(`rotateY(${(x * 18).toFixed(1)}deg) rotateX(${(-y * 14).toFixed(1)}deg)`);
  }

  constructor() {
    // Con la sesión ya abierta, esta pantalla no vuelve a pedir el ingreso: lleva al panel.
    void this.session.restore().then((ok) => { if (ok) void this.router.navigateByUrl('/admin'); });
  }
  protected readonly step = signal<StaffStep | null>(null);
  protected readonly busy = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly show = signal(false);
  protected readonly capsOn = signal(false);
  protected email = '';
  protected password = '';
  protected newPassword = '';
  protected code = '';
  protected recoveryCode = '';
  protected readonly recovery = signal(false);
  /** Códigos recién generados al activar el segundo factor: se muestran antes de entrar. */
  protected readonly codes = signal<string[] | null>(null);

  /** Proceso vigente y fechas de examen, del cronograma oficial (sin datos inventados). */
  protected readonly process = computed(() => {
    const call = this.calls.call();
    if (!call) return null;
    const exams = call.stages
      .filter((s) => s.code === 'EXAM_EXO' || s.code === 'EXAM_ORD')
      .map((s) => ({ name: s.code === 'EXAM_EXO' ? 'Examen de exonerados' : 'Examen ordinario', date: longDate(s.startsAt) }));
    return { code: call.code, exams };
  });

  protected readonly current = computed(() => (this.codes() ? 'CODES' : (this.step()?.step ?? 'CREDENTIALS')));
  /** El primer ingreso tiene cuatro pasos; los siguientes, dos. */
  protected readonly steps = computed(() => {
    const s = this.current();
    return s === 'CHANGE_PASSWORD' || s === 'SETUP_MFA' || s === 'CODES' ? ['CREDENTIALS', 'CHANGE_PASSWORD', 'SETUP_MFA', 'CODES'] : ['CREDENTIALS', 'MFA'];
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
      const codes = await this.session.verifyMfa(this.step()!.challenge, this.code.trim());
      if (codes?.length) this.codes.set(codes);
      else await this.enter();
    });
  }
  protected useRecovery() {
    return this.run(async () => {
      await this.session.verifyRecovery(this.step()!.challenge, this.recoveryCode.trim());
      await this.enter();
    });
  }
  protected enter() {
    return this.router.navigateByUrl('/admin');
  }
  protected reset() {
    this.step.set(null);
    this.code = '';
    this.recoveryCode = '';
    this.recovery.set(false);
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
      this.recoveryCode = '';
    }
  }
}
