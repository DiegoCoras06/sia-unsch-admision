import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminSession } from '../../../core/admin-session';
import { apiErrorMessage } from '../../../core/api.service';
import { shortDateTime } from '../../../core/format';

interface Log {
  total: number; page: number; pageSize: number; byStatus: { key: string; count: number }[]; byEvent: { key: string; count: number }[];
  items: { id: string; email: string; event: string; subject: string; status: string; attempts: number; lastError: string | null; sentAt: string | null; createdAt: string }[];
}
interface Campaign { id: string; subject: string; segment: Record<string, string>; recipients: number; createdAt: string; sent: number; pending: number; failed: number; bounced: number }
interface Template { key: string; name: string; subject: string; body: string; customized: boolean }

const STATUS: Record<string, string> = { PENDIENTE: 'En cola', ENVIADA: 'Enviada', FALLIDA: 'Fallida', REBOTADA: 'Rebotada' };
/** Tipo de aviso en palabras del trámite. */
const EVENT: Record<string, string> = {
  RECORDATORIO_PAGO: 'Recordatorio de pago', RECORDATORIO_EXAMEN: 'Recordatorio del examen', AULA_PUBLICADA: 'Aula publicada',
  RESULTADOS_DISPONIBLES: 'Resultados disponibles', COMUNICADO: 'Comunicado', SISTEMA: 'Aviso del trámite',
};
const INS_STATUS = [
  { v: 'PENDIENTE_PAGO', l: 'Pendiente de pago' }, { v: 'PENDIENTE_VALIDACION', l: 'Pendiente de validación' }, { v: 'OBSERVADA', l: 'Observada' }, { v: 'APTA', l: 'Apta' },
];

/** Spec 010: registro de envíos (RF-11.09), comunicados segmentados (RF-11.08) y plantillas editables (FR-006). */
@Component({
  selector: 'app-admin-notifications',
  imports: [FormsModule],
  template: `
    <header class="adm-head"><div><h1>Notificaciones</h1><p>Todo correo del sistema queda registrado con su estado. Los recordatorios, aulas publicadas y resultados disponibles salen solos, sin duplicarse.</p></div></header>
    <div class="adm-tabs" role="tablist">
      @for (t of tabs; track t.id) { <button type="button" role="tab" [class.is-on]="tab() === t.id" [attr.aria-selected]="tab() === t.id" (click)="go(t.id)">{{ t.label }}</button> }
    </div>
    @if (msg()) { <p class="adm-msg" [class.err]="msgErr()" role="status">{{ msg() }}</p> }

    @if (tab() === 'log' && log(); as l) {
      <div class="adm-kpis">@for (s of l.byStatus; track s.key) { <div class="adm-kpi"><strong>{{ s.count }}</strong><span>{{ st(s.key) }}</span></div> }</div>
      <form class="adm-panel adm-filters" (ngSubmit)="loadLog(1)">
        <div class="field"><label for="n-st">Estado</label><select id="n-st" class="select" name="st" [(ngModel)]="f.status"><option value="">Todos</option>
          @for (s of statusKeys; track s) { <option [value]="s">{{ st(s) }}</option> }</select></div>
        <div class="field"><label for="n-ev">Tipo</label><select id="n-ev" class="select" name="ev" [(ngModel)]="f.event"><option value="">Todos</option>
          @for (e of l.byEvent; track e.key) { <option [value]="e.key">{{ ev(e.key) }} ({{ e.count }})</option> }</select></div>
        <div class="field"><label for="n-em">Correo</label><input id="n-em" class="input" name="em" [(ngModel)]="f.email"></div>
        <button class="btn" type="submit">Filtrar</button>
        <button class="btn btn--quiet" type="button" (click)="dispatchNow()">Procesar cola ahora</button>
        <button class="btn btn--quiet" type="button" (click)="retry()">Reintentar fallidas</button>
      </form>
      <section class="adm-panel">
        <div class="adm-table-wrap"><table class="adm-table">
          <thead><tr><th>Fecha</th><th>Destinatario</th><th>Tipo</th><th>Asunto</th><th>Estado</th></tr></thead>
          <tbody>@for (n of l.items; track n.id) {
            <tr><td>{{ when(n.createdAt) }}</td><td>{{ n.email }}</td><td>{{ ev(n.event) }}</td><td>{{ n.subject }}</td>
              <td><span class="adm-tag" [class.ok]="n.status === 'ENVIADA'" [class.warn]="n.status === 'PENDIENTE'" [class.bad]="n.status === 'FALLIDA' || n.status === 'REBOTADA'">{{ st(n.status) }}</span>
                @if (n.attempts > 1 || n.lastError) { <br><span class="adm-muted">{{ n.attempts }} intentos{{ n.lastError ? ' · ' + n.lastError : '' }}</span> }</td></tr>
          } @empty { <tr class="adm-none"><td colspan="5">Sin notificaciones.</td></tr> }</tbody>
        </table></div>
        <div class="adm-pager">
          <button type="button" class="btn btn--quiet" [disabled]="l.page <= 1" (click)="loadLog(l.page - 1)">Anterior</button>
          <span>Página {{ l.page }} de {{ pages(l) }} · {{ l.total }} registros</span>
          <button type="button" class="btn btn--quiet" [disabled]="l.page >= pages(l)" (click)="loadLog(l.page + 1)">Siguiente</button>
        </div>
      </section>
    }

    @if (tab() === 'camp') {
      <div class="adm-grid">
        <form class="adm-panel adm-form" (ngSubmit)="send()">
          <h2>Nuevo comunicado</h2>
          <div class="two">
            <div class="field"><label for="c-mod">Modalidad</label><select id="c-mod" class="select" name="mod" [(ngModel)]="seg.modality" (ngModelChange)="preview()"><option value="">Todas</option>
              <option value="ORD">Ordinario</option><option value="EXO">Exonerados</option><option value="CEPRE">CEPRE-UNSCH</option></select></div>
            <div class="field"><label for="c-st">Estado de la inscripción</label><select id="c-st" class="select" name="st" [(ngModel)]="seg.status" (ngModelChange)="preview()"><option value="">Todas (no anuladas)</option>
              @for (s of insStatus; track s.v) { <option [value]="s.v">{{ s.l }}</option> }</select></div>
          </div>
          <div class="field"><label for="c-op">Programa (código, opcional)</label><input id="c-op" class="input" name="op" [(ngModel)]="seg.optionCode" (change)="preview()" placeholder="P05" maxlength="3"></div>
          <p class="adm-muted">Destinatarios: <strong>{{ recipients() ?? '-' }}</strong></p>
          <div class="field"><label for="c-sub">Asunto</label><input id="c-sub" class="input" name="sub" [(ngModel)]="c.subject" maxlength="200"></div>
          <div class="field"><label for="c-body">Mensaje (puedes usar <code ngNonBindable>{{nombre}}</code> y <code ngNonBindable>{{codigo}}</code>)</label><textarea id="c-body" class="input" name="body" rows="7" [(ngModel)]="c.body"></textarea></div>
          <p class="adm-muted">No incluyas DNI ni puntajes: el correo debe llevar al portal.</p>
          <button class="btn" type="submit" style="justify-self:start" [disabled]="!recipients()">Enviar a {{ recipients() ?? 0 }} postulantes</button>
        </form>
        <section class="adm-panel">
          <h2>Comunicados enviados</h2>
          <ul class="adm-form" style="list-style:none;margin:0;padding:0">@for (x of campaigns(); track x.id) {
            <li><strong>{{ x.subject }}</strong><br><span class="adm-muted">{{ when(x.createdAt) }} · {{ segText(x.segment) }}</span><br>
              {{ x.recipients }} destinatarios · <span class="adm-tag ok">{{ x.sent }} enviados</span> @if (x.pending) { <span class="adm-tag warn">{{ x.pending }} en cola</span> } @if (x.failed) { <span class="adm-tag bad">{{ x.failed }} fallidos</span> }</li>
          } @empty { <li class="adm-muted">Aún no hay comunicados.</li> }</ul>
        </section>
      </div>
    }

    @if (tab() === 'tpl') {
      <div class="adm-grid">
        @for (x of templates(); track x.key) {
          <form class="adm-panel adm-form" (ngSubmit)="saveTpl(x)">
            <h2>{{ x.name }} @if (x.customized) { <span class="adm-tag">editada</span> }</h2>
            <div class="field"><label [for]="'ts-' + x.key">Asunto</label><input class="input" [id]="'ts-' + x.key" [name]="'s' + x.key" [(ngModel)]="x.subject"></div>
            <div class="field"><label [for]="'tb-' + x.key">Cuerpo (un párrafo por línea)</label><textarea class="input" [id]="'tb-' + x.key" [name]="'b' + x.key" rows="6" [(ngModel)]="x.body"></textarea></div>
            <button class="btn btn--quiet" type="submit" style="justify-self:start">Guardar plantilla</button>
          </form>
        }
      </div>
    }
  `,
})
export class NotificationsAdminPage implements OnInit {
  private readonly session = inject(AdminSession);
  protected readonly tab = signal<'log' | 'camp' | 'tpl'>('log');
  protected readonly tabs = [{ id: 'log' as const, label: 'Registro de envíos' }, { id: 'camp' as const, label: 'Comunicados' }, { id: 'tpl' as const, label: 'Plantillas' }];
  protected readonly log = signal<Log | null>(null);
  protected readonly campaigns = signal<Campaign[]>([]);
  protected readonly templates = signal<Template[]>([]);
  protected readonly recipients = signal<number | null>(null);
  protected readonly msg = signal<string | null>(null);
  protected readonly msgErr = signal(false);
  protected readonly when = shortDateTime;
  protected readonly st = (s: string) => STATUS[s] ?? s;
  protected readonly ev = (e: string) => EVENT[e] ?? e;
  protected readonly statusKeys = Object.keys(STATUS);
  protected readonly insStatus = INS_STATUS;
  protected readonly pages = (l: Log) => Math.max(1, Math.ceil(l.total / l.pageSize));
  protected f = { status: '', event: '', email: '' };
  protected seg = { modality: '', status: '', optionCode: '' };
  protected c = { subject: '', body: '' };

  ngOnInit() { void this.loadLog(1); }

  protected go(id: 'log' | 'camp' | 'tpl') {
    this.tab.set(id);
    this.msg.set(null);
    if (id === 'log') void this.loadLog(1);
    if (id === 'camp') { void this.loadCampaigns(); void this.preview(); }
    if (id === 'tpl') void this.session.get<Template[]>('/admin/notification-templates').then((t) => this.templates.set(t)).catch((e) => this.fail(e));
  }

  protected async loadLog(page: number) {
    try { this.log.set(await this.session.get<Log>('/admin/notifications', { ...this.f, page })); } catch (e) { this.fail(e); }
  }

  protected async dispatchNow() {
    try {
      const r = await this.session.postAuth<{ queued: number; sent: number }>('/admin/notifications/dispatch');
      this.ok(`${r.queued} avisos nuevos en cola · ${r.sent} enviados.`);
      await this.loadLog(1);
    } catch (e) { this.fail(e); }
  }

  protected async retry() {
    try {
      const r = await this.session.postAuth<{ requeued: number }>('/admin/notifications/retry');
      this.ok(`${r.requeued} notificaciones vuelven a la cola.`);
      await this.loadLog(1);
    } catch (e) { this.fail(e); }
  }

  private segment() {
    return { ...(this.seg.modality ? { modality: this.seg.modality } : {}), ...(this.seg.status ? { status: this.seg.status } : {}), ...(/^P\d{2}$/.test(this.seg.optionCode.trim().toUpperCase()) ? { optionCode: this.seg.optionCode.trim().toUpperCase() } : {}) };
  }

  protected async preview() {
    try { this.recipients.set((await this.session.postAuth<{ recipients: number }>('/admin/campaigns/preview', this.segment())).recipients); } catch (e) { this.fail(e); }
  }

  protected async loadCampaigns() {
    try { this.campaigns.set(await this.session.get<Campaign[]>('/admin/campaigns')); } catch (e) { this.fail(e); }
  }

  protected async send() {
    try {
      this.campaigns.set(await this.session.postAuth<Campaign[]>('/admin/campaigns', { ...this.c, segment: this.segment() }));
      this.ok('Comunicado en cola: se envía en lotes en el siguiente minuto.');
      this.c = { subject: '', body: '' };
    } catch (e) { this.fail(e); }
  }

  protected segText(s: Record<string, string>) {
    const parts = [s['modality'] ? `Modalidad ${s['modality']}` : 'Todas las modalidades', s['status'] ? INS_STATUS.find((x) => x.v === s['status'])?.l ?? s['status'] : '', s['optionCode'] ?? ''];
    return parts.filter(Boolean).join(' · ');
  }

  protected async saveTpl(x: Template) {
    try {
      this.templates.set(await this.session.put<Template[]>(`/admin/notification-templates/${x.key}`, { subject: x.subject, body: x.body }));
      this.ok('Plantilla guardada.');
    } catch (e) { this.fail(e); }
  }

  private ok(t: string) { this.msg.set(t); this.msgErr.set(false); }
  private fail(e: unknown) { this.msg.set(apiErrorMessage(e)); this.msgErr.set(true); }
}
