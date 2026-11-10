import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import type { DossierDto } from '@sia/contracts';
import { AdminSession } from '../../../core/admin-session';
import { apiErrorMessage } from '../../../core/api.service';
import { openDocument } from '../../../core/direct-upload';
import { shortDateTime } from '../../../core/format';
import { EVENT_LABEL } from '../../expediente/dossier-panel';

interface Row {
  id: string; applicantCode: string; fullName: string; submodality: string; category: string; program: string;
  status: DossierDto['status']; statusLabel: string; submittedAt: string | null; evaluator: string | null; observeDeadline: string | null;
}

const TAG: Record<string, string> = { AUTORIZADO: 'ok', EN_REVISION: 'warn', OBSERVADO: 'warn', RECHAZADO: 'bad', NO_SUBSANADO: 'bad' };

/** Spec 004, Historia 3: bandeja del evaluador, revisión por documento y dictamen del expediente. */
@Component({
  selector: 'app-admin-dossiers',
  imports: [FormsModule],
  template: `
    @if (!sel()) {
      <header class="adm-head"><div><h1>Expedientes de exonerados</h1><p>Revisa cada documento, márcalo conforme u obsérvalo, y emite el dictamen. Se asignan por turno entre los evaluadores activos.</p></div></header>
      <form class="adm-panel adm-filters" (ngSubmit)="load()">
        <div class="field"><label for="dx-st">Estado</label>
          <select id="dx-st" class="select" name="st" [(ngModel)]="status">
            <option value="">Enviados (todos)</option><option value="EN_REVISION">En revisión</option><option value="OBSERVADO">Observados</option>
            <option value="AUTORIZADO">Autorizados</option><option value="RECHAZADO">Rechazados</option><option value="NO_SUBSANADO">No subsanados</option><option value="BORRADOR">Por enviar</option>
          </select></div>
        <div class="field"><label for="dx-sm">Submodalidad</label><input id="dx-sm" class="input" name="sm" [(ngModel)]="submodality" placeholder="EXO-DEP"></div>
        @if (seesAll()) { <label class="adm-row"><input type="checkbox" name="mine" [(ngModel)]="mine"> Solo los míos</label> }
        <button class="btn" type="submit">Filtrar</button>
      </form>
      @if (msg()) { <p class="adm-msg" [class.err]="msgErr()" role="status">{{ msg() }}</p> }
      <section class="adm-panel">
        <div class="adm-table-wrap"><table class="adm-table">
          <thead><tr><th>Código</th><th>Postulante</th><th>Submodalidad</th><th>Programa</th><th>Enviado</th><th>Evaluador</th><th>Estado</th><th></th></tr></thead>
          <tbody>@for (r of rows(); track r.id) {
            <tr><td><strong>{{ r.applicantCode }}</strong></td><td>{{ r.fullName }}</td><td>{{ r.category }}<br><span class="adm-muted">{{ r.submodality }}</span></td>
              <td>{{ r.program }}</td><td>{{ r.submittedAt ? when(r.submittedAt) : '-' }}</td><td>{{ r.evaluator ?? 'Sin asignar' }}</td>
              <td><span class="adm-tag" [class]="'adm-tag ' + tag(r.status)">{{ r.statusLabel }}</span>
                @if (r.status === 'OBSERVADO' && r.observeDeadline) { <br><span class="adm-muted">Plazo: {{ when(r.observeDeadline) }}</span> }</td>
              <td><button type="button" class="adm-link" (click)="open(r.id)">Revisar</button></td></tr>
          } @empty { <tr class="adm-none"><td colspan="8">No hay expedientes con ese filtro.</td></tr> }</tbody>
        </table></div>
      </section>
    } @else {
      @let d = sel()!;
      <header class="adm-head">
        <div><button type="button" class="adm-link" (click)="back()">Volver a la bandeja</button>
          <h1>{{ d.fullName }}</h1><p>Código {{ d.applicantCode }}, {{ d.document }}, {{ d.category }}, {{ d.program }}</p></div>
        <span class="adm-tag" [class]="'adm-tag ' + tag(d.status)">{{ d.statusLabel }}</span>
      </header>
      @if (msg()) { <p class="adm-msg" [class.err]="msgErr()" role="status">{{ msg() }}</p> }
      @if (d.decisionNote) { <p class="adm-panel"><strong>Último dictamen:</strong> {{ d.decisionNote }}@if (d.verifiedInPerson) { (verificado presencialmente) }</p> }

      <div class="adm-grid">
        <section class="adm-panel">
          <h2>Documentos</h2>
          <div class="adm-table-wrap"><table class="adm-table">
            <thead><tr><th>Requisito</th><th>Archivo</th><th>Revisión</th></tr></thead>
            <tbody>@for (r of d.requirements; track r.code) {
              <tr><td><strong>{{ r.name }}</strong>@if (!r.mandatory) { <span class="adm-muted"> (opcional)</span> }<br><span class="adm-muted">{{ r.article }}</span></td>
                <td>@if (r.current; as c) {
                    <button type="button" class="adm-link" (click)="file(d.id!, c.id, c.fileName)">{{ c.fileName }}</button>
                    <br><span class="adm-muted">v{{ c.version }}, {{ when(c.uploadedAt) }}</span>
                  } @else { <span class="adm-muted">No adjuntado</span> }</td>
                <td>@if (r.current; as c) {
                    <span class="adm-tag" [class]="'adm-tag ' + (c.status === 'CONFORME' ? 'ok' : c.status === 'OBSERVADO' ? 'bad' : '')">{{ c.status === 'CARGADO' ? 'Por revisar' : c.status === 'CONFORME' ? 'Conforme' : 'Observado' }}</span>
                    @if (c.note) { <br><span class="adm-muted">{{ c.note }}</span> }
                  }</td></tr>
              @if (d.status === 'EN_REVISION' && r.current; as c) {
                <tr class="dx-act"><td colspan="3"><div class="adm-row">
                  @if (c.status !== 'CONFORME') { <button type="button" class="btn btn--quiet" (click)="review(d.id!, c.id, 'CONFORME')">Conforme</button> }
                  <input class="input dx-obs" [(ngModel)]="notes[c.id]" [name]="'n' + c.id" placeholder="Motivo de la observación" [attr.aria-label]="'Observación de ' + r.name">
                  <button type="button" class="btn btn--quiet" (click)="review(d.id!, c.id, 'OBSERVADO')">Observar</button>
                </div></td></tr>
              }
            }</tbody>
          </table></div>
          @if (d.evaluationCriteria) {
            <h2>Criterios de evaluación</h2>
            <p style="white-space:pre-line">{{ d.evaluationCriteria }}</p>
          }
          @if (Object.keys(d.complementary).length) {
            <h2>Datos de la submodalidad</h2>
            <dl class="adm-form">@for (f of d.complementaryFields; track f.key) { <div><dt class="adm-muted">{{ f.label }}</dt><dd style="margin:0">{{ d.complementary[f.key] || '-' }}</dd></div> }</dl>
          }
        </section>

        <div style="display:grid; gap:1.25rem">
          @if (d.status === 'EN_REVISION') {
            <section class="adm-panel adm-form">
              <h2>Dictamen</h2>
              <p class="adm-muted">Autorizar exige todos los documentos obligatorios conformes. Observar da {{ 72 }} horas al postulante para subsanar.</p>
              <label for="dx-note">Nota para el postulante</label>
              <textarea id="dx-note" class="input" [(ngModel)]="decisionNote" name="dn" rows="3"></textarea>
              <div class="adm-row">
                <button type="button" class="btn" (click)="decide(d.id!, 'AUTORIZAR')">Autorizar</button>
                <button type="button" class="btn btn--quiet" (click)="decide(d.id!, 'OBSERVAR')">Observar</button>
                <button type="button" class="btn btn--quiet" (click)="decide(d.id!, 'RECHAZAR')">Rechazar</button>
              </div>
            </section>
          }
          @if (d.status !== 'AUTORIZADO' && d.status !== 'RECHAZADO') {
            <section class="adm-panel adm-form">
              <h2>Verificación presencial</h2>
              <p class="adm-muted">Si el postulante presentó los originales en la Dirección de Admisión, autoriza aquí dejando constancia.</p>
              <input class="input" [(ngModel)]="inPersonNote" name="ip" placeholder="Documentos verificados">
              <button type="button" class="btn btn--quiet" (click)="inPerson(d.id!)">Registrar y autorizar</button>
            </section>
          }
          <section class="adm-panel adm-form">
            <h2>Evaluación especial</h2>
            @if (d.specialEvaluation; as s) { <p>Programada: {{ s.date }}, {{ s.place }}@if (s.note) {, {{ s.note }} }</p> }
            <div class="two">
              <input class="input" [(ngModel)]="special.date" name="sd" placeholder="Fecha y hora" aria-label="Fecha y hora">
              <input class="input" [(ngModel)]="special.place" name="sp" placeholder="Lugar" aria-label="Lugar">
            </div>
            <input class="input" [(ngModel)]="special.note" name="sn" placeholder="Indicaciones (opcional)" aria-label="Indicaciones">
            <button type="button" class="btn btn--quiet" (click)="schedule(d.id!)">Programar</button>
          </section>
          @if (d.evaluators?.length) {
            <section class="adm-panel adm-form">
              <h2>Reasignar evaluador</h2>
              <select class="select" [(ngModel)]="assignTo" name="as" aria-label="Evaluador"><option value="">Elige un evaluador</option>
                @for (e of d.evaluators; track e.id) { <option [value]="e.id">{{ e.name }}</option> }</select>
              <button type="button" class="btn btn--quiet" (click)="assign(d.id!)" [disabled]="!assignTo">Reasignar</button>
            </section>
          }
          <section class="adm-panel">
            <h2>Historial</h2>
            <ul class="adm-form" style="list-style:none; margin:0; padding:0">
              @for (e of d.events; track $index) { <li><span class="adm-muted">{{ when(e.at) }}{{ e.byStaff ? ', personal' : ', postulante' }}</span><br>{{ label(e.action) }}@if (e.note) { - {{ e.note }} }</li> }
            </ul>
          </section>
        </div>
      </div>
    }
  `,
  styles: `
    .dx-act td { padding-top: 0; border-bottom-width: 2px; }
    tr:has(+ .dx-act) td { border-bottom: 0; }
    .dx-obs { flex: 1 1 14rem; }
  `,
})
export class DossiersAdminPage implements OnInit {
  private readonly session = inject(AdminSession);
  protected readonly rows = signal<Row[]>([]);
  protected readonly sel = signal<DossierDto | null>(null);
  protected readonly msg = signal<string | null>(null);
  protected readonly msgErr = signal(false);
  protected readonly seesAll = () => this.session.can('expedientes.asignar');
  protected readonly when = shortDateTime;
  protected readonly tag = (s: string) => TAG[s] ?? '';
  protected readonly Object = Object;
  protected readonly label = (a: string) => EVENT_LABEL[a] ?? a;
  protected status = '';
  protected submodality = '';
  protected mine = false;
  protected notes: Record<string, string> = {};
  protected decisionNote = '';
  protected inPersonNote = '';
  protected assignTo = '';
  protected special = { date: '', place: '', note: '' };

  ngOnInit() { void this.load(); }

  protected async load() {
    try {
      this.rows.set(await this.session.get<Row[]>('/admin/dossiers', { status: this.status, submodality: this.submodality.trim().toUpperCase(), mine: this.mine || undefined }));
    } catch (e) {
      this.fail(e);
    }
  }

  protected async open(id: string) {
    this.msg.set(null);
    try {
      this.show(await this.session.get<DossierDto>(`/admin/dossiers/${id}`));
    } catch (e) {
      this.fail(e);
    }
  }

  protected back() {
    this.sel.set(null);
    this.msg.set(null);
    void this.load();
  }

  protected async file(id: string, documentId: string, _fileName: string) {
    try {
      await openDocument(await this.session.blob(`/admin/dossiers/${id}/documents/${documentId}`));
    } catch (e) {
      this.fail(e);
    }
  }

  protected review(id: string, documentId: string, verdict: 'CONFORME' | 'OBSERVADO') {
    return this.act(`/admin/dossiers/${id}/documents/${documentId}/review`, { verdict, note: this.notes[documentId] || undefined }, verdict === 'CONFORME' ? 'Documento conforme.' : 'Documento observado.');
  }

  protected decide(id: string, decision: 'AUTORIZAR' | 'OBSERVAR' | 'RECHAZAR') {
    const done = { AUTORIZAR: 'Expediente autorizado: el postulante ya puede pagar.', OBSERVAR: 'Expediente observado: el postulante tiene 72 horas para subsanar.', RECHAZAR: 'Expediente rechazado.' }[decision];
    return this.act(`/admin/dossiers/${id}/decision`, { decision, note: this.decisionNote.trim() || undefined }, done);
  }

  protected inPerson(id: string) {
    return this.act(`/admin/dossiers/${id}/in-person`, { note: this.inPersonNote.trim() }, 'Verificación presencial registrada; expediente autorizado.');
  }

  protected schedule(id: string) {
    return this.act(`/admin/dossiers/${id}/special`, this.special, 'Evaluación especial programada.');
  }

  protected assign(id: string) {
    return this.act(`/admin/dossiers/${id}/assign`, { evaluatorId: this.assignTo }, 'Expediente reasignado.');
  }

  private async act(path: string, body: unknown, done: string) {
    try {
      this.show(await this.session.postAuth<DossierDto>(path, body));
      this.msg.set(done);
      this.msgErr.set(false);
    } catch (e) {
      this.fail(e);
    }
  }

  private show(d: DossierDto) {
    this.sel.set(d);
    this.decisionNote = '';
    this.inPersonNote = '';
    this.notes = {};
    this.special = { date: d.specialEvaluation?.date ?? '', place: d.specialEvaluation?.place ?? '', note: d.specialEvaluation?.note ?? '' };
  }

  private fail(e: unknown) {
    this.msg.set(apiErrorMessage(e));
    this.msgErr.set(true);
  }
}
