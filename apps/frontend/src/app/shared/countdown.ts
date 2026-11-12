import { Component, DestroyRef, computed, inject, input, signal } from '@angular/core';

/**
 * Cuenta regresiva al siguiente hito (FR-003). Usa la hora del servidor como referencia,
 * así también respeta el reloj simulado (APP_FIXED_NOW) en las pruebas.
 */
@Component({
  selector: 'app-countdown',
  template: `
    @if (parts(); as p) {
      <p class="cd" [class.cd--tiles]="tiles()" role="timer" [attr.aria-label]="'Faltan ' + p.days + ' días y ' + p.hours + ' horas para ' + label()">
        <span class="cd__unit"><span class="cd__num">{{ p.days }}</span> días</span>
        <span class="cd__unit"><span class="cd__num">{{ p.hours }}</span> horas</span>
        <span class="cd__unit"><span class="cd__num">{{ p.minutes }}</span> min</span>
      </p>
    }
  `,
  styles: `
    .cd { display: flex; gap: clamp(1rem, 3vw, 2.5rem); margin: 0; max-width: none; }
    .cd__unit { display: grid; font-weight: 600; font-size: var(--size-note); }
    .cd__num { font-size: clamp(2.5rem, 5vw, 4.5rem); font-weight: 800; line-height: 1; letter-spacing: -0.04em; color: var(--gold); font-variant-numeric: tabular-nums; }
    /* Variante en casillas de vidrio (portada). */
    .cd--tiles { gap: 0.6rem; }
    .cd--tiles .cd__unit { justify-items: center; min-width: 4.2rem; padding: clamp(0.4rem, 1.2vh, 0.65rem) 0.6rem clamp(0.35rem, 1vh, 0.55rem); border-radius: 14px; font-weight: 500;
      background: linear-gradient(180deg, rgb(255 255 255 / 0.14), rgb(255 255 255 / 0.05)); border: 1px solid rgb(255 255 255 / 0.2); box-shadow: inset 0 1px 0 rgb(255 255 255 / 0.2); }
    .cd--tiles .cd__num { font-size: clamp(1.6rem, min(3.4vw, 4.4vh), 2.4rem); color: #f0d27c; letter-spacing: -0.03em; }
  `,
})
export class Countdown {
  readonly target = input.required<string>();
  readonly serverNow = input.required<string>();
  /** Muestra cada número en su casilla. */
  readonly tiles = input(false);
  readonly label = input('el examen');

  private readonly tick = signal(Date.now());
  /** Solo un reloj realmente distinto (el simulado) cuenta: unos minutos de diferencia son la caché de la respuesta (ADR-020). */
  private readonly offset = computed(() => {
    const diff = new Date(this.serverNow()).getTime() - this.loadedAt;
    return Math.abs(diff) < 15 * 60_000 ? 0 : diff;
  });
  private readonly loadedAt = Date.now();

  protected readonly parts = computed(() => {
    const ms = new Date(this.target()).getTime() - (this.tick() + this.offset());
    if (ms <= 0) return null;
    const minutes = Math.floor(ms / 60_000);
    return { days: Math.floor(minutes / 1440), hours: Math.floor((minutes % 1440) / 60), minutes: minutes % 60 };
  });

  constructor() {
    const timer = setInterval(() => this.tick.set(Date.now()), 15_000);
    inject(DestroyRef).onDestroy(() => clearInterval(timer));
  }
}
