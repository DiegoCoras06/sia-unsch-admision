import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AdminSession } from '../../../core/admin-session';
import { ApiService, apiErrorMessage } from '../../../core/api.service';
import { DailyChart } from '../daily-chart';

interface Count {
  key: string;
  label: string;
  count: number;
  monto?: string;
}
type ReportKind = 'inscripciones' | 'pagos' | 'expedientes' | 'asistencia';
const REPORTS: { kind: ReportKind; type: 'xlsx' | 'pdf'; label: string; permission: string }[] = [
  {
    kind: 'inscripciones',
    type: 'xlsx',
    label: 'Inscripciones',
    permission: 'reportes.inscripciones',
  },
  {
    kind: 'inscripciones',
    type: 'pdf',
    label: 'Inscripciones',
    permission: 'reportes.inscripciones',
  },
  { kind: 'expedientes', type: 'xlsx', label: 'Expedientes', permission: 'reportes.inscripciones' },
  { kind: 'asistencia', type: 'xlsx', label: 'Asistencia', permission: 'reportes.inscripciones' },
  { kind: 'pagos', type: 'xlsx', label: 'Pagos', permission: 'reportes.pagos' },
  { kind: 'pagos', type: 'pdf', label: 'Pagos', permission: 'reportes.pagos' },
];

interface Dashboard {
  inscripciones: {
    total: number;
    habilitadas: number;
    porEstado: Count[];
    porModalidad: Count[];
    porPrograma: Count[];
    porDia: { day: string; count: number }[];
  } | null;
  pagos: {
    recaudado: string;
    ordenesPagadas: number;
    ordenesPendientes: number;
    intentosRechazados: number;
    intentosVencidos: number;
    pagosDuplicados: number;
    porMedio: Count[];
  } | null;
  asistente: {
    consultas: number;
    conIa: number;
    derivaciones: number;
    errores: number;
    tokens: number;
    costoUsd: string;
  } | null;
  casosAbiertos: number | null;
  expedientes: Count[] | null;
  examenes:
    | {
        key: string;
        label: string;
        capacity: number;
        assigned: number;
        present: number;
        absent: number;
      }[]
    | null;
  resultados: {
    porCondicion: Count[];
    ingresantes: number;
    porEntregar: number;
    perdidas: number;
  } | null;
  proximamente: string[];
}

/** AC07 (EQ-07): resumen de la encuesta SUS (sin datos personales). */
interface Usability {
  responses: number;
  target: number;
  mean: number | null;
  median: number | null;
  meetsTarget: boolean;
  grade: string | null;
  adjective: string | null;
  medianSeconds: number | null;
  distribution: { label: string; count: number }[];
  statements: { text: string; positive: boolean; average: number | null }[];
  devices: { device: string; count: number }[];
  comments: { text: string; score: number; at: string }[];
}

/** Spec 008, Historia 2: indicadores filtrables, por rol, exportables a Excel y PDF (RF-12.01 a RF-12.10). */
@Component({
  selector: 'app-admin-dashboard',
  imports: [FormsModule, RouterLink, DailyChart],
  host: { class: 'adm-dashboard' },
  styleUrl: './dashboard.scss',
  template: `
    <header class="adm-head adm-dashboard__hero" data-cycle="2027-I">
      <div class="adm-dashboard__welcome">
        <h1>Hola, {{ firstName() }}</h1>
        <p>Revisa lo prioritario y acompaña el avance del Concurso de Admisión 2027-I.</p>
      </div>
      @if (reports().length) {
        <details
          class="adm-export"
          #exp
          (keydown.escape)="exp.open = false"
          (focusout)="!exp.contains($any($event).relatedTarget) && (exp.open = false)"
        >
          <summary class="btn btn--quiet">Descargar reporte</summary>
          <div class="adm-export__menu">
            <ul role="list">
              @for (r of reports(); track r.kind + r.type) {
                <li>
                  <button type="button" (click)="exp.open = false; export(r.kind, r.type)">
                    {{ r.label }}<span>{{ r.type === 'xlsx' ? 'Excel' : 'PDF' }}</span>
                  </button>
                </li>
              }
            </ul>
            <p class="adm-muted">Con los filtros aplicados.</p>
          </div>
        </details>
      }
    </header>

    @if (d() && todo().length) {
      <section class="adm-todo" aria-labelledby="adm-todo-t">
        <header class="adm-todo__head">
          <div>
            <h2 id="adm-todo-t">Prioridades de hoy</h2>
            <p>Empieza por las gestiones que requieren una decisión.</p>
          </div>
          <span class="adm-todo__summary" [class.is-clear]="!pendingAreas()">
            {{ pendingAreas() ? pendingAreas() + ' por atender' : 'Todo al día' }}
          </span>
        </header>
        <ul role="list">
          @for (t of todo(); track t.link) {
            <li [class.is-clear]="!t.count" [class.is-priority]="$first && t.count">
              <a [routerLink]="t.link">
                <strong>{{ t.count || '✓' }}</strong>
                <span class="adm-todo__label">{{ t.label }}</span>
                <span class="adm-todo__action">{{
                  t.count ? 'Revisar ahora' : 'Sin pendientes'
                }}</span>
              </a>
            </li>
          }
        </ul>
      </section>
    }

    <form
      class="adm-panel adm-filters adm-dashboard__filters"
      (ngSubmit)="load()"
      aria-label="Filtros de los indicadores"
    >
      <div class="adm-filters__intro">
        <strong>Vista de datos</strong>
        <span>Acota los indicadores del panel</span>
      </div>
      <div class="field">
        <label for="f-mod">Modalidad</label>
        <select id="f-mod" class="select" name="mod" [(ngModel)]="f.modality">
          <option value="">Todas</option>
          <option value="ORD">Ordinario</option>
          <option value="EXO">Exonerados</option>
          <option value="CEPRE">CEPRE-UNSCH</option>
        </select>
      </div>
      <div class="field">
        <label for="f-prog">Programa</label>
        <select id="f-prog" class="select" name="prog" [(ngModel)]="f.optionCode">
          <option value="">Todos</option>
          @for (o of options(); track o.code) {
            <option [value]="o.code">{{ o.name }}</option>
          }
        </select>
      </div>
      <div class="field">
        <label for="f-from">Desde</label
        ><input id="f-from" class="input" type="date" name="from" [(ngModel)]="f.from" />
      </div>
      <div class="field">
        <label for="f-to">Hasta</label
        ><input id="f-to" class="input" type="date" name="to" [(ngModel)]="f.to" />
      </div>
      <button class="btn" type="submit" [disabled]="loading()" [attr.aria-busy]="loading()">
        {{ loading() ? 'Cargando…' : 'Aplicar filtros' }}
      </button>
    </form>
    @if (noRecovery()) {
      <p class="adm-msg warn adm-dashboard__warning">
        Aún no tienes códigos de respaldo: si pierdes el celular, no podrás entrar.
        <a routerLink="/admin/seguridad">Generarlos ahora</a>
      </p>
    }
    @if (error()) {
      <p class="adm-msg err" role="alert">
        {{ error() }} <button type="button" class="adm-link" (click)="load()">Reintentar</button>
      </p>
    }
    @if (!d() && loading()) {
      <p class="adm-muted" role="status">Cargando indicadores…</p>
    }

    @if (d(); as d) {
      <section class="adm-summary" aria-labelledby="adm-summary-title">
        <header class="adm-summary__head">
          <div>
            <h2 id="adm-summary-title">Resumen del proceso</h2>
            <p>Indicadores consolidados de la convocatoria actual.</p>
          </div>
          @if (d.inscripciones; as i) {
            <span class="adm-summary__status">{{ i.habilitadas }} postulantes aptos</span>
          }
        </header>
        <div class="adm-kpis">
          @if (d.inscripciones; as i) {
            <div class="adm-kpi adm-kpi--primary">
              <strong>{{ i.total }}</strong><span>Inscripciones</span>
            </div>
            <div class="adm-kpi">
              <strong>{{ i.habilitadas }}</strong><span>Aptas para el examen</span>
            </div>
          }
          @if (d.pagos; as p) {
            <div class="adm-kpi adm-kpi--revenue">
              <strong>S/ {{ p.recaudado }}</strong
              ><span>Recaudado en línea</span>
            </div>
            <div class="adm-kpi" [class.has-alert]="p.ordenesPendientes">
              <strong>{{ p.ordenesPendientes }}</strong><span>Órdenes pendientes</span>
            </div>
          }
          @if (d.asistente; as a) {
            <div class="adm-kpi">
              <strong>{{ a.consultas }}</strong><span>Consultas al asistente (14 días)</span>
            </div>
          }
        </div>
      </section>

      <div class="adm-grid adm-dashboard__grid">
        @if (d.inscripciones; as i) {
          <section class="adm-panel adm-dashboard__chart">
            <h2>Inscripciones por día</h2>
            <app-daily-chart [data]="i.porDia" />
          </section>
          <section class="adm-panel">
            <h2>Inscripciones por estado</h2>
            <ul class="adm-bars">
              @for (c of i.porEstado; track c.key) {
                <li>
                  <span>{{ c.label }}</span><span class="bar"
                    ><i [style.width.%]="pct(c.count, i.porEstado)"></i></span
                  ><b>{{ c.count }}</b>
                </li>
              } @empty {
                <li>Sin datos</li>
              }
            </ul>
          </section>
          @if (d.expedientes; as x) {
            <section class="adm-panel">
              <h2>Expedientes de exonerados</h2>
              <ul class="adm-bars">
                @for (c of x; track c.key) {
                  <li>
                    <span>{{ c.label }}</span><span class="bar"
                      ><i [style.width.%]="pct(c.count, x)"></i></span
                    ><b>{{ c.count }}</b>
                  </li>
                } @empty {
                  <li>Aún no hay expedientes</li>
                }
              </ul>
            </section>
          }
          @if (d.examenes; as xs) {
            <section class="adm-panel">
              <h2>Exámenes: ocupación y asistencia</h2>
              <ul class="adm-bars">
                @for (x of xs; track x.key) {
                  <li>
                    <span
                      >{{ x.label }}<br /><small class="adm-muted"
                        >{{ x.assigned }} de {{ x.capacity }} asientos, {{ x.present }} presentes,
                        {{ x.absent }} ausentes</small
                      ></span
                    ><span class="bar"
                      ><i
                        [style.width.%]="x.capacity ? (100 * x.assigned) / x.capacity : 0"
                      ></i></span
                    ><b>{{ x.capacity ? ((100 * x.assigned) / x.capacity).toFixed(0) : 0 }} %</b>
                  </li>
                } @empty {
                  <li>Sin exámenes programados</li>
                }
              </ul>
            </section>
          }
          @if (d.resultados; as r) {
            <section class="adm-panel">
              <h2>Resultados publicados</h2>
              <ul class="adm-bars">
                @for (c of r.porCondicion; track c.key) {
                  <li>
                    <span>{{ c.label }}</span><span class="bar"
                      ><i [style.width.%]="pct(c.count, r.porCondicion)"></i></span
                    ><b>{{ c.count }}</b>
                  </li>
                } @empty {
                  <li>Aún no hay resultados publicados</li>
                }
              </ul>
              <p class="adm-muted">
                {{ r.ingresantes }} ingresantes, {{ r.porEntregar }} por entregar documentos,
                {{ r.perdidas }} admisiones perdidas
              </p>
            </section>
          }
          <section class="adm-panel">
            <h2>Por modalidad</h2>
            <ul class="adm-bars">
              @for (c of i.porModalidad; track c.key) {
                <li>
                  <span>{{ c.label }}</span><span class="bar"
                    ><i [style.width.%]="pct(c.count, i.porModalidad)"></i></span
                  ><b>{{ c.count }}</b>
                </li>
              } @empty {
                <li>Sin datos</li>
              }
            </ul>
          </section>
          <section class="adm-panel">
            <h2>Programas con más inscritos</h2>
            <ul class="adm-bars">
              @for (c of i.porPrograma; track c.key) {
                <li>
                  <span>{{ c.label }}</span><span class="bar"
                    ><i [style.width.%]="pct(c.count, i.porPrograma)"></i></span
                  ><b>{{ c.count }}</b>
                </li>
              } @empty {
                <li>Sin datos</li>
              }
            </ul>
          </section>
        }
        @if (d.pagos; as p) {
          <section class="adm-panel">
            <h2>Pagos en línea</h2>
            <ul class="adm-bars">
              <li>
                <span>Órdenes pagadas</span
                ><span class="bar"><i [style.width.%]="payPct(p.ordenesPagadas, p)"></i></span
                ><b>{{ p.ordenesPagadas }}</b>
              </li>
              <li>
                <span>Intentos vencidos</span
                ><span class="bar"><i [style.width.%]="payPct(p.intentosVencidos, p)"></i></span
                ><b>{{ p.intentosVencidos }}</b>
              </li>
              <li>
                <span>Pagos duplicados (a devolver)</span
                ><span class="bar"><i [style.width.%]="payPct(p.pagosDuplicados, p)"></i></span
                ><b>{{ p.pagosDuplicados }}</b>
              </li>
            </ul>
            @if (p.porMedio.length) {
              <p class="adm-muted">Por medio de pago: {{ methods(p.porMedio) }}</p>
            }
          </section>
        }
        @if (d.asistente; as a) {
          <section class="adm-panel">
            <h2>Asistente virtual (14 días)</h2>
            <ul class="adm-bars">
              <li>
                <span>Consultas</span><span class="bar"><i style="width:100%"></i></span
                ><b>{{ a.consultas }}</b>
              </li>
              <li>
                <span>Respondidas con IA</span
                ><span class="bar"
                  ><i [style.width.%]="a.consultas ? (a.conIa / a.consultas) * 100 : 0"></i></span
                ><b>{{ a.conIa }}</b>
              </li>
              <li>
                <span>Derivadas a una persona</span
                ><span class="bar"
                  ><i
                    [style.width.%]="a.consultas ? (a.derivaciones / a.consultas) * 100 : 0"
                  ></i></span
                ><b>{{ a.derivaciones }}</b>
              </li>
            </ul>
            <p class="adm-muted">
              Tokens: {{ a.tokens }}, costo estimado US$ {{ a.costoUsd }}, errores del proveedor:
              {{ a.errores }}
            </p>
          </section>
        }
        @if (u(); as u) {
          <section class="adm-panel adm-panel--wide sus-panel" aria-labelledby="sus-h">
            <div class="sus-panel__head">
              <h2 id="sus-h">Usabilidad: encuesta SUS</h2>
              <p class="adm-muted">
                Al terminar la inscripción, el postulante responde 10 afirmaciones (System Usability
                Scale). Meta de EQ-07: promedio de {{ u.target }} o más.
              </p>
            </div>
            @if (u.responses) {
              <div class="sus-panel__score">
                <div class="sus-panel__big" [class.is-ok]="u.meetsTarget">
                  <strong>{{ u.mean }}</strong><span>puntaje SUS promedio</span>
                  <span class="adm-tag" [class.ok]="u.meetsTarget" [class.warn]="!u.meetsTarget"
                    >{{ u.grade }}, {{ u.adjective
                    }}{{ u.meetsTarget ? ': cumple la meta' : ': bajo la meta' }}</span
                  >
                </div>
                <ul class="sus-panel__facts">
                  <li>
                    <b>{{ u.responses }}</b><span>respuestas</span>
                  </li>
                  <li>
                    <b>{{ u.median }}</b><span>mediana</span>
                  </li>
                  @if (u.medianSeconds !== null) {
                    <li>
                      <b>{{ minutes(u.medianSeconds) }}</b><span
                        >tiempo mediano de inscripción</span
                      >
                    </li>
                  }
                  @for (dv of u.devices; track dv.device) {
                    <li>
                      <b>{{ dv.count }}</b><span>desde {{ dv.device }}</span>
                    </li>
                  }
                </ul>
              </div>
              <div class="adm-grid">
                <div>
                  <h3 class="adm-sub">Distribución de puntajes</h3>
                  <ul class="adm-bars">
                    @for (b of u.distribution; track b.label) {
                      <li>
                        <span>{{ b.label }}</span><span class="bar"
                          ><i [style.width.%]="pct(b.count, u.distribution)"></i></span
                        ><b>{{ b.count }}</b>
                      </li>
                    }
                  </ul>
                </div>
                <div>
                  <h3 class="adm-sub">Promedio por afirmación (1 a 5)</h3>
                  <ol class="sus-panel__statements">
                    @for (st of u.statements; track $index) {
                      <li
                        [class.is-weak]="
                          st.average !== null && (st.positive ? st.average < 3.5 : st.average > 2.5)
                        "
                      >
                        <span>{{ st.text }}</span>
                        <b>{{ st.average }}</b>
                        <small class="adm-muted">{{
                          st.positive ? 'mejor si es alto' : 'mejor si es bajo'
                        }}</small>
                      </li>
                    }
                  </ol>
                </div>
              </div>
              @if (u.comments.length) {
                <h3 class="adm-sub">Comentarios recientes</h3>
                <ul class="sus-panel__comments">
                  @for (c of u.comments; track c.at) {
                    <li>
                      <q>{{ c.text }}</q> <span class="adm-muted">puntaje {{ c.score }}</span>
                    </li>
                  }
                </ul>
              }
            } @else {
              <p class="adm-muted">
                Aún no hay respuestas. La encuesta aparece al terminar cada inscripción.
              </p>
            }
          </section>
        }
      </div>
      @if (d.proximamente.length) {
        <p class="adm-muted">Próximamente en este panel: {{ d.proximamente.join(', ') }}.</p>
      }
    }
  `,
})
export class DashboardPage implements OnInit {
  protected readonly session = inject(AdminSession);
  private readonly api = inject(ApiService);
  protected readonly d = signal<Dashboard | null>(null);
  protected readonly u = signal<Usability | null>(null);
  protected readonly options = signal<{ code: string; name: string }[]>([]);
  protected readonly error = signal<string | null>(null);
  protected readonly loading = signal(false);
  protected readonly noRecovery = signal(false);
  protected f = { modality: '', optionCode: '', from: '', to: '' };
  protected readonly reports = computed(() =>
    REPORTS.filter((r) => this.session.can(r.permission)),
  );

  /** Lo que espera una acción del personal, según su rol; lo que tiene trabajo va primero. */
  protected readonly todo = computed(() => {
    const d = this.d();
    if (!d) return [];
    const can = (p: string) => this.session.can(p);
    const items: { label: string; count: number; link: string }[] = [];
    if (d.expedientes && can('expedientes.evaluar'))
      items.push({
        label: 'Expedientes por revisar',
        count: d.expedientes.find((x) => x.key === 'EN_REVISION')?.count ?? 0,
        link: '/admin/expedientes',
      });
    if (d.pagos && can('pagos.ver'))
      items.push({
        label: 'Pagos rechazados por revisar',
        count: d.pagos.intentosRechazados,
        link: '/admin/pagos',
      });
    if (d.pagos && can('pagos.conciliar'))
      items.push({
        label: 'Pagos duplicados por devolver',
        count: d.pagos.pagosDuplicados,
        link: '/admin/tesoreria',
      });
    if (d.casosAbiertos !== null && can('casos.gestionar'))
      items.push({
        label: 'Casos de atención abiertos',
        count: d.casosAbiertos,
        link: '/admin/casos',
      });
    if (d.resultados && can('ingreso.registrar'))
      items.push({
        label: 'Ingresantes por entregar documentos',
        count: d.resultados.porEntregar,
        link: '/admin/ingresantes',
      });
    return items.sort((a, b) => Number(!a.count) - Number(!b.count));
  });
  protected readonly pendingAreas = computed(
    () => this.todo().filter((item) => item.count > 0).length,
  );

  protected firstName = () => (this.session.me()?.fullName ?? '').split(' ')[0];

  ngOnInit() {
    this.api
      .options('2027-I')
      .subscribe((r) =>
        this.options.set(r.data.map((o) => ({ code: o.internalCode, name: o.displayName }))),
      );
    // Los indicadores tienen prioridad. La comprobación de recuperación se difiere para no competir por RDS.
    void this.load().then(() => this.loadRecoveryStatus());
  }

  protected async load() {
    this.error.set(null);
    this.loading.set(true);
    try {
      const [dashboard, usability] = await Promise.all([
        this.session.getCached<Dashboard>('/admin/dashboard', this.f, 15_000),
        this.session.can('reportes.inscripciones')
          ? this.session.getCached<Usability>('/admin/usability', {}, 30_000).catch(() => null)
          : Promise.resolve(null),
      ]);
      this.d.set(dashboard);
      this.u.set(usability);
    } catch (e) {
      this.error.set(apiErrorMessage(e));
    } finally {
      this.loading.set(false);
    }
  }

  private async loadRecoveryStatus() {
    const r = await this.session.recoveryStatus().catch(() => null);
    if (r) this.noRecovery.set(r.remaining === 0);
  }

  protected async export(kind: ReportKind, type: 'xlsx' | 'pdf') {
    try {
      await this.session.download(
        `/admin/reports/${kind}.${type}`,
        this.f,
        `${kind}-2027-I.${type}`,
      );
    } catch (e) {
      this.error.set(apiErrorMessage(e, 'No se pudo generar el reporte.'));
    }
  }

  protected pct(n: number, list: { count: number }[]) {
    const max = Math.max(...list.map((x) => x.count), 1);
    return (n / max) * 100;
  }
  protected payPct(n: number, p: NonNullable<Dashboard['pagos']>) {
    return (n / Math.max(p.ordenesPagadas, p.intentosVencidos, p.pagosDuplicados, 1)) * 100;
  }

  protected minutes(seconds: number) {
    const m = Math.floor(seconds / 60);
    return m ? `${m} min ${seconds % 60} s` : `${seconds} s`;
  }

  protected methods(list: Count[]) {
    const name: Record<string, string> = {
      CARD: 'Tarjeta',
      QR: 'QR',
      YAPE_CODE: 'Yape',
      PAGO_PUSH: 'Plin',
      APPLE_PAY: 'Apple Pay',
      OTRO: 'Otro',
    };
    return list.map((m) => `${name[m.key] ?? m.label} ${m.count} (S/ ${m.monto})`).join(', ');
  }
}
