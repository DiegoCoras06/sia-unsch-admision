import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CallStore } from '../../../core/call.store';
import { STAGE_STATUS_LABEL, dateRange, longDate, time } from '../../../core/format';
import { Countdown } from '../../../shared/countdown';
import { RevealDirective } from '../../../shared/reveal.directive';
import { StageTrack } from '../../../shared/stage-track';

/** Spec 001, Historia 1 - FR-002, FR-003, MEJ-09. */
@Component({
  selector: 'app-schedule',
  imports: [RouterLink, Countdown, RevealDirective, StageTrack],
  template: `
    <header class="frame page-head">
      <p class="page-kicker" data-icon="cronograma">Fechas del concurso</p>
      <h1>Cronograma 2027-I</h1>
      <p class="lead">Las etapas se abren y cierran solas en hora de Lima. La que está en curso aparece resaltada.</p>
    </header>

    @if (store.call(); as call) {
      @if (call.nextMilestone; as m) {
        <section class="field-accent next" aria-labelledby="next-title">
          <div class="frame next__grid">
            <div>
              <h2 id="next-title" class="next__title">{{ m.name }}</h2>
              <p class="lead">{{ longDate(m.startsAt) }}, desde las {{ time(m.startsAt) }}</p>
            </div>
            <app-countdown [target]="m.startsAt" [serverNow]="call.now" [label]="m.name" />
          </div>
        </section>
      }

      <section class="section--tight overview" aria-labelledby="overview-title">
        <div class="frame">
          <h2 id="overview-title" class="overview__title">El proceso de un vistazo</h2>
          <app-stage-track [stages]="store.keyStages()" />
        </div>
      </section>

      <section class="section" aria-labelledby="stages-title">
        <div class="frame">
          <h2 id="stages-title" class="overview__title">Todas las etapas</h2>
          <ol class="stages">
            @for (s of call.stages; track s.code; let i = $index) {
              <li class="stage" [class.is-now]="s.status === 'IN_PROGRESS'" [class.is-past]="s.status === 'FINISHED'" [appReveal]="(i % 4) * 60">
                <p class="stage__date">{{ dateRange(s.startsAt, s.endsAt) }}</p>
                <div class="stage__body">
                  <p class="stage__name">{{ s.name }}</p>
                  @if (s.kind === 'EXTEMPORANEOUS') { <p>Con recargo por inscripción extemporánea{{ s.scope === 'CEPRE' ? ' de S/ 50.00' : ' de S/ 65.00' }}.</p> }
                  @if (s.kind === 'EXAM') { <p>Ingreso desde las {{ time(s.startsAt) }} hasta las 8:30 a.m. por las puertas 1 y 2 de la Ciudad Universitaria.</p> }
                  @if (s.kind === 'DELIVERY') { <p>En la Dirección de Admisión, Jr. Arequipa N.° 175, de 4:00 p.m. a 8:00 p.m.</p> }
                </div>
                <p class="status status--{{ s.status }}">{{ labels[s.status] }}</p>
              </li>
            }
          </ol>
          <p class="pdf"><a routerLink="/documentos/cronograma" class="link-arrow">Ver el cronograma oficial (PDF)</a></p>
        </div>
      </section>
    } @else if (store.unavailable()) {
      <section class="frame section"><p class="alert alert--info">Próximamente: aún no hay una convocatoria publicada.</p></section>
    } @else {
      <section class="frame section"><div class="skel skel--cards" role="status" aria-label="Cargando el cronograma"><span></span><span></span><span></span><span></span></div></section>
    }

    <section class="section--tight field-stone">
      <div class="frame cta">
        <h2>¿Ya sabes a qué postulas?</h2>
        <a routerLink="/inscripcion" class="btn">Inscribirme</a>
      </div>
    </section>
  `,
  styles: `
    .next { padding-block: clamp(2.5rem, 5vw, 4rem); }
    .overview__title { font-size: 1.5rem; letter-spacing: -0.02em; margin-bottom: 1.25rem; }
    .next__grid { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: end; gap: 2rem; }
    .next__title { font-size: clamp(1.75rem, 3vw, 2.75rem); margin-bottom: 0.75rem; }
    .stages { list-style: none; margin: 0; padding: 0; display: grid; gap: 0.35rem; }
    .stage { display: grid; grid-template-columns: 12rem minmax(0, 1fr) 9rem; gap: 2rem; padding: 1.5rem 1.75rem; background: var(--stone); align-items: baseline; }
    .stage.is-now { background: var(--accent); color: var(--accent-ink); }
    .stage.is-now .status { color: var(--gold); }
    .stage.is-past { color: var(--ink-soft); background: #f8f6f3; }
    .stage__date { font-weight: 800; font-size: 1.25rem; font-variant-numeric: tabular-nums; }
    .stage__body { display: grid; gap: 0.4rem; }
    .stage__name { font-weight: 700; font-size: 1.25rem; line-height: 1.3; letter-spacing: -0.01em; }
    .pdf { margin-top: 2.5rem; }
    .cta { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 1.5rem; }
    @media (max-width: 760px) { .stage { grid-template-columns: 1fr; gap: 0.5rem; } }
  `,
})
export class SchedulePage {
  protected readonly store = inject(CallStore);
  protected readonly labels = STAGE_STATUS_LABEL;
  protected readonly longDate = longDate;
  protected readonly dateRange = dateRange;
  protected readonly time = time;
  protected readonly loaded = computed(() => this.store.call() !== null);
}
