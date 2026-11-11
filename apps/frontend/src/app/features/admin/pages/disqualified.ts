import { Component, OnInit, inject, signal } from '@angular/core';
import { AdmToast } from '../toast';
import { FormsModule } from '@angular/forms';
import { AdminSession } from '../../../core/admin-session';
import { apiErrorMessage } from '../../../core/api.service';

interface Person { id: string; documentType: string; documentNumber: string; reason: string; resolution: string; validFrom: string; validUntil: string | null; active: boolean }

/** Spec 008, Historia 5: registro de inhabilitados (RN-09); inhabilitar anula las inscripciones vigentes. */
@Component({
  selector: 'app-admin-disqualified',
  imports: [FormsModule, AdmToast],
  template: `
    <header class="adm-head"><div><h1>Inhabilitados</h1><p>Una persona inhabilitada no puede inscribirse; si ya tenía inscripción, se anula con la resolución.</p></div></header>
    <app-adm-toast [text]="msg()" [error]="msgErr()" (closed)="msg.set(null)" />
    <div class="adm-grid">
      <form class="adm-panel adm-form" (ngSubmit)="add()">
        <h2>Registrar inhabilitación</h2>
        <div class="two">
          <div class="field"><label for="d-t">Documento</label><select id="d-t" class="select" name="t" [(ngModel)]="f.documentType"><option value="DNI">DNI</option><option value="CE">Carné de extranjería</option><option value="PASAPORTE">Pasaporte</option></select></div>
          <div class="field"><label for="d-n">Número</label><input id="d-n" class="input" name="n" [(ngModel)]="f.documentNumber" required></div>
        </div>
        <div class="field"><label for="d-r">Resolución</label><input id="d-r" class="input" name="r" [(ngModel)]="f.resolution" placeholder="R.D. N.° 000-2026-DA" required></div>
        <div class="field"><label for="d-m">Motivo</label><input id="d-m" class="input" name="m" [(ngModel)]="f.reason" placeholder="Suplantación en el proceso 2026-II" required></div>
        <div class="field"><label for="d-u">Vigente hasta (vacío = indefinida)</label><input id="d-u" class="input" type="date" name="u" [(ngModel)]="f.validUntil"></div>
        <button class="btn" type="submit">Registrar</button>
      </form>
      <section class="adm-panel"><h2>Registro</h2>
        <div class="adm-table-wrap"><table class="adm-table">
          <thead><tr><th>Documento</th><th>Resolución y motivo</th><th>Vigencia</th><th></th></tr></thead>
          <tbody>@for (p of list(); track p.id) {
            <tr><td>{{ p.documentType }} {{ p.documentNumber }}</td><td><strong>{{ p.resolution }}</strong><br><span class="adm-muted">{{ p.reason }}</span></td>
              <td><span class="adm-tag" [class.bad]="p.active">{{ p.active ? 'Vigente' : 'Sin efecto' }}</span><br><span class="adm-muted">{{ day(p.validFrom) }} a {{ p.validUntil ? day(p.validUntil) : 'indefinida' }}</span></td>
              <td>@if (p.active) {<button type="button" class="adm-link" (click)="lift(p)">Retirar</button>}</td></tr>
          }</tbody>
        </table></div>
      </section>
    </div>
  `,
})
export class DisqualifiedAdminPage implements OnInit {
  private readonly session = inject(AdminSession);
  protected readonly list = signal<Person[]>([]);
  protected readonly msg = signal<string | null>(null);
  protected readonly msgErr = signal(false);
  /** «2026-01-01» a «01/01/2026». */
  protected readonly day = (iso: string) => iso.slice(0, 10).split('-').reverse().join('/');
  protected f = { documentType: 'DNI', documentNumber: '', resolution: '', reason: '', validUntil: '' };

  ngOnInit() { void this.reload(); }
  private async reload() { this.list.set(await this.session.get<Person[]>('/admin/disqualified')); }

  protected async add() {
    if (!confirm(`¿Inhabilitar el documento ${this.f.documentNumber}? Sus inscripciones vigentes se anularán.`)) return;
    try {
      const r = await this.session.postAuth<{ annulled: string[] }>('/admin/disqualified', { ...this.f, validUntil: this.f.validUntil || undefined });
      this.msg.set(`Registrado.${r.annulled.length ? ` Inscripciones anuladas: ${r.annulled.join(', ')}.` : ''}`);
      this.msgErr.set(false);
      this.f = { documentType: 'DNI', documentNumber: '', resolution: '', reason: '', validUntil: '' };
    } catch (e) {
      this.msg.set(apiErrorMessage(e));
      this.msgErr.set(true);
    }
    await this.reload();
  }

  protected async lift(p: Person) {
    if (!confirm(`¿Dejar sin efecto la inhabilitación de ${p.documentNumber}?`)) return;
    await this.session.postAuth(`/admin/disqualified/${p.id}/lift`);
    this.msg.set('Inhabilitación dejada sin efecto (queda en el historial).');
    this.msgErr.set(false);
    await this.reload();
  }
}
