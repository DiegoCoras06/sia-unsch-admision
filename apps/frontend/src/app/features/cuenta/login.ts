import { Component, computed, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AccountSession } from '../../core/account-session';
import { apiErrorMessage } from '../../core/api.service';

const TITLE = { login: 'Ingresa a tu cuenta', forgot: 'Recupera tu contraseña', reset: 'Crea una nueva contraseña' } as const;
const LEAD = {
  login: 'Con tu DNI o tu correo y tu contraseña.',
  forgot: 'Te enviamos un enlace al correo de tu cuenta para crear una contraseña nueva.',
  reset: 'Elige una contraseña de al menos 10 caracteres que no uses en otro sitio.',
} as const;

/**
 * Spec 002, Historias 3 y 4: ingresar, recuperar la contraseña y crear una nueva con el enlace del correo.
 * Tarjeta dividida: a la izquierda, para qué sirve la cuenta; a la derecha, el formulario del paso.
 */
@Component({
  selector: 'app-account-login',
  imports: [FormsModule, RouterLink],
  styleUrl: './account.scss',
  template: `
    <section class="acc">
      <div class="frame">
        <div class="lg">
          <aside class="lg__side" aria-label="Tu cuenta de postulante">
            <img class="lg__crest" src="img/escudo-unsch-oficial-120.webp" srcset="img/escudo-unsch-oficial-120.webp 1x, img/escudo-unsch-oficial-240.webp 2x" alt="" width="47" height="63">
            <p class="lg__kicker">Admisión UNSCH 2027-I</p>
            <p class="lg__title">Tu cuenta de postulante</p>
            <ul class="lg__list">
              <li>Ves tus inscripciones sin escribir tu código de postulante.</li>
              <li>Actualizas tu correo y tu celular para recibir los avisos.</li>
              <li>Revisas la actividad reciente de tu cuenta.</li>
            </ul>
            <p class="lg__note">La cuenta es opcional. Si te inscribiste sin cuenta, consulta, paga e imprime en <a routerLink="/mi-inscripcion">Mi inscripción</a> con tu DNI y tu código.</p>
          </aside>

          <div class="lg__main">
            <header class="lg__head">
              <h1>{{ title() }}</h1>
              <p>{{ lead() }}</p>
            </header>

            @switch (mode()) {
              @case ('login') {
                <form (ngSubmit)="login()" class="lg__form">
                  <div class="field">
                    <label for="lo-id">DNI o correo</label>
                    <input id="lo-id" class="input" name="id" [(ngModel)]="identifier" autocomplete="username" required>
                  </div>
                  <div class="field">
                    <label for="lo-pass">Contraseña</label>
                    <div class="pass">
                      <input id="lo-pass" class="input" [type]="show() ? 'text' : 'password'" name="pass" [(ngModel)]="password" autocomplete="current-password" required (keyup)="caps($event)">
                      <button type="button" class="pass__toggle" (click)="show.set(!show())" [attr.aria-pressed]="show()">{{ show() ? 'Ocultar' : 'Mostrar' }}</button>
                    </div>
                  </div>
                  @if (capsOn()) { <p class="caps" role="status">Las mayúsculas están activadas.</p> }
                  <button class="btn lg__submit" type="submit" [disabled]="busy()" [attr.aria-busy]="busy()">{{ busy() ? 'Ingresando…' : 'Ingresar' }}</button>
                  <p class="lg__links"><a routerLink="/recuperar">Olvidé mi contraseña</a></p>
                </form>
                <p class="lg__alt">¿Aún no tienes cuenta? <a routerLink="/crear-cuenta">Crear cuenta</a></p>
              }
              @case ('forgot') {
                <form (ngSubmit)="forgot()" class="lg__form">
                  <div class="field">
                    <label for="fo-id">DNI o correo de tu cuenta</label>
                    <input id="fo-id" class="input" name="id" [(ngModel)]="identifier" autocomplete="username" required>
                  </div>
                  <button class="btn lg__submit" type="submit" [disabled]="busy()" [attr.aria-busy]="busy()">{{ busy() ? 'Enviando…' : 'Enviarme el enlace' }}</button>
                </form>
                <p class="lg__alt"><a routerLink="/ingresar">Volver a ingresar</a></p>
              }
              @default {
                <form (ngSubmit)="reset()" class="lg__form">
                  <div class="field">
                    <label for="re-pass">Nueva contraseña</label>
                    <div class="pass">
                      <input id="re-pass" class="input" [type]="show() ? 'text' : 'password'" name="pass" [(ngModel)]="password" autocomplete="new-password" minlength="10" required
                        (keyup)="caps($event)" aria-describedby="re-pass-hint">
                      <button type="button" class="pass__toggle" (click)="show.set(!show())" [attr.aria-pressed]="show()">{{ show() ? 'Ocultar' : 'Mostrar' }}</button>
                    </div>
                    <span id="re-pass-hint" class="hint">{{ password.length }} de 10 caracteres como mínimo</span>
                  </div>
                  @if (capsOn()) { <p class="caps" role="status">Las mayúsculas están activadas.</p> }
                  <button class="btn lg__submit" type="submit" [disabled]="busy() || !token() || password.length < 10" [attr.aria-busy]="busy()">{{ busy() ? 'Guardando…' : 'Guardar contraseña' }}</button>
                  @if (!token()) { <p class="hint">Abre esta página desde el enlace que te enviamos por correo.</p> }
                </form>
              }
            }
            @if (error()) { <p class="alert alert--error" role="alert">{{ error() }}</p> }
            @if (info()) { <p class="acc__ok lg__ok" role="status">{{ info() }}</p> }
          </div>
        </div>
      </div>
    </section>
  `,
  styles: `
    /* Una sola tarjeta: el guinda explica, el blanco pide los datos. Esquinas concéntricas con el radio del sitio. */
    .lg { display: grid; grid-template-columns: minmax(0, 5fr) minmax(0, 6fr); max-width: 60rem; margin-inline: auto;
      background: var(--ground); border-radius: var(--radius-lg); overflow: hidden;
      box-shadow: 0 0 0 1px rgb(29 20 21 / 0.06), 0 1px 2px -1px rgb(29 20 21 / 0.08), 0 12px 32px -12px rgb(29 20 21 / 0.18); }
    .lg__side { display: grid; align-content: start; gap: 0.9rem; padding: clamp(1.75rem, 4vw, 2.75rem); background: var(--accent); color: var(--accent-ink); }
    .lg__crest { width: 47px; height: auto; }
    .lg__kicker { margin: 0.5rem 0 0; font-size: var(--size-note); font-weight: 600; color: var(--gold); }
    .lg__title { margin: 0; font-size: clamp(1.625rem, 2.6vw, 2.125rem); font-weight: 800; line-height: 1.1; letter-spacing: -0.03em; text-wrap: balance; }
    .lg__list { margin: 0.5rem 0 0; padding: 0; list-style: none; display: grid; gap: 0; border-top: 1px solid rgb(255 255 255 / 0.22); }
    .lg__list li { display: grid; grid-template-columns: 1rem 1fr; gap: 0.6rem; padding: 0.75rem 0; border-bottom: 1px solid rgb(255 255 255 / 0.22); }
    .lg__list li::before { content: ''; width: 0.45rem; height: 0.45rem; margin-top: 0.55em; border-radius: 50%; background: var(--gold); }
    .lg__note { margin: 0.5rem 0 0; font-size: var(--size-note); opacity: 0.9; }
    .lg__note a { color: var(--accent-ink); font-weight: 700; }

    .lg__main { display: grid; align-content: center; gap: 1.5rem; padding: clamp(1.75rem, 5vw, 3.25rem); }
    .lg__head { display: grid; gap: 0.4rem; }
    .lg__head h1 { font-size: clamp(1.75rem, 3vw, 2.25rem); letter-spacing: -0.03em; line-height: 1.1; }
    .lg__head p { margin: 0; color: var(--ink-soft); }
    .lg__form { display: grid; gap: 1.1rem; }
    .field label { font-weight: 600; }
    .pass { position: relative; }
    .pass .input { padding-right: 6rem; }
    .pass__toggle { position: absolute; top: 50%; right: 0.35rem; transform: translateY(-50%); min-height: 2.5rem; min-width: 5rem; padding: 0 0.75rem;
      font: inherit; font-size: 0.875rem; font-weight: 600; color: var(--accent); background: transparent; border: 0; border-radius: var(--radius); cursor: pointer; }
    .pass__toggle:hover { background: var(--stone); }
    .caps { margin: -0.4rem 0 0; font-size: var(--size-note); font-weight: 600; color: var(--warn); }
    .lg__submit { width: 100%; min-height: 3.25rem; font-size: 1.0625rem; }
    .lg__links { margin: -0.25rem 0 0; font-size: 0.9375rem; }
    .lg__alt { margin: 0; padding-top: 1.25rem; border-top: 1px solid var(--stone-deep); font-size: 0.9375rem; }
    .lg__alt a, .lg__links a { color: var(--accent); font-weight: 600; }
    .lg__ok { border-radius: var(--radius); }

    @media (max-width: 860px) {
      .lg { grid-template-columns: minmax(0, 1fr); }
      .lg__main { order: -1; }
      .lg__list { display: none; }
    }
  `,
})
export class AccountLoginPage {
  private readonly account = inject(AccountSession);
  private readonly router = inject(Router);
  readonly mode = input<'login' | 'forgot' | 'reset'>('login');
  /** Token del enlace del correo (`/restablecer?token=…`). */
  readonly token = input<string>('');
  protected readonly busy = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly info = signal<string | null>(null);
  protected readonly show = signal(false);
  protected readonly capsOn = signal(false);
  protected readonly title = computed(() => TITLE[this.mode()]);
  protected readonly lead = computed(() => LEAD[this.mode()]);
  protected identifier = '';
  protected password = '';

  protected caps(e: KeyboardEvent): void {
    this.capsOn.set(e.getModifierState?.('CapsLock') ?? false);
  }

  protected login() {
    return this.run(async () => {
      await this.account.login(this.identifier.trim(), this.password);
      await this.router.navigateByUrl('/mi-cuenta');
    });
  }
  protected forgot() { return this.run(async () => this.info.set((await this.account.forgot(this.identifier.trim())).message)); }
  protected reset() {
    return this.run(async () => {
      await this.account.reset(this.token(), this.password);
      this.info.set('Contraseña actualizada. Ya puedes ingresar.');
      setTimeout(() => void this.router.navigateByUrl('/ingresar'), 2000);
    });
  }

  private async run(fn: () => Promise<void>) {
    this.busy.set(true);
    this.error.set(null);
    this.info.set(null);
    try {
      await fn();
    } catch (e) {
      this.error.set(apiErrorMessage(e));
    } finally {
      this.busy.set(false);
      this.password = '';
      this.show.set(false);
    }
  }
}
