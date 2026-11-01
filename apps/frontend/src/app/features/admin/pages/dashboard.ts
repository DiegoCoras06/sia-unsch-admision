import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminSession } from '../../../core/admin-session';
import { ApiService, apiErrorMessage } from '../../../core/api.service';

interface Count { key: string; label: string; count: number; monto?: string }
interface Dashboard {
  inscripciones: { total: number; habilitadas: number; porEstado: Count[]; porModalidad: Count[]; porPrograma: Count[]; porDia: { day: string; count: number }[] } | null;
  pagos: { recaudado: string; ordenesPagadas: number; ordenesPendientes: number; intentosRechazados: number; intentosVencidos: number; pagosDuplicados: number; porMedio: Count[] } | null;
  asistente: { consultas: number; conIa: number; derivaciones: number; errores: number; tokens: number; costoUsd: string } | null;
  casosAbiertos: number | null;
  expedientes: Count[] | null;
  examenes: { key: string; label: string; capacity: number; assigned: number; present: number; absent: number }[] | null;
  resultados: { porCondicion: Count[]; ingresantes: number; porEntregar: number; perdidas: number } | null;
  proximamente: string[];
}

/** Spec 008, Historia 2: indicadores filtrables, por rol, exportables a Excel y PDF (RF-12.01 a RF-12.10). */
@Component({
  selector: 'app-admin-dashboard',
  imports: [FormsModule],
  template: `
    <header class="adm-head">
      <div>
        <h1>Hola, {{ firstName() }}</h1>
        <p>Indicadores del Concurso de Admisión 2027-I en tiempo real.</p>
      </div>
    </header>

    <form class="adm-panel adm-filters" (ngSubmit)="load()">
      <div class="field"><label for="f-mod">Modalidad</label>
        <select id="f-mod" class="select" name="mod" [(ngModel)]="f.modality"><option value="">Todas</option><option value="ORD">Ordinario</option><option value="EXO">Exonerados</option><option value="CEPRE">CEPRE-UNSCH</option></select></div>
      <div class="field"><label for="f-prog">Programa</label>
        <select id="f-prog" class="select" name="prog" [(ngModel)]="f.optionCode"><option value="">Todos</option>@for (o of options(); track o.code) {<option [value]="o.code">{{ o.name }}</option>}</select></div>
      <div class="field"><label for="f-from">Desde</label><input id="f-from" class="input" type="date" name="from" [(ngModel)]="f.from"></div>
      <div class="field"><label for="f-to">Hasta</label><input id="f-to" class="input" type="date" name="to" [(ngModel)]="f.to"></div>
      <button class="btn" type="submit">Aplicar filtros</button>
      @if (session.can('reportes.inscripciones')) {
        <button class="btn btn--quiet" type="button" (click)="export('inscripciones', 'xlsx')">Inscripciones · Excel</button>
        <button class="btn btn--quiet" type="button" (click)="export('inscripciones', 'pdf')">Inscripciones · PDF</button>
        <button class="btn btn--quiet" type="button" (click)="export('expedientes', 'xlsx')">Expedientes · Excel</button>
        <button class="btn btn--quiet" type="button" (click)="export('asistencia', 'xlsx')">Asistencia · Excel</button>
      }
      @if (session.can('reportes.pagos')) {
        <button class="btn btn--quiet" type="button" (click)="export('pagos', 'xlsx')">Pagos · Excel</button>
        <button class="btn btn--quiet" type="button" (click)="export('pagos', 'pdf')">Pagos · PDF</button>
      }
    </form>
    @if (error()) { <p class="adm-msg err" role="alert">{{ error() }}</p> }

    @if (d(); as d) {
      <section class="adm-kpis" aria-label="Resumen">
        @if (d.inscripciones; as i) {
          <div class="adm-kpi"><strong>{{ i.total }}</strong><span>Inscripciones</span></div>
          <div class="adm-kpi"><strong>{{ i.habilitadas }}</strong><span>Aptas para el examen</span></div>
        }
        @if (d.pagos; as p) {
          <div class="adm-kpi"><strong>S/ {{ p.recaudado }}</strong><span>Recaudado en línea</span></div>
          <div class="adm-kpi"><strong>{{ p.ordenesPendientes }}</strong><span>Órdenes pendientes</span></div>
          <div class="adm-kpi"><strong>{{ p.intentosRechazados }}</strong><span>Pagos rechazados</span></div>
        }
        @if (d.casosAbiertos !== null) { <div class="adm-kpi"><strong>{{ d.casosAbiertos }}</strong><span>Casos abiertos</span></div> }
        @if (d.asistente; as a) { <div class="adm-kpi"><strong>{{ a.consultas }}</strong><span>Consultas al asistente (14 días)</span></div> }
      </section>

      <div class="adm-grid">
        @if (d.inscripciones; as i) {
          <section class="adm-panel"><h2>Inscripciones por estado</h2><ul class="adm-bars">@for (c of i.porEstado; track c.key) {<li><span>{{ c.label }}</span><span class="bar"><i [style.width.%]="pct(c.count, i.porEstado)"></i></span><b>{{ c.count }}</b></li>} @empty {<li>Sin datos</li>}</ul></section>
          @if (d.expedientes; as x) {
            <section class="adm-panel"><h2>Expedientes de exonerados</h2><ul class="adm-bars">@for (c of x; track c.key) {<li><span>{{ c.label }}</span><span class="bar"><i [style.width.%]="pct(c.count, x)"></i></span><b>{{ c.count }}</b></li>} @empty {<li>Aún no hay expedientes</li>}</ul></section>
          }
          @if (d.examenes; as xs) {
            <section class="adm-panel"><h2>Exámenes: ocupación y asistencia</h2><ul class="adm-bars">@for (x of xs; track x.key) {
              <li><span>{{ x.label }}<br><small class="adm-muted">{{ x.assigned }} de {{ x.capacity }} asientos · {{ x.present }} presentes · {{ x.absent }} ausentes</small></span><span class="bar"><i [style.width.%]="x.capacity ? 100 * x.assigned / x.capacity : 0"></i></span><b>{{ x.capacity ? (100 * x.assigned / x.capacity).toFixed(0) : 0 }} %</b></li>
            } @empty {<li>Sin exámenes programados</li>}</ul></section>
          }
          @if (d.resultados; as r) {
            <section class="adm-panel"><h2>Resultados publicados</h2><ul class="adm-bars">@for (c of r.porCondicion; track c.key) {<li><span>{{ c.label }}</span><span class="bar"><i [style.width.%]="pct(c.count, r.porCondicion)"></i></span><b>{{ c.count }}</b></li>} @empty {<li>Aún no hay resultados publicados</li>}</ul>
              <p class="adm-muted">{{ r.ingresantes }} ingresantes · {{ r.porEntregar }} por entregar documentos · {{ r.perdidas }} admisiones perdidas</p></section>
          }
          <section class="adm-panel"><h2>Por modalidad</h2><ul class="adm-bars">@for (c of i.porModalidad; track c.key) {<li><span>{{ c.label }}</span><span class="bar"><i [style.width.%]="pct(c.count, i.porModalidad)"></i></span><b>{{ c.count }}</b></li>} @empty {<li>Sin datos</li>}</ul></section>
          <section class="adm-panel"><h2>Programas con más inscritos</h2><ul class="adm-bars">@for (c of i.porPrograma; track c.key) {<li><span>{{ c.label }}</span><span class="bar"><i [style.width.%]="pct(c.count, i.porPrograma)"></i></span><b>{{ c.count }}</b></li>} @empty {<li>Sin datos</li>}</ul></section>
          <section class="adm-panel"><h2>Inscripciones por día</h2><ul class="adm-bars">@for (c of i.porDia.slice(-10); track c.day) {<li><span>{{ c.day }}</span><span class="bar"><i [style.width.%]="pctDay(c.count, i.porDia)"></i></span><b>{{ c.count }}</b></li>} @empty {<li>Sin datos</li>}</ul></section>
        }
        @if (d.pagos; as p) {
          <section class="adm-panel"><h2>Pagos en línea</h2>
            <ul class="adm-bars">
              <li><span>Órdenes pagadas</span><span class="bar"><i style="width:100%"></i></span><b>{{ p.ordenesPagadas }}</b></li>
              <li><span>Intentos vencidos</span><span class="bar"><i [style.width.%]="p.intentosVencidos ? 40 : 0"></i></span><b>{{ p.intentosVencidos }}</b></li>
              <li><span>Pagos duplicados (a devolver)</span><span class="bar"><i [style.width.%]="p.pagosDuplicados ? 20 : 0"></i></span><b>{{ p.pagosDuplicados }}</b></li>
            </ul>
            @if (p.porMedio.length) { <p class="adm-muted">Por medio de pago: {{ methods(p.porMedio) }}</p> }
          </section>
        }
        @if (d.asistente; as a) {
          <section class="adm-panel"><h2>Asistente virtual (14 días)</h2>
            <ul class="adm-bars">
              <li><span>Consultas</span><span class="bar"><i style="width:100%"></i></span><b>{{ a.consultas }}</b></li>
              <li><span>Respondidas con IA</span><span class="bar"><i [style.width.%]="a.consultas ? (a.conIa / a.consultas) * 100 : 0"></i></span><b>{{ a.conIa }}</b></li>
              <li><span>Derivadas a una persona</span><span class="bar"><i [style.width.%]="a.consultas ? (a.derivaciones / a.consultas) * 100 : 0"></i></span><b>{{ a.derivaciones }}</b></li>
            </ul>
            <p class="adm-muted">Tokens: {{ a.tokens }} · costo estimado US$ {{ a.costoUsd }} · errores del proveedor: {{ a.errores }}</p>
          </section>
        }
      </div>
      @if (d.proximamente.length) { <p class="adm-muted">Próximamente en este panel: {{ d.proximamente.join(' · ') }}.</p> }
    }
  `,
})
export class DashboardPage implements OnInit {
  protected readonly session = inject(AdminSession);
  private readonly api = inject(ApiService);
  protected readonly d = signal<Dashboard | null>(null);
  protected readonly options = signal<{ code: string; name: string }[]>([]);
  protected readonly error = signal<string | null>(null);
  protected f = { modality: '', optionCode: '', from: '', to: '' };

  protected firstName = () => (this.session.me()?.fullName ?? '').split(' ')[0];

  ngOnInit() {
    this.api.options('2027-I').subscribe((r) => this.options.set(r.data.map((o) => ({ code: o.internalCode, name: o.displayName }))));
    void this.load();
  }

  protected async load() {
    this.error.set(null);
    try {
      this.d.set(await this.session.get<Dashboard>('/admin/dashboard', this.f));
    } catch (e) {
      this.error.set(apiErrorMessage(e));
    }
  }

  protected async export(kind: 'inscripciones' | 'pagos' | 'expedientes' | 'asistencia', type: 'xlsx' | 'pdf') {
    try {
      await this.session.download(`/admin/reports/${kind}.${type}`, this.f, `${kind}-2027-I.${type}`);
    } catch (e) {
      this.error.set(apiErrorMessage(e, 'No se pudo generar el reporte.'));
    }
  }

  protected pct(n: number, list: { count: number }[]) {
    const max = Math.max(...list.map((x) => x.count), 1);
    return (n / max) * 100;
  }
  protected pctDay = (n: number, list: { count: number }[]) => this.pct(n, list);

  protected methods(list: Count[]) {
    const name: Record<string, string> = { CARD: 'Tarjeta', QR: 'QR', YAPE_CODE: 'Yape', PAGO_PUSH: 'Plin', APPLE_PAY: 'Apple Pay', OTRO: 'Otro' };
    return list.map((m) => `${name[m.key] ?? m.label} ${m.count} (S/ ${m.monto})`).join(' · ');
  }
}
