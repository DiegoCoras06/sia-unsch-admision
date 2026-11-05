import { Component, DestroyRef, ElementRef, computed, inject, input, signal, type OnInit } from '@angular/core';

const HEIGHT = 220;
const PAD = { top: 18, right: 44, bottom: 26, left: 32 };
const DAY_MS = 86_400_000;

const shortDay = (ms: number) => new Date(ms).toLocaleDateString('es-PE', { timeZone: 'UTC', day: 'numeric', month: 'short' });

/** Tope y divisiones enteras del eje: nunca «1.5 inscripciones». */
function ticksFor(max: number): number[] {
  const step = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000].find((s) => max / s <= 4) ?? Math.ceil(max / 4);
  const top = Math.max(Math.ceil(max / step), 1) * step;
  return Array.from({ length: top / step + 1 }, (_, i) => i * step);
}

/**
 * Inscripciones por día: línea con área, una sola serie y un solo eje.
 * Los días sin inscripciones cuentan como 0 para que la línea no invente una tendencia entre dos fechas lejanas.
 * Se lee con puntero o con las flechas del teclado, y hay vista de tabla.
 */
@Component({
  selector: 'app-daily-chart',
  template: `
    @if (points().length < 2) {
      <p class="dc__void">{{ points().length ? 'Hay datos de un solo día: ' + points()[0]!.count + ' inscripciones el ' + points()[0]!.label + '.' : 'Aún no hay inscripciones en este periodo.' }}</p>
    } @else {
      <div class="dc" (pointerleave)="active.set(null)">
        <svg [attr.viewBox]="'0 0 ' + width() + ' ' + height" [attr.height]="height" width="100%" role="img" tabindex="0" [attr.aria-label]="summary()"
          (pointermove)="hover($event)" (keydown)="key($event)" (blur)="active.set(null)">
          @for (t of ticks(); track t) {
            <line class="dc__grid" [attr.x1]="left" [attr.x2]="width() - right" [attr.y1]="y(t)" [attr.y2]="y(t)" />
            <text class="dc__axis" [attr.x]="left - 8" [attr.y]="y(t) + 4" text-anchor="end">{{ t }}</text>
          }
          @for (l of xLabels(); track l.x) {
            <text class="dc__axis" [attr.x]="l.x" [attr.y]="height - 7" [attr.text-anchor]="l.anchor">{{ l.text }}</text>
          }
          <path class="dc__area" [attr.d]="area()" />
          <path class="dc__line" [attr.d]="line()" />
          <circle class="dc__mark" [attr.cx]="end().x" [attr.cy]="end().y" r="4" />
          <text class="dc__end" [attr.x]="end().x + 10" [attr.y]="end().y + 4">{{ end().count }}</text>
          @if (focus(); as f) {
            <line class="dc__cross" [attr.x1]="f.x" [attr.x2]="f.x" [attr.y1]="top" [attr.y2]="height - bottom" />
            <circle class="dc__mark" [attr.cx]="f.x" [attr.cy]="f.y" r="5" />
          }
        </svg>
        @if (focus(); as f) {
          <p class="dc__tip" role="status" [style.left.px]="f.tipX" [style.top.px]="f.y"><strong>{{ f.count }}</strong> {{ f.count === 1 ? 'inscripción' : 'inscripciones' }}<span>{{ f.label }}</span></p>
        }
      </div>
      <details class="dc__table">
        <summary>Ver como tabla</summary>
        <div class="adm-table-wrap"><table class="adm-table">
          <thead><tr><th>Día</th><th class="num">Inscripciones</th></tr></thead>
          <tbody>@for (p of points(); track p.ms) { <tr><td>{{ p.label }}</td><td class="num">{{ p.count }}</td></tr> }</tbody>
        </table></div>
      </details>
    }
  `,
  styles: `
    :host { display: grid; gap: 0.5rem; min-width: 0; }
    .dc { position: relative; touch-action: pan-y; }
    svg { display: block; border-radius: var(--radius); }
    .dc__grid { stroke: var(--stone-deep); stroke-width: 1; }
    .dc__axis { fill: var(--ink-soft); font-size: 12px; font-variant-numeric: tabular-nums; }
    .dc__area { fill: var(--accent); opacity: 0.1; }
    .dc__line { fill: none; stroke: var(--accent); stroke-width: 2; stroke-linejoin: round; stroke-linecap: round; }
    .dc__mark { fill: var(--accent); stroke: var(--ground); stroke-width: 2; }
    .dc__end { fill: var(--ink); font-size: 13px; font-weight: 700; font-variant-numeric: tabular-nums; }
    .dc__cross { stroke: var(--ink-soft); stroke-width: 1; }
    .dc__tip { position: absolute; z-index: 2; margin: 0; padding: 0.4rem 0.6rem; transform: translateY(-120%); max-width: none; border-radius: var(--radius); background: var(--ink); color: #fff;
      font-size: 0.8125rem; white-space: nowrap; pointer-events: none; font-variant-numeric: tabular-nums; }
    .dc__tip span { display: block; opacity: 0.8; }
    .dc__void { margin: 0; padding: 1.25rem 0; color: var(--ink-soft); }
    .dc__table summary { min-height: 2.75rem; display: inline-flex; align-items: center; color: var(--accent); font-size: var(--size-note); font-weight: 600; cursor: pointer; }
  `,
})
export class DailyChart implements OnInit {
  readonly data = input.required<{ day: string; count: number }[]>();

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly destroy = inject(DestroyRef);
  protected readonly width = signal(640);
  protected readonly active = signal<number | null>(null);
  protected readonly height = HEIGHT;
  protected readonly top = PAD.top;
  protected readonly left = PAD.left;
  protected readonly right = PAD.right;
  protected readonly bottom = PAD.bottom;

  /** Serie continua de días, del primero al último con datos. */
  protected readonly points = computed(() => {
    const rows = [...this.data()].sort((a, b) => a.day.localeCompare(b.day));
    if (!rows.length) return [];
    const counts = new Map(rows.map((r) => [Date.parse(`${r.day}T00:00:00Z`), r.count]));
    const first = Date.parse(`${rows[0]!.day}T00:00:00Z`);
    const last = Date.parse(`${rows.at(-1)!.day}T00:00:00Z`);
    const out: { ms: number; count: number; label: string }[] = [];
    for (let ms = first; ms <= last; ms += DAY_MS) out.push({ ms, count: counts.get(ms) ?? 0, label: shortDay(ms) });
    return out;
  });

  protected readonly ticks = computed(() => ticksFor(Math.max(...this.points().map((p) => p.count), 1)));
  private readonly top_ = computed(() => this.ticks().at(-1)!);

  private x(i: number): number {
    const span = this.width() - PAD.left - PAD.right;
    return PAD.left + (span * i) / Math.max(this.points().length - 1, 1);
  }
  protected y(value: number): number {
    return PAD.top + (HEIGHT - PAD.top - PAD.bottom) * (1 - value / this.top_());
  }

  protected readonly line = computed(() => this.points().map((p, i) => `${i ? 'L' : 'M'}${this.x(i).toFixed(1)} ${this.y(p.count).toFixed(1)}`).join(' '));
  protected readonly area = computed(() => {
    const base = this.y(0).toFixed(1);
    return `${this.line()} L${this.x(this.points().length - 1).toFixed(1)} ${base} L${this.x(0).toFixed(1)} ${base} Z`;
  });
  protected readonly end = computed(() => {
    const i = this.points().length - 1;
    const p = this.points()[i]!;
    return { x: this.x(i), y: this.y(p.count), count: p.count };
  });
  protected readonly xLabels = computed(() => {
    const p = this.points();
    const last = p.length - 1;
    const picks: [number, string][] = [[0, 'start'], [last, 'end']];
    if (last >= 6 && this.width() > 420) picks.splice(1, 0, [Math.round(last / 2), 'middle']);
    return picks.map(([i, anchor]) => ({ x: this.x(i), text: p[i]!.label, anchor }));
  });
  protected readonly focus = computed(() => {
    const i = this.active();
    const p = i === null ? null : this.points()[i];
    if (i === null || !p) return null;
    const x = this.x(i);
    return { x, y: this.y(p.count), count: p.count, label: p.label, tipX: x > this.width() - 150 ? x - 130 : x + 10 };
  });
  protected readonly summary = computed(() => {
    const p = this.points();
    const total = p.reduce((s, r) => s + r.count, 0);
    const best = p.reduce((a, b) => (b.count > a.count ? b : a), p[0]!);
    return `Inscripciones por día del ${p[0]?.label} al ${p.at(-1)?.label}: ${total} en total y un máximo de ${best?.count} el ${best?.label} (usa las flechas para recorrer los días)`;
  });

  ngOnInit() {
    const observer = new ResizeObserver(([entry]) => {
      if (entry && entry.contentRect.width > 0) this.width.set(Math.round(entry.contentRect.width));
    });
    observer.observe(this.host.nativeElement);
    this.destroy.onDestroy(() => observer.disconnect());
  }

  protected hover(e: PointerEvent) {
    const box = (e.currentTarget as SVGElement).getBoundingClientRect();
    const span = this.width() - PAD.left - PAD.right;
    const i = Math.round(((e.clientX - box.left - PAD.left) / span) * (this.points().length - 1));
    this.active.set(Math.min(Math.max(i, 0), this.points().length - 1));
  }

  protected key(e: KeyboardEvent) {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    e.preventDefault();
    const last = this.points().length - 1;
    const now = this.active() ?? last;
    this.active.set(Math.min(Math.max(now + (e.key === 'ArrowRight' ? 1 : -1), 0), last));
  }
}
