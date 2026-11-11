import { Component, OnInit, inject, signal } from '@angular/core';
import { AdmToast } from '../toast';
import { FormsModule } from '@angular/forms';
import { AdminSession } from '../../../core/admin-session';
import { apiErrorMessage } from '../../../core/api.service';

interface Entry { id?: string; topic: string; question: string; answer: string; source: string; active: boolean; extraKeywords?: string }
interface Usage { day: string; requests: number; aiReplies: number; tokensIn: number; tokensOut: number; costUsd: number; errors: number; handoffs: number }

/** Asistente virtual: base de conocimientos editable (RF-10.12) e indicadores de uso (RF-10.15, RF-12.10). */
@Component({
  selector: 'app-admin-knowledge',
  imports: [FormsModule, AdmToast],
  template: `
    <header class="adm-head"><div><h1>Asistente virtual</h1><p>Las respuestas que cargues aquí las usa el asistente desde el siguiente mensaje. Cita siempre la fuente oficial.</p></div></header>
    <app-adm-toast [text]="msg()" [error]="msgErr()" (closed)="msg.set(null)" />
    <section class="adm-kpis">
      <div class="adm-kpi"><strong>{{ total('requests') }}</strong><span>Consultas (30 días)</span></div>
      <div class="adm-kpi"><strong>{{ total('aiReplies') }}</strong><span>Respondidas con IA</span></div>
      <div class="adm-kpi"><strong>{{ total('handoffs') }}</strong><span>Derivadas a una persona</span></div>
      <div class="adm-kpi"><strong>US$ {{ cost() }}</strong><span>Costo de IA (30 días)</span></div>
      <div class="adm-kpi"><strong>{{ total('errors') }}</strong><span>Errores del proveedor</span></div>
    </section>
    <div class="adm-grid">
      <form class="adm-panel adm-form" (ngSubmit)="save()">
        <h2>{{ form.id ? 'Editar respuesta' : 'Nueva respuesta' }}</h2>
        <div class="two">
          <div class="field"><label for="k-top">Tema</label>
            <select id="k-top" class="select" name="top" [(ngModel)]="form.topic"><option value="inscripcion">Inscripción</option><option value="pagos">Pagos</option><option value="documentos">Documentos</option><option value="exonerados">Exonerados</option><option value="examen">Examen</option><option value="resultados">Resultados</option><option value="contacto">Contacto</option></select></div>
          <label class="adm-check"><input type="checkbox" name="act" [(ngModel)]="form.active"> Activa</label>
        </div>
        <div class="field"><label for="k-q">Pregunta</label><input id="k-q" class="input" name="q" [(ngModel)]="form.question" required></div>
        <div class="field"><label for="k-a">Respuesta</label><textarea id="k-a" class="input" name="a" [(ngModel)]="form.answer" required></textarea></div>
        <div class="field"><label for="k-s">Fuente oficial</label><input id="k-s" class="input" name="s" [(ngModel)]="form.source" placeholder="Reglamento 2027-I, Art. 18" required></div>
        <div class="field"><label for="k-kw">Palabras con que la pregunta la gente (opcional)</label><input id="k-kw" class="input" name="kw" [(ngModel)]="form.extraKeywords" placeholder="devolución reembolso"></div>
        <div class="adm-row"><button class="btn" type="submit">Guardar</button>@if (form.id) {<button class="btn btn--quiet" type="button" (click)="reset()">Cancelar</button>}</div>
      </form>
      <section class="adm-panel"><h2>Base de conocimientos ({{ entries().length }})</h2>
        <div class="adm-table-wrap"><table class="adm-table"><tbody>
          @for (e of entries(); track e.id) {
            <tr><td><span class="adm-tag">{{ e.topic }}</span> @if (!e.active) {<span class="adm-tag bad">inactiva</span>}<br><strong>{{ e.question }}</strong><br><span class="adm-muted">{{ e.source }}</span></td>
              <td><button type="button" class="adm-link" (click)="edit(e)">Editar</button></td></tr>
          }
        </tbody></table></div>
      </section>
    </div>
  `,
})
export class KnowledgeAdminPage implements OnInit {
  private readonly session = inject(AdminSession);
  protected readonly entries = signal<Entry[]>([]);
  protected readonly usage = signal<Usage[]>([]);
  protected readonly msg = signal<string | null>(null);
  protected readonly msgErr = signal(false);
  protected form: Entry = { topic: 'inscripcion', question: '', answer: '', source: '', active: true };

  ngOnInit() { void this.reload(); }

  protected total = (k: 'requests' | 'aiReplies' | 'handoffs' | 'errors') => this.usage().reduce((s, u) => s + u[k], 0);
  protected cost = () => this.usage().reduce((s, u) => s + u.costUsd, 0).toFixed(4);

  private async reload() {
    const [e, u] = await Promise.all([this.session.get<Entry[]>('/admin/knowledge'), this.session.get<Usage[]>('/admin/assistant/usage')]);
    this.entries.set(e);
    this.usage.set(u);
  }

  protected edit(e: Entry) { this.form = { ...e }; }
  protected reset() { this.form = { topic: 'inscripcion', question: '', answer: '', source: '', active: true }; }

  protected async save() {
    try {
      await this.session.postAuth('/admin/knowledge', { ...this.form, extraKeywords: this.form.extraKeywords || undefined });
      this.msg.set('Respuesta guardada: el asistente ya la usa.');
      this.msgErr.set(false);
      this.reset();
      await this.reload();
    } catch (err) {
      this.msg.set(apiErrorMessage(err));
      this.msgErr.set(true);
    }
  }
}
