import { Component, computed, inject, input } from '@angular/core';
import type { InscriptionSummaryDto } from '@sia/contracts';
import { CallStore } from '../../core/call.store';
import { dateTime, longDate } from '../../core/format';

type State = 'done' | 'now' | 'warn' | 'next';
interface Step { key: string; label: string; state: State; detail: string }

const STATE_TEXT: Record<State, string> = { done: 'completado', now: 'en curso', warn: 'requiere tu atención', next: 'pendiente' };

/**
 * Línea del trámite en «Mi inscripción» (skill interface-design): dónde está el postulante y qué sigue,
 * con fechas reales del cronograma. El paso en curso es el foco; los demás quedan en segundo plano.
 */
@Component({
  selector: 'app-inscription-track',
  template: `
    @if (summary().status === 'ANULADA') {
      <p class="track-void" role="status"><strong>Inscripción anulada.</strong> Si crees que es un error, acércate a la Dirección de Admisión con tu DNI.</p>
    } @else {
      <section class="track" aria-labelledby="track-title">
        <header class="track__head">
          <h3 id="track-title">Tu trámite</h3>
          <p>{{ summary().statusLabel }}</p>
        </header>
        <ol class="track__list">
          @for (s of steps(); track s.key; let i = $index) {
            <li class="track__step" [class]="'is-' + s.state" [attr.aria-current]="s.state === 'now' || s.state === 'warn' ? 'step' : null">
              <span class="track__dot" aria-hidden="true">
                @if (s.state === 'done') {
                  <svg viewBox="0 0 16 16" width="14" height="14"><path d="m3.5 8.5 3 3 6-7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                } @else if (s.state === 'warn') { ! } @else { {{ i + 1 }} }
              </span>
              <span class="track__text">
                <span class="track__label">{{ s.label }}<span class="sr-only">: {{ stateText[s.state] }}</span></span>
                <span class="track__detail">{{ s.detail }}</span>
              </span>
            </li>
          }
        </ol>
      </section>
    }
  `,
  styles: `
    .track { display: grid; gap: 1.25rem; padding: 1.5rem; border: 1px solid var(--stone-deep); border-radius: var(--radius-lg); background: var(--ground); }
    .track__head { display: flex; flex-wrap: wrap; align-items: baseline; justify-content: space-between; gap: 0.25rem 1rem; }
    .track__head h3 { font-size: 1.25rem; letter-spacing: -0.02em; }
    .track__head p { margin: 0; color: var(--ink-soft); font-size: var(--size-note); max-width: none; }

    /* Escritorio: pasos en fila unidos por una línea; la línea toma el guinda hasta el último paso completado. */
    .track__list { list-style: none; margin: 0; padding: 0; display: grid; grid-auto-flow: column; grid-auto-columns: minmax(0, 1fr); }
    .track__step { position: relative; display: grid; justify-items: start; gap: 0.75rem; padding-right: 0.75rem; }
    .track__step::before { content: ''; position: absolute; top: 0.9375rem; left: 2.25rem; right: 0.5rem; height: 2px; background: var(--stone-deep); }
    .track__step:last-child::before { display: none; }
    .track__step.is-done::before { background: var(--accent); }

    .track__dot { position: relative; z-index: 1; display: grid; place-items: center; width: 1.875rem; height: 1.875rem; border-radius: 50%;
      font-size: 0.875rem; font-weight: 700; font-variant-numeric: tabular-nums; background: var(--ground); color: var(--ink-soft); box-shadow: inset 0 0 0 2px var(--stone-deep); }
    .is-done .track__dot { background: var(--accent); color: var(--accent-ink); box-shadow: none; }
    .is-now .track__dot { background: var(--gold); color: var(--ink); box-shadow: 0 0 0 4px rgb(217 180 74 / 0.28); }
    .is-warn .track__dot { background: var(--warn); color: #fff; box-shadow: 0 0 0 4px rgb(138 90 0 / 0.18); }

    .track__text { display: grid; gap: 0.2rem; }
    .track__label { font-weight: 600; line-height: 1.25; color: var(--ink-soft); }
    .is-done .track__label { color: var(--ink); }
    .is-now .track__label, .is-warn .track__label { color: var(--ink); font-weight: 700; }
    .track__detail { font-size: 0.875rem; color: var(--ink-soft); font-variant-numeric: tabular-nums; }
    .is-warn .track__detail { color: var(--warn); font-weight: 600; }

    .track-void { margin: 0; padding: 1rem 1.25rem; border-radius: var(--radius); background: #f7e3e3; color: #6d1212; }

    /* Celular: la misma línea en vertical. */
    @media (max-width: 760px) {
      .track__list { grid-auto-flow: row; gap: 0; }
      .track__step { grid-template-columns: auto 1fr; gap: 0 0.9rem; padding: 0 0 1.25rem; }
      .track__step:last-child { padding-bottom: 0; }
      .track__step::before { top: 2.25rem; bottom: 0.25rem; left: 0.875rem; right: auto; width: 2px; height: auto; }
    }
    @media print { .track { border-color: #999; } }
  `,
})
export class InscriptionTrack {
  readonly summary = input.required<InscriptionSummaryDto>();
  private readonly calls = inject(CallStore);
  protected readonly stateText = STATE_TEXT;

  protected readonly steps = computed<Step[]>(() => {
    const s = this.summary();
    const call = this.calls.call();
    const exam = call?.stages.find((st) => st.code === (s.modalityCode === 'EXO' ? 'EXAM_EXO' : 'EXAM_ORD'));
    const now = call ? new Date(call.now) : new Date();
    const examAt = exam ? new Date(exam.startsAt) : null;
    const roomAt = examAt ? new Date(examAt.getTime() - 24 * 3600 * 1000) : null;
    const paid = s.status === 'APTA';
    const inReview = s.status === 'PENDIENTE_VALIDACION';
    const observed = s.status === 'OBSERVADA';

    const steps: Step[] = [{ key: 'reg', label: 'Inscripción registrada', state: 'done', detail: dateTime(s.createdAt) }];
    if (s.modalityCode === 'EXO') {
      steps.push({
        key: 'exp', label: observed || inReview ? 'Revisión del expediente' : 'Expediente revisado',
        state: observed ? 'warn' : inReview ? 'now' : 'done',
        detail: observed ? 'Tiene observaciones: corrígelas abajo' : inReview ? 'Un evaluador lo está revisando' : 'Autorizado',
      });
    }
    const canPay = !inReview && !observed;
    steps.push({
      // El título dice el estado real: «Pago confirmado» solo cuando ya se pagó.
      key: 'pay', label: paid ? 'Pago confirmado' : canPay ? 'Pago pendiente' : 'Pago',
      state: paid ? 'done' : canPay ? 'now' : 'next',
      detail: paid ? 'Inscripción Apta' : canPay ? `Paga ${'S/ ' + s.fee.total} abajo` : 'Después de la revisión',
    });
    steps.push({
      key: 'ficha', label: 'Ficha de inscripción',
      state: s.fichaAvailable ? 'done' : paid ? 'now' : 'next',
      detail: s.fichaAvailable ? 'Lista para descargar' : paid ? 'Se habilita en breve' : 'Al confirmarse el pago',
    });
    if (s.modalityCode !== 'CEPRE' && examAt && roomAt) {
      const roomOpen = now >= roomAt;
      steps.push({
        key: 'aula', label: roomOpen && paid ? 'Aula asignada' : 'Asignación de aula',
        state: roomOpen && paid ? 'done' : 'next',
        detail: roomOpen ? 'Publicada en «Buscar aula»' : `Desde el ${longDate(roomAt.toISOString())}`,
      });
      steps.push({
        key: 'exam', label: 'Examen y resultado',
        state: now >= examAt && paid ? 'now' : 'next',
        detail: longDate(examAt.toISOString()),
      });
    }
    // Sin paso en curso (todo al día), lo que sigue se destaca: siempre hay un foco.
    if (!steps.some((st) => st.state === 'now' || st.state === 'warn')) {
      const next = steps.find((st) => st.state === 'next');
      if (next) next.state = 'now';
    }
    return steps;
  });
}
