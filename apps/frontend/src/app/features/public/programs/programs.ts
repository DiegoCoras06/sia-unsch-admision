import { Component, DestroyRef, computed, effect, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { OptionSummaryDto, OptionsMeta, QuotaCategoryDto } from '@sia/contracts';
import { ApiService } from '../../../core/api.service';
import { CallStore } from '../../../core/call.store';
import { AREA_NAMES } from '../../../core/format';

/** Spec 001, Historia 2 - FR-004, MEJ-08. */
@Component({
  selector: 'app-programs',
  imports: [RouterLink],
  template: `
    <header class="frame page-head">
      <h1>Programas y vacantes</h1>
      <p class="lead">{{ meta()?.totalVacancies ?? 1803 }} vacantes en 40 opciones de postulación. Busca tu carrera y mira cuántas hay en tu modalidad.</p>
    </header>

    <section class="frame" aria-label="Filtros">
      <div class="filters">
        <div class="field">
          <label for="q">Buscar carrera</label>
          <input id="q" class="input" type="search" autocomplete="off" placeholder="Por ejemplo: sistemas, enfermería" [value]="q()" (input)="onSearch($event)">
        </div>
        <fieldset class="field areas">
          <legend>Área</legend>
          <div class="seg">
            @for (a of areaOptions; track a.value) {
              <label [class.is-on]="area() === a.value"><input type="radio" name="area" [value]="a.value" [checked]="area() === a.value" (change)="area.set(a.value)"> {{ a.label }}</label>
            }
          </div>
        </fieldset>
        <div class="field">
          <label for="cat">Modalidad</label>
          <select id="cat" class="select" (change)="category.set($any($event.target).value)">
            <option value="">Todas (total)</option>
            @for (c of categories(); track c.code) { <option [value]="c.code">{{ c.name }}</option> }
          </select>
        </div>
      </div>
    </section>

    <section class="frame section--tight" aria-labelledby="results-title">
      <h2 id="results-title" class="results-title" aria-live="polite">{{ results().length }} {{ results().length === 1 ? 'opción' : 'opciones' }}</h2>
      @if (results().length) {
        <div class="table-wrap">
          <table class="data list">
            <thead>
              <tr>
                <th scope="col">Programa</th>
                <th scope="col">Área</th>
                @if (category()) { <th scope="col" class="num">{{ categoryName() }}</th> }
                <th scope="col" class="num">Ordinario</th>
                <th scope="col" class="num">Total</th>
              </tr>
            </thead>
            <tbody>
              @for (o of results(); track o.internalCode) {
                <tr>
                  <td><a [routerLink]="['/programas', o.internalCode]">{{ o.displayName }}</a></td>
                  <td data-label="Área">{{ areaName(o.area) }}</td>
                  @if (category()) {
                    <td class="num" [attr.data-label]="categoryName()">
                      @if (o.categoryVacancies === 0) { <span class="none">Sin vacantes en esta modalidad</span> } @else { {{ o.categoryVacancies }} }
                    </td>
                  }
                  <td class="num" data-label="Ordinario">{{ o.ordinaryVacancies }}</td>
                  <td class="num" data-label="Total">{{ o.totalVacancies }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      } @else if (loaded()) {
        <p class="alert alert--info">No encontramos carreras con «{{ q() }}». Prueba con otra palabra.</p>
      }
      <p class="pdf"><a routerLink="/documentos/vacantes" class="link-arrow">Ver el cuadro oficial de vacantes (PDF)</a></p>
    </section>
  `,
  styles: `
    .filters { display: grid; grid-template-columns: minmax(0, 5fr) auto minmax(0, 4fr); gap: var(--gap); align-items: end; }
    .areas { border: 0; padding: 0; margin: 0; }
    .areas legend { font-weight: 600; padding: 0; margin-bottom: 0.4rem; }
    .seg { display: flex; gap: 0.25rem; }
    .seg label { min-height: 3.25rem; display: inline-flex; align-items: center; padding: 0 1rem; background: var(--stone); font-weight: 600; cursor: pointer;
      transition: background-color var(--fast) var(--ease); }
    .seg label:hover { background: var(--stone-deep); }
    .seg label.is-on { background: var(--accent); color: var(--accent-ink); }
    .seg label:focus-within { outline: 3px solid var(--focus); outline-offset: 2px; }
    .seg input { position: absolute; opacity: 0; width: 1px; height: 1px; }
    .results-title { font-size: 1.5rem; margin-bottom: 1.5rem; }
    .list a { font-weight: 700; text-decoration: none; }
    .list a:hover { text-decoration: underline; color: var(--accent); }
    .none { font-weight: 500; color: var(--ink-soft); font-size: var(--size-note); }
    .pdf { margin-top: 2rem; }
    @media (max-width: 900px) { .filters { grid-template-columns: 1fr; } .seg { flex-wrap: wrap; } }
    @media (max-width: 640px) {
      .list thead { position: absolute; left: -9999px; }
      .list tr { display: grid; grid-template-columns: 1fr 1fr; gap: 0.25rem 1rem; padding: 1rem; }
      .list tbody tr:nth-child(even) td, .list td { background: transparent; padding: 0; }
      .list tbody tr:nth-child(odd) { background: var(--stone); }
      .list td:first-child { grid-column: 1 / -1; font-size: 1.125rem; }
      .list td[data-label]::before { content: attr(data-label) ': '; font-weight: 500; color: var(--ink-soft); }
      .list .num { text-align: left; }
    }
  `,
})
export class ProgramsPage {
  private readonly api = inject(ApiService);
  private readonly store = inject(CallStore);
  protected readonly q = signal('');
  protected readonly area = signal('');
  protected readonly category = signal('');
  protected readonly results = signal<OptionSummaryDto[]>([]);
  protected readonly meta = signal<OptionsMeta | null>(null);
  protected readonly categories = signal<QuotaCategoryDto[]>([]);
  protected readonly loaded = signal(false);
  protected readonly areaOptions = [
    { value: '', label: 'Todas' },
    { value: 'I', label: 'Ciencias' },
    { value: 'II', label: 'Letras' },
    { value: 'III', label: 'Biomédicas' },
  ];
  protected readonly categoryName = computed(() => this.categories().find((c) => c.code === this.category())?.name ?? '');
  protected readonly areaName = (code: string) => AREA_NAMES[code] ?? code;
  private debounce: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    inject(DestroyRef).onDestroy(() => clearTimeout(this.debounce));
    effect(() => {
      this.api.quotaCategories(this.store.code()).subscribe((c) => this.categories.set(c));
    });
    effect(() => {
      const filter = { q: this.q(), area: this.area(), category: this.category() };
      this.api.options(this.store.code(), filter).subscribe((r) => {
        this.results.set(r.data);
        this.meta.set(r.meta ?? null);
        this.loaded.set(true);
      });
    });
  }

  protected onSearch(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    clearTimeout(this.debounce);
    this.debounce = setTimeout(() => this.q.set(value.trim()), 250);
  }
}
