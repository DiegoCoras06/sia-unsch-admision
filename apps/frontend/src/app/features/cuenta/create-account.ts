import { Component, inject, signal, type OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import type { ConsentDto, IdentityLookupDto } from '@sia/contracts';
import { AccountSession } from '../../core/account-session';
import { apiErrorMessage } from '../../core/api.service';

/** Dígito verificador de los DNI de prueba (mismo cálculo que el proveedor simulado). Solo ayuda a la demostración. */
function demoCheckDigit(dni: string): string {
  const w = [3, 2, 7, 6, 5, 4, 3, 2];
  const sum = [...dni].reduce((acc, d, i) => acc + Number(d) * (w[i] ?? 0), 0);
  return String((11 - (sum % 11)) % 10);
}

/** Spec 002, Historia 1 (cuenta opcional, enmienda de ADR-015): DNI con dígito verificador → contacto y contraseña → código del correo. */
@Component({
  selector: 'app-create-account',
  imports: [FormsModule, RouterLink],
  styleUrl: './account.scss',
  template: `
    <section class="acc acc--glow field-glow">
      <div class="frame acc__wrap">
        <div class="acc__intro">
          <h1>Crea tu cuenta</h1>
          <p>Es opcional: puedes inscribirte sin cuenta. Con ella:</p>
          <ul>
            <li>ves tus inscripciones, pagas y descargas tu ficha sin escribir tu código;</li>
            <li>actualizas tu celular, correo y dirección;</li>
            <li>revisas la actividad de tu cuenta y cierras sesiones abiertas.</li>
          </ul>
        </div>

        <div class="acc__card acc__panel">
          @if (step() < 4) {
            <ol class="acc__steps" aria-label="Avance">
              @for (s of steps; track s.n) {
                <li [class.is-done]="step() > s.n" [class.is-on]="step() === s.n" [attr.aria-current]="step() === s.n ? 'step' : null">
                  <span aria-hidden="true">{{ s.n }}</span>{{ s.label }}</li>
              }
            </ol>
          }
          @switch (step()) {
            @case (1) {
              <form (ngSubmit)="lookup()" class="acc__card" style="padding:0">
                <h2>1. Tu DNI</h2>
                <div class="acc__row">
                  <div><label for="ca-dni">Número de DNI</label><input id="ca-dni" class="input" name="dni" [(ngModel)]="dni" inputmode="numeric" maxlength="8" required></div>
                  <div><label for="ca-dv">Dígito</label><input id="ca-dv" class="input" name="dv" [(ngModel)]="dv" maxlength="1" required></div>
                </div>
                <p class="acc__hint">El dígito verificador está a la derecha del número, en la parte superior de tu DNI.</p>
                <button class="btn" type="submit" [disabled]="busy()">Verificar mi identidad</button>
                <details class="acc__demo"><summary>DNI de prueba (verificación simulada)</summary>
                  <p>@for (d of demo; track d) { {{ d }}-{{ check(d) }} · }</p></details>
              </form>
            }
            @case (2) {
              <form (ngSubmit)="register()" class="acc__card" style="padding:0">
                <h2>2. Tus datos de contacto</h2>
                <p class="acc__names">{{ identity()!.firstNames }} {{ identity()!.paternalSurname }} {{ identity()!.maternalSurname }}</p>
                <label for="ca-mail">Correo</label><input id="ca-mail" class="input" type="email" name="mail" [(ngModel)]="email" autocomplete="email" required>
                <label for="ca-cel">Celular</label><input id="ca-cel" class="input" name="cel" [(ngModel)]="phone" inputmode="numeric" maxlength="9" autocomplete="tel" required>
                <label for="ca-pass">Contraseña (mínimo 10 caracteres)</label><input id="ca-pass" class="input" type="password" name="pass" [(ngModel)]="password" autocomplete="new-password" required>
                @if (consent(); as c) {
                  <div class="acc__consent">{{ c.textMarkdown }}</div>
                  <label class="acc__check"><input type="checkbox" name="ok" [(ngModel)]="accept"> Acepto el tratamiento de mis datos personales (versión {{ c.version }}).</label>
                }
                <button class="btn" type="submit" [disabled]="busy() || !accept">Crear cuenta</button>
              </form>
            }
            @case (3) {
              <form (ngSubmit)="verify()" class="acc__card" style="padding:0">
                <h2>3. Confirma tu correo</h2>
                <p>Te enviamos un código de 6 dígitos a <strong>{{ maskedEmail() }}</strong>. Vence en 15 minutos.</p>
                <label for="ca-code">Código</label><input id="ca-code" class="input acc__code" name="code" [(ngModel)]="code" inputmode="numeric" maxlength="6" autocomplete="one-time-code" required>
                <button class="btn" type="submit" [disabled]="busy()">Confirmar</button>
                <button class="btn btn--quiet" type="button" (click)="resend()" [disabled]="busy()">Enviarme otro código</button>
              </form>
            }
            @case (4) {
              <p class="acc__ok" role="status">¡Listo! Tu cuenta está activa.</p>
              <a routerLink="/ingresar" class="btn">Ingresar a mi cuenta</a>
            }
          }
          @if (error()) { <p class="alert alert--error" role="alert">{{ error() }}</p> }
          @if (info()) { <p class="acc__ok" role="status">{{ info() }}</p> }
          <p class="acc__links"><a routerLink="/ingresar">Ya tengo cuenta</a><a routerLink="/inscripcion">Inscribirme sin cuenta</a></p>
        </div>
      </div>
    </section>
  `,
})
export class CreateAccountPage implements OnInit {
  private readonly account = inject(AccountSession);
  private readonly router = inject(Router);
  protected readonly step = signal<1 | 2 | 3 | 4>(1);
  protected readonly busy = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly info = signal<string | null>(null);
  protected readonly identity = signal<IdentityLookupDto | null>(null);
  protected readonly consent = signal<ConsentDto | null>(null);
  protected readonly maskedEmail = signal('');
  protected readonly steps = [{ n: 1, label: 'DNI' }, { n: 2, label: 'Contacto' }, { n: 3, label: 'Correo' }] as const;
  protected readonly demo = ['99900026', '99900027', '99900028', '99900029'];
  protected readonly check = demoCheckDigit;
  protected dni = '';
  protected dv = '';
  protected email = '';
  protected phone = '';
  protected password = '';
  protected accept = false;
  protected code = '';

  ngOnInit() { void this.account.consent().then((c) => this.consent.set(c)); }

  protected lookup() {
    return this.run(async () => {
      this.identity.set(await this.account.lookup(this.dni.trim(), this.dv.trim().toUpperCase()));
      this.step.set(2);
    });
  }

  protected register() {
    return this.run(async () => {
      const r = await this.account.register({
        identityToken: this.identity()!.identityToken, email: this.email.trim(), phone: this.phone.trim(), password: this.password, consentVersion: this.consent()!.version,
      });
      this.maskedEmail.set(r.maskedEmail);
      this.password = '';
      this.step.set(3);
    });
  }

  protected verify() {
    return this.run(async () => {
      await this.account.verifyEmail(this.email.trim(), this.code.trim());
      this.step.set(4);
      setTimeout(() => void this.router.navigateByUrl('/ingresar'), 2500);
    });
  }

  protected resend() {
    return this.run(async () => this.info.set((await this.account.resendCode(this.email.trim())).message));
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
    }
  }
}
