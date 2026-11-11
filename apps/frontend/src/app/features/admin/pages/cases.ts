import { Component, OnInit, inject, signal } from '@angular/core';
import { AdmToast } from '../toast';
import { FormsModule } from '@angular/forms';
import { AdminSession } from '../../../core/admin-session';
import { apiErrorMessage } from '../../../core/api.service';
import { shortDateTime } from '../../../core/format';

interface Attachment { id: string; fileName: string; contentType: string; sizeBytes: number }
interface Case { caseNumber: string; type: string; typeLabel: string; status: 'OPEN' | 'IN_PROGRESS' | 'CLOSED'; statusLabel: string; name: string; email: string; phone: string | null; message: string; createdAt: string; attachments: Attachment[] }
interface Page<T> { total: number; page: number; pageSize: number; items: T[] }

/** Spec 008, Historia 7: consultas, denuncias y derivaciones del asistente con número de caso. */
@Component({
  selector: 'app-admin-cases',
  imports: [FormsModule, AdmToast],
  template: `
    <header class="adm-head"><div><h1>Casos de atención</h1><p>El ciudadano ve el avance con su número de caso en el portal.</p></div></header>
    <form class="adm-panel adm-filters" (ngSubmit)="go(1)">
      <div class="field"><label for="cs-st">Estado</label><select id="cs-st" class="select" name="st" [(ngModel)]="status"><option value="">Todos</option><option value="OPEN">Recibido</option><option value="IN_PROGRESS">En atención</option><option value="CLOSED">Cerrado</option></select></div>
      <div class="field"><label for="cs-ty">Tipo</label><select id="cs-ty" class="select" name="ty" [(ngModel)]="type"><option value="">Todos</option><option value="CONTACT">Consulta</option><option value="COMPLAINT">Denuncia</option><option value="CHATBOT_ESCALATION">Derivado del asistente</option><option value="RESULT_REVIEW">Revisión de resultados</option></select></div>
      <button class="btn" type="submit">Filtrar</button>
    </form>
    <app-adm-toast [text]="msg()" [error]="msgErr()" (closed)="msg.set(null)" />
    <section class="adm-panel">
      <div class="adm-table-wrap"><table class="adm-table">
        <thead><tr><th>Caso</th><th>Tipo</th><th>De</th><th>Mensaje</th><th>Estado</th></tr></thead>
        <tbody>@for (c of page()?.items ?? []; track c.caseNumber) {
          <tr><td><strong>{{ c.caseNumber }}</strong><br><span class="adm-muted">{{ when(c.createdAt) }}</span></td><td>{{ c.typeLabel }}</td>
            <td>{{ c.name }}<br><span class="adm-muted">{{ c.email }}</span></td>
            <td style="max-width:32rem"><p style="margin:0; white-space:pre-line">{{ c.message.length > 400 ? c.message.slice(0, 400) + '…' : c.message }}</p>
              @if (c.attachments.length) {
                <ul class="cs-files" aria-label="Evidencia adjunta">@for (a of c.attachments; track a.id) {
                  <li><button type="button" class="btn btn--quiet" (click)="download(c, a)">📎 {{ a.fileName }} <span class="adm-muted">({{ kb(a.sizeBytes) }})</span></button></li>
                }</ul>
              }</td>
            <td><select class="select" [ngModel]="c.status" (ngModelChange)="setStatus(c, $event)" [attr.aria-label]="'Estado del caso ' + c.caseNumber">
              <option value="OPEN">Recibido</option><option value="IN_PROGRESS">En atención</option><option value="CLOSED">Cerrado</option></select></td></tr>
        } @empty { <tr class="adm-none"><td colspan="5">No hay casos.</td></tr> }</tbody>
      </table></div>
    </section>
  `,
  styles: `.cs-files { list-style: none; margin: 0.5rem 0 0; padding: 0; display: flex; flex-wrap: wrap; gap: 0.35rem; } .cs-files .btn { font-size: 0.8125rem; padding: 0.3rem 0.6rem; }`,
})
export class CasesAdminPage implements OnInit {
  private readonly session = inject(AdminSession);
  protected readonly page = signal<Page<Case> | null>(null);
  protected readonly msg = signal<string | null>(null);
  protected readonly msgErr = signal(false);
  protected status = '';
  protected type = '';
  protected readonly when = shortDateTime;

  ngOnInit() { void this.go(1); }

  protected async go(page: number) {
    this.page.set(await this.session.get<Page<Case>>('/admin/cases', { status: this.status, type: this.type, page }));
  }

  protected kb(bytes: number) { return bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`; }

  /** La descarga queda en la auditoría (Historia 7). */
  protected async download(c: Case, a: Attachment) {
    try {
      await this.session.download(`/admin/cases/${c.caseNumber}/attachments/${a.id}`, {}, a.fileName);
    } catch (e) {
      this.msg.set(apiErrorMessage(e));
      this.msgErr.set(true);
    }
  }

  protected async setStatus(c: Case, status: Case['status']) {
    try {
      await this.session.postAuth(`/admin/cases/${c.caseNumber}/status`, { status });
      this.msg.set(`Caso ${c.caseNumber} actualizado.`);
      this.msgErr.set(false);
    } catch (e) {
      this.msg.set(apiErrorMessage(e));
      this.msgErr.set(true);
    }
    await this.go(this.page()?.page ?? 1);
  }
}
