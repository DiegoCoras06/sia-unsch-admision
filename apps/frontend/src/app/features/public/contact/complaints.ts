import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService, apiErrorMessage } from '../../../core/api.service';

/** Denuncias e irregularidades del proceso, como el portal oficial: se registran como caso reservado en el panel. */
@Component({
  selector: 'app-complaints',
  imports: [ReactiveFormsModule],
  template: `
    <section class="p-hero field-accent field-glow" aria-labelledby="dn-title">
      <div class="frame p-hero__grid">
        <div class="p-hero__text">
          <p class="p-kicker"><svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="currentColor" d="M12 2 4 5v6c0 5 3.4 9.5 8 11 4.6-1.5 8-6 8-11V5l-8-3Zm0 2.2 6 2.2V11c0 3.9-2.5 7.5-6 8.9V4.2Z"/></svg>Canal de denuncias</p>
          <h1 id="dn-title">Denuncia una <span>irregularidad</span></h1>
          <p class="p-lead">Ante cualquier denuncia o irregularidad del proceso de admisión, escríbenos. Atendemos cada caso con absoluta reserva y te damos un número para hacerle seguimiento.</p>
        </div>
        <ul class="dn-promises" aria-label="Qué garantizamos">
          <li><span class="dn-promises__icon"><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M12 1a5 5 0 0 0-5 5v3H5v14h14V9h-2V6a5 5 0 0 0-5-5Zm-3 8V6a3 3 0 1 1 6 0v3H9Z"/></svg></span><span><strong>Reserva absoluta</strong>Tu denuncia solo la ve la Comisión de Admisión.</span></li>
          <li><span class="dn-promises__icon"><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm0 2c-4.4 0-8 2.2-8 5v3h16v-3c0-2.8-3.6-5-8-5Z"/></svg></span><span><strong>Nombre opcional</strong>Solo pedimos un correo para responderte.</span></li>
          <li><span class="dn-promises__icon"><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M4 4h16v4H4V4Zm0 6h16v10H4V10Zm3 3v2h6v-2H7Z"/></svg></span><span><strong>Número de caso</strong>Para hacer seguimiento de tu denuncia.</span></li>
        </ul>
      </div>
    </section>

    <div class="page">
      <div class="frame grid">
        <section class="card form-card" aria-labelledby="d-title">
          <h2 id="d-title" class="form-title">Ingresa tu denuncia</h2>
          <p class="secret" id="d-reserva">
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M12 1a5 5 0 0 0-5 5v3H5v14h14V9h-2V6a5 5 0 0 0-5-5Zm-3 8V6a3 3 0 1 1 6 0v3H9Z"/></svg>
            <span>Tu nombre es opcional y tu denuncia se atiende con reserva. El correo solo se usa para responderte; no se publica ni se comparte. Los campos con <span class="req" aria-hidden="true">*</span> son obligatorios.</span>
          </p>

          @if (caseNumber(); as n) {
            <div class="done" role="status">
              <span class="done__icon" aria-hidden="true"><svg viewBox="0 0 24 24" width="28" height="28"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg></span>
              <h3>Recibimos tu denuncia</h3>
              <p class="done__label">Tu número de caso</p>
              <p class="done__num">{{ n }}</p>
              <p>Guárdalo para hacer seguimiento; te escribiremos al correo que indicaste.</p>
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
                    <textarea id="d-msg" class="in in--area" formControlName="message" placeholder="Qué pasó, cuándo y dónde, y quiénes participaron." aria-required="true" [attr.aria-invalid]="bad('message')"></textarea>
                    <span class="count" aria-live="polite">{{ form.controls.message.value.length }} / 2000</span></div>
                </div>
              </div>
              <div class="f f--files">
                <span class="lb" id="d-files-lb">Evidencia <span class="opt">(opcional: hasta 3 archivos PDF, JPG o PNG, 5 MB en total)</span></span>
                <label class="drop" for="d-files">
                  <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path fill="currentColor" d="M16.5 6.5v10a4.5 4.5 0 0 1-9 0V5a3 3 0 0 1 6 0v10.5a1.5 1.5 0 0 1-3 0V6.5H9v9a3 3 0 0 0 6 0V5a4.5 4.5 0 0 0-9 0v11.5a6 6 0 0 0 12 0v-10h-1.5Z"/></svg>
                  <span><strong>Adjuntar archivos</strong><small>Fotos o documentos que respalden tu denuncia</small></span></label>
                <input id="d-files" type="file" multiple accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" hidden aria-labelledby="d-files-lb" (change)="pick($any($event.target))">
                @if (files().length) {
                  <ul class="files">@for (f of files(); track f.name) {
                    <li><span>{{ f.name }} <span class="opt">({{ kb(f.size) }})</span></span><button type="button" class="files__x" (click)="remove(f)" [attr.aria-label]="'Quitar ' + f.name">×</button></li>
                  }</ul>
                }
              </div>
              <div class="hp" aria-hidden="true"><label for="d-web">Sitio web</label><input id="d-web" tabindex="-1" autocomplete="off" formControlName="website"></div>
              @if (error()) { <p class="err" role="alert">{{ error() }}</p> }
              <button class="send" type="submit" [disabled]="sending()" [attr.aria-busy]="sending()">
                <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M2 21 23 12 2 3v7l15 2-15 2v7Z"/></svg>
                {{ sending() ? 'Enviando…' : 'Enviar denuncia de forma segura' }}
              </button>
            </form>
          }
        </section>

        <aside class="side">
          <section class="card side-card">
            <span class="side-card__icon" aria-hidden="true"><svg viewBox="0 0 24 24" width="22" height="22"><path fill="currentColor" d="M12 2 2 7v2h20V7L12 2ZM4 11v7h2v-7H4Zm4 0v7h2v-7H8Zm6 0v7h2v-7h-2Zm4 0v7h2v-7h-2ZM2 20v2h20v-2H2Z"/></svg></span>
            <h2>Contraloría General de la República</h2>
            <p class="muted">También puedes presentar tu denuncia directamente ante la Plataforma Nacional Digital de Denuncias Ciudadanas del Estado.</p>
            <a class="outline" href="https://www.contraloria.gob.pe/" target="_blank" rel="noopener">Ir a Contraloría
              <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true"><path fill="currentColor" d="M14 3h7v7h-2V6.4l-9.3 9.3-1.4-1.4L17.6 5H14V3ZM5 5h6v2H5v12h12v-6h2v8H3V5h2Z"/></svg><span class="sr-only">(se abre en otra pestaña)</span></a>
          </section>

          <section class="card side-card">
            <span class="side-card__icon" aria-hidden="true"><svg viewBox="0 0 24 24" width="22" height="22"><path fill="currentColor" d="M2 5h20v14H2V5Zm2 2v.5l8 5 8-5V7H4Zm16 2.8-8 5-8-5V17h16V9.8Z"/></svg></span>
            <h2>Denuncia por correo directo</h2>
            <p class="row"><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M2 5h20v14H2V5Zm2 2v.5l8 5 8-5V7H4Z"/></svg>
              <span><strong>Correo:</strong> <a href="mailto:admision@unsch.edu.pe">admision&#64;unsch.edu.pe</a></span></p>
            <h2 class="h2--sp">Horario de atención</h2>
            <p class="row"><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M7 2v2H4v18h16V4h-3V2h-2v2H9V2H7Zm-1 8h12v10H6V10Zm4.6 7.6-2.8-2.8 1.4-1.4 1.4 1.4 4.2-4.2 1.4 1.4-5.6 5.6Z"/></svg>
              <span><strong>Comisión de Admisión (denuncias):</strong> lunes a viernes, 10:00 h - 13:00 h</span></p>
            <p class="row row--closed"><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M7 2v2H4v18h16V4h-3V2h-2v2H9V2H7Zm-1 8h12v10H6V10Zm3.4 2.6L12 15.2l2.6-2.6 1.4 1.4-2.6 2.6 2.6 2.6-1.4 1.4-2.6-2.6-2.6 2.6L8 18.6l2.6-2.6L8 13.4l1.4-1.4Z"/></svg>
              <span><strong>Sábado y domingo:</strong> cerrado</span></p>
          </section>
        </aside>
      </div>
    </div>
  `,
  styles: `
    :host { display: block; background: var(--stone); }
    .page { padding-bottom: clamp(3rem, 6vw, 5rem); }
    .p-kicker svg { flex: none; }
    /* Garantías en una tarjeta de vidrio, con ícono dorado. */
    .dn-promises { margin: 0; padding: clamp(1rem, 2.4vw, 1.4rem); list-style: none; display: grid; gap: 0.6rem; border-radius: 22px; background: rgb(255 255 255 / 0.08);
      border: 1px solid rgb(255 255 255 / 0.22); -webkit-backdrop-filter: blur(12px); backdrop-filter: blur(12px); box-shadow: 0 30px 60px -32px rgb(20 6 8 / 0.8), inset 0 1px 0 rgb(255 255 255 / 0.18); }
    .dn-promises li { display: grid; grid-template-columns: auto minmax(0, 1fr); gap: 0.85rem; align-items: center; padding: 0.7rem 0.85rem; border-radius: 14px; background: rgb(255 255 255 / 0.07); }
    .dn-promises__icon { display: grid; place-items: center; width: 2.4rem; height: 2.4rem; border-radius: 12px; color: var(--ink); background: linear-gradient(180deg, #edd07a, #c9a23a); }
    .dn-promises li > span:last-child { display: grid; gap: 0.1rem; font-size: 0.9375rem; color: rgb(255 255 255 / 0.88); }
    .dn-promises strong { color: #fff; }

    .grid { display: grid; grid-template-columns: minmax(0, 7fr) minmax(0, 5fr); gap: clamp(1.25rem, 3vw, 2rem); align-items: start; margin-top: clamp(-2.5rem, -4vh, -1.5rem); position: relative; z-index: 1; }
    .card { background: #fff; border-radius: 22px; padding: clamp(1.4rem, 3vw, 2rem); box-shadow: 0 0 0 1px rgb(29 20 21 / 0.06), 0 20px 40px -30px rgb(29 20 21 / 0.55); }
    .form-card { padding: clamp(1.5rem, 3.5vw, 2.5rem); border-top: 4px solid var(--gold); }
    .form-title { margin: 0 0 0.85rem; font-size: clamp(1.6rem, 2.8vw, 2.25rem); letter-spacing: -0.03em; }
    .secret { display: flex; align-items: flex-start; gap: 0.6rem; margin: 0 0 1.6rem; padding: 0.85rem 1rem; border-radius: 14px; background: #f7ece9; color: var(--accent);
      font-weight: 600; font-size: 0.9375rem; max-width: none; }
    .secret svg { flex: none; margin-top: 0.15em; }
    .cols { display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem 1.75rem; }
    .col { display: grid; gap: 1.2rem; align-content: start; }
    .f { display: grid; gap: 0.4rem; }
    .f--grow { grid-template-rows: auto 1fr auto; height: 100%; }
    .lb { font-weight: 600; color: var(--ink); }
    .opt { font-weight: 400; color: var(--ink-soft); }
    .req { color: var(--accent); }
    /* Campos en relieve con foco dorado, como en el resto del portal. */
    .in { width: 100%; min-height: 3.1rem; font: inherit; padding: 0.8rem 1rem; border: 1px solid var(--stone-deep); border-radius: 12px; background: #fbf7f3; color: var(--ink);
      box-shadow: inset 2px 2px 6px rgb(29 20 21 / 0.1), inset -2px -2px 5px rgb(255 255 255 / 0.9); transition: border-color var(--fast) var(--ease), box-shadow var(--fast) var(--ease); }
    .in::placeholder { color: #6b6060; }
    .in:hover { border-color: var(--ink-soft); }
    .in:focus { outline: none; border-color: var(--gold); background: #fff; box-shadow: 0 0 0 4px rgb(217 180 74 / 0.35); }
    .in[aria-invalid='true'] { border-color: var(--danger); box-shadow: inset 0 0 0 1px var(--danger); }
    .in--area { min-height: 12rem; height: 100%; resize: vertical; line-height: 1.5; }
    .count { justify-self: end; font-size: 0.8125rem; color: var(--ink-soft); font-variant-numeric: tabular-nums; }
    .f--files { margin-top: 1.4rem; }
    .drop { display: flex; align-items: center; gap: 0.85rem; padding: 1rem 1.1rem; border: 2px dashed #d9c9bf; border-radius: 16px; background: #fbf7f3; color: var(--accent); cursor: pointer;
      transition: border-color var(--fast) var(--ease), background-color var(--fast) var(--ease); }
    .drop span { display: grid; gap: 0.1rem; }
    .drop small { color: var(--ink-soft); font-size: var(--size-note); }
    @media (hover: hover) { .drop:hover { border-color: var(--gold); background: #fffaf0; } }
    .files { list-style: none; margin: 0.35rem 0 0; padding: 0; display: grid; gap: 0.35rem; }
    .files li { display: flex; align-items: center; justify-content: space-between; gap: 0.75rem; padding: 0.5rem 0.85rem; background: #fbf7f3; border-radius: 12px; overflow-wrap: anywhere; }
    .files__x { flex: none; width: 2.5rem; height: 2.5rem; border: 0; border-radius: 10px; background: none; color: var(--accent); font-size: 1.35rem; cursor: pointer; }
    .files__x:hover { background: #f7ece9; }
    .hp { position: absolute; left: -9999px; }
    .send { margin-top: 1.6rem; width: 100%; display: inline-flex; align-items: center; justify-content: center; gap: 0.6rem; min-height: 3.4rem; border: 1px solid var(--accent-press);
      border-radius: 14px; color: #fff; font: inherit; font-size: 1.0625rem; font-weight: 700; cursor: pointer;
      background: linear-gradient(180deg, #932830 0%, var(--accent) 55%, #62161b 100%); box-shadow: 0 16px 28px -16px rgb(122 28 34 / 0.9), inset 0 1px 0 rgb(255 255 255 / 0.2); }
    @media (hover: hover) { .send:not([disabled]):hover { filter: brightness(1.08); } }
    .send[disabled] { opacity: 0.7; cursor: progress; }
    .send--quiet { width: auto; padding: 0 1.5rem; margin-top: 0.5rem; }
    .err { display: flex; gap: 0.5rem; margin: 1rem 0 0; padding: 0.75rem 1rem; border-radius: 12px; background: #fbe9ea; color: var(--danger); font-weight: 600; }
    .done { display: grid; justify-items: center; gap: 0.5rem; padding: 1.5rem 1rem; text-align: center; border-radius: 18px; background: #f1f9f3; }
    .done__icon { display: grid; place-items: center; width: 3.5rem; height: 3.5rem; border-radius: 50%; background: #1f7a3f; color: #fff; box-shadow: 0 0 0 6px rgb(31 122 63 / 0.15); }
    .done h3 { font-size: 1.375rem; margin-top: 0.4rem; }
    .done p { margin: 0; max-width: 44ch; }
    .done__label { font-size: var(--size-note); font-weight: 700; color: var(--ink-soft); }
    .done__num { font-size: clamp(1.6rem, 3vw, 2.1rem); font-weight: 800; letter-spacing: 0.04em; color: var(--accent); font-variant-numeric: tabular-nums; }
    .side { display: grid; gap: 1rem; }
    .side-card { position: relative; display: grid; gap: 0.75rem; }
    .side-card__icon { display: grid; place-items: center; width: 2.75rem; height: 2.75rem; border-radius: 14px; color: #fff;
      background: linear-gradient(160deg, #8d242b, var(--accent) 55%, #5e1419); box-shadow: 0 10px 18px -12px rgb(94 20 25 / 0.9); }
    .side-card h2 { margin: 0; font-size: 1.25rem; letter-spacing: -0.015em; }
    .h2--sp { margin-top: 0.75rem !important; }
    .muted { color: var(--ink-soft); margin: 0; }
    .outline { justify-self: start; display: inline-flex; align-items: center; gap: 0.45rem; min-height: 2.75rem; padding: 0 1.1rem; border-radius: 12px; color: var(--accent); font-weight: 700;
      text-decoration: none; background: #fff; box-shadow: 0 0 0 1px var(--stone-deep), 0 8px 16px -12px rgb(29 20 21 / 0.4); }
    @media (hover: hover) { .outline:hover { box-shadow: 0 0 0 1px var(--accent), 0 10px 18px -12px rgb(122 28 34 / 0.5); } }
    .row { display: flex; align-items: center; gap: 0.75rem; margin: 0; padding: 0.75rem 0.9rem; border-radius: 12px; background: #fbf7f3; max-width: none; }
    .row svg { color: var(--accent); flex: none; }
    .row strong { margin-right: 0.3em; }
    .row > span { min-width: 0; overflow-wrap: anywhere; }
    .row a { color: var(--accent); font-weight: 600; }
    .row--closed { background: #f7ece9; color: var(--accent); }
    @media (max-width: 960px) { .grid { grid-template-columns: minmax(0, 1fr); margin-top: 1.25rem; } }
    @media (max-width: 640px) { .cols { grid-template-columns: minmax(0, 1fr); } }
    @media (prefers-reduced-motion: reduce) { .in, .drop { transition: none; } }
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
  protected readonly sending = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly caseNumber = signal<string | null>(null);
  protected readonly files = signal<File[]>([]);

  protected kb(bytes: number) { return bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`; }

  /** Evidencia: se valida en el navegador para avisar pronto; el servidor la vuelve a verificar por su contenido. */
  protected pick(input: HTMLInputElement): void {
    const picked = [...(input.files ?? [])];
    input.value = '';
    const all = [...this.files(), ...picked.filter((p) => !this.files().some((f) => f.name === p.name))];
    if (all.some((f) => !/\.(pdf|jpe?g|png)$/i.test(f.name))) { this.error.set('Solo se aceptan archivos PDF, JPG o PNG.'); return; }
    if (all.length > 3) { this.error.set('Puedes adjuntar como máximo 3 archivos.'); return; }
    if (all.reduce((s, f) => s + f.size, 0) > 5 * 1024 * 1024) { this.error.set('Los archivos superan 5 MB en total.'); return; }
    this.error.set(null);
    this.files.set(all);
  }

  protected remove(f: File): void { this.files.set(this.files().filter((x) => x !== f)); }

  private toDataUrl(f: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result));
      r.onerror = () => reject(new Error(`No se pudo leer ${f.name}.`));
      r.readAsDataURL(f);
    });
  }

  protected bad(name: string): boolean {
    const c = this.form.get(name);
    return !!c && c.invalid && c.touched;
  }

  protected async send(): Promise<void> {
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      this.error.set('Indica un correo válido para responderte y describe los hechos en al menos 10 caracteres. El celular, si lo pones, tiene 9 dígitos y empieza con 9.');
      return;
    }
    this.sending.set(true);
    this.error.set(null);
    const v = this.form.getRawValue();
    let attachments: { fileName: string; content: string }[] = [];
    try {
      attachments = await Promise.all(this.files().map(async (f) => ({ fileName: f.name, content: await this.toDataUrl(f) })));
    } catch (e) {
      this.error.set((e as Error).message);
      this.sending.set(false);
      return;
    }
    this.api.complaint({ email: v.email, message: v.message, name: v.name || undefined, phone: v.phone || undefined, website: v.website || undefined, attachments: attachments.length ? attachments : undefined }).subscribe({
      next: (r) => {
        this.caseNumber.set(r.caseNumber);
        this.form.reset();
        this.files.set([]);
        this.sending.set(false);
      },
      error: (e) => {
        this.error.set(apiErrorMessage(e));
        this.sending.set(false);
      },
    });
  }
}
