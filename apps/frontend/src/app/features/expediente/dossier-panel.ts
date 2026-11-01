import { Component, OnInit, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import type { DossierDto } from '@sia/contracts';
import { firstValueFrom } from 'rxjs';
import { ApiService, apiErrorMessage } from '../../core/api.service';
import { fileType, openDocument, postToS3, toBase64 } from '../../core/direct-upload';
import { dateTime } from '../../core/format';

const DOC_LABEL: Record<string, string> = { CARGADO: 'Cargado', CONFORME: 'Conforme', OBSERVADO: 'Observado', REEMPLAZADO: 'Reemplazado' };
export const EVENT_LABEL: Record<string, string> = {
  'documento.cargado': 'Subiste un documento', 'documento.reemplazado': 'Reemplazaste un documento',
  'expediente.enviado': 'Enviaste tu expediente a revisión', 'expediente.reenviado': 'Reenviaste tu expediente subsanado',
  'documento.conforme': 'Documento conforme', 'documento.observado': 'Documento observado', 'expediente.asignado': 'Asignado a un evaluador',
  'expediente.autorizado': 'Expediente autorizado', 'expediente.observado': 'Expediente observado', 'expediente.rechazado': 'Expediente rechazado',
  'expediente.no_subsanado': 'Venció el plazo de subsanación', 'expediente.verificado_presencialmente': 'Verificado presencialmente',
  'expediente.evaluacion_especial': 'Evaluación especial programada',
};

/** Spec 004, Historias 1, 2 y 4: el exonerado arma, envía y subsana su expediente en línea. */
@Component({
  selector: 'app-dossier-panel',
  imports: [FormsModule],
  template: `
    @if (d(); as d) {
      <section class="dos" aria-labelledby="dos-title">
        <header class="dos__head" [class.is-ok]="d.status === 'AUTORIZADO'" [class.is-bad]="d.status === 'RECHAZADO' || d.status === 'NO_SUBSANADO'" [class.is-warn]="d.status === 'OBSERVADO'">
          <div>
            <h3 id="dos-title">Tu expediente de exonerado</h3>
            <p>{{ d.category }} · {{ d.program }}</p>
          </div>
          <p class="dos__state"><strong>{{ d.statusLabel }}</strong>
            @if (d.status === 'OBSERVADO' && d.observeDeadline) { <br>Plazo: {{ when(d.observeDeadline) }} }
          </p>
        </header>

        @if (d.decisionNote && d.status !== 'EN_REVISION') { <p class="dos__note">{{ d.decisionNote }}</p> }
        @if (d.status === 'BORRADOR') { <p class="dos__help">Sube cada documento en PDF, JPG o PNG (máximo 5 MB), completa tus datos y envía tu expediente. Lo revisa un evaluador de la Dirección de Admisión; te avisamos por correo.</p> }
        @if (d.status === 'EN_REVISION') { <p class="dos__help">Tu expediente está en revisión. No puedes modificarlo hasta que tenga dictamen.</p> }
        @if (d.status === 'AUTORIZADO') { <p class="dos__help">Ya puedes pagar el derecho de inscripción. Con el pago confirmado se habilita tu ficha.</p> }
        @if (d.specialEvaluation; as s) {
          <p class="dos__special"><strong>Evaluación especial:</strong> {{ s.date }} · {{ s.place }}@if (s.note) { · {{ s.note }} }</p>
        }

        <ul class="dos__reqs">
          @for (r of d.requirements; track r.code) {
            <li [class.is-obs]="r.current?.status === 'OBSERVADO'">
              <div class="dos__req">
                <strong>{{ r.name }}</strong>@if (!r.mandatory) { <span class="dos__opt">opcional</span> }
                <span class="dos__meta">{{ r.article }} · {{ r.acceptedFormats.join(', ') }}</span>
                @if (r.current; as c) {
                  <span class="dos__file">
                    <span class="tag" [class.ok]="c.status === 'CONFORME'" [class.bad]="c.status === 'OBSERVADO'">{{ docLabel(c.status) }}</span>
                    <button type="button" class="link" (click)="open(c.id, c.fileName)">{{ c.fileName }}</button>
                    <span class="dos__meta">{{ kb(c.sizeBytes) }} · versión {{ c.version }}</span>
                  </span>
                  @if (c.status === 'OBSERVADO' && c.note) { <span class="dos__obs">Observación: {{ c.note }}</span> }
                }
              </div>
              @if (canUpload(r.current?.status)) {
                <label class="btn btn--quiet dos__up">
                  {{ busyReq() === r.code ? 'Subiendo…' : (r.current ? 'Reemplazar' : 'Subir') }}
                  <input type="file" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" (change)="upload(r.code, $event)" [disabled]="!!busyReq()" hidden>
                </label>
              }
            </li>
          }
        </ul>

        @if (d.complementaryFields.length) {
          <form class="dos__comp" (ngSubmit)="saveComplementary()">
            <h4>Datos de tu submodalidad</h4>
            <div class="dos__grid">
              @for (f of d.complementaryFields; track f.key) {
                <div class="field"><label [for]="'dc-' + f.key">{{ f.label }}</label>
                  <input class="input" [id]="'dc-' + f.key" [name]="f.key" [type]="f.type === 'number' ? 'number' : 'text'" [(ngModel)]="values[f.key]" [disabled]="!d.editable"></div>
              }
            </div>
            @if (d.editable) { <button type="submit" class="btn btn--quiet">Guardar datos</button> }
          </form>
        }

        @if (d.editable) {
          <button type="button" class="btn" (click)="submit()" [disabled]="submitting()">{{ d.status === 'OBSERVADO' ? 'Reenviar expediente subsanado' : 'Enviar expediente a revisión' }}</button>
        }
        @if (msg()) { <p class="alert" [class.alert--error]="msgErr()" role="status">{{ msg() }}</p> }

        @if (d.events.length) {
          <details class="dos__history"><summary>Historial del expediente ({{ d.events.length }})</summary>
            <ul>@for (e of d.events; track $index) { <li><span>{{ when(e.at) }}</span> {{ eventLabel(e.action) }}@if (e.note && !e.action.startsWith('documento.')) { - {{ e.note }} }</li> }</ul>
          </details>
        }
      </section>
    } @else if (error()) {
      <p class="alert alert--error">{{ error() }}</p>
    }
  `,
  styles: `
    .dos { display: grid; gap: 1rem; background: var(--ground); padding: clamp(1rem, 3vw, 1.5rem); border: 2px solid var(--stone); }
    .dos__head { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 1rem; background: var(--accent); color: var(--accent-ink); padding: 1.1rem 1.25rem; }
    .dos__head h3 { font-size: 1.375rem; color: var(--gold); }
    .dos__head.is-ok { background: #164d2a; }
    .dos__head.is-bad { background: #6d1212; }
    .dos__head.is-warn { background: #6b4a00; }
    .dos__state { text-align: right; }
    .dos__note { background: var(--stone); padding: 0.75rem 1rem; font-weight: 600; }
    .dos__help { color: var(--ink-soft); }
    .dos__special { background: #fbf1d9; color: #6b4a00; padding: 0.75rem 1rem; }
    .dos__reqs { list-style: none; margin: 0; padding: 0; display: grid; gap: 0.5rem; }
    .dos__reqs li { display: flex; justify-content: space-between; gap: 1rem; align-items: center; padding: 0.85rem 1rem; background: var(--stone); }
    .dos__reqs li.is-obs { background: #fbf1d9; }
    .dos__req { display: grid; gap: 0.25rem; min-width: 0; }
    .dos__meta { font-size: var(--size-note); color: var(--ink-soft); }
    .dos__opt { font-size: var(--size-note); color: var(--ink-soft); margin-left: 0.4rem; }
    .dos__file { display: flex; flex-wrap: wrap; gap: 0.5rem; align-items: center; }
    .dos__obs { color: #6b4a00; font-weight: 600; font-size: 0.9375rem; }
    .dos__up { cursor: pointer; white-space: nowrap; }
    .tag { font-size: 0.75rem; font-weight: 700; padding: 0.15rem 0.5rem; background: var(--ground); }
    .tag.ok { background: #e3f1e8; color: #164d2a; }
    .tag.bad { background: #f7e3e3; color: #6d1212; }
    .link { background: none; border: 0; padding: 0; font: inherit; color: var(--accent); text-decoration: underline; cursor: pointer; overflow-wrap: anywhere; text-align: left; }
    .dos__comp { display: grid; gap: 0.75rem; }
    .dos__comp h4 { font-size: 1.125rem; }
    .dos__grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr)); gap: 0.75rem; }
    .dos__history summary { cursor: pointer; font-weight: 700; }
    .dos__history ul { list-style: none; padding: 0; margin: 0.5rem 0 0; display: grid; gap: 0.35rem; font-size: 0.9375rem; }
    .dos__history span { color: var(--ink-soft); margin-right: 0.4rem; }
    @media (max-width: 640px) { .dos__reqs li { flex-direction: column; align-items: stretch; } .dos__state { text-align: left; } }
    @media print { :host { display: none; } }
  `,
})
export class DossierPanel implements OnInit {
  private readonly api = inject(ApiService);
  readonly documentNumber = input.required<string>();
  readonly applicantCode = input.required<string>();
  /** El estado de la inscripción cambia con el envío o el dictamen: la página lo vuelve a leer. */
  readonly changed = output<void>();

  protected readonly d = signal<DossierDto | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly busyReq = signal<string | null>(null);
  protected readonly submitting = signal(false);
  protected readonly msg = signal<string | null>(null);
  protected readonly msgErr = signal(false);
  protected values: Record<string, string> = {};
  protected readonly when = dateTime;
  protected readonly docLabel = (s: string) => DOC_LABEL[s] ?? s;
  protected readonly eventLabel = (a: string) => EVENT_LABEL[a] ?? a;
  protected readonly kb = (n: number) => (n > 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);

  async ngOnInit() {
    try {
      this.set(await firstValueFrom(this.api.dossier(this.documentNumber(), this.applicantCode())));
    } catch (e) {
      this.error.set(apiErrorMessage(e));
    }
  }

  protected canUpload(status: string | undefined) {
    const d = this.d();
    if (!d?.editable) return false;
    return d.status === 'BORRADOR' || status === 'OBSERVADO';
  }

  protected async upload(requirementCode: string, ev: Event) {
    const file = (ev.target as HTMLInputElement).files?.[0];
    (ev.target as HTMLInputElement).value = '';
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return this.show('El archivo supera los 5 MB. Comprímelo o escanéalo con menor resolución.', true);
    this.busyReq.set(requirementCode);
    try {
      const who = { documentNumber: this.documentNumber(), applicantCode: this.applicantCode(), requirementCode };
      const ticket = await firstValueFrom(this.api.dossierUploadUrl({ ...who, contentType: fileType(file), size: file.size }));
      let source: { uploadKey: string } | { contentBase64: string };
      if (ticket.mode === 's3') {
        await postToS3(ticket, file);
        source = { uploadKey: ticket.uploadKey };
      } else {
        source = { contentBase64: await toBase64(file) };
      }
      this.set(await firstValueFrom(this.api.dossierUpload({ ...who, fileName: file.name, ...source })));
      this.show(`Documento cargado: ${file.name}.`, false);
    } catch (e) {
      this.show(apiErrorMessage(e), true);
    } finally {
      this.busyReq.set(null);
    }
  }

  protected async saveComplementary() {
    try {
      this.set(await firstValueFrom(this.api.dossierComplementary(this.documentNumber(), this.applicantCode(), this.values)));
      this.show('Datos guardados.', false);
    } catch (e) {
      this.show(apiErrorMessage(e), true);
    }
  }

  protected async submit() {
    this.submitting.set(true);
    try {
      if (Object.keys(this.values).length) await firstValueFrom(this.api.dossierComplementary(this.documentNumber(), this.applicantCode(), this.values));
      this.set(await firstValueFrom(this.api.dossierSubmit(this.documentNumber(), this.applicantCode())));
      this.show('Expediente enviado. Te avisaremos por correo cuando tenga dictamen.', false);
      setTimeout(() => this.changed.emit(), 1500);
    } catch (e) {
      this.show(apiErrorMessage(e), true);
    } finally {
      this.submitting.set(false);
    }
  }

  protected async open(documentId: string, _fileName: string) {
    try {
      await openDocument(await firstValueFrom(this.api.dossierFile(this.documentNumber(), this.applicantCode(), documentId)));
    } catch (e) {
      this.show(apiErrorMessage(e), true);
    }
  }

  private set(d: DossierDto) {
    this.d.set(d);
    this.values = { ...d.complementary };
  }

  private show(text: string, err: boolean) {
    this.msg.set(text);
    this.msgErr.set(err);
  }
}
