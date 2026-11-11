import { Component, OnInit, inject, signal } from '@angular/core';
import { AdmToast } from '../toast';
import { FormsModule } from '@angular/forms';
import { AdminSession } from '../../../core/admin-session';
import { apiErrorMessage } from '../../../core/api.service';
import { shortDateTime } from '../../../core/format';

interface VersionSummary { id: string; version: number; status: string; reason: string | null; publishAt: string | null; visible: boolean; submittedAt: string | null; approvedAt: string | null; createdAt: string; notifiedAt: string | null }
interface ExamResults {
  id: string; code: string; name: string; modalities: string[]; date: string; examStatus: string;
  batches: { id: string; fileName: string; status: string; validCount: number; issues: number; createdAt: string }[];
  versions: VersionSummary[];
}
interface Issue { line: number; applicantCode: string | null; issue: string }
interface Batch { id: string; status: string; validCount: number; unreadable: number; issues: Issue[] }
interface VersionDetail extends VersionSummary {
  examId: string; exam: string; total: number; matching: number; shown: number;
  byCondition: { key: string; label: string; count: number }[];
  coverage: { optionCode: string; program: string; quotaCategory: string; vacancies: number; admitted: number; uncovered: number }[];
  rows: { applicantCode: string; fullName: string; program: string; quotaCategory: string; knowledge: number | null; vocational: number | null; attitude: number | null; score: string | null; rank: number | null; condition: string; conditionLabel: string }[];
}

const toLima = (iso: string) => new Date(new Date(iso).getTime() - 5 * 3600_000).toISOString().slice(0, 16);
const STATUS: Record<string, string> = { BORRADOR: 'Borrador', EN_APROBACION: 'En aprobación', PUBLICADA: 'Publicada', REEMPLAZADA: 'Reemplazada', DESCARTADA: 'Descartada' };
const TAG: Record<string, string> = { ADMITIDO: 'ok', NO_ADMITIDO: '', AUSENTE: 'bad', NO_CALIFICABLE: 'bad', SIN_DERECHO_VACANTE: 'warn' };

/** Spec 007, Historias 1, 2, 3 y 6: importar, procesar, aprobar, publicar y reportar resultados. */
@Component({
  selector: 'app-admin-results',
  imports: [FormsModule, AdmToast],
  template: `
    <header class="adm-head"><div><h1>Resultados</h1><p>Importa el archivo de la lectora óptica, revisa el orden de mérito, envíalo a la Comisión y publica a la hora autorizada. Cada rectificación es una versión nueva.</p></div></header>
    <app-adm-toast [text]="msg()" [error]="msgErr()" (closed)="msg.set(null)" />

    @if (!sel()) {
      @for (e of exams(); track e.id) {
        <section class="adm-panel">
          <div class="adm-row" style="justify-content:space-between">
            <div><h2>{{ e.name }}</h2><p class="adm-muted">{{ when(e.date) }}, {{ e.examStatus === 'FINALIZADO' ? 'asistencia cerrada' : 'asistencia abierta: ciérrala antes de importar' }}</p></div>
          </div>
          <form class="adm-filters" (ngSubmit)="upload(e.id)">
            <div class="field"><label [for]="'f-' + e.id">Archivo CSV: codigo, conocimientos, aptitud, actitud, observacion</label>
              <input class="input" type="file" [id]="'f-' + e.id" accept=".csv,text/csv" (change)="pick($event)"></div>
            <button class="btn" type="submit" [disabled]="!file">Importar y validar</button>
          </form>
          @if (batch()?.id && lastExam === e.id; as _) {
            @let b = batch()!;
            <div class="adm-msg" [class.err]="b.status === 'CON_ERRORES'">{{ b.status === 'CON_ERRORES' ? b.issues.length + ' inconsistencias: corrige el archivo e impórtalo de nuevo.' : b.validCount + ' registros válidos (' + b.unreadable + ' no calificables). Listo para procesar.' }}</div>
            @if (b.issues.length) {
              <div class="adm-table-wrap" style="max-height:16rem"><table class="adm-table"><thead><tr><th>Línea</th><th>Código</th><th>Inconsistencia</th></tr></thead>
                <tbody>@for (i of b.issues; track $index) { <tr><td>{{ i.line || '-' }}</td><td>{{ i.applicantCode ?? '-' }}</td><td>{{ i.issue }}</td></tr> }</tbody></table></div>
            } @else {
              <div class="adm-row">
                @if (e.versions.some(published)) { <input class="input" style="flex:1 1 20rem" [(ngModel)]="reason" name="rs" placeholder="Motivo de la rectificación (obligatorio)" aria-label="Motivo de la rectificación"> }
                <button type="button" class="btn" (click)="process(b.id)">Procesar orden de mérito</button>
              </div>
            }
          }
          <div class="adm-table-wrap"><table class="adm-table">
            <thead><tr><th>Versión</th><th>Estado</th><th>Publicación</th><th>Motivo</th><th></th></tr></thead>
            <tbody>@for (v of e.versions; track v.id) {
              <tr><td><strong>v{{ v.version }}</strong><br><span class="adm-muted">{{ when(v.createdAt) }}</span></td>
                <td><span class="adm-tag" [class.ok]="v.status === 'PUBLICADA'" [class.warn]="v.status === 'EN_APROBACION'">{{ label(v.status) }}</span></td>
                <td>{{ v.publishAt ? when(v.publishAt) : '-' }}@if (v.status === 'PUBLICADA') { <br><span class="adm-muted">{{ v.visible ? 'Visible' : 'Programada' }}</span> }</td>
                <td>{{ v.reason ?? '-' }}</td>
                <td>@if (v.status !== 'DESCARTADA') { <button type="button" class="adm-link" (click)="open(v.id)">Revisar</button> }</td></tr>
            } @empty { <tr class="adm-none"><td colspan="5">Aún no hay resultados procesados.</td></tr> }</tbody>
          </table></div>
        </section>
      }
    } @else {
      @let v = sel()!;
      <section class="adm-panel">
        <div class="adm-row" style="justify-content:space-between">
          <div><button type="button" class="adm-link" (click)="back()">Volver</button><h2 class="rs-title">{{ v.exam }}, versión {{ v.version }}, {{ label(v.status) }}</h2>
            @if (v.reason) { <p class="adm-muted">Rectificación: {{ v.reason }}</p> }</div>
          <div class="adm-row">
            <button type="button" class="btn btn--quiet" (click)="report('xlsx', 'resultados')">Resultados (Excel)</button>
            <button type="button" class="btn btn--quiet" (click)="report('pdf', 'resultados')">Resultados (PDF)</button>
            <button type="button" class="btn btn--quiet" (click)="report('xlsx', 'cobertura')">Cobertura (Excel)</button>
          </div>
        </div>
        <div class="adm-kpis">@for (c of v.byCondition; track c.key) { <div class="adm-kpi"><strong>{{ c.count }}</strong><span>{{ c.label }}</span></div> }</div>
        @if (v.status === 'BORRADOR') { <button type="button" class="btn" style="justify-self:start" (click)="submit(v.id)">Enviar a aprobación de la Comisión</button> }
        @if (v.status === 'EN_APROBACION') {
          @if (canApprove()) {
            <div class="adm-row">
              <label for="pub">Publicar el</label><input id="pub" class="input" style="width:15rem" type="datetime-local" [(ngModel)]="publish" name="pub">
              <button type="button" class="btn" (click)="approve(v.id)">Aprobar y programar publicación</button>
              <input class="input" style="flex:1 1 14rem" [(ngModel)]="note" name="nt" placeholder="Observación para devolver" aria-label="Observación">
              <button type="button" class="btn btn--quiet" (click)="sendBack(v.id)">Devolver</button>
            </div>
          } @else { <p class="adm-muted">Esperando la aprobación de la Comisión (otra persona con permiso de aprobación).</p> }
        }
      </section>
      <section class="adm-panel">
        <h2>Cobertura de vacantes</h2>
        <div class="adm-table-wrap" style="max-height:20rem"><table class="adm-table">
          <thead><tr><th>Programa</th><th>Categoría</th><th class="num">Vacantes</th><th class="num">Admitidos</th><th class="num">Sin cubrir</th></tr></thead>
          <tbody>@for (c of v.coverage; track c.optionCode + c.quotaCategory) { <tr><td>{{ c.program }}</td><td>{{ c.quotaCategory }}</td><td class="num">{{ c.vacancies }}</td><td class="num">{{ c.admitted }}</td><td class="num">{{ c.uncovered }}</td></tr> }</tbody>
        </table></div>
      </section>
      <section class="adm-panel">
        <form class="adm-filters" (ngSubmit)="open(v.id)">
          <div class="field"><label for="fc">Condición</label><select id="fc" class="select" name="fc" [(ngModel)]="cond"><option value="">Todas</option>
            @for (c of v.byCondition; track c.key) { <option [value]="c.key">{{ c.label }}</option> }</select></div>
          <div class="field"><label for="fq">Buscar</label><input id="fq" class="input" name="fq" [(ngModel)]="q" placeholder="Código o nombre"></div>
          <button class="btn btn--quiet" type="submit">Filtrar</button>
          <span class="adm-muted">{{ v.shown }} de {{ v.matching }}</span>
        </form>
        <div class="adm-table-wrap"><table class="adm-table">
          <thead><tr><th>Programa</th><th>Cat.</th><th class="num">Puesto</th><th>Código</th><th>Postulante</th><th class="num">C</th><th class="num">AV</th><th class="num">AP</th><th class="num">Puntaje</th><th>Condición</th></tr></thead>
          <tbody>@for (r of v.rows; track r.applicantCode) {
            <tr><td>{{ r.program }}</td><td>{{ r.quotaCategory }}</td><td class="num">{{ r.rank ?? '-' }}</td><td>{{ r.applicantCode }}</td><td>{{ r.fullName }}</td>
              <td class="num">{{ r.knowledge ?? '-' }}</td><td class="num">{{ r.vocational ?? '-' }}</td><td class="num">{{ r.attitude ?? '-' }}</td><td class="num"><strong>{{ r.score ?? '-' }}</strong></td>
              <td><span class="adm-tag" [class]="'adm-tag ' + tag(r.condition)">{{ r.conditionLabel }}</span></td></tr>
          }</tbody>
        </table></div>
      </section>
    }
  `,
  styles: `.rs-title { font-size: clamp(1.25rem, 2vw, 1.625rem); letter-spacing: -0.02em; margin-top: 0.25rem; }`,
})
export class ResultsAdminPage implements OnInit {
  private readonly session = inject(AdminSession);
  protected readonly exams = signal<ExamResults[]>([]);
  protected readonly sel = signal<VersionDetail | null>(null);
  protected readonly batch = signal<Batch | null>(null);
  protected readonly msg = signal<string | null>(null);
  protected readonly msgErr = signal(false);
  protected readonly when = shortDateTime;
  protected readonly label = (s: string) => STATUS[s] ?? s;
  protected readonly tag = (c: string) => TAG[c] ?? '';
  protected readonly published = (v: VersionSummary) => v.status === 'PUBLICADA';
  protected readonly canApprove = () => this.session.can('resultados.aprobar');
  protected file: File | null = null;
  protected lastExam = '';
  protected reason = '';
  protected publish = toLima(new Date(Date.now() + 3600_000).toISOString());
  protected note = '';
  protected cond = '';
  protected q = '';

  ngOnInit() { void this.load(); }

  protected async load() {
    try { this.exams.set(await this.session.get<ExamResults[]>('/admin/results')); } catch (e) { this.fail(e); }
  }

  protected pick(ev: Event) {
    this.file = (ev.target as HTMLInputElement).files?.[0] ?? null;
  }

  protected async upload(examId: string) {
    if (!this.file) return;
    try {
      const content = await this.file.text();
      this.lastExam = examId;
      this.batch.set(await this.session.postAuth<Batch>(`/admin/results/exams/${examId}/batches`, { fileName: this.file.name, content }));
      this.msg.set(null);
      await this.load();
    } catch (e) { this.fail(e); }
  }

  protected async process(batchId: string) {
    try {
      const v = await this.session.postAuth<VersionDetail>(`/admin/results/batches/${batchId}/process`, this.reason.trim() ? { reason: this.reason.trim() } : {});
      this.batch.set(null);
      this.reason = '';
      this.sel.set(v);
      this.ok(`Versión ${v.version} procesada en borrador.`);
    } catch (e) { this.fail(e); }
  }

  protected async open(id: string) {
    try { this.sel.set(await this.session.get<VersionDetail>(`/admin/results/versions/${id}`, { condition: this.cond, q: this.q })); } catch (e) { this.fail(e); }
  }

  protected back() {
    this.sel.set(null);
    this.cond = '';
    this.q = '';
    void this.load();
  }

  protected submit(id: string) { return this.act(() => this.session.postAuth<VersionDetail>(`/admin/results/versions/${id}/submit`), 'Enviada a la Comisión.'); }
  protected approve(id: string) {
    return this.act(() => this.session.postAuth<VersionDetail>(`/admin/results/versions/${id}/approve`, { publishAt: `${this.publish}:00-05:00` }), 'Aprobada: se publica a la hora programada y se avisa por correo.');
  }
  protected sendBack(id: string) { return this.act(() => this.session.postAuth<VersionDetail>(`/admin/results/versions/${id}/send-back`, { note: this.note }), 'Devuelta al operador.'); }

  protected async report(format: 'xlsx' | 'pdf', kind: 'resultados' | 'cobertura') {
    const v = this.sel()!;
    try { await this.session.download(`/admin/results/versions/${v.id}/report.${format}`, { kind }, `${kind}-v${v.version}.${format}`); } catch (e) { this.fail(e); }
  }

  private async act(call: () => Promise<VersionDetail>, done: string) {
    try {
      this.sel.set(await call());
      this.ok(done);
    } catch (e) { this.fail(e); }
  }

  private ok(t: string) { this.msg.set(t); this.msgErr.set(false); }
  private fail(e: unknown) { this.msg.set(apiErrorMessage(e)); this.msgErr.set(true); }
}
