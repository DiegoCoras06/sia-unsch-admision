import { Component, computed, effect, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { RequirementDto } from '@sia/contracts';
import { ApiService, type SubmodalityDto } from '../../../core/api.service';
import { CallStore } from '../../../core/call.store';

/** Spec 001, Historia 4 - FR-007, MEJ-10: requisitos en HTML, por submodalidad. */
@Component({
  selector: 'app-requirements',
  imports: [RouterLink],
  template: `
    <header class="frame page-head">
      <p class="page-kicker" data-icon="requisitos">Antes de postular</p>
      <h1>Requisitos por modalidad</h1>
      <p class="lead">Elige tu modalidad y verás exactamente qué documentos necesitas, con el artículo del reglamento que los exige.</p>
    </header>

    <section class="section--tight" aria-labelledby="req-title">
      <div class="frame req">
        <nav aria-label="Modalidades" class="mods">
          <ul>
            @for (s of submodalities(); track s.code) {
              <li><button type="button" [class.is-on]="s.code === selected()" [attr.aria-pressed]="s.code === selected()" (click)="selected.set(s.code)">{{ s.name }}</button></li>
            }
          </ul>
        </nav>
        <div class="stack-lg" aria-live="polite">
          <h2 id="req-title">{{ current()?.name }}</h2>
          <p class="note">{{ current()?.legalBasis }}</p>
          @if (current()?.evaluationCriteria; as crit) {
            <div class="criteria"><h3>Cómo se evalúa tu expediente</h3><p>{{ crit }}</p></div>
          }
          <ol class="docs">
            @for (r of requirements(); track r.code) {
              <li>
                <h3>{{ r.name }}@if (!r.mandatory) { <span class="opt"> (según tu caso)</span> }</h3>
                <p>{{ r.description }}</p>
                <p class="note">{{ r.article }}@if (r.isBase) { · documento común a la mayoría de modalidades }</p>
              </li>
            }
          </ol>
          <div class="alert alert--info">
            Antes de inscribirte debes conocer y aceptar el reglamento e identificarte con tu DNI original vigente (Art. 14).
            Los originales se presentan en la Dirección de Admisión, Jr. Arequipa N.° 175, al obtener la constancia de ingreso.
          </div>
          <p class="links">
            <a routerLink="/documentos/requisitos" class="link-arrow">Requisitos oficiales (PDF)</a>
            <a routerLink="/documentos/reglamento" class="link-arrow">Reglamento completo (PDF)</a>
            <a routerLink="/tasas" class="link-arrow">¿Cuánto pago?</a>
          </p>
        </div>
      </div>
    </section>
  `,
  styles: `
    .criteria { border-left: 3px solid var(--accent); padding: 0.25rem 0 0.25rem 1.25rem; display: grid; gap: 0.35rem; }
    .criteria h3 { font-size: 1.0625rem; }
    .criteria p { white-space: pre-line; }
    .req { display: grid; grid-template-columns: minmax(0, 4fr) minmax(0, 8fr); gap: clamp(2rem, 6vw, 6rem); align-items: start; }
    .mods ul { list-style: none; margin: 0; padding: 0; display: grid; gap: 0.25rem; position: sticky; top: 6rem; }
    .mods button { width: 100%; text-align: left; padding: 0.875rem 1.25rem; font: inherit; font-weight: 600; background: var(--stone); border: 0; cursor: pointer;
      transition: background-color var(--fast) var(--ease); }
    .mods button:hover { background: var(--stone-deep); }
    .mods button.is-on { background: var(--accent); color: var(--accent-ink); }
    .docs { margin: 0; padding-left: 1.5rem; display: grid; gap: 1.75rem; }
    .docs li::marker { font-weight: 800; color: var(--accent); }
    .docs li { display: grid; gap: 0.4rem; padding-left: 0.5rem; }
    .opt { font-weight: 500; color: var(--ink-soft); }
    .links { display: flex; flex-wrap: wrap; gap: 1.5rem; }
    @media (max-width: 860px) { .req { grid-template-columns: 1fr; } .mods ul { position: static; grid-template-columns: 1fr 1fr; } }
  `,
})
export class RequirementsPage {
  private readonly api = inject(ApiService);
  private readonly store = inject(CallStore);
  protected readonly submodalities = signal<SubmodalityDto[]>([]);
  protected readonly selected = signal('ORD');
  protected readonly requirements = signal<RequirementDto[]>([]);
  protected readonly current = computed(() => this.submodalities().find((s) => s.code === this.selected()));

  constructor() {
    effect(() => this.api.submodalities(this.store.code()).subscribe((s) => this.submodalities.set(s)));
    effect(() => this.api.requirements(this.store.code(), this.selected()).subscribe((r) => this.requirements.set(r)));
  }
}
