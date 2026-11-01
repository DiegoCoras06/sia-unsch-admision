import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminSession } from '../../../core/admin-session';
import { apiErrorMessage } from '../../../core/api.service';

interface Stage { code: string; name: string; scope: string; kind: string; startsAt: string; endsAt: string; status: string; _start?: string; _end?: string }
interface Fee { code: string; concept: string; amount: string; kind: string; legalNote: string; _amount?: string }
interface Opt { code: string; name: string; area: string; byCategory: Record<string, number>; total: number }
interface CallDetail { code: string; name: string; status: string; stages: Stage[]; fees: Fee[]; vacancies: { categories: string[]; options: Opt[]; total: number } }

/** Hora de Lima (UTC−5, sin horario de verano) para los campos datetime-local. */
const toLima = (iso: string) => new Date(new Date(iso).getTime() - 5 * 3600_000).toISOString().slice(0, 16);
const fromLima = (local: string) => `${local}:00-05:00`;

/** Spec 008, Historia 1: etapas, tasas, vacantes (con resolución si está publicada) y copia de convocatoria. */
@Component({
  selector: 'app-admin-call',
  imports: [FormsModule],
  template: `
    <header class="adm-head">
      <div><h1>Convocatoria</h1><p>Los cambios se aplican al portal al instante y quedan en la auditoría con el valor anterior y el nuevo.</p></div>
      <div class="field"><label for="c-sel">Convocatoria</label>
        <select id="c-sel" class="select" [(ngModel)]="code" (ngModelChange)="load()">@for (c of calls(); track c.code) {<option [value]="c.code">{{ c.code }} · {{ c.status === 'PUBLISHED' ? 'publicada' : c.status === 'DRAFT' ? 'borrador' : c.status.toLowerCase() }}</option>}</select></div>
    </header>
    <div class="adm-tabs" role="tablist">
      @for (t of tabs; track t.id) { <button type="button" role="tab" [class.is-on]="tab() === t.id" [attr.aria-selected]="tab() === t.id" (click)="tab.set(t.id)">{{ t.label }}</button> }
    </div>
    @if (msg()) { <p class="adm-msg" [class.err]="msgErr()" role="status">{{ msg() }}</p> }

    @if (detail(); as d) {
      @switch (tab()) {
        @case ('etapas') {
          <section class="adm-panel"><h2>Cronograma (hora de Lima)</h2>
            <div class="adm-table-wrap"><table class="adm-table">
              <thead><tr><th>Etapa</th><th>Estado</th><th>Inicio</th><th>Fin</th><th></th></tr></thead>
              <tbody>@for (s of d.stages; track s.code) {
                <tr><td>{{ s.name }}<br><span class="adm-muted">{{ s.code }}</span></td>
                  <td><span class="adm-tag" [class.ok]="s.status === 'IN_PROGRESS'">{{ s.status === 'IN_PROGRESS' ? 'En curso' : s.status === 'UPCOMING' ? 'Próxima' : 'Finalizada' }}</span></td>
                  <td><input class="input" type="datetime-local" [(ngModel)]="s._start" [attr.aria-label]="'Inicio de ' + s.name"></td>
                  <td><input class="input" type="datetime-local" [(ngModel)]="s._end" [attr.aria-label]="'Fin de ' + s.name"></td>
                  <td><button class="btn btn--quiet" type="button" (click)="saveStage(s)">Guardar</button></td></tr>
              }</tbody>
            </table></div>
          </section>
        }
        @case ('tasas') {
          <section class="adm-panel"><h2>Tasas (Tabla N.° 3)</h2>
            <div class="adm-table-wrap"><table class="adm-table">
              <thead><tr><th>Concepto</th><th>Base legal</th><th>Tipo</th><th>Monto S/</th><th></th></tr></thead>
              <tbody>@for (f of d.fees; track f.code) {
                <tr><td>{{ f.concept }}</td><td class="adm-muted">{{ f.legalNote }}</td><td>{{ f.kind }}</td>
                  <td><input class="input" type="number" min="0" step="0.01" [(ngModel)]="f._amount" [attr.aria-label]="'Monto de ' + f.concept"></td>
                  <td><button class="btn btn--quiet" type="button" (click)="saveFee(f)">Guardar</button></td></tr>
              }</tbody>
            </table></div>
          </section>
        }
        @case ('vacantes') {
          <section class="adm-panel"><h2>Cuadro de vacantes · {{ d.vacancies.total }} en total</h2>
            @if (d.status === 'PUBLISHED') { <p class="adm-msg">Convocatoria publicada: cada cambio exige resolución y motivo (RN-03).</p>
              <div class="adm-form two"><div class="field"><label for="v-res">Resolución</label><input id="v-res" class="input" [(ngModel)]="resolution" placeholder="R.R. N.° 000-2026-UNSCH-R"></div>
                <div class="field"><label for="v-why">Motivo</label><input id="v-why" class="input" [(ngModel)]="reason" placeholder="Empate en el último puesto"></div></div> }
            <div class="adm-table-wrap"><table class="adm-table">
              <thead><tr><th>Programa</th>@for (c of d.vacancies.categories; track c) {<th class="num">{{ c }}</th>}<th class="num">Total</th></tr></thead>
              <tbody>@for (o of d.vacancies.options; track o.code) {
                <tr><td>{{ o.name }} <span class="adm-muted">{{ o.code }}</span></td>
                  @for (c of d.vacancies.categories; track c) {
                    <td class="num"><input class="input" type="number" min="0" style="width:4.5rem" [value]="o.byCategory[c] ?? 0" (change)="saveVacancy(o, c, $any($event.target).value)" [attr.aria-label]="o.name + ' ' + c"></td>
                  }
                  <td class="num"><strong>{{ o.total }}</strong></td></tr>
              }</tbody>
            </table></div>
          </section>
        }
        @case ('copiar') {
          <section class="adm-panel"><h2>Copiar {{ d.code }} a un periodo nuevo</h2>
            <p>Copia etapas (desplazadas los meses que indiques), tasas con sus reglas, vacantes, requisitos y documentos. La nueva convocatoria queda en borrador.</p>
            <form class="adm-form" (ngSubmit)="copy()">
              <div class="two">
                <div class="field"><label for="cp-code">Código</label><input id="cp-code" class="input" name="code" [(ngModel)]="cp.code" placeholder="2027-II" required></div>
                <div class="field"><label for="cp-name">Nombre</label><input id="cp-name" class="input" name="name" [(ngModel)]="cp.name" required></div>
                <div class="field"><label for="cp-year">Año</label><input id="cp-year" class="input" type="number" name="year" [(ngModel)]="cp.year"></div>
                <div class="field"><label for="cp-per">Periodo</label><input id="cp-per" class="input" name="per" [(ngModel)]="cp.period"></div>
                <div class="field"><label for="cp-off">Desplazar fechas (meses)</label><input id="cp-off" class="input" type="number" min="0" max="24" name="off" [(ngModel)]="cp.monthsOffset"></div>
              </div>
              <button class="btn" type="submit">Crear copia en borrador</button>
            </form>
          </section>
        }
      }
    }
  `,
})
export class CallAdminPage implements OnInit {
  private readonly session = inject(AdminSession);
  protected readonly calls = signal<{ code: string; status: string }[]>([]);
  protected readonly detail = signal<CallDetail | null>(null);
  protected readonly tab = signal<'etapas' | 'tasas' | 'vacantes' | 'copiar'>('etapas');
  protected readonly msg = signal<string | null>(null);
  protected readonly msgErr = signal(false);
  protected readonly tabs = [
    { id: 'etapas' as const, label: 'Cronograma' }, { id: 'tasas' as const, label: 'Tasas' },
    { id: 'vacantes' as const, label: 'Vacantes' }, { id: 'copiar' as const, label: 'Copiar convocatoria' },
  ];
  protected code = '2027-I';
  protected resolution = '';
  protected reason = '';
  protected cp = { code: '2027-II', name: 'Concurso de Admisión 2027-II', year: 2027, period: 'II', monthsOffset: 6 };

  async ngOnInit() {
    this.calls.set(await this.session.get('/admin/calls'));
    await this.load();
  }

  protected async load() {
    const d = await this.session.get<CallDetail>(`/admin/calls/${this.code}`);
    d.stages.forEach((s) => { s._start = toLima(s.startsAt); s._end = toLima(s.endsAt); });
    d.fees.forEach((f) => { f._amount = f.amount; });
    this.detail.set(d);
  }

  protected async saveStage(s: Stage) {
    await this.act(async () => {
      const r = await this.session.put<{ warnings: string[] }>(`/admin/calls/${this.code}/stages/${s.code}`, { startsAt: fromLima(s._start!), endsAt: fromLima(s._end!) });
      return `Etapa «${s.name}» guardada.${r.warnings.length ? ` Atención: ${r.warnings.join(' ')}` : ''}`;
    });
  }

  protected async saveFee(f: Fee) {
    const amount = Number(f._amount);
    const confirmZero = amount === 0 ? confirm(`¿Seguro que «${f.concept}» debe costar S/ 0.00?`) : false;
    if (amount === 0 && !confirmZero) return;
    await this.act(async () => {
      await this.session.put(`/admin/calls/${this.code}/fees/${f.code}`, { amount, confirmZero });
      return `Tasa actualizada: ${f.concept} = S/ ${amount.toFixed(2)}.`;
    });
  }

  protected async saveVacancy(o: Opt, category: string, value: string) {
    await this.act(async () => {
      await this.session.put(`/admin/calls/${this.code}/vacancies`, {
        optionCode: o.code, category, quantity: Number(value), resolution: this.resolution || undefined, reason: this.reason || undefined,
      });
      return `Vacantes de ${o.name} (${category}) = ${value}.`;
    });
  }

  protected async copy() {
    await this.act(async () => {
      const r = await this.session.postAuth<{ code: string }>(`/admin/calls/${this.code}/copy`, this.cp);
      this.calls.set(await this.session.get('/admin/calls'));
      return `Convocatoria ${r.code} creada en borrador.`;
    }, false);
  }

  private async act(fn: () => Promise<string>, reload = true) {
    try {
      this.msg.set(await fn());
      this.msgErr.set(false);
      if (reload) await this.load();
    } catch (e) {
      this.msg.set(apiErrorMessage(e));
      this.msgErr.set(true);
      if (reload) await this.load();
    }
  }
}
