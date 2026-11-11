import { HttpClient } from '@angular/common/http';
import { Component, OnInit, inject, input, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { apiErrorMessage } from '../../core/api.service';
import { fileType, postToS3, type UploadTicket } from '../../core/direct-upload';
import { dateTime } from '../../core/format';

interface DocRow {
  kind: string; name: string; hint: string; required: boolean;
  uploaded: { fileName: string; sizeBytes: number; mimeType: string; uploadedAt: string } | null;
}

const MAX = 5 * 1024 * 1024;
const kb = (n: number) => (n < 1024 * 1024 ? `${Math.round(n / 1024)} KB` : `${(n / 1024 / 1024).toFixed(1)} MB`);

/** RF-03.05: documentos que se adjuntan a la inscripción además de la foto (DNI y código ya validados). */
@Component({
  selector: 'app-extra-documents',
  template: `
    @if (rows().length) {
      <section class="docs" aria-labelledby="docs-title">
        <h3 id="docs-title">Documentos de tu inscripción</h3>
        <p class="note">PDF, JPG o PNG de hasta 5 MB. Si te equivocas, vuelve a subirlo: se guarda el último. Lleva los originales cuando la Dirección de Admisión te los pida.</p>
        <ul>
          @for (r of rows(); track r.kind) {
            <li>
              <div class="docs__what">
                <strong>{{ r.name }}@if (r.required) { <span class="req">obligatorio</span> }</strong>
                <span class="note">{{ r.hint }}</span>
                @if (r.uploaded; as u) { <span class="docs__ok">Recibido: {{ u.fileName }}, {{ size(u.sizeBytes) }}, {{ when(u.uploadedAt) }}</span> }
              </div>
              <label class="btn btn--quiet docs__file" [class.is-busy]="busy() === r.kind">
                {{ busy() === r.kind ? 'Subiendo…' : r.uploaded ? 'Reemplazar' : 'Subir archivo' }}
                <input type="file" accept="application/pdf,image/jpeg,image/png" [disabled]="!!busy()" (change)="upload(r, $any($event.target))" [attr.aria-label]="'Subir ' + r.name">
              </label>
            </li>
          }
        </ul>
        @if (msg()) { <p class="alert" [class.alert--error]="err()" [class.alert--info]="!err()" role="status">{{ msg() }}</p> }
      </section>
    }
  `,
  styles: `
    .docs { display: grid; gap: 0.75rem; }
    h3 { font-size: 1.375rem; }
    ul { list-style: none; margin: 0; padding: 0; display: grid; gap: 2px; }
    li { background: var(--stone); padding: 0.9rem 1rem; display: flex; gap: 1rem; align-items: center; justify-content: space-between; flex-wrap: wrap; }
    .docs__what { display: grid; gap: 0.2rem; min-width: 0; flex: 1 1 18rem; }
    .req { margin-left: 0.5rem; font-size: 0.8125rem; font-weight: 700; color: var(--accent); }
    .docs__ok { color: #164d2a; font-weight: 600; font-size: 0.9375rem; overflow-wrap: anywhere; }
    .docs__file { position: relative; overflow: hidden; cursor: pointer; }
    .docs__file input { position: absolute; inset: 0; opacity: 0; cursor: pointer; }
    .docs__file:focus-within { outline: 2px solid currentColor; outline-offset: 2px; }
    @media print { :host { display: none; } }
  `,
})
export class ExtraDocuments implements OnInit {
  private readonly http = inject(HttpClient);
  readonly documentNumber = input.required<string>();
  readonly applicantCode = input.required<string>();
  protected readonly rows = signal<DocRow[]>([]);
  protected readonly busy = signal<string | null>(null);
  protected readonly msg = signal<string | null>(null);
  protected readonly err = signal(false);
  protected readonly when = dateTime;
  protected readonly size = kb;

  ngOnInit() {
    const params = { documentNumber: this.documentNumber(), applicantCode: this.applicantCode() };
    this.http.get<{ data: DocRow[] }>('/api/v1/inscriptions/documents', { params }).subscribe({ next: (r) => this.rows.set(r.data), error: () => undefined });
  }

  protected async upload(r: DocRow, el: HTMLInputElement) {
    const file = el.files?.[0];
    el.value = '';
    if (!file) return;
    if (file.size > MAX) return this.say(`«${file.name}» pesa ${kb(file.size)}; el máximo es 5 MB.`, true);
    this.busy.set(r.kind);
    try {
      const who = { documentNumber: this.documentNumber(), applicantCode: this.applicantCode(), kind: r.kind };
      // ADR-010: con S3 el archivo va directo al bucket; sin S3, en base64 a la API.
      const ticket = (await firstValueFrom(this.http.post<{ data: UploadTicket }>('/api/v1/inscriptions/documents/upload-url', { ...who, contentType: fileType(file), size: file.size }))).data;
      let source: { uploadKey: string } | { content: string };
      if (ticket.mode === 's3') {
        await postToS3(ticket, file);
        source = { uploadKey: ticket.uploadKey };
      } else {
        source = { content: await new Promise<string>((ok, ko) => { const fr = new FileReader(); fr.onload = () => ok(String(fr.result)); fr.onerror = ko; fr.readAsDataURL(file); }) };
      }
      const res = await firstValueFrom(this.http.post<{ data: DocRow[] }>('/api/v1/inscriptions/documents', { ...who, fileName: file.name, ...source }));
      this.rows.set(res.data);
      this.say(`Recibimos «${r.name}».`, false);
    } catch (e) {
      this.say(apiErrorMessage(e, 'No pudimos subir el archivo. Inténtalo de nuevo.'), true);
    } finally {
      this.busy.set(null);
    }
  }

  private say(text: string, isError: boolean) {
    this.msg.set(text);
    this.err.set(isError);
  }
}
