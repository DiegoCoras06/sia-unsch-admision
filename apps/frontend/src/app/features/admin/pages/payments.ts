import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminSession } from '../../../core/admin-session';
import { apiErrorMessage } from '../../../core/api.service';
import { shortDateTime } from '../../../core/format';

interface Row {
  applicantCode: string; orderNumber: string; transactionId: string; provider: string; status: string; amount: string;
  payMethod: string | null; operationNumber: string | null; cardMasked: string | null; confirmedVia: string | null; createdAt: string;
}
interface Page<T> { total: number; page: number; pageSize: number; items: T[] }

/** Pagos en línea para Tesorería (spec 005 y 008): intentos, estado y confirmación. */
@Component({
  selector: 'app-admin-payments',
  imports: [FormsModule],
  template: `
    <header class="adm-head"><div><h1>Pagos en línea</h1><p>Cada intento de pago con su estado, número de operación y cómo se confirmó.</p></div></header>
    <form class="adm-panel adm-filters" (ngSubmit)="go(1)">
      <div class="field"><label for="p-st">Estado</label>
        <select id="p-st" class="select" name="st" [(ngModel)]="status"><option value="">Todos</option><option value="AUTORIZADO">Autorizado</option><option value="INICIADO">Iniciado</option><option value="RECHAZADO">Rechazado</option><option value="VENCIDO">Vencido</option><option value="DUPLICADO">Duplicado</option></select></div>
      <button class="btn" type="submit">Filtrar</button>
      @if (session.can('reportes.pagos')) { <button class="btn btn--quiet" type="button" (click)="export()">Exportar a Excel</button> }
    </form>
    @if (error()) { <p class="adm-msg err" role="alert">{{ error() }}</p> }
    <section class="adm-panel">
      <div class="adm-table-wrap">
        <table class="adm-table">
          <thead><tr><th>Postulante</th><th>Pedido</th><th>Transacción</th><th>Pasarela</th><th>Estado</th><th class="num">Monto</th><th>Medio</th><th>Operación</th><th>Confirmado por</th><th>Fecha</th></tr></thead>
          <tbody>
            @for (r of page()?.items ?? []; track r.transactionId) {
              <tr>
                <td>{{ r.applicantCode }}</td><td>{{ r.orderNumber }}</td><td class="adm-muted">{{ r.transactionId }}</td><td>{{ r.provider }}</td>
                <td><span class="adm-tag" [class.ok]="r.status === 'AUTORIZADO'" [class.warn]="r.status === 'INICIADO' || r.status === 'DUPLICADO'" [class.bad]="r.status === 'RECHAZADO'">{{ r.status }}</span></td>
                <td class="num">S/ {{ r.amount }}</td><td>{{ r.payMethod ?? '-' }}@if (r.cardMasked) {<br><span class="adm-muted">{{ r.cardMasked }}</span>}</td>
                <td>{{ r.operationNumber ?? '-' }}</td><td>{{ r.confirmedVia ?? '-' }}</td><td>{{ when(r.createdAt) }}</td>
              </tr>
            } @empty { <tr><td colspan="10">Aún no hay pagos en línea.</td></tr> }
          </tbody>
        </table>
      </div>
      @if (page(); as p) {
        <div class="adm-pager"><span>{{ p.total }} intentos</span>
          <button class="btn btn--quiet" type="button" [disabled]="p.page <= 1" (click)="go(p.page - 1)">Anterior</button>
          <button class="btn btn--quiet" type="button" [disabled]="p.page * p.pageSize >= p.total" (click)="go(p.page + 1)">Siguiente</button></div>
      }
    </section>
  `,
})
export class PaymentsAdminPage implements OnInit {
  protected readonly session = inject(AdminSession);
  protected readonly page = signal<Page<Row> | null>(null);
  protected readonly error = signal<string | null>(null);
  protected status = '';
  protected readonly when = shortDateTime;

  ngOnInit() { void this.go(1); }

  protected async go(page: number) {
    try {
      this.page.set(await this.session.get<Page<Row>>('/admin/payments', { status: this.status, page }));
    } catch (e) {
      this.error.set(apiErrorMessage(e));
    }
  }

  protected async export() {
    try { await this.session.download('/admin/reports/pagos.xlsx', {}, 'pagos-2027-I.xlsx'); } catch (e) { this.error.set(apiErrorMessage(e)); }
  }
}
