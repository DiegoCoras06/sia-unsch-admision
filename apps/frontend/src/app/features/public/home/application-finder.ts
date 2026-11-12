import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { FeeQuoteDto, OptionDetailDto, OptionSummaryDto, QuotaCategoryDto } from '@sia/contracts';
import { ApiService, apiErrorMessage, type SubmodalityDto } from '../../../core/api.service';
import { soles } from '../../../core/format';

const EXAM_LABEL: Record<string, string> = {
  ORD: 'Rindes el examen ordinario el domingo 22 de noviembre.',
  EXO: 'Rindes el examen de exonerados el domingo 15 de noviembre.',
  CEPRE: 'Te inscribes como adjudicado CEPRE el 11 y 12 de noviembre.',
};
const NEEDS_SCHOOL = new Set(['ORD', 'EXO-PSP', 'EXO-COAR']);

/**
 * "Tu postulación en tres respuestas" - la parte interactiva de la portada.
 * Con datos reales de la API: vacantes de la carrera en tu modalidad y el monto exacto que pagas hoy.
 */
@Component({
  selector: 'app-application-finder',
  imports: [RouterLink],
  template: `
    <div class="finder">
      <form class="finder__form" (submit)="$event.preventDefault()">
        <div class="field q">
          <label for="f-option"><span class="q__n" aria-hidden="true">1</span>¿A qué carrera postulas?</label>
          <select id="f-option" class="select" (change)="optionCode.set(sel($event))">
            @for (o of options(); track o.internalCode) {
              <option [value]="o.internalCode" [selected]="o.internalCode === optionCode()">{{ o.displayName }}</option>
            }
          </select>
        </div>
        <div class="field q">
          <label for="f-mod"><span class="q__n" aria-hidden="true">2</span>¿Por qué modalidad?</label>
          <select id="f-mod" class="select" (change)="submodality.set(sel($event))">
            @for (s of submodalities(); track s.code) {
              <option [value]="s.code" [selected]="s.code === submodality()">{{ s.name }}</option>
            }
          </select>
        </div>
        @if (needsSchool()) {
          <fieldset class="q school">
            <legend><span class="q__n" aria-hidden="true">3</span>¿Dónde terminaste la secundaria?</legend>
            <div class="seg">
              <label class="seg__opt"><input type="radio" name="school" value="ESTATAL" [checked]="school() === 'ESTATAL'" (change)="school.set('ESTATAL')"><span>Colegio estatal</span></label>
              <label class="seg__opt"><input type="radio" name="school" value="PARTICULAR" [checked]="school() === 'PARTICULAR'" (change)="school.set('PARTICULAR')"><span>Colegio particular</span></label>
            </div>
          </fieldset>
        }
        <p class="finder__note">Datos del prospecto oficial de la convocatoria. El monto final se confirma al inscribirte.</p>
      </form>

      <div class="finder__result" aria-live="polite">
        @if (error()) {
          <p class="alert alert--error">{{ error() }}</p>
        } @else if (detail(); as d) {
          <p class="res__kicker">Tu postulación</p>
          <p class="res__program">{{ d.displayName }}</p>
          <p class="res__mode">Por {{ subName() }}</p>
          <div class="res__stats">
            <div class="res__stat">
              <span class="res__label">Vacantes</span>
              <span class="res__num">{{ vacancies() }}</span>
              <span class="res__sub">{{ vacancies() === 0 ? 'Esta carrera no ofrece vacantes en esa modalidad' : (vacancies() === 1 ? 'vacante en tu modalidad' : 'vacantes en tu modalidad') }}</span>
            </div>
            @if (quote(); as q) {
              <div class="res__stat res__stat--money">
                <span class="res__label">Pagas hoy</span>
                <span class="res__num">{{ money(q.total) }}</span>
                <span class="res__sub">@if (q.lines.length > 1) { Incluye recargo extemporáneo } @else { Derecho de inscripción }</span>
              </div>
            }
          </div>
          <p class="res__exam"><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false"><rect x="3.5" y="5" width="17" height="15.5" rx="2.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M3.5 10h17M8 3v4M16 3v4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>{{ examLine() }}</p>
          <div class="res__actions">
            <a routerLink="/inscripcion" class="res__go">Inscribirme <span aria-hidden="true">→</span></a>
            <a [routerLink]="['/programas', d.internalCode]" class="res__ghost">Ver la carrera</a>
          </div>
        }
      </div>
    </div>
  `,
  styles: `
    .finder { display: grid; grid-template-columns: minmax(0, 5fr) minmax(0, 7fr); gap: clamp(1.25rem, 3vw, 2.5rem); align-items: stretch; }

    /* Preguntas en una tarjeta clara: cada una numerada, campos en relieve y foco dorado. */
    .finder__form { display: grid; align-content: start; gap: 1.5rem; padding: clamp(1.25rem, 3vw, 2rem); border-radius: 22px;
      background: linear-gradient(180deg, #fff 0%, #fbf7f3 100%);
      box-shadow: 0 0 0 1px var(--stone-deep), 0 24px 48px -30px rgb(29 20 21 / 0.45), inset 0 1px 0 #fff; }
    .q label, .q legend { display: flex; align-items: center; gap: 0.6rem; font-weight: 700; }
    .q__n { display: grid; place-items: center; width: 1.75rem; height: 1.75rem; flex: none; border-radius: 50%; font-size: 0.875rem; font-weight: 800;
      background: var(--accent); color: #fff; box-shadow: 0 0 0 3px rgb(217 180 74 / 0.4); }
    .q .select { min-height: 3.25rem; background-color: #fbf7f3; border-color: var(--stone-deep); border-radius: 12px;
      box-shadow: inset 2px 2px 6px rgb(29 20 21 / 0.1), inset -2px -2px 5px rgb(255 255 255 / 0.9); }
    .q .select:hover { border-color: var(--ink-soft); }
    .q .select:focus { background-color: #fff; border-color: var(--gold); box-shadow: 0 0 0 4px rgb(217 180 74 / 0.35); }
    .school { border: 0; padding: 0; margin: 0; display: grid; gap: 0.6rem; min-width: 0; }
    .school legend { padding: 0; margin-bottom: 0.6rem; }
    /* Dos opciones como selector segmentado: se toca toda la tarjeta, no solo el círculo. */
    .seg { display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; padding: 0.35rem; border-radius: 14px; background: #f1ebe5;
      box-shadow: inset 2px 2px 6px rgb(29 20 21 / 0.1); }
    .seg__opt { position: relative; display: block; cursor: pointer; }
    .seg__opt input { position: absolute; opacity: 0; inset: 0; margin: 0; cursor: pointer; }
    .seg__opt span { display: grid; place-items: center; min-height: 2.9rem; padding: 0.4rem 0.6rem; border-radius: 10px; text-align: center;
      font-weight: 600; color: var(--ink-soft); transition: background-color var(--fast) var(--ease), color var(--fast) var(--ease), box-shadow var(--fast) var(--ease); }
    .seg__opt input:checked + span { background: #fff; color: var(--accent); font-weight: 700; box-shadow: 0 6px 14px -8px rgb(29 20 21 / 0.45), 0 0 0 1px var(--stone-deep); }
    .seg__opt input:focus-visible + span { outline: 3px solid var(--gold); outline-offset: 2px; }
    .finder__note { margin: 0; padding-top: 1rem; border-top: 1px dashed var(--stone-deep); font-size: var(--size-note); color: var(--ink-soft); }

    /* Resultado: tarjeta guinda con luces; vacantes y monto como dos indicadores de vidrio. */
    .finder__result { position: relative; overflow: hidden; display: grid; align-content: start; gap: 0.5rem; padding: clamp(1.5rem, 3.5vw, 2.5rem); border-radius: 24px; color: #fff;
      background: radial-gradient(30rem 20rem at 100% 0%, rgb(217 180 74 / 0.26), transparent 70%), radial-gradient(26rem 18rem at 0% 100%, rgb(255 255 255 / 0.1), transparent 70%),
        linear-gradient(155deg, #8d242b 0%, var(--accent) 50%, #571217 100%);
      box-shadow: 0 30px 60px -32px rgb(87 18 23 / 0.95), inset 0 1px 0 rgb(255 255 255 / 0.16); }
    .res__kicker { margin: 0; font-size: var(--size-note); font-weight: 700; color: var(--gold); }
    .res__program { margin: 0; font-size: clamp(1.5rem, 2.6vw, 2.1rem); font-weight: 800; line-height: 1.1; letter-spacing: -0.025em; text-wrap: balance; }
    .res__mode { margin: 0; opacity: 0.88; }
    .res__mode::first-letter { text-transform: uppercase; }
    .res__stats { display: grid; grid-template-columns: minmax(0, 2fr) minmax(0, 3fr); gap: 0.75rem; margin-top: 1rem; }
    .res__stat { display: grid; align-content: start; gap: 0.2rem; padding: 1rem 1.15rem; border-radius: 18px;
      background: rgb(255 255 255 / 0.08); border: 1px solid rgb(255 255 255 / 0.2); -webkit-backdrop-filter: blur(10px); backdrop-filter: blur(10px);
      box-shadow: inset 0 1px 0 rgb(255 255 255 / 0.16); }
    .res__label { font-size: var(--size-note); font-weight: 700; opacity: 0.9; }
    .res__num { font-size: clamp(2.4rem, 5vw, 3.75rem); font-weight: 800; line-height: 1; letter-spacing: -0.045em; color: #f0d27c; font-variant-numeric: tabular-nums; white-space: nowrap; }
    .res__sub { font-size: var(--size-note); opacity: 0.85; }
    .res__stat--money { background: linear-gradient(180deg, rgb(217 180 74 / 0.18), rgb(217 180 74 / 0.06)); border-color: rgb(217 180 74 / 0.45); }
    .res__exam { display: flex; align-items: center; gap: 0.55rem; margin: 0.75rem 0 0; padding: 0.6rem 0.9rem; border-radius: 12px; background: rgb(0 0 0 / 0.16); font-weight: 600; }
    .res__exam svg { flex: none; color: var(--gold); }
    .res__actions { display: flex; flex-wrap: wrap; gap: 0.75rem; margin-top: 1rem; }
    .res__go, .res__ghost { display: inline-flex; align-items: center; justify-content: center; gap: 0.55rem; min-height: 3.1rem; padding: 0 1.4rem; border-radius: 14px;
      font-weight: 700; text-decoration: none; transition: transform var(--fast) var(--ease), filter var(--fast) var(--ease), background-color var(--fast) var(--ease); }
    .res__go { color: var(--ink); background: linear-gradient(180deg, #edd07a, #c9a23a); border: 1px solid #b38f2c;
      box-shadow: 0 14px 26px -14px rgb(0 0 0 / 0.75), inset 0 1px 0 rgb(255 255 255 / 0.5); }
    .res__ghost { color: #fff; font-weight: 600; background: rgb(255 255 255 / 0.08); border: 1px solid rgb(255 255 255 / 0.3); }
    @media (hover: hover) {
      .res__go:hover { filter: brightness(1.05); transform: translateY(-1px); }
      .res__ghost:hover { background: rgb(255 255 255 / 0.16); transform: translateY(-1px); }
    }
    @supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) { .res__stat { background: rgb(0 0 0 / 0.16); } }
    @media (prefers-reduced-motion: reduce) { .seg__opt span, .res__go, .res__ghost { transition: none; } }
    @media (max-width: 860px) { .finder { grid-template-columns: 1fr; } }
    @media (max-width: 520px) {
      .res__stats { grid-template-columns: 1fr; }
      .res__actions > a { flex: 1 1 100%; }
      .seg__opt span { min-height: 2.75rem; font-size: 0.9375rem; line-height: 1.2; }
    }
  `,
})
export class ApplicationFinder {
  readonly callCode = input.required<string>();
  private readonly api = inject(ApiService);

  protected readonly options = signal<OptionSummaryDto[]>([]);
  protected readonly submodalities = signal<SubmodalityDto[]>([]);
  private readonly categories = signal<QuotaCategoryDto[]>([]);
  protected readonly optionCode = signal('P34');
  protected readonly submodality = signal('ORD');
  protected readonly school = signal<'ESTATAL' | 'PARTICULAR'>('ESTATAL');
  protected readonly detail = signal<OptionDetailDto | null>(null);
  protected readonly quote = signal<FeeQuoteDto | null>(null);
  protected readonly error = signal<string | null>(null);

  protected readonly needsSchool = computed(() => NEEDS_SCHOOL.has(this.submodality()));
  protected readonly sub = computed(() => this.submodalities().find((s) => s.code === this.submodality()));
  protected readonly subName = computed(() => (this.sub()?.name ?? 'Ordinario').toLowerCase().replace(/^ordinario.*/, 'examen ordinario'));
  protected readonly vacancies = computed(() => {
    const d = this.detail();
    if (!d) return 0;
    const codes = this.categories().filter((c) => (c.submodality ?? c.code) === this.submodality()).map((c) => c.code);
    return d.vacanciesByCategory.filter((v) => codes.includes(v.category)).reduce((s, v) => s + v.quantity, 0);
  });
  protected readonly examLine = computed(() => EXAM_LABEL[this.sub()?.modality ?? 'ORD']);
  protected readonly money = soles;

  constructor() {
    effect(() => {
      const call = this.callCode();
      this.api.options(call).subscribe((r) => this.options.set(r.data));
      this.api.submodalities(call).subscribe((s) => this.submodalities.set(s));
      this.api.quotaCategories(call).subscribe((c) => this.categories.set(c));
    });
    effect(() => {
      this.api.option(this.callCode(), this.optionCode()).subscribe({
        next: (d) => this.detail.set(d),
        error: (e) => this.error.set(apiErrorMessage(e)),
      });
    });
    effect(() => {
      const sub = this.sub();
      if (!sub) return;
      this.error.set(null);
      this.api
        .feeQuote(this.callCode(), {
          modality: sub.modality,
          submodality: sub.modality === 'EXO' ? sub.code : undefined,
          schoolType: this.needsSchool() ? this.school() : undefined,
        })
        .subscribe({ next: (q) => this.quote.set(q), error: (e) => this.error.set(apiErrorMessage(e)) });
    });
  }

  protected sel(event: Event): string {
    return (event.target as HTMLSelectElement).value;
  }
}
