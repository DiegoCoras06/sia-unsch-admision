import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminSession } from '../../../core/admin-session';
import { apiErrorMessage } from '../../../core/api.service';
import { openDocument } from '../../../core/direct-upload';
import { shortDateTime } from '../../../core/format';

interface Row {
  applicantCode: string; documentType: string; documentNumber: string; fullName: string; email: string; mobile: string;
  modality: string; optionCode: string; status: string; statusLabel: string; fee: string; createdAt: string;
}
interface Page<T> { total: number; page: number; pageSize: number; items: T[] }

/** Inscripciones con búsqueda, filtros y anulación con motivo (spec 008). */
@Component({
  selector: 'app-admin-inscriptions',
  imports: [FormsModule],
  template: `
    <header class="adm-head"><div><h1>Inscripciones</h1><p>Busca por código, DNI, apellido o nombre.</p></div></header>
    <form class="adm-panel adm-filters" (ngSubmit)="go(1)">
      <div class="field"><label for="i-q">Buscar</label><input id="i-q" class="input" name="q" [(ngModel)]="q" placeholder="27000017, 99900021, QUISPE…"></div>
      <div class="field"><label for="i-st">Estado</label>
        <select id="i-st" class="select" name="st" [(ngModel)]="status"><option value="">Todos</option><option value="PENDIENTE_PAGO">Pendiente de pago</option><option value="PENDIENTE_VALIDACION">Pendiente de validación</option><option value="APTA">Apta</option><option value="OBSERVADA">Observada</option><option value="ANULADA">Anulada</option></select></div>
      <div class="field"><label for="i-mod">Modalidad</label>
        <select id="i-mod" class="select" name="mod" [(ngModel)]="modality"><option value="">Todas</option><option value="ORD">Ordinario</option><option value="EXO">Exonerados</option><option value="CEPRE">CEPRE</option></select></div>
      <button class="btn" type="submit">Buscar</button>
    </form>
    @if (msg()) { <p class="adm-msg" [class.err]="msgErr()" role="status">{{ msg() }}</p> }
    <section class="adm-panel">
      <div class="adm-table-wrap">
        <table class="adm-table">
          <thead><tr><th>Código</th><th>Postulante</th><th>Contacto</th><th>Modalidad</th><th>Programa</th><th>Estado</th><th class="num">Tasa</th><th>Registrada</th><th></th></tr></thead>
          <tbody>
            @for (r of page()?.items ?? []; track r.applicantCode) {
              <tr>
                <td><strong>{{ r.applicantCode }}</strong></td><td class="ins-name">{{ r.fullName }}<br><span class="adm-muted">{{ r.documentType }} {{ r.documentNumber }}</span></td>
                <td>{{ r.email }}<br><span class="adm-muted">{{ r.mobile }}</span></td><td>{{ r.modality }}</td><td>{{ r.optionCode }}</td>
                <td><span class="adm-tag" [class.ok]="r.status === 'APTA'" [class.warn]="r.status.startsWith('PENDIENTE')" [class.bad]="r.status === 'ANULADA'" [title]="r.statusLabel">{{ short(r.status) }}</span></td>
                <td class="num">S/ {{ r.fee }}</td><td class="nowrap">{{ when(r.createdAt) }}</td>
                <td><button type="button" class="adm-link" (click)="toggleDocs(r.applicantCode)" [attr.aria-expanded]="open() === r.applicantCode">Documentos</button>
                  @if (session.can('inscripciones.anular') && r.status !== 'ANULADA') {<br><button type="button" class="adm-link" (click)="annul(r)">Anular</button>}</td>
              </tr>
              @if (open() === r.applicantCode) {
                <tr class="ins-docs"><td colspan="9">
                  @for (d of docs(); track d.kind) {
                    <div class="ins-doc"><span>{{ d.name }}@if (d.required) { <span class="adm-muted"> (obligatorio)</span> }</span>
                      @if (d.uploaded; as u) { <button type="button" class="adm-link" (click)="openDoc(r.applicantCode, d.kind)">Ver {{ u.fileName }}</button> <span class="adm-muted">{{ when(u.uploadedAt) }}</span> }
                      @else { <span class="adm-tag" [class.warn]="d.required">Sin subir</span> }</div>
                  } @empty { <p class="adm-muted">Cargando…</p> }
                </td></tr>
              }
            } @empty { <tr class="adm-none"><td colspan="9">No hay inscripciones con esos filtros.</td></tr> }
          </tbody>
        </table>
      </div>
      @if (page(); as p) {
        <div class="adm-pager"><span>{{ p.total }} resultados, página {{ p.page }} de {{ pages() }}</span>
          <button class="btn btn--quiet" type="button" [disabled]="p.page <= 1" (click)="go(p.page - 1)">Anterior</button>
          <button class="btn btn--quiet" type="button" [disabled]="p.page >= pages()" (click)="go(p.page + 1)">Siguiente</button></div>
      }
    </section>
  `,
  styles: `
    .ins-docs td { background: #f8f7f5; }
    .ins-doc { display: flex; flex-wrap: wrap; gap: 0.5rem 1rem; align-items: baseline; padding: 0.35rem 0; }
    .ins-doc > span:first-child { min-width: 18rem; font-weight: 600; }
  `,
})
export class InscriptionsAdminPage implements OnInit {
  protected readonly session = inject(AdminSession);
  protected readonly page = signal<Page<Row> | null>(null);
  protected readonly msg = signal<string | null>(null);
  protected readonly msgErr = signal(false);
  /** RF-03.05: inscripción cuyos documentos adjuntos se están viendo. */
  protected readonly open = signal<string | null>(null);
  protected readonly docs = signal<{ kind: string; name: string; required: boolean; uploaded: { fileName: string; uploadedAt: string } | null }[]>([]);
  protected q = '';
  protected status = '';
  protected modality = '';
  protected readonly when = shortDateTime;
  /** Estado en pocas palabras (el texto completo queda en el título de la etiqueta). */
  protected readonly short = (status: string) =>
    ({ PENDIENTE_PAGO: 'Pendiente de pago', PENDIENTE_VALIDACION: 'Expediente por validar', APTA: 'Apta', OBSERVADA: 'Observada', ANULADA: 'Anulada' } as Record<string, string>)[status] ?? status;
  protected pages = () => Math.max(1, Math.ceil((this.page()?.total ?? 0) / (this.page()?.pageSize ?? 25)));

  ngOnInit() { void this.go(1); }

  protected async go(page: number) {
    try {
      this.page.set(await this.session.get<Page<Row>>('/admin/inscriptions', { q: this.q, status: this.status, modality: this.modality, page }));
    } catch (e) {
      this.show(apiErrorMessage(e), true);
    }
  }

  protected async annul(r: Row) {
    const reason = prompt(`Motivo de la anulación de ${r.applicantCode} (${r.fullName}):`);
    if (!reason?.trim()) return;
    try {
      await this.session.postAuth(`/admin/inscriptions/${r.applicantCode}/annul`, { reason });
      this.show(`Inscripción ${r.applicantCode} anulada.`, false);
      await this.go(this.page()?.page ?? 1);
    } catch (e) {
      this.show(apiErrorMessage(e), true);
    }
  }

  protected async toggleDocs(code: string) {
    if (this.open() === code) { this.open.set(null); return; }
    this.docs.set([]);
    this.open.set(code);
    try { this.docs.set(await this.session.get(`/admin/inscriptions/${code}/documents`)); } catch (e) { this.show(apiErrorMessage(e), true); }
  }

  protected async openDoc(code: string, kind: string) {
    try {
      await openDocument(await this.session.blob(`/admin/inscriptions/${code}/documents/${kind}`));
    } catch (e) { this.show(apiErrorMessage(e), true); }
  }

  private show(text: string, err: boolean) { this.msg.set(text); this.msgErr.set(err); }
}
