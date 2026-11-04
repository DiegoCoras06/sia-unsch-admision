import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AdminSession } from '../../../core/admin-session';
import { ApiService, apiErrorMessage } from '../../../core/api.service';

interface Count { key: string; label: string; count: number; monto?: string }
type ReportKind = 'inscripciones' | 'pagos' | 'expedientes' | 'asistencia';
const REPORTS: { kind: ReportKind; type: 'xlsx' | 'pdf'; label: string; permission: string }[] = [
  { kind: 'inscripciones', type: 'xlsx', label: 'Inscripciones', permission: 'reportes.inscripciones' },
  { kind: 'inscripciones', type: 'pdf', label: 'Inscripciones', permission: 'reportes.inscripciones' },
  { kind: 'expedientes', type: 'xlsx', label: 'Expedientes', permission: 'reportes.inscripciones' },
  { kind: 'asistencia', type: 'xlsx', label: 'Asistencia', permission: 'reportes.inscripciones' },
  { kind: 'pagos', type: 'xlsx', label: 'Pagos', permission: 'reportes.pagos' },
  { kind: 'pagos', type: 'pdf', label: 'Pagos', permission: 'reportes.pagos' },
];

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
  imports: [FormsModule, RouterLink],
  template: `
    <header class="adm-head">
      <div>
        <h1>Hola, {{ firstName() }}</h1>
        <p>Concurso de Admisión 2027-I: lo que espera tu atención y cómo avanza el proceso.</p>
      </div>
      @if (reports().length) {
        <details class="adm-export" #exp (keydown.escape)="exp.open = false" (focusout)="!exp.contains($any($event).relatedTarget) && (exp.open = false)">
          <summary class="btn btn--quiet">Descargar reporte</summary>
          <div class="adm-export__menu">
            <ul role="list">
              @for (r of reports(); track r.kind + r.type) {
                <li><button type="button" (click)="exp.open = false; export(r.kind, r.type)">{{ r.label }}<span>{{ r.type === 'xlsx' ? 'Excel' : 'PDF' }}</span></button></li>
              }
            </ul>
            <p class="adm-muted">Con los filtros aplicados.</p>
          </div>
        </details>
      }
    </header>

    @if (d() && todo().length) {
      <section class="adm-todo" aria-labelledby="adm-todo-t">
        <h2 id="adm-todo-t">Pendientes de hoy</h2>
        <ul role="list">
          @for (t of todo(); track t.link) {
            <li [class.is-clear]="!t.count">
              <a [routerLink]="t.link">
                <strong>{{ t.count || 'Al día' }}</strong>
                <span>{{ t.label }}</span>
              </a>
            </li>
          }
        </ul>
      </section>
    }

    <form class="adm-panel adm-filters" (ngSubmit)="load()" aria-label="Filtros de los indicadores">
      <div class="field"><label for="f-mod">Modalidad</label>
        <select id="f-mod" class="select" name="mod" [(ngModel)]="f.modality"><option value="">Todas</option><option value="ORD">Ordinario</option><option value="EXO">Exonerados</option><option value="CEPRE">CEPRE-UNSCH</option></select></div>
      <div class="field"><label for="f-prog">Programa</label>
        <select id="f-prog" class="select" name="prog" [(ngModel)]="f.optionCode"><option value="">Todos</option>@for (o of options(); track o.code) {<option [value]="o.code">{{ o.name }}</option>}</select></div>
      <div class="field"><label for="f-from">Desde</label><input id="f-from" class="input" type="date" name="from" [(ngModel)]="f.from"></div>
      <div class="field"><label for="f-to">Hasta</label><input id="f-to" class="input" type="date" name="to" [(ngModel)]="f.to"></div>
      <button class="btn" type="submit" [disabled]="loading()">{{ loading() ? 'Cargando…' : 'Aplicar filtros' }}</button>
    </form>
    @if (noRecovery()) { <p class="adm-msg warn">Aún no tienes códigos de respaldo: si pierdes el celular, no podrás entrar. <a routerLink="/admin/seguridad">Generarlos ahora</a></p> }
    @if (error()) { <p class="adm-msg err" role="alert">{{ error() }} <button type="button" class="adm-link" (click)="load()">Reintentar</button></p> }
    @if (!d() && loading()) { <p class="adm-muted" role="status">Cargando indicadores…</p> }

    @if (d(); as d) {
      <h2 class="adm-sub">Resumen del proceso</h2>
      <section class="adm-kpis" aria-label="Resumen del proceso">
        @if (d.inscripciones; as i) {
          <div class="adm-kpi"><strong>{{ i.total }}</strong><span>Inscripciones</span></div>
          <div class="adm-kpi"><strong>{{ i.habilitadas }}</strong><span>Aptas para el examen</span></div>
        }
        @if (d.pagos; as p) {
          <div class="adm-kpi"><strong>S/ {{ p.recaudado }}</strong><span>Recaudado en línea</span></div>
          <div class="adm-kpi"><strong>{{ p.ordenesPendientes }}</strong><span>Órdenes pendientes</span></div>
        }
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
              <li><span>{{ x.label }}<br><small class="adm-muted">{{ x.assigned }} de {{ x.capacity }} asientos, {{ x.present }} presentes, {{ x.absent }} ausentes</small></span><span class="bar"><i [style.width.%]="x.capacity ? 100 * x.assigned / x.capacity : 0"></i></span><b>{{ x.capacity ? (100 * x.assigned / x.capacity).toFixed(0) : 0 }} %</b></li>
            } @empty {<li>Sin exámenes programados</li>}</ul></section>
          }
          @if (d.resultados; as r) {
            <section class="adm-panel"><h2>Resultados publicados</h2><ul class="adm-bars">@for (c of r.porCondicion; track c.key) {<li><span>{{ c.label }}</span><span class="bar"><i [style.width.%]="pct(c.count, r.porCondicion)"></i></span><b>{{ c.count }}</b></li>} @empty {<li>Aún no hay resultados publicados</li>}</ul>
              <p class="adm-muted">{{ r.ingresantes }} ingresantes, {{ r.porEntregar }} por entregar documentos, {{ r.perdidas }} admisiones perdidas</p></section>
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
            <p class="adm-muted">Tokens: {{ a.tokens }}, costo estimado US$ {{ a.costoUsd }}, errores del proveedor: {{ a.errores }}</p>
          </section>
        }
      </div>
      @if (d.proximamente.length) { <p class="adm-muted">Próximamente en este panel: {{ d.proximamente.join(', ') }}.</p> }
    }
  `,
})
export class DashboardPage implements OnInit {
  protected readonly session = inject(AdminSession);
  private readonly api = inject(ApiService);
  protected readonly d = signal<Dashboard | null>(null);
  protected readonly options = signal<{ code: string; name: string }[]>([]);
  protected readonly error = signal<string | null>(null);
  protected readonly loading = signal(false);
  protected readonly noRecovery = signal(false);
  protected f = { modality: '', optionCode: '', from: '', to: '' };
  protected readonly reports = computed(() => REPORTS.filter((r) => this.session.can(r.permission)));

  /** Lo que espera una acción del personal, según su rol; lo que tiene trabajo va primero. */
  protected readonly todo = computed(() => {
    const d = this.d();
    if (!d) return [];
    const can = (p: string) => this.session.can(p);
    const items: { label: string; count: number; link: string }[] = [];
    if (d.expedientes && can('expedientes.evaluar'))
      items.push({ label: 'Expedientes por revisar', count: d.expedientes.find((x) => x.key === 'EN_REVISION')?.count ?? 0, link: '/admin/expedientes' });
    if (d.pagos && can('pagos.ver')) items.push({ label: 'Pagos rechazados por revisar', count: d.pagos.intentosRechazados, link: '/admin/pagos' });
    if (d.pagos && can('pagos.conciliar')) items.push({ label: 'Pagos duplicados por devolver', count: d.pagos.pagosDuplicados, link: '/admin/tesoreria' });
    if (d.casosAbiertos !== null && can('casos.gestionar')) items.push({ label: 'Casos de atención abiertos', count: d.casosAbiertos, link: '/admin/casos' });
    if (d.resultados && can('ingreso.registrar'))
      items.push({ label: 'Ingresantes por entregar documentos', count: d.resultados.porEntregar, link: '/admin/ingresantes' });
    return items.sort((a, b) => Number(!a.count) - Number(!b.count));
  });

  protected firstName = () => (this.session.me()?.fullName ?? '').split(' ')[0];

  ngOnInit() {
    this.api.options('2027-I').subscribe((r) => this.options.set(r.data.map((o) => ({ code: o.internalCode, name: o.displayName }))));
    void this.load();
    this.session.recoveryStatus().then((r) => this.noRecovery.set(r.remaining === 0)).catch(() => undefined);
  }

  protected async load() {
    this.error.set(null);
    this.loading.set(true);
    try {
      this.d.set(await this.session.get<Dashboard>('/admin/dashboard', this.f));
    } catch (e) {
      this.error.set(apiErrorMessage(e));
    } finally {
      this.loading.set(false);
    }
  }

  protected async export(kind: ReportKind, type: 'xlsx' | 'pdf') {
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
    return list.map((m) => `${name[m.key] ?? m.label} ${m.count} (S/ ${m.monto})`).join(', ');
  }
}
