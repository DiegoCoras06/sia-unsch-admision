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
    <section class="p-hero field-accent field-glow" aria-labelledby="fe-title">
      <div class="frame p-hero__grid">
        <div class="p-hero__text">
          <p class="p-kicker" data-icon="tasas">Derecho de inscripción</p>
          <h1 id="fe-title">Tasas y <span>simulador</span></h1>
          <p class="p-lead">Responde unas preguntas y te mostramos el monto exacto, con el concepto del prospecto que lo respalda.</p>
        </div>
        <ul class="p-facts" aria-label="Tu monto">
          <li><b>{{ quote() ? money(quote()!.total) : 'S/ -' }}</b><span>según tus respuestas</span></li>
          <li><b>{{ fees().length || '-' }}</b><span>tasas en el prospecto</span></li>
        </ul>
      </div>
    </section>

    @for (n of errata(); track n.id) {
      <div class="frame fe-errata"><p class="alert alert--info"><strong>{{ n.title }}.</strong> {{ n.bodyMarkdown }} <a routerLink="/comunicados">Ver comunicados</a></p></div>
    }

    <section class="section--tight" aria-labelledby="sim-title">
      <div class="frame sim">
        <form class="p-card sim__form" (submit)="$event.preventDefault()">
          <h2 id="sim-title" class="p-h2">Calcula tu tasa</h2>
          <div class="field">
            <label for="s-mod">Modalidad</label>
            <select id="s-mod" class="select" (change)="sub.set($any($event.target).value)">
              @for (s of submodalities(); track s.code) { <option [value]="s.code" [selected]="s.code === sub()">{{ s.name }}</option> }
            </select>
          </div>
          @if (needsSchool()) {
            <fieldset class="field opts">
              <legend>¿Dónde terminaste la secundaria?</legend>
              <div class="p-pills">
                <label [class.is-on]="school() === 'ESTATAL'"><input type="radio" name="sch" [checked]="school() === 'ESTATAL'" (change)="school.set('ESTATAL')">Colegio estatal</label>
                <label [class.is-on]="school() === 'PARTICULAR'"><input type="radio" name="sch" [checked]="school() === 'PARTICULAR'" (change)="school.set('PARTICULAR')">Colegio particular</label>
              </div>
            </fieldset>
          }
          @if (sub() === 'ORD') {
            <fieldset class="field opts">
              <legend>¿Servicio militar acuartelado?</legend>
              <div class="p-pills">
                <label [class.is-on]="military() === 'NONE'"><input type="radio" name="mil" [checked]="military() === 'NONE'" (change)="military.set('NONE')">No</label>
                <label [class.is-on]="military() === 'ACTIVE'"><input type="radio" name="mil" [checked]="military() === 'ACTIVE'" (change)="military.set('ACTIVE')">En servicio</label>
                <label [class.is-on]="military() === 'DISCHARGED'"><input type="radio" name="mil" [checked]="military() === 'DISCHARGED'" (change)="military.set('DISCHARGED')">Licenciado</label>
              </div>
            </fieldset>
          }
          <label class="family" [class.is-on]="family()">
            <input type="checkbox" [checked]="family()" (change)="family.set($any($event.target).checked)">
            <span>Soy hijo(a) o cónyuge de un docente o servidor de la UNSCH y es mi primera vez</span>
          </label>
        </form>

        <div class="result" aria-live="polite">
          @if (error()) {
            <p class="alert alert--error">{{ error() }}</p>
          } @else if (quote(); as q) {
            <p class="result__label">Pagarás</p>
            <p class="result__total">{{ money(q.total) }}</p>
            <ul class="lines">
              @for (l of q.lines; track l.code) {
                <li><span>{{ l.concept }}<small>{{ l.legalNote }}</small></span><strong>{{ money(l.amount) }}</strong></li>
              }
            </ul>
            @for (w of q.warnings; track w) { <p class="warn"><svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 11v6M12 7.5v.5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>{{ w }}</p> }
            <p class="small">Paga en línea o en Santa María Magdalena, Banco de la Nación o Interbank. Los pagos no se devuelven (Art. 18).</p>
          }
        </div>
      </div>
    </section>

    <section class="section--tight field-stone" aria-labelledby="table-title">
      <div class="frame">
        <div class="fe-table__head">
          <h2 id="table-title" class="p-h2">Todas las tasas 2027-I</h2>
          <a routerLink="/documentos/tasas" class="p-btn-soft" data-icon="descargar">Tabla oficial de tasas (PDF)</a>
        </div>
        <div class="table-wrap" tabindex="0" role="region" aria-labelledby="table-title">
          <table class="data fe-table">
            <thead><tr><th scope="col">Concepto</th><th scope="col">Base</th><th scope="col" class="num">Monto</th></tr></thead>
            <tbody>
              @for (f of fees(); track f.code) {
                <tr><td class="fe-concept">{{ f.concept }}</td><td class="fe-base">{{ f.legalNote }}</td><td class="num"><span class="fe-amount">{{ money(f.amount) }}</span></td></tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </section>
  `,
  styles: `
    .fe-errata { margin-top: 1.25rem; }
    .sim { display: grid; grid-template-columns: minmax(0, 5fr) minmax(0, 7fr); gap: clamp(1.5rem, 4vw, 3rem); align-items: start; }
    .sim__form { display: grid; gap: 1.25rem; }
    .sim__form label, .opts legend { font-weight: 600; }
    .opts { border: 0; padding: 0; margin: 0; display: grid; gap: 0.4rem; min-width: 0; }
    .opts legend { padding: 0; margin-bottom: 0.4rem; }
    .family { position: relative; display: flex; gap: 0.75rem; align-items: flex-start; padding: 0.9rem 1rem; border-radius: 14px; background: #fbf7f3; border: 1px solid var(--stone-deep);
      font-weight: 500 !important; cursor: pointer; transition: border-color var(--fast) var(--ease), background-color var(--fast) var(--ease); }
    .family input { width: 1.25rem; height: 1.25rem; margin-top: 0.1rem; flex: none; accent-color: var(--accent); }
    .family.is-on { border-color: var(--gold); background: #fffaf0; }
    /* Resultado: tarjeta guinda con luces, el monto en dorado y cada concepto como línea de recibo. */
    .result { position: sticky; top: 6rem; display: grid; gap: 0.9rem; padding: clamp(1.4rem, 3.5vw, 2.5rem); border-radius: 24px; color: #fff;
      background: radial-gradient(28rem 16rem at 100% 0%, rgb(217 180 74 / 0.28), transparent 70%), radial-gradient(20rem 14rem at 0% 100%, rgb(255 255 255 / 0.1), transparent 70%),
        linear-gradient(155deg, #8d242b 0%, var(--accent) 50%, #571217 100%);
      box-shadow: 0 30px 60px -32px rgb(87 18 23 / 0.95), inset 0 1px 0 rgb(255 255 255 / 0.16); }
    .result__label { margin: 0; font-size: var(--size-note); font-weight: 700; color: var(--gold); }
    .result__total { margin: 0; font-size: clamp(3rem, 8vw, 6rem); font-weight: 800; letter-spacing: -0.05em; line-height: 0.9; color: #f0d27c; font-variant-numeric: tabular-nums; }
    .lines { list-style: none; margin: 0.4rem 0 0; padding: 0; display: grid; gap: 0.5rem; }
    .lines li { display: flex; justify-content: space-between; align-items: center; gap: 1rem; padding: 0.8rem 1rem; border-radius: 14px; background: rgb(255 255 255 / 0.08);
      border: 1px solid rgb(255 255 255 / 0.16); }
    .lines strong { font-variant-numeric: tabular-nums; white-space: nowrap; }
    .lines small { display: block; opacity: 0.85; font-size: var(--size-note); }
    .warn { display: flex; gap: 0.45rem; align-items: flex-start; margin: 0; font-weight: 600; }
    .warn svg { flex: none; margin-top: 0.2em; color: var(--gold); }
    .small { margin: 0; font-size: var(--size-note); opacity: 0.9; }
    .fe-table__head { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 0.75rem 1.5rem; margin-bottom: 1.1rem; }
    .table-wrap { border-radius: 22px; overflow: hidden; background: #fff; box-shadow: 0 0 0 1px rgb(29 20 21 / 0.06), 0 20px 40px -30px rgb(29 20 21 / 0.55); }
    .fe-table thead th { background: #f4efe9; color: var(--ink-soft); font-size: 0.875rem; }
    .fe-table td { vertical-align: middle; border-top: 1px solid var(--stone); padding-block: 0.8rem; }
    .fe-table th:first-child, .fe-table td:first-child { padding-left: 1.4rem; }
    .fe-table th:last-child, .fe-table td:last-child { padding-right: 1.4rem; }
    .fe-table tbody tr:hover td { background: #fbf7f3; }
    .fe-concept { font-weight: 600; }
    .fe-base { color: var(--ink-soft); font-size: 0.9375rem; }
    .fe-amount { display: inline-block; padding: 0.2rem 0.65rem; border-radius: 10px; background: #f7ece9; color: var(--accent); font-weight: 800; white-space: nowrap; }
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
