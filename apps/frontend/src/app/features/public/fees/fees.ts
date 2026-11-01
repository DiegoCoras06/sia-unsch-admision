import { Component, computed, effect, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { AnnouncementDto, FeeDto, FeeQuoteDto } from '@sia/contracts';
import { ApiService, apiErrorMessage, type SubmodalityDto } from '../../../core/api.service';
import { CallStore } from '../../../core/call.store';
import { soles } from '../../../core/format';

const NEEDS_SCHOOL = new Set(['ORD', 'EXO-PSP', 'EXO-COAR']);

/** Spec 001, Historia 3 - FR-006, MEJ-07 - y aviso de fe de erratas (Historia 5). */
@Component({
  selector: 'app-fees',
  imports: [RouterLink],
  template: `
    <header class="frame page-head">
      <h1>Tasas y simulador</h1>
      <p class="lead">Responde unas preguntas y te mostramos el monto exacto, con el concepto del prospecto que lo respalda.</p>
    </header>

    @for (n of errata(); track n.id) {
      <div class="frame"><p class="alert alert--info"><strong>{{ n.title }}.</strong> {{ n.bodyMarkdown }} <a routerLink="/comunicados">Ver comunicados</a></p></div>
    }

    <section class="section--tight" aria-labelledby="sim-title">
      <div class="frame sim">
        <form class="stack-lg" (submit)="$event.preventDefault()">
          <h2 id="sim-title" class="sim__title">Calcula tu tasa</h2>
          <div class="field">
            <label for="s-mod">Modalidad</label>
            <select id="s-mod" class="select" (change)="sub.set($any($event.target).value)">
              @for (s of submodalities(); track s.code) { <option [value]="s.code" [selected]="s.code === sub()">{{ s.name }}</option> }
            </select>
          </div>
          @if (needsSchool()) {
            <fieldset class="field opts">
              <legend>¿Dónde terminaste la secundaria?</legend>
              <label class="check"><input type="radio" name="sch" [checked]="school() === 'ESTATAL'" (change)="school.set('ESTATAL')"> Colegio estatal</label>
              <label class="check"><input type="radio" name="sch" [checked]="school() === 'PARTICULAR'" (change)="school.set('PARTICULAR')"> Colegio particular</label>
            </fieldset>
          }
          @if (sub() === 'ORD') {
            <fieldset class="field opts">
              <legend>¿Servicio militar acuartelado?</legend>
              <label class="check"><input type="radio" name="mil" [checked]="military() === 'NONE'" (change)="military.set('NONE')"> No</label>
              <label class="check"><input type="radio" name="mil" [checked]="military() === 'ACTIVE'" (change)="military.set('ACTIVE')"> Sí, estoy en servicio</label>
              <label class="check"><input type="radio" name="mil" [checked]="military() === 'DISCHARGED'" (change)="military.set('DISCHARGED')"> Sí, soy licenciado</label>
            </fieldset>
          }
          <label class="check"><input type="checkbox" [checked]="family()" (change)="family.set($any($event.target).checked)"> Soy hijo(a) o cónyuge de un docente o servidor de la UNSCH y es mi primera vez</label>
        </form>

        <div class="result" aria-live="polite">
          @if (error()) {
            <p class="alert alert--error">{{ error() }}</p>
          } @else if (quote(); as q) {
            <p class="result__total">{{ money(q.total) }}</p>
            <ul class="lines">
              @for (l of q.lines; track l.code) {
                <li><span>{{ l.concept }}<small>{{ l.legalNote }}</small></span><strong>{{ money(l.amount) }}</strong></li>
              }
            </ul>
            @for (w of q.warnings; track w) { <p class="warn">{{ w }}</p> }
            <p class="small">Paga en línea o en Santa María Magdalena, Banco de la Nación o Interbank. Los pagos no se devuelven (Art. 18).</p>
          }
        </div>
      </div>
    </section>

    <section class="section" aria-labelledby="table-title">
      <div class="frame stack-lg">
        <h2 id="table-title">Todas las tasas 2027-I</h2>
        <div class="table-wrap">
          <table class="data">
            <thead><tr><th scope="col">Concepto</th><th scope="col">Base</th><th scope="col" class="num">Monto</th></tr></thead>
            <tbody>
              @for (f of fees(); track f.code) {
                <tr><td>{{ f.concept }}</td><td>{{ f.legalNote }}</td><td class="num">{{ money(f.amount) }}</td></tr>
              }
            </tbody>
          </table>
        </div>
        <p><a routerLink="/documentos/tasas" class="link-arrow">Ver la tabla oficial de tasas (PDF)</a></p>
      </div>
    </section>
  `,
  styles: `
    .sim { display: grid; grid-template-columns: minmax(0, 5fr) minmax(0, 7fr); gap: clamp(2rem, 6vw, 6rem); align-items: start; }
    .sim__title { font-size: 1.75rem; }
    .opts { border: 0; padding: 0; margin: 0; display: grid; gap: 0.6rem; }
    .opts legend { font-weight: 600; padding: 0; margin-bottom: 0.5rem; }
    .result { background: var(--accent); color: var(--accent-ink); padding: clamp(1.75rem, 4vw, 3.5rem); display: grid; gap: 1.25rem; position: sticky; top: 6rem; }
    .result__total { font-size: clamp(4rem, 10vw, 8rem); font-weight: 800; letter-spacing: -0.05em; line-height: 0.85; color: var(--gold); font-variant-numeric: tabular-nums; }
    .lines { list-style: none; margin: 0; padding: 0; display: grid; gap: 0.75rem; }
    .lines li { display: flex; justify-content: space-between; gap: 1rem; padding: 0.75rem 1rem; background: var(--accent-press); }
    .lines small { display: block; opacity: 0.85; font-size: var(--size-note); }
    .warn { font-weight: 600; }
    .small { font-size: var(--size-note); opacity: 0.9; }
    @media (max-width: 860px) { .sim { grid-template-columns: 1fr; } .result { position: static; } }
  `,
})
export class FeesPage {
  private readonly api = inject(ApiService);
  private readonly store = inject(CallStore);
  protected readonly submodalities = signal<SubmodalityDto[]>([]);
  protected readonly fees = signal<FeeDto[]>([]);
  protected readonly errata = signal<AnnouncementDto[]>([]);
  protected readonly sub = signal('ORD');
  protected readonly school = signal<'ESTATAL' | 'PARTICULAR'>('ESTATAL');
  protected readonly military = signal<'NONE' | 'ACTIVE' | 'DISCHARGED'>('NONE');
  protected readonly family = signal(false);
  protected readonly quote = signal<FeeQuoteDto | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly needsSchool = computed(() => NEEDS_SCHOOL.has(this.sub()));
  protected readonly money = soles;

  constructor() {
    this.api.announcements({ section: 'TASAS', type: 'FE_ERRATAS' }).subscribe((r) => this.errata.set(r.data));
    effect(() => {
      const call = this.store.code();
      this.api.submodalities(call).subscribe((s) => this.submodalities.set(s));
      this.api.fees(call).subscribe((f) => this.fees.set(f));
    });
    effect(() => {
      const s = this.submodalities().find((x) => x.code === this.sub());
      if (!s) return;
      this.error.set(null);
      this.api
        .feeQuote(this.store.code(), {
          modality: s.modality,
          submodality: s.modality === 'EXO' ? s.code : undefined,
          schoolType: this.needsSchool() ? this.school() : undefined,
          militaryCondition: s.modality === 'ORD' ? this.military() : 'NONE',
          familyLink: this.family(),
        })
        .subscribe({ next: (q) => this.quote.set(q), error: (e) => this.error.set(apiErrorMessage(e)) });
    });
  }
}
