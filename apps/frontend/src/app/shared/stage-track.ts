import { Component, computed, input } from '@angular/core';
import type { StageDto } from '@sia/contracts';
import { STAGE_STATUS_LABEL, dateRange } from '../core/format';

/**
 * Cronograma como línea de tiempo: de un vistazo, qué pasó, qué está en curso y qué sigue.
 * Mismo lenguaje que la línea del trámite (`app-inscription-track`). Horizontal en escritorio, vertical en el celular.
 */
@Component({
  selector: 'app-stage-track',
  template: `
    <ol class="st" [style.--st-cols]="steps().length">
      @for (s of steps(); track s.code) {
        <li class="st__step" [class.is-past]="s.status === 'FINISHED'" [class.is-now]="s.status === 'IN_PROGRESS'" [attr.aria-current]="s.code === today() ? 'step' : null">
          @if (s.code === today()) { <span class="st__today">Hoy</span> }
          <span class="st__dot" aria-hidden="true">
            @if (s.status === 'FINISHED') { <svg viewBox="0 0 16 16" width="12" height="12"><path d="M3 8.5l3.2 3.2L13 5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg> }
          </span>
          <span class="st__text">
            <span class="st__date">{{ range(s.startsAt, s.endsAt) }}</span>
            <span class="st__name">{{ s.name }}</span>
            <span class="sr-only">{{ labels[s.status] }}</span>
          </span>
        </li>
      }
    </ol>
  `,
  styles: `
    .st { list-style: none; margin: 0; padding: 1.75rem 0 0; display: grid; grid-template-columns: repeat(var(--st-cols), minmax(0, 1fr)); gap: 0 0.75rem; }
    .st__step { position: relative; display: grid; align-content: start; gap: 0.75rem; }
    /* La línea une cada punto con el siguiente. Guinda lo ya ocurrido, piedra lo que falta. */
    .st__step::before { content: ''; position: absolute; top: 0.8125rem; left: 1.875rem; right: -0.75rem; height: 2px; background: var(--stone-deep); }
    .st__step:last-child::before { display: none; }
    .st__step.is-past::before { background: var(--accent); }
    .st__dot { position: relative; z-index: 1; width: 1.75rem; height: 1.75rem; display: grid; place-items: center; border-radius: 50%; background: var(--ground); border: 2px solid var(--field-line); }
    .is-past .st__dot { background: var(--accent); border-color: var(--accent); color: var(--accent-ink); }
    .is-now .st__dot { background: var(--gold); border-color: var(--gold); box-shadow: 0 0 0 4px rgb(217 180 74 / 0.28); }
    .st__today { position: absolute; top: -1.75rem; left: 0; padding: 0.05rem 0.5rem; border-radius: var(--radius); background: var(--accent); color: var(--accent-ink); font-size: 0.8125rem; font-weight: 700; }
    .st__text { display: grid; gap: 0.2rem; padding-right: 0.5rem; }
    .st__date { font-size: var(--size-note); font-weight: 700; font-variant-numeric: tabular-nums; }
    .st__name { font-size: 0.9375rem; font-weight: 600; line-height: 1.3; color: var(--ink); }
    .is-past .st__date, .is-past .st__name { color: var(--ink-soft); font-weight: 500; }
    .is-now .st__name { font-weight: 800; }

    /* Celular y tabletas: la misma línea en vertical. */
    @media (max-width: 900px) {
      .st { grid-template-columns: minmax(0, 1fr); padding-top: 0; }
      .st__step { grid-template-columns: auto minmax(0, 1fr); gap: 0 0.9rem; padding-bottom: 1.25rem; }
      .st__step:last-child { padding-bottom: 0; }
      .st__step::before { top: 1.875rem; bottom: 0; left: 0.8125rem; right: auto; width: 2px; height: auto; }
      .st__today { position: static; grid-column: 2; grid-row: 1; justify-self: start; margin-bottom: 0.25rem; }
      .st__dot { grid-column: 1; grid-row: 1 / span 2; }
      .st__text { grid-column: 2; }
    }
    @media print { .st__today { background: none; color: inherit; border: 1px solid #000; } }
  `,
})
export class StageTrack {
  readonly stages = input.required<StageDto[]>();
  protected readonly labels = STAGE_STATUS_LABEL;
  protected readonly range = dateRange;

  protected readonly steps = computed(() => [...this.stages()].sort((a, b) => a.startsAt.localeCompare(b.startsAt) || a.endsAt.localeCompare(b.endsAt)));

  /** Dónde va «Hoy»: la última etapa en curso o, entre dos etapas, la última que terminó. */
  protected readonly today = computed(() => {
    const latest = [...this.steps()].reverse();
    return (latest.find((s) => s.status === 'IN_PROGRESS') ?? latest.find((s) => s.status === 'FINISHED'))?.code ?? null;
  });
}
