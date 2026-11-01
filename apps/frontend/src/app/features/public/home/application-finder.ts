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
      <form class="finder__form stack-lg" (submit)="$event.preventDefault()">
        <div class="field">
          <label for="f-option">¿A qué carrera postulas?</label>
          <select id="f-option" class="select" (change)="optionCode.set(sel($event))">
            @for (o of options(); track o.internalCode) {
              <option [value]="o.internalCode" [selected]="o.internalCode === optionCode()">{{ o.displayName }}</option>
            }
          </select>
        </div>
        <div class="field">
          <label for="f-mod">¿Por qué modalidad?</label>
          <select id="f-mod" class="select" (change)="submodality.set(sel($event))">
            @for (s of submodalities(); track s.code) {
              <option [value]="s.code" [selected]="s.code === submodality()">{{ s.name }}</option>
            }
          </select>
        </div>
        @if (needsSchool()) {
          <fieldset class="field school">
            <legend>¿Dónde terminaste la secundaria?</legend>
            <label class="check"><input type="radio" name="school" value="ESTATAL" [checked]="school() === 'ESTATAL'" (change)="school.set('ESTATAL')"> Colegio estatal</label>
            <label class="check"><input type="radio" name="school" value="PARTICULAR" [checked]="school() === 'PARTICULAR'" (change)="school.set('PARTICULAR')"> Colegio particular</label>
          </fieldset>
        }
      </form>

      <div class="finder__result" aria-live="polite">
        @if (error()) {
          <p class="alert alert--error">{{ error() }}</p>
        } @else if (detail(); as d) {
          <p class="big"><span class="big__num">{{ vacancies() }}</span> {{ vacancies() === 1 ? 'vacante' : 'vacantes' }}</p>
          <p class="result-line">en <strong>{{ d.displayName }}</strong> por {{ subName() }}{{ vacancies() === 0 ? ' - esta carrera no ofrece vacantes en esa modalidad.' : '.' }}</p>
          @if (quote(); as q) {
            <p class="big big--money"><span class="big__num">{{ money(q.total) }}</span></p>
            <p class="result-line">es lo que pagas si te inscribes hoy@if (q.lines.length > 1) { (incluye recargo extemporáneo)}.</p>
          }
          <p class="result-line">{{ examLine() }}</p>
          <div class="actions">
            <a routerLink="/inscripcion" class="btn">Inscribirme</a>
            <a [routerLink]="['/programas', d.internalCode]" class="link-arrow">Ver la carrera</a>
          </div>
        }
      </div>
    </div>
  `,
  styles: `
    .finder { display: grid; grid-template-columns: minmax(0, 5fr) minmax(0, 7fr); gap: clamp(2rem, 6vw, 6rem); align-items: start; }
    .school { border: 0; padding: 0; margin: 0; display: grid; gap: 0.75rem; }
    .school legend { font-weight: 600; margin-bottom: 0.5rem; padding: 0; }
    .finder__result { background: var(--accent); color: var(--accent-ink); padding: clamp(1.75rem, 4vw, 3.5rem); display: grid; gap: 0.75rem; min-height: 100%; }
    .big { margin: 0; font-weight: 700; font-size: 1.5rem; display: flex; align-items: baseline; gap: 0.75rem; }
    .big__num { font-size: clamp(3.5rem, 9vw, 7.5rem); font-weight: 800; letter-spacing: -0.05em; line-height: 0.9; color: var(--gold); font-variant-numeric: tabular-nums; }
    .big--money { margin-top: 1.5rem; }
    .result-line { font-size: 1.25rem; }
    .actions { display: flex; flex-wrap: wrap; align-items: center; gap: 1.5rem; margin-top: 1.5rem; }
    .actions .btn { background: var(--ground); color: var(--accent); }
    .actions .btn:hover { background: var(--stone); }
    @media (max-width: 860px) { .finder { grid-template-columns: 1fr; } }
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
