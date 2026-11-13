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
    <section class="p-hero field-accent field-glow" aria-labelledby="pg-title">
      <div class="frame p-hero__grid">
        <div class="p-hero__text">
          <p class="p-kicker" data-icon="programas">Oferta académica 2027-I</p>
          <h1 id="pg-title">Programas y <span>vacantes</span></h1>
          <p class="p-lead">Busca tu carrera y mira cuántas vacantes hay en tu modalidad. Cada programa muestra su detalle al abrirlo.</p>
        </div>
        <ul class="p-facts" aria-label="La oferta en cifras">
          <li><b>{{ meta()?.totalVacancies ?? 1803 }}</b><span>vacantes</span></li>
          <li><b>34</b><span>programas</span></li>
          <li><b>40</b><span>opciones</span></li>
          <li><b>3</b><span>áreas</span></li>
        </ul>
      </div>
    </section>

    <section class="frame pg-filters-wrap" aria-label="Filtros">
      <div class="p-card filters">
        <div class="field">
          <label for="q">Buscar carrera</label>
          <div class="search" data-icon="buscar">
            <input id="q" class="input" type="search" autocomplete="off" placeholder="Por ejemplo: sistemas, enfermería" [value]="q()" (input)="onSearch($event)">
          </div>
        </div>
        <fieldset class="field areas">
          <legend>Área</legend>
          <div class="p-pills">
            @for (a of areaOptions; track a.value) {
              <label [class.is-on]="area() === a.value"><input type="radio" name="area" [value]="a.value" [checked]="area() === a.value" (change)="area.set(a.value)">{{ a.label }}</label>
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

    <section class="frame section--tight pg-results" aria-labelledby="results-title">
      <div class="pg-results__head">
        <h2 id="results-title" class="p-h2" aria-live="polite">{{ results().length }} {{ results().length === 1 ? 'opción' : 'opciones' }}</h2>
        <a routerLink="/documentos/vacantes" class="p-btn-soft" data-icon="descargar">Cuadro oficial de vacantes (PDF)</a>
      </div>
      @if (results().length) {
        <div class="table-wrap" tabindex="0" role="region" aria-labelledby="results-title">
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
                  <td><a [routerLink]="['/programas', o.internalCode]">{{ o.displayName }}<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false"><path d="M9 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg></a></td>
                  <td data-label="Área"><span class="area-tag" [attr.data-area]="o.area">{{ areaName(o.area) }}</span></td>
                  @if (category()) {
                    <td class="num" [attr.data-label]="categoryName()">
                      @if (o.categoryVacancies === 0) { <span class="none">Sin vacantes en esta modalidad</span> } @else { {{ o.categoryVacancies }} }
                    </td>
                  }
                  <td class="num" data-label="Ordinario">{{ o.ordinaryVacancies }}</td>
                  <td class="num" data-label="Total"><span class="total">{{ o.totalVacancies }}</span></td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      } @else if (loaded()) {
        <p class="alert alert--info">No encontramos carreras con «{{ q() }}». Prueba con otra palabra.</p>
      }
    </section>
  `,
  styles: `
    .pg-filters-wrap { margin-top: clamp(-2.5rem, -4vh, -1.5rem); position: relative; z-index: 1; }
    .filters { display: grid; grid-template-columns: minmax(0, 5fr) auto minmax(0, 4fr); gap: 1.25rem; align-items: end; }
    .filters label, .filters legend { font-weight: 600; }
    .search { position: relative; }
    .search[data-icon]::before { position: absolute; left: 0.95rem; top: 50%; transform: translateY(-50%); width: 1.15rem; height: 1.15rem; background: var(--ink-soft); z-index: 1; }
    .search .input { padding-left: 2.6rem; }
    .areas { border: 0; padding: 0; margin: 0; min-width: 0; }
    .areas legend { padding: 0; margin-bottom: 0.4rem; }
    .pg-results__head { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 0.75rem 1.5rem; margin-bottom: 1.1rem; }
    /* Tabla en tarjeta: filas que se marcan al pasar, área en etiqueta de color y el total destacado. */
    .table-wrap { border-radius: 22px; overflow: hidden; background: #fff; box-shadow: 0 0 0 1px rgb(29 20 21 / 0.06), 0 20px 40px -30px rgb(29 20 21 / 0.55); }
    .list thead th { background: #f4efe9; color: var(--ink-soft); font-size: 0.875rem; }
    .list tbody tr { transition: background-color var(--fast) var(--ease); }
    .list tbody tr:hover td { background: #fbf7f3; }
    .list td { vertical-align: middle; border-top: 1px solid var(--stone); padding-block: 0.8rem; }
    .list th:first-child, .list td:first-child { padding-left: 1.4rem; }
    .list th:last-child, .list td:last-child { padding-right: 1.4rem; }
    .area-tag { display: inline-block; padding: 0.15rem 0.6rem; border-radius: 999px; font-size: var(--size-note); font-weight: 700; background: var(--stone); color: var(--ink-soft); }
    .area-tag[data-area='I'] { background: #e6eef8; color: #1d4f86; }
    .area-tag[data-area='II'] { background: #f3e8ee; color: #7a1c22; }
    .area-tag[data-area='III'] { background: #e3f1e8; color: #164d2a; }
    .total { display: inline-block; min-width: 2.6rem; padding: 0.2rem 0.6rem; border-radius: 10px; text-align: center; color: var(--accent); background: #f7ece9; font-size: 1.0625rem; font-weight: 800; }
    .list a { display: inline-flex; align-items: center; gap: 0.35rem; font-weight: 700; color: var(--ink); text-decoration: none; }
    .list a svg { flex: none; color: var(--ink-soft); transition: transform var(--fast) var(--ease); }
    @media (hover: hover) { .list a:hover { color: var(--accent); } .list a:hover svg { color: var(--accent); transform: translateX(2px); } }
    .none { font-weight: 500; color: var(--ink-soft); font-size: var(--size-note); }
    @media (max-width: 900px) { .filters { grid-template-columns: 1fr; } .pg-filters-wrap { margin-top: 1.25rem; } }
    @media (max-width: 640px) {
      .table-wrap { background: transparent; box-shadow: none; border-radius: 0; overflow: visible; }
      .list thead { position: absolute; left: -9999px; }
      .list tbody { display: grid; gap: 0.6rem; }
      .list tr { display: grid; grid-template-columns: 1fr 1fr; gap: 0.35rem 1rem; padding: 1rem 1.1rem; border-radius: 16px; background: #fff;
        box-shadow: 0 0 0 1px rgb(29 20 21 / 0.06), 0 12px 24px -20px rgb(29 20 21 / 0.5); }
      .list tbody tr:nth-child(even) td, .list td { background: transparent; padding: 0; border: 0; }
      .list td:first-child { grid-column: 1 / -1; font-size: 1.0625rem; padding: 0; }
      .list td:last-child { padding: 0; }
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
