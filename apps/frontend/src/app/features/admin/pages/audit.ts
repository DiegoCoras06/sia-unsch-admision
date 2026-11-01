import { Component, OnInit, inject, signal } from '@angular/core';
import { JsonPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminSession } from '../../../core/admin-session';
import { apiErrorMessage } from '../../../core/api.service';
import { shortDateTime } from '../../../core/format';

interface Ev { id: string; occurredAt: string; actor: string; action: string; resourceType: string; resourceId: string | null; before: unknown; after: unknown; origin: string | null }
interface Page<T> { total: number; page: number; pageSize: number; items: T[] }

/** Spec 008, Historia 4: auditoría de solo lectura (RF-13.04, RF-13.05; RNF-10: no existe opción de editar). */
@Component({
  selector: 'app-admin-audit',
  imports: [FormsModule, JsonPipe],
  template: `
    <header class="adm-head"><div><h1>Auditoría</h1><p>Quién hizo qué, cuándo, desde dónde, con el valor anterior y el nuevo. Los registros no se pueden modificar ni borrar.</p></div></header>
    <form class="adm-panel adm-filters" (ngSubmit)="go(1)">
      <div class="field"><label for="au-u">Usuario (correo)</label><input id="au-u" class="input" name="u" [(ngModel)]="f.actor"></div>
      <div class="field"><label for="au-a">Acción</label><input id="au-a" class="input" name="a" [(ngModel)]="f.action" placeholder="call., payment., access.denied"></div>
      <div class="field"><label for="au-r">Recurso o código</label><input id="au-r" class="input" name="r" [(ngModel)]="f.resource" placeholder="27000017, fee, vacancy"></div>
      <div class="field"><label for="au-f">Desde</label><input id="au-f" class="input" type="date" name="f" [(ngModel)]="f.from"></div>
      <div class="field"><label for="au-t">Hasta</label><input id="au-t" class="input" type="date" name="t" [(ngModel)]="f.to"></div>
      <button class="btn" type="submit">Buscar</button>
    </form>
    @if (error()) { <p class="adm-msg err" role="alert">{{ error() }}</p> }
    <section class="adm-panel">
      <div class="adm-table-wrap"><table class="adm-table">
        <thead><tr><th>Fecha</th><th>Quién</th><th>Acción</th><th>Recurso</th><th>Cambio</th><th>Origen</th></tr></thead>
        <tbody>@for (e of page()?.items ?? []; track e.id) {
          <tr><td>{{ when(e.occurredAt) }}</td><td>{{ e.actor }}</td>
            <td><span class="adm-tag" [class.bad]="e.action === 'access.denied' || e.action.includes('failed')">{{ e.action }}</span></td>
            <td>{{ e.resourceType }}<br><span class="adm-muted">{{ e.resourceId }}</span></td>
            <td>@if (e.before || e.after) {<details class="adm-json"><summary>Ver</summary>@if (e.before) {<pre>Antes: {{ e.before | json }}</pre>}@if (e.after) {<pre>Después: {{ e.after | json }}</pre>}</details>}</td>
            <td class="adm-muted">{{ e.origin ?? '-' }}</td></tr>
        } @empty { <tr><td colspan="6">Sin registros con esos filtros.</td></tr> }</tbody>
      </table></div>
      @if (page(); as p) {
        <div class="adm-pager"><span>{{ p.total }} registros</span>
          <button class="btn btn--quiet" type="button" [disabled]="p.page <= 1" (click)="go(p.page - 1)">Anterior</button>
          <button class="btn btn--quiet" type="button" [disabled]="p.page * p.pageSize >= p.total" (click)="go(p.page + 1)">Siguiente</button></div>
      }
    </section>
  `,
})
export class AuditAdminPage implements OnInit {
  private readonly session = inject(AdminSession);
  protected readonly page = signal<Page<Ev> | null>(null);
  protected readonly error = signal<string | null>(null);
  protected f = { actor: '', action: '', resource: '', from: '', to: '' };
  protected readonly when = shortDateTime;

  ngOnInit() { void this.go(1); }

  protected async go(page: number) {
    try {
      this.page.set(await this.session.get<Page<Ev>>('/admin/audit', { ...this.f, page }));
      this.error.set(null);
    } catch (e) {
      this.error.set(apiErrorMessage(e));
    }
  }
}
