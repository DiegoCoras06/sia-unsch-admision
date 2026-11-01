import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService, apiErrorMessage } from '../../../core/api.service';

interface Member { role: string; name: string; does: string; icon: string }

/** Equipo de la Dirección de Admisión, como el portal oficial. */
const TEAM: Member[] = [
  { role: 'Director', name: 'Dr. Boris E. PEÑA MORALES', does: 'Presidente / Director de la Dirección de Admisión', icon: 'M12 2a4 4 0 1 1 0 8 4 4 0 0 1 0-8Zm-7 18c0-3.9 3.1-7 7-7s7 3.1 7 7v2H5v-2Zm7-5-1.5 2 1.5 4 1.5-4L12 15Z' },
  { role: 'Secretaría', name: 'Sra. Dina Mendoza', does: 'Atención administrativa e informes generales', icon: 'M4 4h11v2H6v12h12v-9h2v11H4V4Zm15.3-1.7 2.4 2.4L12.4 14H10v-2.4l9.3-9.3Z' },
  { role: 'Logística', name: 'Sr. César Mamani', does: 'Soporte y coordinación logística', icon: 'M2 6h12v9h1.5l1-4H20l2 3v4h-2a2.5 2.5 0 0 1-5 0H9a2.5 2.5 0 0 1-5 0H2V6Zm4.5 11a1 1 0 1 0 0 2 1 1 0 0 0 0-2Zm11 0a1 1 0 1 0 0 2 1 1 0 0 0 0-2Z' },
  { role: 'Soporte técnico', name: 'Sr. Abraham Martínez', does: 'Gestión de sistemas e infraestructura digital', icon: 'M4 5h16v10H4V5Zm2 2v6h12V7H6ZM2 17h20v2H2v-2Z' },
  { role: 'Imagen institucional', name: 'Srta. Janeth Cayllahua', does: 'Comunicaciones y difusión del proceso', icon: 'M3 10h3l9-5v14l-9-5H5l1 5H4l-1-5v-4Zm14-1h2a3 3 0 0 1 0 6h-2V9Z' },
];

/** Spec 001, Historia 6 - FR-012: datos de contacto, equipo, horarios y consulta con número de caso. */
@Component({
  selector: 'app-contact',
  imports: [ReactiveFormsModule],
  template: `
    <div class="page">
      <section class="frame team" aria-labelledby="team-title">
        <h1 id="team-title">Nuestro equipo</h1>
        <div class="team__grid">
          @for (m of team; track m.name; let i = $index) {
            <article class="member" [class.member--half]="i >= 3">
              <div class="member__top">
                <span class="member__icon"><svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path fill="currentColor" [attr.d]="m.icon"/></svg></span>
                <span class="member__role">{{ m.role }}</span>
              </div>
              <h2>{{ m.name }}</h2>
              <p>{{ m.does }}</p>
            </article>
          }
        </div>
        @if (notice()) {
          <div class="info" role="note">
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm-1 5h2v2h-2V7Zm0 4h2v6h-2v-6Z"/></svg>
            <p>Si tienes una consulta, escríbenos al correo electrónico y con gusto te responderemos.</p>
            <button type="button" (click)="notice.set(false)" aria-label="Cerrar aviso">×</button>
          </div>
        }
      </section>

      <div class="frame cols">
        <section class="card" aria-labelledby="ch-title">
          <h2 id="ch-title" class="card__title">Canales de Contacto</h2>
          <ul class="channels">
            <li><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7Zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5Z"/></svg>
              <span><strong>Ubicación:</strong> Jr. Arequipa 175, Segundo Piso, Ayacucho</span></li>
            <li><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M2 5h20v14H2V5Zm2 2v.5l8 5 8-5V7H4Z"/></svg>
              <span><strong>Inscripciones:</strong> <a href="mailto:admision@unsch.edu.pe">admision&#64;unsch.edu.pe</a></span></li>
            <li><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" d="M3 6h18v12H3zM3 7l9 6 9-6"/></svg>
              <span><strong>Secretaría:</strong> <a href="mailto:dina.mendoza@unsch.edu.pe">dina.mendoza&#64;unsch.edu.pe</a></span></li>
            <li><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" d="M3 6h18v12H3zM3 7l9 6 9-6"/></svg>
              <span><strong>Logística:</strong> <a href="mailto:cesar.mamani@unsch.edu.pe">cesar.mamani&#64;unsch.edu.pe</a></span></li>
            <li><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" d="M3 6h18v12H3zM3 7l9 6 9-6"/></svg>
              <span><strong>Soporte Técnico:</strong> <a href="mailto:abraham.martinez@unsch.edu.pe">abraham.martinez&#64;unsch.edu.pe</a></span></li>
            <li><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm6.9 9h-3a15 15 0 0 0-1.3-5.6A8 8 0 0 1 18.9 11ZM12 4.1c.9 1.2 1.7 3.6 1.9 6.9h-3.8c.2-3.3 1-5.7 1.9-6.9ZM9.4 5.4A15 15 0 0 0 8.1 11h-3a8 8 0 0 1 4.3-5.6ZM5.1 13h3a15 15 0 0 0 1.3 5.6A8 8 0 0 1 5.1 13Zm6.9 6.9c-.9-1.2-1.7-3.6-1.9-6.9h3.8c-.2 3.3-1 5.7-1.9 6.9Zm2.6-1.3a15 15 0 0 0 1.3-5.6h3a8 8 0 0 1-4.3 5.6Z"/></svg>
              <span><strong>Portal Web:</strong> <a href="https://admision.unsch.edu.pe" target="_blank" rel="noopener">admision.unsch.edu.pe</a></span></li>
            <li><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M4 3h16a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1h-5v-7h2.5l.5-3h-3V9.5c0-.9.3-1.5 1.6-1.5H18V5.3c-.3 0-1.2-.1-2.3-.1-2.3 0-3.7 1.4-3.7 3.9V11H9.5v3H12v7H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z"/></svg>
              <span><strong>Facebook:</strong> Admision UNSCH</span></li>
          </ul>
          <div class="mpv">
            <div><strong>Mesa de Partes Virtual</strong><span>Inicia aquí tus trámites externos</span></div>
            <a class="btn-blue" href="https://tramite.unsch.edu.pe/solicitud-tramite-externo" target="_blank" rel="noopener">Ingresar aquí
              <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true"><path fill="currentColor" d="M14 3h7v7h-2V6.4l-9.3 9.3-1.4-1.4L17.6 5H14V3ZM5 5h6v2H5v12h12v-6h2v8H3V5h2Z"/></svg></a>
          </div>
        </section>

        <section class="card" aria-labelledby="hr-title">
          <h2 id="hr-title" class="card__title card__title--icon">
            <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path fill="currentColor" d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm0 2a8 8 0 1 1 0 16 8 8 0 0 1 0-16Zm-1 3v6l5 3 1-1.7-4-2.3V7h-2Z"/></svg>
            Horario de Atención</h2>
          <div class="slot"><strong>Oficina presencial</strong><span>Lunes a Viernes: 8:00 h - 13:00 h | 14:00 h - 15:30 h</span></div>
          <div class="slot"><strong>Atención en línea (correo electrónico)</strong><span>Lunes a Viernes: 9:00 h - 13:00 h</span></div>
          <div class="slot slot--closed"><strong>Sábados y domingos</strong><span>Cerrado</span></div>
        </section>
      </div>

      <section class="frame" aria-labelledby="q-title">
        <div class="card ask">
          <h2 id="q-title" class="card__title">Envíanos tu consulta</h2>
          @if (caseNumber(); as n) {
            <div role="status">
              <p>Recibimos tu mensaje. Tu número de caso es <strong>{{ n }}</strong>; te enviamos una copia a tu correo.</p>
              <button type="button" class="btn-blue" (click)="caseNumber.set(null)">Enviar otra consulta</button>
            </div>
          } @else {
            <form [formGroup]="form" (ngSubmit)="send()" novalidate class="ask__form">
              <div class="f"><label for="c-name">Nombres y apellidos <span class="req" aria-hidden="true">*</span></label><input id="c-name" class="in" formControlName="name" autocomplete="name" aria-required="true" [attr.aria-invalid]="bad('name')"></div>
              <div class="f"><label for="c-email">Correo electrónico <span class="req" aria-hidden="true">*</span></label><input id="c-email" class="in" type="email" formControlName="email" autocomplete="email" aria-required="true" [attr.aria-invalid]="bad('email')"></div>
              <div class="f"><label for="c-phone">Celular (opcional)</label><input id="c-phone" class="in" inputmode="numeric" formControlName="phone" autocomplete="tel" placeholder="9 dígitos" [attr.aria-invalid]="bad('phone')"></div>
              <div class="f f--wide"><label for="c-msg">Tu consulta <span class="req" aria-hidden="true">*</span></label><textarea id="c-msg" class="in" rows="5" formControlName="message" aria-required="true" [attr.aria-invalid]="bad('message')"></textarea></div>
              <div class="hp" aria-hidden="true"><label for="c-web">Sitio web</label><input id="c-web" tabindex="-1" autocomplete="off" formControlName="website"></div>
              @if (error()) { <p class="err f--wide" role="alert">{{ error() }}</p> }
              <div class="f--wide"><button class="btn-blue" type="submit" [disabled]="sending()">{{ sending() ? 'Enviando…' : 'Enviar consulta' }}</button></div>
            </form>
          }
        </div>
      </section>
    </div>
  `,
  styles: `
    :host { --b: #0b6fb8; --b-dark: #095c98; --b-soft: #e8f2fb; --navy: #0f1b33; --g: #800020; display: block; background: #f0f0f0; }
    .page { padding: clamp(2.5rem, 6vw, 4.5rem) 0 clamp(3rem, 6vw, 5rem); display: grid; grid-template-columns: minmax(0, 1fr); gap: clamp(2.5rem, 5vw, 4rem); }
    h1 { text-align: center; margin: 0 0 2.75rem; font-size: clamp(1.75rem, 3vw, 2.25rem); font-weight: 800; text-transform: uppercase; color: var(--navy); letter-spacing: 0.04em; }
    h1::after { content: ''; display: block; width: 3.75rem; height: 4px; background: var(--b); border-radius: 2px; margin: 1rem auto 0; }
    .team__grid { display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 1.75rem 2.5rem; }
    .member { grid-column: span 2; background: #fff; border-radius: 12px; border-top: 5px solid var(--b); padding: 1.6rem 1.4rem; box-shadow: 0 1px 3px rgb(0 0 0 / 0.06); }
    .member--half { grid-column: span 3; }
    .member__top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
    .member__icon { display: grid; place-items: center; width: 3rem; height: 3rem; border-radius: 8px; background: var(--b-soft); color: var(--b); }
    .member__role { background: #eef4fa; color: var(--b); font-size: 0.875rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; padding: 0.4rem 0.75rem; border-radius: 6px; border: 1px solid #dbe7f3; }
    .member h2 { margin: 0 0 0.35rem; font-size: 1.25rem; color: var(--navy); }
    .member p { margin: 0; color: #5a6b80; }
    .info { display: flex; align-items: center; gap: 0.75rem; margin-top: 2.75rem; padding: 1.1rem 1.5rem; border-radius: 8px; background: linear-gradient(90deg, #0b6fb8, #0a5f9e); color: #fff; }
    .info p { margin: 0; flex: 1; font-weight: 600; max-width: none; }
    .info button { display: grid; place-items: center; width: 2.75rem; height: 2.75rem; flex: none; background: none; border: 0; color: #fff; font-size: 1.5rem; line-height: 1; cursor: pointer; }
    .cols { display: grid; grid-template-columns: minmax(0, 7fr) minmax(0, 5fr); gap: 2.5rem; align-items: start; }
    .card { background: #fff; border-radius: 12px; padding: clamp(1.5rem, 3vw, 2.25rem); box-shadow: 0 1px 3px rgb(0 0 0 / 0.06); }
    .card__title { margin: 0 0 1.25rem; padding: 0 0 1rem 0.75rem; border-bottom: 1px solid #e5e5e5; font-size: 1.5rem; color: var(--navy); }
    .card__title--icon { display: flex; align-items: center; gap: 0.6rem; padding-left: 0; }
    .card__title--icon svg { color: var(--b); }
    .channels { list-style: none; margin: 0 0 1.5rem; padding: 0; display: grid; gap: 0.9rem; }
    .channels li { display: flex; align-items: center; gap: 1rem; min-width: 0; }
    .channels li > :not(svg) { min-width: 0; overflow-wrap: anywhere; }
    .channels svg { width: 20px; height: 20px; color: var(--b); flex: none; }
    .channels strong { margin-right: 0.3em; }
    .channels a { color: inherit; text-decoration: none; }
    .channels a:hover { color: var(--b); text-decoration: underline; }
    .mpv { display: flex; justify-content: space-between; align-items: center; gap: 1rem; flex-wrap: wrap; padding: 1.1rem 1.4rem; background: #f1f5fa; border-radius: 8px; }
    .mpv div { display: grid; gap: 0.2rem; }
    .mpv span { color: #5a6b80; font-size: 0.9375rem; }
    .btn-blue { display: inline-flex; align-items: center; gap: 0.45rem; min-height: 2.75rem; padding: 0 1.1rem; border: 0; border-radius: 6px; background: var(--b); color: #fff; font: inherit; font-weight: 700; text-decoration: none; cursor: pointer; }
    .btn-blue:hover { background: var(--b-dark); }
    .btn-blue[disabled] { opacity: 0.7; cursor: progress; }
    .slot { display: grid; gap: 0.3rem; margin-bottom: 0.9rem; padding: 0.95rem 1.25rem; background: #f6f8fb; border-left: 4px solid var(--b); border-radius: 0 6px 6px 0; }
    .slot strong { text-transform: uppercase; font-size: 0.9375rem; color: var(--navy); }
    .slot--closed { background: #fdf1f3; border-left-color: var(--g); }
    .slot--closed strong { color: var(--g); }
    .ask__form { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 1.1rem 1.5rem; }
    .f { display: grid; gap: 0.4rem; }
    .f label { font-weight: 600; }
    .f--wide { grid-column: 1 / -1; }
    .req { color: #b00020; }
    .in { width: 100%; font: inherit; padding: 0.8rem 1rem; border: 1px solid #858585; border-radius: 8px; background: #fafafa; }
    .in:focus { border-color: var(--b); background: #fff; }
    .in[aria-invalid='true'] { border-color: #b00020; }
    .in::placeholder { color: #6b6b6b; }
    textarea.in { resize: vertical; }
    .err { color: #b00020; font-weight: 600; margin: 0; }
    .hp { position: absolute; left: -9999px; }
    @media (max-width: 960px) {
      .team__grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .member, .member--half { grid-column: span 1; }
      .cols { grid-template-columns: minmax(0, 1fr); }
    }
    @media (max-width: 640px) {
      .team__grid, .ask__form { grid-template-columns: minmax(0, 1fr); }
      .info { padding: 0.9rem 1rem; }
    }
  `,
})
export class ContactPage {
  private readonly api = inject(ApiService);
  protected readonly team = TEAM;
  protected readonly notice = signal(true);
  protected readonly form = inject(FormBuilder).nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(120)]],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.pattern(/^9\d{8}$/)]],
    message: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(2000)]],
    website: [''],
  });
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
      this.error.set('Revisa los campos marcados: tu nombre, un correo válido y una consulta de al menos 10 caracteres.');
      return;
    }
    this.sending.set(true);
    this.error.set(null);
    const v = this.form.getRawValue();
    this.api.contact({ ...v, phone: v.phone || undefined, website: v.website || undefined }).subscribe({
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
