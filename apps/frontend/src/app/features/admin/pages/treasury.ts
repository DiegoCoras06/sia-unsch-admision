import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminSession } from '../../../core/admin-session';
import { apiErrorMessage } from '../../../core/api.service';
import { shortDateTime } from '../../../core/format';

type Summary = Record<string, number | string>;
interface Run { id: string; source: string; fileName: string; periodFrom: string; periodTo: string; summary: Summary; createdAt: string }
interface Item { id: string; reference: string; applicantCode: string | null; providerAmount: string | null; providerStatus: string | null; systemAmount: string | null; systemStatus: string | null; result: string; resultLabel: string; resolution: string | null; resolvedAt: string | null }
interface RunDetail extends Run { items: Item[] }
interface Annulment {
  id: string; kind: string; reason: string; reasonLabel: string; detail: string; resolution: string; amount: string; status: string; decisionNote: string | null;
  createdAt: string; decidedAt: string | null; transactionId: string; orderNumber: string; applicantCode: string; attemptStatus: string;
}

const today = () => new Date(Date.now() - 5 * 3600_000).toISOString().slice(0, 10);
const RESULTS = [
  { k: 'CONCILIADO', l: 'Conciliados' }, { k: 'DIFERENCIA_MONTO', l: 'Diferencia de monto' }, { k: 'DIFERENCIA_ESTADO', l: 'Diferencia de estado' },
  { k: 'SOLO_PROVEEDOR', l: 'Solo en el reporte' }, { k: 'SOLO_SISTEMA', l: 'Solo en el sistema' },
];

/** Spec 005, Historias 4 y 5: conciliación con el proveedor o Tesorería y anulaciones por error de cobro (RN-08). */
@Component({
  selector: 'app-admin-treasury',
  imports: [FormsModule],
  template: `
    <header class="adm-head"><div><h1>Tesorería</h1><p>Concilia los pagos con el reporte de Izipay, del banco o de Tesorería, y registra anulaciones solo por error de cobro: el pago válido de la inscripción no se devuelve (Art. 18).</p></div></header>
    <div class="adm-tabs" role="tablist">
      @for (t of tabs; track t.id) { @if (session.can(t.perm)) { <button type="button" role="tab" [class.is-on]="tab() === t.id" [attr.aria-selected]="tab() === t.id" (click)="go(t.id)">{{ t.label }}</button> } }
    </div>
    @if (msg()) { <p class="adm-msg" [class.err]="msgErr()" role="status">{{ msg() }}</p> }

    @if (tab() === 'rec') {
      @if (!run()) {
        <div class="adm-grid">
          <form class="adm-panel adm-form" (ngSubmit)="reconcile()">
            <h2>Nueva conciliación</h2>
            <div class="two">
              <div class="field"><label for="t-src">Fuente</label><select id="t-src" class="select" name="src" [(ngModel)]="r.source"><option value="IZIPAY">Izipay</option><option value="BANCO">Banco</option><option value="TESORERIA">Tesorería UNSCH</option></select></div>
              <div class="field"><label for="t-file">Reporte CSV</label><input id="t-file" class="input" type="file" accept=".csv,text/csv" (change)="pick($event)"></div>
            </div>
            <div class="two">
              <div class="field"><label for="t-from">Desde</label><input id="t-from" class="input" type="date" name="from" [(ngModel)]="r.from"></div>
              <div class="field"><label for="t-to">Hasta</label><input id="t-to" class="input" type="date" name="to" [(ngModel)]="r.to"></div>
            </div>
            <p class="adm-muted">Columnas: <code>pedido</code> (o <code>transaccion</code>), <code>monto</code>, <code>estado</code>; opcionales <code>fecha</code> y <code>operacion</code>. Separador coma o punto y coma.</p>
            <button class="btn" type="submit" style="justify-self:start" [disabled]="!file">Conciliar</button>
          </form>
          <section class="adm-panel">
            <h2>Conciliaciones</h2>
            <div class="adm-table-wrap"><table class="adm-table">
              <thead><tr><th>Fecha</th><th>Fuente</th><th>Periodo</th><th class="num">Diferencias</th><th></th></tr></thead>
              <tbody>@for (x of runs(); track x.id) {
                <tr><td class="nowrap">{{ when(x.createdAt) }}<br><span class="adm-muted">{{ x.fileName }}</span></td><td>{{ x.source }}</td><td>{{ x.periodFrom.slice(0, 10) }} – {{ x.periodTo.slice(0, 10) }}</td>
                  <td class="num">{{ diffs(x.summary) }}</td><td><button type="button" class="adm-link" (click)="open(x.id)">Ver</button></td></tr>
              } @empty { <tr class="adm-none"><td colspan="5">Aún no hay conciliaciones.</td></tr> }</tbody>
            </table></div>
          </section>
        </div>
      } @else {
        @let d = run()!;
        <section class="adm-panel">
          <div class="adm-row" style="justify-content:space-between"><div><button type="button" class="adm-link" (click)="run.set(null)">← Volver</button>
            <h2>{{ d.source }} · {{ d.periodFrom.slice(0, 10) }} – {{ d.periodTo.slice(0, 10) }}</h2></div>
            <p>Reporte: <strong>S/ {{ d.summary['providerTotal'] }}</strong> · Sistema: <strong>S/ {{ d.summary['systemTotal'] }}</strong></p></div>
          <div class="adm-kpis">@for (x of results; track x.k) {
            <button type="button" class="adm-kpi tr-kpi" [class.is-on]="filter === x.k" (click)="filterBy(x.k)"><strong>{{ d.summary[x.k] ?? 0 }}</strong><span>{{ x.l }}</span></button>
          }</div>
        </section>
        <section class="adm-panel">
          <div class="adm-table-wrap"><table class="adm-table">
            <thead><tr><th>Referencia</th><th>Código</th><th class="num">Reporte</th><th class="num">Sistema</th><th>Resultado</th><th>Resolución</th></tr></thead>
            <tbody>@for (i of d.items; track i.id) {
              <tr><td>{{ i.reference }}</td><td>{{ i.applicantCode ?? '-' }}</td>
                <td class="num">{{ i.providerAmount ?? '-' }}<br><span class="adm-muted">{{ i.providerStatus ?? '' }}</span></td>
                <td class="num">{{ i.systemAmount ?? '-' }}<br><span class="adm-muted">{{ i.systemStatus ?? '' }}</span></td>
                <td><span class="adm-tag" [class.ok]="i.result === 'CONCILIADO'" [class.bad]="i.result !== 'CONCILIADO' && !i.resolution" [class.warn]="i.result !== 'CONCILIADO' && !!i.resolution">{{ i.resultLabel }}</span></td>
                <td>@if (i.resolution) { {{ i.resolution }} } @else if (i.result !== 'CONCILIADO') {
                  <div class="adm-row"><input class="input" [(ngModel)]="notes[i.id]" [name]="'n' + i.id" placeholder="Cómo se resolvió" [attr.aria-label]="'Resolución de ' + i.reference">
                  <button type="button" class="btn btn--quiet" (click)="resolve(i.id)">Resolver</button></div> }</td></tr>
            } @empty { <tr class="adm-none"><td colspan="6">Sin partidas con ese filtro.</td></tr> }</tbody>
          </table></div>
        </section>
      }
    }

    @if (tab() === 'ann') {
      <div class="adm-grid">
        <form class="adm-panel adm-form" (ngSubmit)="request()">
          <h2>Solicitar anulación o devolución</h2>
          <div class="field"><label for="a-ref">Pedido o transacción</label><input id="a-ref" class="input" name="ref" [(ngModel)]="a.reference"></div>
          <div class="two">
            <div class="field"><label for="a-kind">Tipo</label><select id="a-kind" class="select" name="kind" [(ngModel)]="a.kind"><option value="DEVOLUCION">Devolución</option><option value="ANULACION">Anulación</option></select></div>
            <div class="field"><label for="a-reason">Motivo</label><select id="a-reason" class="select" name="reason" [(ngModel)]="a.reason">
              <option value="COBRO_DUPLICADO">Cobro duplicado</option><option value="COBRO_INDEBIDO">Cobro indebido</option><option value="ERROR_PROVEEDOR">Error de la pasarela o del banco</option></select></div>
          </div>
          <div class="field"><label for="a-det">Detalle</label><textarea id="a-det" class="input" name="det" rows="3" [(ngModel)]="a.detail"></textarea></div>
          <div class="field"><label for="a-res">Resolución o documento que la sustenta</label><input id="a-res" class="input" name="res" [(ngModel)]="a.resolution" placeholder="R.D. N.° …"></div>
          <p class="adm-muted">El sistema no mueve dinero: Tesorería ejecuta la devolución por su canal. La aprueba otra persona.</p>
          <button class="btn" type="submit" style="justify-self:start">Registrar solicitud</button>
        </form>
        <section class="adm-panel">
          <h2>Solicitudes</h2>
          <ul class="adm-form" style="list-style:none;margin:0;padding:0">@for (x of annulments(); track x.id) {
            <li><strong>{{ x.kind === 'DEVOLUCION' ? 'Devolución' : 'Anulación' }} · S/ {{ x.amount }}</strong> · {{ x.applicantCode }} · {{ x.transactionId }}
              <span class="adm-tag" [class.ok]="x.status === 'APROBADA'" [class.warn]="x.status === 'SOLICITADA'" [class.bad]="x.status === 'RECHAZADA'">{{ x.status === 'SOLICITADA' ? 'Por aprobar' : x.status === 'APROBADA' ? 'Aprobada' : 'Rechazada' }}</span>
              <br><span class="adm-muted">{{ when(x.createdAt) }} · {{ x.reasonLabel }} · {{ x.resolution }}</span><br>{{ x.detail }}
              @if (x.decisionNote) { <br><span class="adm-muted">Decisión: {{ x.decisionNote }}</span> }
              @if (x.status === 'SOLICITADA') {
                <div class="adm-row" style="margin-top:0.4rem"><input class="input" [(ngModel)]="notes[x.id]" [name]="'d' + x.id" placeholder="Nota de la decisión" [attr.aria-label]="'Nota para ' + x.transactionId">
                  <button type="button" class="btn btn--quiet" (click)="decide(x.id, true)">Aprobar</button><button type="button" class="btn btn--quiet" (click)="decide(x.id, false)">Rechazar</button></div>
              }</li>
          } @empty { <li class="adm-muted">Sin solicitudes.</li> }</ul>
        </section>
      </div>
    }
  `,
  styles: `
    .tr-kpi { border: 0; font: inherit; text-align: left; cursor: pointer; }
    .tr-kpi.is-on { outline: 3px solid var(--accent); outline-offset: -3px; }
  `,
})
export class TreasuryAdminPage implements OnInit {
  protected readonly session = inject(AdminSession);
  protected readonly tabs = [{ id: 'rec' as const, label: 'Conciliación', perm: 'pagos.conciliar' }, { id: 'ann' as const, label: 'Anulaciones y devoluciones', perm: 'pagos.anular' }];
  protected readonly tab = signal<'rec' | 'ann'>('rec');
  protected readonly runs = signal<Run[]>([]);
  protected readonly run = signal<RunDetail | null>(null);
  protected readonly annulments = signal<Annulment[]>([]);
  protected readonly msg = signal<string | null>(null);
  protected readonly msgErr = signal(false);
  protected readonly when = shortDateTime;
  protected readonly results = RESULTS;
  protected file: File | null = null;
  protected filter = '';
  protected notes: Record<string, string> = {};
  protected r = { source: 'IZIPAY', from: today(), to: today() };
  protected a = { reference: '', kind: 'DEVOLUCION', reason: 'COBRO_DUPLICADO', detail: '', resolution: '' };

  ngOnInit() {
    this.go(this.session.can('pagos.conciliar') ? 'rec' : 'ann');
  }

  protected go(id: 'rec' | 'ann') {
    this.tab.set(id);
    this.msg.set(null);
    if (id === 'rec') void this.session.get<Run[]>('/admin/reconciliations').then((x) => this.runs.set(x)).catch((e) => this.fail(e));
    else void this.session.get<Annulment[]>('/admin/annulments').then((x) => this.annulments.set(x)).catch((e) => this.fail(e));
  }

  protected diffs(s: Summary) {
    return RESULTS.filter((x) => x.k !== 'CONCILIADO').reduce((n, x) => n + Number(s[x.k] ?? 0), 0);
  }

  protected pick(ev: Event) {
    this.file = (ev.target as HTMLInputElement).files?.[0] ?? null;
  }

  protected async reconcile() {
    if (!this.file) return;
    try {
      this.run.set(await this.session.postAuth<RunDetail>('/admin/reconciliations', { ...this.r, fileName: this.file.name, content: await this.file.text() }));
      this.filter = '';
      this.ok('Conciliación generada.');
    } catch (e) { this.fail(e); }
  }

  protected async open(id: string) {
    this.filter = '';
    try { this.run.set(await this.session.get<RunDetail>(`/admin/reconciliations/${id}`)); } catch (e) { this.fail(e); }
  }

  protected async filterBy(k: string) {
    this.filter = this.filter === k ? '' : k;
    try { this.run.set(await this.session.get<RunDetail>(`/admin/reconciliations/${this.run()!.id}`, { result: this.filter })); } catch (e) { this.fail(e); }
  }

  protected async resolve(id: string) {
    try {
      await this.session.postAuth(`/admin/reconciliations/items/${id}/resolve`, { resolution: (this.notes[id] ?? '').trim() });
      this.run.set(await this.session.get<RunDetail>(`/admin/reconciliations/${this.run()!.id}`, { result: this.filter }));
      this.ok('Partida resuelta.');
    } catch (e) { this.fail(e); }
  }

  protected async request() {
    try {
      this.annulments.set(await this.session.postAuth<Annulment[]>('/admin/annulments', this.a));
      this.a = { reference: '', kind: 'DEVOLUCION', reason: 'COBRO_DUPLICADO', detail: '', resolution: '' };
      this.ok('Solicitud registrada; la aprueba otra persona de Tesorería.');
    } catch (e) { this.fail(e); }
  }

  protected async decide(id: string, approve: boolean) {
    try {
      this.annulments.set(await this.session.postAuth<Annulment[]>(`/admin/annulments/${id}/decision`, { approve, note: (this.notes[id] ?? '').trim() }));
      this.ok(approve ? 'Aprobada.' : 'Rechazada.');
    } catch (e) { this.fail(e); }
  }

  private ok(t: string) { this.msg.set(t); this.msgErr.set(false); }
  private fail(e: unknown) { this.msg.set(apiErrorMessage(e)); this.msgErr.set(true); }
}
