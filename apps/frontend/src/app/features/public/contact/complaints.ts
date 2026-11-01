import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService, apiErrorMessage } from '../../../core/api.service';

/** Denuncias e irregularidades del proceso, como el portal oficial: se registran como caso reservado en el panel. */
@Component({
  selector: 'app-complaints',
  imports: [ReactiveFormsModule],
  template: `
    <div class="page">
      @if (notice()) {
        <div class="notice" role="note">
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="currentColor" d="M12 2 4 5v6c0 5 3.4 9.5 8 11 4.6-1.5 8-6 8-11V5l-8-3Zm0 2.2 6 2.2V11c0 3.9-2.5 7.5-6 8.9V4.2Z"/></svg>
          <p>Ante cualquier denuncia o irregularidad, comunícate con nosotros. Atenderemos tu caso con absoluta reserva.</p>
          <button type="button" class="notice__x" (click)="notice.set(false)" aria-label="Cerrar aviso">×</button>
        </div>
      }

      <div class="frame grid">
        <section class="card form-card" aria-labelledby="d-title">
          <h1 id="d-title">Ingresa tu denuncia</h1>
          <p class="secret" id="d-reserva">
            <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path fill="currentColor" d="M12 1a5 5 0 0 0-5 5v3H5v14h14V9h-2V6a5 5 0 0 0-5-5Zm-3 8V6a3 3 0 1 1 6 0v3H9Z"/></svg>
            <span>Tu nombre es opcional y tu denuncia se atiende con reserva. El correo solo se usa para responderte; no se publica ni se comparte. Los campos con <span class="req" aria-hidden="true">*</span> son obligatorios.</span>
          </p>

          @if (caseNumber(); as n) {
            <div class="done" role="status">
              <h2>Recibimos tu denuncia</h2>
              <p>Tu número de caso es <strong>{{ n }}</strong>. Guárdalo para hacer seguimiento; te escribiremos al correo que indicaste.</p>
              <button type="button" class="send send--quiet" (click)="caseNumber.set(null)">Registrar otra denuncia</button>
            </div>
          } @else {
            <form [formGroup]="form" (ngSubmit)="send()" novalidate>
              <div class="cols">
                <div class="col">
                  <div class="f"><label class="lb" for="d-name">Nombres y apellidos <span class="opt">(opcional)</span></label>
                    <input id="d-name" class="in" formControlName="name" autocomplete="name" aria-describedby="d-reserva"></div>
                  <div class="f"><label class="lb" for="d-mail">Correo electrónico <span class="req" aria-hidden="true">*</span></label>
                    <input id="d-mail" class="in" type="email" formControlName="email" placeholder="Para responderte" autocomplete="email" aria-required="true" aria-describedby="d-reserva" [attr.aria-invalid]="bad('email')"></div>
                  <div class="f"><label class="lb" for="d-phone">Teléfono o celular <span class="opt">(opcional)</span></label>
                    <input id="d-phone" class="in" inputmode="numeric" formControlName="phone" placeholder="9 dígitos" autocomplete="tel" [attr.aria-invalid]="bad('phone')"></div>
                </div>
                <div class="col">
                  <div class="f f--grow"><label class="lb" for="d-msg">Hechos de tu denuncia <span class="req" aria-hidden="true">*</span></label>
                    <textarea id="d-msg" class="in in--area" formControlName="message" placeholder="Qué pasó, cuándo y dónde, y quiénes participaron." aria-required="true" [attr.aria-invalid]="bad('message')"></textarea></div>
                </div>
              </div>
              <div class="hp" aria-hidden="true"><label for="d-web">Sitio web</label><input id="d-web" tabindex="-1" autocomplete="off" formControlName="website"></div>
              @if (error()) { <p class="err" role="alert">{{ error() }}</p> }
              <button class="send" type="submit" [disabled]="sending()">
                <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M2 21 23 12 2 3v7l15 2-15 2v7Z"/></svg>
                {{ sending() ? 'Enviando…' : 'Enviar denuncia de forma segura' }}
              </button>
            </form>
          }
        </section>

        <aside class="side">
          <section class="card card--top">
            <h2><svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path fill="currentColor" d="M12 2 2 7v2h20V7L12 2ZM4 11v7h2v-7H4Zm4 0v7h2v-7H8Zm6 0v7h2v-7h-2Zm4 0v7h2v-7h-2ZM2 20v2h20v-2H2Z"/></svg> Contraloría General de la República</h2>
            <p class="muted">También puedes presentar tu denuncia directamente ante la Plataforma Nacional Digital de Denuncias Ciudadanas del Estado.</p>
            <a class="outline" href="https://www.contraloria.gob.pe/" target="_blank" rel="noopener">Ir a Contraloría
              <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true"><path fill="currentColor" d="M14 3h7v7h-2V6.4l-9.3 9.3-1.4-1.4L17.6 5H14V3ZM5 5h6v2H5v12h12v-6h2v8H3V5h2Z"/></svg></a>
          </section>

          <section class="card card--top">
            <h2><svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path fill="currentColor" d="M2 5h20v14H2V5Zm2 2v.5l8 5 8-5V7H4Zm16 2.8-8 5-8-5V17h16V9.8Z"/></svg> Denuncia por Correo Directo</h2>
            <p class="row"><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M2 5h20v14H2V5Zm2 2v.5l8 5 8-5V7H4Z"/></svg>
              <span><strong>Correo:</strong> <a href="mailto:admision@unsch.edu.pe">admision&#64;unsch.edu.pe</a></span></p>
            <h2 class="h2--sp"><svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path fill="currentColor" d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm0 2a8 8 0 1 1 0 16 8 8 0 0 1 0-16Zm-1 3v6l5 3 1-1.7-4-2.3V7h-2Z"/></svg> Horario de Atención</h2>
            <p class="row"><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M7 2v2H4v18h16V4h-3V2h-2v2H9V2H7Zm-1 8h12v10H6V10Zm4.6 7.6-2.8-2.8 1.4-1.4 1.4 1.4 4.2-4.2 1.4 1.4-5.6 5.6Z"/></svg>
              <span><strong>Comisión de Admisión (denuncias):</strong> lunes a viernes, 10:00 h - 13:00 h</span></p>
            <p class="row row--closed"><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M7 2v2H4v18h16V4h-3V2h-2v2H9V2H7Zm-1 8h12v10H6V10Zm3.4 2.6L12 15.2l2.6-2.6 1.4 1.4-2.6 2.6 2.6 2.6-1.4 1.4-2.6-2.6-2.6 2.6L8 18.6l2.6-2.6L8 13.4l1.4-1.4Z"/></svg>
              <span><strong>Sábado y Domingo:</strong> Cerrado</span></p>
          </section>
        </aside>
      </div>
    </div>
  `,
  styles: `
    :host { --g: #800020; --g-dark: #66001a; --navy: #0f1b33; display: block; background: #f0f0f0; }
    .page { padding-bottom: clamp(3rem, 6vw, 5rem); }
    .notice { display: flex; align-items: center; gap: 0.75rem; margin: 1.5rem 0 0; padding: 1.1rem 1.5rem; background: #fdf1f3; border-left: 5px solid var(--g); color: var(--g); }
    .notice p { margin: 0; font-weight: 600; flex: 1; max-width: none; }
    .notice__x { display: grid; place-items: center; width: 2.75rem; height: 2.75rem; flex: none; background: none; border: 0; color: var(--g); font-size: 1.5rem; line-height: 1; cursor: pointer; }
    .grid { display: grid; grid-template-columns: minmax(0, 7fr) minmax(0, 5fr); gap: 2.5rem; align-items: start; padding-top: clamp(2.5rem, 6vw, 5.5rem); }
    .card { background: #fff; border-radius: 12px; padding: clamp(1.5rem, 3vw, 2.25rem); box-shadow: 0 1px 3px rgb(0 0 0 / 0.06); }
    .form-card { padding: clamp(1.75rem, 4vw, 3.5rem) clamp(1.5rem, 3vw, 2.25rem); }
    h1 { margin: 0 0 1.25rem; font-size: clamp(2rem, 3.6vw, 3rem); font-weight: 800; text-transform: uppercase; color: var(--navy); letter-spacing: 0.01em; }
    .secret { display: flex; align-items: flex-start; gap: 0.5rem; color: var(--g); font-weight: 600; margin: 0 0 1.75rem; }
    .secret svg { flex: none; margin-top: 0.25em; }
    .cols { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem 2.25rem; }
    .col { display: grid; gap: 1.4rem; align-content: start; }
    .in { width: 100%; font: inherit; padding: 0.9rem 1.1rem; border: 1px solid #858585; border-radius: 8px; background: #fafafa; color: #222; }
    .in::placeholder { color: #6b6b6b; }
    .f { display: grid; gap: 0.4rem; }
    .f--grow { grid-template-rows: auto 1fr; height: 100%; }
    .lb { font-weight: 600; color: var(--navy); }
    .opt { font-weight: 400; color: #5a6b80; }
    .req { color: var(--g); }
    .in:focus { border-color: var(--g); background: #fff; }
    .in[aria-invalid='true'] { border-color: #b00020; }
    .in--area { min-height: 11rem; height: 100%; resize: vertical; }
    .send { margin-top: 1.75rem; width: 100%; display: inline-flex; align-items: center; justify-content: center; gap: 0.6rem; min-height: 3.5rem; border: 0; border-radius: 8px;
      background: var(--g); color: #fff; font: inherit; font-size: 1.125rem; font-weight: 700; cursor: pointer; }
    .send:hover { background: var(--g-dark); }
    .send[disabled] { opacity: 0.7; cursor: progress; }
    .send--quiet { width: auto; padding: 0 1.5rem; }
    .err { color: #b00020; font-weight: 600; margin: 1rem 0 0; }
    .done h2 { color: var(--navy); }
    .hp { position: absolute; left: -9999px; }
    .side { display: grid; grid-template-columns: minmax(0, 1fr); gap: 1.75rem; }
    .card--top { border-top: 5px solid var(--g); }
    .card h2 { display: flex; align-items: center; gap: 0.6rem; margin: 0 0 0.85rem; font-size: 1.375rem; color: var(--navy); }
    .card h2 svg { color: var(--g); flex: none; }
    .h2--sp { margin-top: 1.5rem !important; }
    .muted { color: #5a6b80; margin: 0 0 1rem; }
    .outline { display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.6rem 1rem; border: 1px solid #e3c4cb; border-radius: 6px; color: var(--g); font-weight: 700; text-decoration: none; }
    .outline:hover { background: #fdf1f3; }
    .row { display: flex; align-items: center; gap: 0.75rem; margin: 0 0 0.6rem; padding: 0.75rem 1rem; background: #f7f7f7; border-radius: 6px; }
    .row svg { color: var(--g); flex: none; }
    .row strong { margin-right: 0.3em; }
    .row > span { min-width: 0; overflow-wrap: anywhere; }
    .row a { color: inherit; }
    .row--closed { background: #fdf1f3; color: var(--g); }
    @media (max-width: 960px) { .grid { grid-template-columns: minmax(0, 1fr); } }
    @media (max-width: 640px) { .cols { grid-template-columns: minmax(0, 1fr); } .notice { padding: 0.9rem 1rem; } }
  `,
})
export class ComplaintsPage {
  private readonly api = inject(ApiService);
  protected readonly form = inject(FormBuilder).nonNullable.group({
    name: ['', [Validators.maxLength(120)]],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.pattern(/^9\d{8}$/)]],
    message: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(2000)]],
    website: [''],
  });
  protected readonly notice = signal(true);
  protected readonly sending = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly caseNumber = signal<string | null>(null);

  protected bad(name: string): boolean {
    const c = this.form.get(name);
    return !!c && c.invalid && c.touched;
  }

  protected send(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      this.error.set('Indica un correo válido para responderte y describe los hechos en al menos 10 caracteres. El celular, si lo pones, tiene 9 dígitos y empieza con 9.');
      return;
    }
    this.sending.set(true);
    this.error.set(null);
    const v = this.form.getRawValue();
    this.api.complaint({ email: v.email, message: v.message, name: v.name || undefined, phone: v.phone || undefined, website: v.website || undefined }).subscribe({
      next: (r) => {
        this.caseNumber.set(r.caseNumber);
        this.form.reset();
        this.sending.set(false);
      },
      error: (e) => {
        this.error.set(apiErrorMessage(e));
        this.sending.set(false);
      },
    });
  }
}
