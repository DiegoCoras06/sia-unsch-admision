import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminSession } from '../../../core/admin-session';
import { apiErrorMessage } from '../../../core/api.service';
import { shortDateTime } from '../../../core/format';

interface Row { applicantCode: string; fullName: string; document: string; program: string; status: 'PENDIENTE' | 'INGRESANTE' | 'PERDIDA'; receivedAt: string | null; receiptNumber: string | null; late: boolean; amountPaid: string | null; note: string | null }
interface Data { window: { start: string; end: string; lateEnd: string } | null; rows: Row[] }

const LABEL = { PENDIENTE: 'Admitido: por entregar', INGRESANTE: 'Ingresante', PERDIDA: 'Admisión perdida' } as const;

/** Spec 007, Historia 5: entrega de documentos, pago de la constancia (S/ 15.00, recargo S/ 65.00) e ingresantes. */
@Component({
  selector: 'app-admin-admissions',
  imports: [FormsModule],
  template: `
    <header class="adm-head"><div><h1>Ingreso</h1>
      <p>Registra la entrega de documentos originales y el recibo de la constancia de ingreso. Vencido el plazo, el admitido sin entrega pierde la vacante automáticamente (Art. 34) y no se cubre (Disp. Final 4.ª).</p></div></header>
    @if (data()?.window; as w) {
      <p class="adm-panel">Plazo: {{ when(w.start) }} al {{ when(w.end) }} · extemporánea hasta el {{ when(w.lateEnd) }} con recargo de S/ 65.00.</p>
    }
    <form class="adm-panel adm-filters" (ngSubmit)="load()">
      <div class="field"><label for="ad-st">Estado</label><select id="ad-st" class="select" name="st" [(ngModel)]="status"><option value="">Todos</option>
        <option value="PENDIENTE">Por entregar</option><option value="INGRESANTE">Ingresantes</option><option value="PERDIDA">Admisión perdida</option></select></div>
      <div class="field"><label for="ad-q">Buscar</label><input id="ad-q" class="input" name="q" [(ngModel)]="q" placeholder="Código, DNI o nombre"></div>
      <button class="btn" type="submit">Filtrar</button>
    </form>
    @if (msg()) { <p class="adm-msg" [class.err]="msgErr()" role="status">{{ msg() }}</p> }
    <section class="adm-panel">
      <div class="adm-table-wrap"><table class="adm-table">
        <thead><tr><th>Código</th><th>Admitido</th><th>Programa</th><th>Estado</th><th>Entrega</th><th></th></tr></thead>
        <tbody>@for (r of data()?.rows ?? []; track r.applicantCode) {
          <tr><td><strong>{{ r.applicantCode }}</strong></td><td>{{ r.fullName }}<br><span class="adm-muted">{{ r.document }}</span></td><td>{{ r.program }}</td>
            <td><span class="adm-tag" [class.ok]="r.status === 'INGRESANTE'" [class.warn]="r.status === 'PENDIENTE'" [class.bad]="r.status === 'PERDIDA'">{{ label[r.status] }}</span></td>
            <td>@if (r.receivedAt) { {{ when(r.receivedAt) }}<br><span class="adm-muted">Recibo {{ r.receiptNumber }} · S/ {{ r.amountPaid }}{{ r.late ? ' (extemporánea)' : '' }}</span> } @else { {{ r.note ?? '-' }} }</td>
            <td>@if (r.status === 'PENDIENTE') {
                <div class="adm-row"><input class="input" style="width:9rem" [(ngModel)]="receipts[r.applicantCode]" [name]="'rc' + r.applicantCode" placeholder="N.° de recibo" [attr.aria-label]="'Recibo de ' + r.applicantCode">
                <button type="button" class="btn btn--quiet" (click)="deliver(r.applicantCode)">Registrar entrega</button></div>
              } @else if (r.status === 'INGRESANTE') { <button type="button" class="adm-link" (click)="certificate(r.applicantCode)">Constancia (PDF)</button> }</td></tr>
        } @empty { <tr class="adm-none"><td colspan="6">No hay admitidos con ese filtro. Aparecen cuando la Comisión aprueba los resultados.</td></tr> }</tbody>
      </table></div>
    </section>
  `,
})
export class AdmissionsAdminPage implements OnInit {
  private readonly session = inject(AdminSession);
  protected readonly data = signal<Data | null>(null);
  protected readonly msg = signal<string | null>(null);
  protected readonly msgErr = signal(false);
  protected readonly when = shortDateTime;
  protected readonly label = LABEL;
  protected status = '';
  protected q = '';
  protected receipts: Record<string, string> = {};

  ngOnInit() { void this.load(); }

  protected async load() {
    try { this.data.set(await this.session.get<Data>('/admin/admissions', { status: this.status, q: this.q })); } catch (e) { this.fail(e); }
  }

  protected async deliver(code: string) {
    try {
      await this.session.postAuth(`/admin/admissions/${code}/deliver`, { receiptNumber: (this.receipts[code] ?? '').trim() });
      this.msg.set(`${code} ya es ingresante.`);
      this.msgErr.set(false);
      await this.load();
    } catch (e) { this.fail(e); }
  }

  protected async certificate(code: string) {
    try { await this.session.download(`/admin/admissions/${code}/certificate.pdf`, {}, `constancia-ingreso-${code}.pdf`); } catch (e) { this.fail(e); }
  }

  private fail(e: unknown) { this.msg.set(apiErrorMessage(e)); this.msgErr.set(true); }
}
