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
    <!-- Encabezado con el próximo hito: el mismo lenguaje que la portada. -->
    <section class="sc-hero field-accent field-glow" aria-labelledby="sc-title">
      <div class="frame sc-hero__grid">
        <div class="sc-hero__text">
          <p class="sc-kicker" data-icon="cronograma">Fechas del concurso</p>
          <h1 id="sc-title">Cronograma <span>2027-I</span></h1>
          <p class="sc-lead">Las etapas se abren y se cierran solas en hora de Lima. La que está en curso aparece resaltada.</p>
          @if (store.call(); as call) {
            <p class="sc-open"><i aria-hidden="true"></i>{{ openCount() }} {{ openCount() === 1 ? 'etapa abierta ahora' : 'etapas abiertas ahora' }}</p>
          }
        </div>
        @if (store.call(); as call) {
          @if (call.nextMilestone; as m) {
            <aside class="sc-next" aria-labelledby="next-title">
              <p class="sc-next__label">Próximo hito</p>
              <h2 id="next-title" class="sc-next__title">{{ m.name }}</h2>
              <p class="sc-next__when"><svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false"><rect x="3.5" y="5" width="17" height="15.5" rx="2.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M3.5 10h17M8 3v4M16 3v4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>{{ longDate(m.startsAt) }}, desde las {{ time(m.startsAt) }}</p>
              <app-countdown [target]="m.startsAt" [serverNow]="call.now" [label]="m.name" [tiles]="true" />
            </aside>
          }
        }
      </div>
    </section>

    @if (store.call(); as call) {
      <section class="section--tight overview" aria-labelledby="overview-title">
        <div class="frame">
          <h2 id="overview-title" class="sc-h2">El proceso de un vistazo</h2>
          <app-stage-track [stages]="store.keyStages()" />
        </div>
      </section>

      <section class="section--tight field-stone all" aria-labelledby="stages-title">
        <div class="frame">
          <div class="all__head">
            <h2 id="stages-title" class="sc-h2">Todas las etapas</h2>
            <a routerLink="/documentos/cronograma" class="sc-pdf" data-icon="descargar">Cronograma oficial (PDF)</a>
          </div>
          <ol class="stages">
            @for (s of call.stages; track s.code; let i = $index) {
              <li class="stage" [class.is-now]="s.status === 'IN_PROGRESS'" [class.is-past]="s.status === 'FINISHED'" [appReveal]="(i % 4) * 60">
                <div class="stage__date">
                  <span class="stage__day">{{ dateRange(s.startsAt, s.endsAt) }}</span>
                </div>
                <div class="stage__body">
                  <p class="stage__name">{{ s.name }}</p>
                  @if (s.kind === 'EXTEMPORANEOUS') { <p class="stage__note"><svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 11v6M12 7.5v.5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>Con recargo por inscripción extemporánea{{ s.scope === 'CEPRE' ? ' de S/ 50.00' : ' de S/ 65.00' }}.</p> }
                  @if (s.kind === 'EXAM') { <p class="stage__note"><svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 11v6M12 7.5v.5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>Ingreso desde las {{ time(s.startsAt) }} hasta las 8:30 a.m. por las puertas 1 y 2 de la Ciudad Universitaria.</p> }
                  @if (s.kind === 'DELIVERY') { <p class="stage__note"><svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 11v6M12 7.5v.5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>En la Dirección de Admisión, Jr. Arequipa N.° 175, de 4:00 p.m. a 8:00 p.m.</p> }
                </div>
                <div class="stage__tags">
                  @if (kindLabel[s.kind]; as k) { <span class="stage__kind" [attr.data-kind]="s.kind">{{ k }}</span> }
                  <span class="status status--{{ s.status }}">{{ labels[s.status] }}</span>
                </div>
              </li>
            }
          </ol>
        </div>
      </section>
    } @else if (store.unavailable()) {
      <section class="frame section"><p class="alert alert--info">Próximamente: aún no hay una convocatoria publicada.</p></section>
    } @else {
      <section class="frame section"><div class="skel skel--cards" role="status" aria-label="Cargando el cronograma"><span></span><span></span><span></span><span></span></div></section>
    }

    <section class="section--tight">
      <div class="frame">
        <div class="cta">
          <div>
            <h2>¿Ya sabes a qué postulas?</h2>
            <p>Inscríbete en línea y paga con tarjeta o Yape.</p>
          </div>
          <a routerLink="/inscripcion" class="cta__go">Inscribirme <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false"><path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg></a>
        </div>
      </div>
    </section>
  `,
  styles: `
    /* Encabezado guinda con luces y el próximo hito en una tarjeta de vidrio con la cuenta regresiva. */
    .sc-hero { padding-block: clamp(2.5rem, 6vh, 4.5rem); color: #fff; }
    .sc-hero__grid { display: grid; grid-template-columns: minmax(0, 7fr) minmax(0, 5fr); gap: clamp(1.5rem, 4vw, 3.5rem); align-items: center; }
    .sc-hero__text { display: grid; gap: 1rem; }
    .sc-kicker { justify-self: start; display: inline-flex; align-items: center; gap: 0.5rem; margin: 0; padding: 0.35rem 0.85rem; border-radius: 999px; font-size: var(--size-note);
      font-weight: 700; color: var(--gold); background: rgb(0 0 0 / 0.18); border: 1px solid rgb(217 180 74 / 0.45); }
    .sc-hero h1 { margin: 0; font-size: clamp(2.5rem, min(5.5vw, 9vh), 4.75rem); line-height: 1; letter-spacing: -0.04em; color: #fff; }
    .sc-hero h1 span { color: var(--gold); background: linear-gradient(180deg, #f3d98a, #d9b44a 60%, #b8902c); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; }
    .sc-lead { margin: 0; font-size: clamp(1rem, 1.6vw, 1.25rem); line-height: 1.5; max-width: 46ch; color: rgb(255 255 255 / 0.92); }
    .sc-open { justify-self: start; display: inline-flex; align-items: center; gap: 0.5rem; margin: 0; padding: 0.35rem 0.85rem; border-radius: 999px; font-size: var(--size-note);
      font-weight: 600; background: rgb(255 255 255 / 0.1); border: 1px solid rgb(255 255 255 / 0.22); }
    .sc-open i { width: 0.55rem; height: 0.55rem; border-radius: 50%; background: #4ade80; box-shadow: 0 0 0 4px rgb(74 222 128 / 0.25); }
    .sc-next { display: grid; gap: 0.75rem; padding: clamp(1.25rem, 3vw, 1.75rem); border-radius: 22px; background: rgb(255 255 255 / 0.08); border: 1px solid rgb(255 255 255 / 0.22);
      -webkit-backdrop-filter: blur(12px); backdrop-filter: blur(12px); box-shadow: 0 30px 60px -32px rgb(20 6 8 / 0.8), inset 0 1px 0 rgb(255 255 255 / 0.18); }
    .sc-next__label { margin: 0; font-size: var(--size-note); font-weight: 700; color: var(--gold); }
    .sc-next__title { margin: 0; font-size: clamp(1.25rem, 2vw, 1.6rem); line-height: 1.2; letter-spacing: -0.02em; color: #fff; }
    .sc-next__when { display: flex; align-items: center; gap: 0.45rem; margin: 0; font-size: 0.9375rem; color: rgb(255 255 255 / 0.9); }
    .sc-next__when svg { flex: none; color: var(--gold); }
    @supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) { .sc-next { background: rgb(0 0 0 / 0.18); } }

    .sc-h2 { font-size: clamp(1.4rem, 2.2vw, 1.75rem); letter-spacing: -0.02em; margin: 0 0 1.25rem; }

    /* Todas las etapas: tarjetas con la fecha, la descripción y su estado. */
    .all__head { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 0.75rem 1.5rem; margin-bottom: 1.25rem; }
    .all__head .sc-h2 { margin: 0; }
    .sc-pdf { display: inline-flex; align-items: center; gap: 0.5rem; min-height: 2.75rem; padding: 0 1.1rem; border-radius: 12px; font-weight: 700; color: var(--accent);
      text-decoration: none; background: #fff; box-shadow: 0 0 0 1px var(--stone-deep), 0 8px 16px -12px rgb(29 20 21 / 0.4); }
    .stages { list-style: none; margin: 0; padding: 0; display: grid; gap: 0.75rem; }
    .stage { display: grid; grid-template-columns: 10.5rem minmax(0, 1fr) auto; gap: 1.5rem; align-items: center; padding: 1.1rem 1.4rem; border-radius: 18px;
      background: #fff; border-left: 5px solid var(--stone-deep); box-shadow: 0 0 0 1px rgb(29 20 21 / 0.05), 0 12px 26px -22px rgb(29 20 21 / 0.5); }
    .stage__date { display: grid; }
    .stage__day { justify-self: start; padding: 0.4rem 0.75rem; border-radius: 12px; background: var(--stone); font-weight: 800; font-size: 1rem; color: var(--accent);
      font-variant-numeric: tabular-nums; white-space: nowrap; }
    .stage__body { display: grid; gap: 0.3rem; min-width: 0; }
    .stage__name { margin: 0; font-weight: 700; font-size: 1.0625rem; line-height: 1.3; letter-spacing: -0.01em; }
    .stage__note { display: flex; align-items: flex-start; gap: 0.4rem; margin: 0; font-size: 0.9375rem; color: var(--ink-soft); }
    .stage__note svg { flex: none; margin-top: 0.15em; color: var(--accent); }
    .stage__tags { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 0.4rem; }
    .stage__kind { padding: 0.2rem 0.65rem; border-radius: 999px; font-size: 0.8125rem; font-weight: 700; background: var(--stone); color: var(--ink-soft); }
    .stage__kind[data-kind='EXAM'] { background: #fbf1d9; color: #6b4a00; }
    .stage__kind[data-kind='EXTEMPORANEOUS'] { background: #f7e3e3; color: #6d1212; }
    .stage .status { display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.2rem 0.65rem; border-radius: 999px; font-size: 0.8125rem; font-weight: 700;
      background: var(--stone); white-space: nowrap; }
    .stage.is-past { background: rgb(255 255 255 / 0.6); box-shadow: 0 0 0 1px rgb(29 20 21 / 0.05); }
    .stage.is-past .stage__name { color: var(--ink-soft); font-weight: 600; }
    .stage.is-past .stage__day { color: var(--ink-soft); }
    .stage.is-now { color: #fff; border-left-color: var(--gold);
      background: radial-gradient(22rem 10rem at 100% 0%, rgb(217 180 74 / 0.28), transparent 70%), linear-gradient(155deg, #8d242b 0%, var(--accent) 55%, #5e1419 100%);
      box-shadow: 0 22px 40px -24px rgb(94 20 25 / 0.95), inset 0 1px 0 rgb(255 255 255 / 0.16); }
    .stage.is-now .stage__day { background: rgb(255 255 255 / 0.14); color: #f0d27c; }
    .stage.is-now .stage__note { color: rgb(255 255 255 / 0.9); }
    .stage.is-now .stage__note svg { color: var(--gold); }
    .stage.is-now .status { background: rgb(255 255 255 / 0.14); color: #fff; }
    .stage.is-now .status::before { background: #4ade80; }
    .stage.is-now .stage__kind { background: rgb(255 255 255 / 0.14); color: #fff; }

    /* Llamado final */
    .cta { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 1.25rem 2rem; padding: clamp(1.5rem, 3.5vw, 2.25rem); border-radius: 24px; color: #fff;
      background: radial-gradient(24rem 14rem at 100% 0%, rgb(217 180 74 / 0.28), transparent 70%), linear-gradient(155deg, #8d242b 0%, var(--accent) 55%, #571217 100%);
      box-shadow: 0 30px 60px -34px rgb(87 18 23 / 0.95); }
    .cta h2 { margin: 0; font-size: clamp(1.5rem, 2.6vw, 2.25rem); color: #fff; }
    .cta p { margin: 0.35rem 0 0; color: rgb(255 255 255 / 0.9); }
    .cta__go { display: inline-flex; align-items: center; gap: 0.55rem; min-height: 3.25rem; padding: 0 1.5rem; border-radius: 14px; font-weight: 700; font-size: 1.0625rem; text-decoration: none;
      color: var(--ink); background: linear-gradient(180deg, #edd07a, #c9a23a); border: 1px solid #b38f2c; box-shadow: 0 16px 28px -14px rgb(0 0 0 / 0.75), inset 0 1px 0 rgb(255 255 255 / 0.5); }
    @media (hover: hover) { .cta__go:hover { filter: brightness(1.05); } }

    @media (max-width: 900px) {
      .sc-hero__grid { grid-template-columns: 1fr; }
    }
    @media (max-width: 760px) {
      .stage { grid-template-columns: 1fr; gap: 0.6rem; padding: 1rem 1.1rem; }
      .stage__tags { justify-content: flex-start; }
      .cta__go { flex: 1 1 100%; justify-content: center; }
    }
  `,
})
export class SchedulePage {
  protected readonly store = inject(CallStore);
  protected readonly labels = STAGE_STATUS_LABEL;
  protected readonly longDate = longDate;
  protected readonly dateRange = dateRange;
  protected readonly time = time;
  protected readonly loaded = computed(() => this.store.call() !== null);
  protected readonly openCount = computed(() => (this.store.call()?.stages ?? []).filter((s) => s.status === 'IN_PROGRESS').length);
  protected readonly kindLabel: Record<string, string> = { EXAM: 'Examen', EXTEMPORANEOUS: 'Extemporánea', DELIVERY: 'Entrega', PUBLICATION: 'Publicación' };
}
