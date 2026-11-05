import { Component, input } from '@angular/core';

const TZ = 'America/Lima';
const longDate = (iso: string) => new Date(iso).toLocaleDateString('es-PE', { timeZone: TZ, weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
const hour = (iso: string) => new Date(iso).toLocaleTimeString('es-PE', { timeZone: TZ, hour: 'numeric', minute: '2-digit' });

export interface ExamTicketData {
  applicantCode: string;
  examName: string;
  entryOpensAt: string | null;
  entryClosesAt: string | null;
  room: { venue: string; address: string; building: string; floor: number; code: string; gate: string; accessible: boolean; seat: number };
}

/** Ficha de examen como boleto: lo que se muestra en la puerta el día del examen. Solo datos, sin consultar al API: se ve también sin internet. */
@Component({
  selector: 'app-exam-ticket',
  template: `
    @if (data(); as t) {
      <section class="ticket" [attr.aria-label]="'Ficha de examen, aula ' + t.room.code + ', asiento ' + t.room.seat">
        <header class="ticket__head">
          <div>
            <p class="ticket__kicker">Ficha de examen</p>
            <h3 class="ticket__exam">{{ t.examName }}</h3>
            @if (t.entryOpensAt) { <p class="ticket__date">{{ long(t.entryOpensAt) }}</p> }
          </div>
          <p class="ticket__code"><span>Código</span>{{ t.applicantCode }}</p>
        </header>
        <div class="ticket__main">
          <div class="ticket__room"><span>Aula</span><strong>{{ t.room.code }}</strong></div>
          <div class="ticket__seat"><span>Asiento</span><strong>{{ t.room.seat }}</strong></div>
        </div>
        <dl class="ticket__route">
          <div><dt>Puerta</dt><dd>{{ t.room.gate }}</dd></div>
          <div><dt>Pabellón</dt><dd>{{ t.room.building }}</dd></div>
          <div><dt>Piso</dt><dd>{{ t.room.floor }}</dd></div>
        </dl>
        @if (t.entryOpensAt && t.entryClosesAt) {
          <p class="ticket__entry"><strong>Ingreso de {{ hr(t.entryOpensAt) }} a {{ hr(t.entryClosesAt) }}</strong>, después no hay ingreso</p>
        }
        <p class="ticket__venue">{{ t.room.venue }}, {{ t.room.address }}@if (t.room.accessible) { <span class="ticket__acc">Aula accesible</span> }</p>
      </section>
    }
  `,
  styles: `
    :host { display: block; }
    .ticket { --notch: 0.75rem; position: relative; display: grid; border-radius: var(--radius-lg); overflow: hidden;
      background: var(--accent); color: var(--accent-ink); }
    .ticket__head { display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; padding: 1.25rem 1.5rem 1rem; }
    .ticket__kicker { margin: 0; font-size: var(--size-note); font-weight: 600; color: var(--gold); }
    .ticket__exam { margin: 0.15rem 0 0; font-size: clamp(1.125rem, 2.2vw, 1.375rem); letter-spacing: -0.01em; }
    .ticket__date { margin: 0.15rem 0 0; opacity: 0.9; }
    .ticket__code { margin: 0; display: grid; justify-items: end; font-size: clamp(1.25rem, 2.6vw, 1.625rem); font-weight: 800; color: var(--gold); font-variant-numeric: tabular-nums; letter-spacing: 0.04em; }
    .ticket__code span { font-size: 0.8125rem; font-weight: 600; letter-spacing: 0; color: var(--accent-ink); opacity: 0.85; }
    .ticket__main { position: relative; display: grid; grid-template-columns: 2fr 1fr; gap: 1px; background: rgb(255 255 255 / 0.18);
      border-top: 2px dashed rgb(255 255 255 / 0.35); }
    .ticket__main::before, .ticket__main::after { content: ''; position: absolute; top: calc(-1 * var(--notch) - 1px); width: calc(2 * var(--notch)); height: calc(2 * var(--notch));
      border-radius: 50%; background: var(--ground); }
    .ticket__main::before { left: calc(-1 * var(--notch)); }
    .ticket__main::after { right: calc(-1 * var(--notch)); }
    .ticket__main > div { display: grid; gap: 0.15rem; padding: 1.25rem 1.5rem; background: var(--accent); }
    .ticket__main span, .ticket__route dt { font-size: 0.875rem; font-weight: 600; color: var(--gold); }
    .ticket__main strong { font-size: clamp(3rem, 8vw, 4.5rem); font-weight: 800; line-height: 1; letter-spacing: -0.03em; font-variant-numeric: tabular-nums; }
    .ticket__seat { background: var(--accent-press) !important; }
    .ticket__route { margin: 0; display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 2fr) minmax(0, 1fr); background: var(--accent-press); }
    .ticket__route div { min-width: 0; padding: 0.9rem 1.5rem; display: grid; gap: 0.1rem; border-right: 1px solid rgb(255 255 255 / 0.15); }
    .ticket__route dd { overflow-wrap: anywhere; }
    .ticket__route div:last-child { border-right: 0; }
    .ticket__route dd { margin: 0; font-size: clamp(1.25rem, 2.6vw, 1.625rem); font-weight: 700; font-variant-numeric: tabular-nums; }
    .ticket__entry { margin: 0; padding: 0.9rem 1.5rem; background: var(--gold); color: var(--ink); max-width: none; }
    .ticket__venue { margin: 0; padding: 0.9rem 1.5rem 1.1rem; font-size: var(--size-note); opacity: 0.92; max-width: none; }
    .ticket__acc { margin-left: 0.5rem; padding: 0.1rem 0.5rem; border-radius: var(--radius); background: rgb(255 255 255 / 0.16); font-weight: 600; white-space: nowrap; }
    @media print { .ticket { border: 2px solid var(--accent); } .ticket__main::before, .ticket__main::after { display: none; } }
    @media (max-width: 640px) {
      .ticket__head { padding: 1.1rem 1.1rem 0.9rem; }
      .ticket__main > div, .ticket__route div, .ticket__entry, .ticket__venue { padding-inline: 1.1rem; }
    }
  `,
})
export class ExamTicket {
  readonly data = input.required<ExamTicketData>();
  protected readonly long = longDate;
  protected readonly hr = hour;
}
