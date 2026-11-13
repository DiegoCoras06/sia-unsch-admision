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
    <section class="p-hero field-accent field-glow" aria-labelledby="rq-title">
      <div class="frame p-hero__grid">
        <div class="p-hero__text">
          <p class="p-kicker" data-icon="requisitos">Antes de postular</p>
          <h1 id="rq-title">Requisitos por <span>modalidad</span></h1>
          <p class="p-lead">Elige tu modalidad y verás exactamente qué documentos necesitas, con el artículo del reglamento que los exige.</p>
        </div>
        <ul class="p-facts" aria-label="Resumen">
          <li><b>{{ submodalities().length || '-' }}</b><span>modalidades</span></li>
          <li><b>{{ requirements().length || '-' }}</b><span>documentos en la elegida</span></li>
        </ul>
      </div>
    </section>

    <section class="section--tight" aria-labelledby="req-title">
      <div class="frame req">
        <nav aria-label="Modalidades" class="mods p-card">
          <p class="mods__label">Modalidad</p>
          <ul>
            @for (s of submodalities(); track s.code) {
              <li><button type="button" [class.is-on]="s.code === selected()" [attr.aria-pressed]="s.code === selected()" (click)="selected.set(s.code)">
                <span>{{ s.name }}</span>@if (s.code === selected()) { <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg> }
              </button></li>
            }
          </ul>
        </nav>
        <div class="req__main" aria-live="polite">
          <div class="p-card req__head">
            <h2 id="req-title" class="p-h2">{{ current()?.name }}</h2>
            @if (current()?.legalBasis; as lb) { <p class="req__basis"><svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 11v6M12 7.5v.5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>{{ lb }}</p> }
            @if (current()?.evaluationCriteria; as crit) {
              <div class="criteria"><h3>Cómo se evalúa tu expediente</h3><p>{{ crit }}</p></div>
            }
          </div>
          <ol class="docs">
            @for (r of requirements(); track r.code; let i = $index) {
              <li class="doc">
                <span class="doc__n" aria-hidden="true">{{ i + 1 }}</span>
                <div class="doc__body">
                  <h3>{{ r.name }}</h3>
                  <p>{{ r.description }}</p>
                  <p class="doc__tags">
                    <span class="doc__art">{{ r.article }}</span>
                    @if (!r.mandatory) { <span class="doc__opt">Según tu caso</span> }
                    @if (r.isBase) { <span class="doc__base">Común a la mayoría de modalidades</span> }
                  </p>
                </div>
              </li>
            }
          </ol>
          <div class="req__note">
            <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 11v6M12 7.5v.5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>
            <p>Antes de inscribirte debes conocer y aceptar el reglamento e identificarte con tu DNI original vigente (Art. 14).
            Los originales se presentan en la Dirección de Admisión, Jr. Arequipa N.° 175, al obtener la constancia de ingreso.</p>
          </div>
          <p class="p-links">
            <a routerLink="/documentos/requisitos" class="p-btn-soft" data-icon="descargar">Requisitos oficiales (PDF)</a>
            <a routerLink="/documentos/reglamento" class="p-btn-soft" data-icon="reglamento">Reglamento completo (PDF)</a>
            <a routerLink="/tasas" class="p-btn-soft" data-icon="tasas">¿Cuánto pago?</a>
          </p>
        </div>
      </div>
    </section>
  `,
  styles: `
    .req { display: grid; grid-template-columns: minmax(0, 4fr) minmax(0, 8fr); gap: clamp(1.5rem, 4vw, 3rem); align-items: start; }
    .mods { position: sticky; top: 6rem; padding: 0.9rem; }
    .mods__label { margin: 0.2rem 0.5rem 0.6rem; font-size: var(--size-note); font-weight: 700; color: var(--accent); }
    .mods ul { list-style: none; margin: 0; padding: 0; display: grid; gap: 0.3rem; }
    .mods button { width: 100%; display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; min-height: 2.9rem; text-align: left; padding: 0.6rem 0.9rem;
      font: inherit; font-weight: 600; color: var(--ink); background: transparent; border: 0; border-radius: 12px; cursor: pointer; transition: background-color var(--fast) var(--ease); }
    .mods button svg { flex: none; color: var(--gold); }
    @media (hover: hover) { .mods button:not(.is-on):hover { background: #fbf7f3; color: var(--accent); } }
    .mods button.is-on { color: #fff; background: linear-gradient(180deg, #932830 0%, var(--accent) 55%, #62161b 100%); box-shadow: 0 10px 18px -12px rgb(122 28 34 / 0.9); }
    .mods button:focus-visible { outline: 3px solid var(--gold); outline-offset: 2px; }
    .req__main { display: grid; gap: 1rem; min-width: 0; }
    .req__head { display: grid; gap: 0.75rem; border-top: 4px solid var(--gold); }
    .req__basis { display: flex; align-items: flex-start; gap: 0.45rem; margin: 0; font-size: 0.9375rem; color: var(--ink-soft); }
    .req__basis svg, .req__note svg { flex: none; margin-top: 0.2em; color: var(--accent); }
    .criteria { display: grid; gap: 0.35rem; padding: 0.85rem 1rem; border-radius: 14px; background: #fbf7f3; border-left: 4px solid var(--accent); }
    .criteria h3 { font-size: 1rem; }
    .criteria p { margin: 0; white-space: pre-line; }
    .docs { list-style: none; margin: 0; padding: 0; display: grid; gap: 0.75rem; }
    .doc { display: grid; grid-template-columns: auto minmax(0, 1fr); gap: 1rem; padding: 1.1rem 1.25rem; border-radius: 18px; background: #fff;
      box-shadow: 0 0 0 1px rgb(29 20 21 / 0.06), 0 14px 28px -24px rgb(29 20 21 / 0.55); }
    .doc__n { display: grid; place-items: center; width: 2.25rem; height: 2.25rem; border-radius: 12px; font-weight: 800; color: var(--ink);
      background: linear-gradient(180deg, #edd07a, #c9a23a); box-shadow: inset 0 1px 0 rgb(255 255 255 / 0.5); }
    .doc__body { display: grid; gap: 0.35rem; min-width: 0; }
    .doc__body h3 { font-size: 1.0625rem; line-height: 1.3; }
    .doc__body p { margin: 0; }
    .doc__tags { display: flex; flex-wrap: wrap; gap: 0.35rem; margin-top: 0.15rem !important; }
    .doc__tags span { padding: 0.15rem 0.6rem; border-radius: 999px; font-size: 0.8125rem; font-weight: 700; }
    .doc__art { background: var(--stone); color: var(--ink-soft); }
    .doc__opt { background: #fbf1d9; color: #6b4a00; }
    .doc__base { background: #e6eef8; color: #1d4f86; }
    .req__note { display: flex; gap: 0.6rem; padding: 1rem 1.1rem; border-radius: 16px; background: #eef4fb; color: #1d3f66; }
    .req__note p { margin: 0; }
    .req__note svg { color: #1d4f86; }
    @media (max-width: 860px) { .req { grid-template-columns: 1fr; } .mods { position: static; } .mods ul { grid-template-columns: 1fr 1fr; } }
    @media (max-width: 480px) { .mods ul { grid-template-columns: 1fr; } }
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
