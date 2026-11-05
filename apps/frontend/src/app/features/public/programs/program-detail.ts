import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import type { OptionDetailDto } from '@sia/contracts';
import { ApiService, apiErrorMessage } from '../../../core/api.service';
import { CallStore } from '../../../core/call.store';
import { AREA_NAMES } from '../../../core/format';

/** Spec 001, Historia 2, escenario 4 - FR-005. */
@Component({
  selector: 'app-program-detail',
  imports: [RouterLink],
  template: `
    @if (option(); as o) {
      <header class="field-accent head">
        <div class="frame head__grid">
          <div class="stack-lg">
            <p><a routerLink="/programas" class="back">Programas y vacantes</a></p>
            <h1>{{ o.displayName }}</h1>
            <p class="lead">{{ o.faculty }} · Área {{ areaName() }}</p>
          </div>
          <p class="head__num"><span>{{ o.totalVacancies }}</span> vacantes en total, {{ o.ordinaryVacancies }} por examen ordinario</p>
        </div>
      </header>

      <section class="section" aria-labelledby="facts-title">
        <div class="frame facts">
          <div class="stack-lg">
            <h2 id="facts-title">Lo que estudias</h2>
            <dl>
              <div><dt>Duración</dt><dd>{{ o.durationYears }} años ({{ o.durationYears * 2 }} semestres académicos)</dd></div>
              <div><dt>Grado académico</dt><dd>{{ o.degree }}</dd></div>
              <div><dt>Título profesional</dt><dd>{{ o.professionalTitle }}</dd></div>
            </dl>
            <p>{{ o.profileMarkdown }} <a [href]="'docs/programas.pdf#page=' + profilePage()">Abrir el perfil de ingreso</a></p>
            <a routerLink="/inscripcion" class="btn">Postular a esta carrera</a>
          </div>
          <div class="stack">
            <h2 class="vac-title">Vacantes por modalidad</h2>
            <div class="table-wrap">
              <table class="data">
                <caption class="sr-only">Vacantes de {{ o.displayName }} por modalidad</caption>
                <thead><tr><th scope="col">Modalidad</th><th scope="col" class="num">Vacantes</th></tr></thead>
                <tbody>
                  @for (v of o.vacanciesByCategory; track v.category) {
                    <tr [class.zero]="v.quantity === 0"><td>{{ v.name }}</td><td class="num">{{ v.quantity }}</td></tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>
    } @else if (error()) {
      <section class="frame section stack-lg">
        <h1>Programa no encontrado</h1>
        <p>{{ error() }}</p>
        <a routerLink="/programas" class="link-arrow">Ver todos los programas</a>
      </section>
    } @else {
      <section class="frame section"><div class="skel" role="status" aria-label="Cargando el programa"><span></span><span></span><span></span><span></span><span></span><span></span></div></section>
    }
  `,
  styles: `
    .head { padding-block: clamp(3rem, 7vw, 6rem); }
    .head__grid { display: grid; grid-template-columns: minmax(0, 8fr) minmax(0, 4fr); gap: var(--gap); align-items: end; }
    .head h1 { font-size: clamp(2.5rem, 6vw, 5.5rem); }
    .back { font-weight: 700; text-decoration: none; }
    .back::before { content: '← '; }
    .head__num { font-size: 1.25rem; font-weight: 600; }
    .head__num span { display: block; font-size: clamp(4rem, 9vw, 8rem); font-weight: 800; color: var(--gold); letter-spacing: -0.05em; line-height: 0.85; }
    .facts { display: grid; grid-template-columns: minmax(0, 6fr) minmax(0, 6fr); gap: clamp(2rem, 6vw, 6rem); align-items: start; }
    dl { margin: 0; display: grid; gap: 1.25rem; }
    dt { font-weight: 600; color: var(--ink-soft); font-size: var(--size-note); }
    dd { margin: 0; font-size: 1.375rem; font-weight: 700; }
    .vac-title { font-size: 1.5rem; }
    tr.zero td { color: var(--ink-soft); }
    @media (max-width: 860px) { .head__grid, .facts { grid-template-columns: 1fr; } }
  `,
})
export class ProgramDetailPage {
  readonly code = input.required<string>();
  private readonly api = inject(ApiService);
  private readonly store = inject(CallStore);
  private readonly title = inject(Title);
  protected readonly option = signal<OptionDetailDto | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly areaName = computed(() => AREA_NAMES[this.option()?.area ?? 'I']);
  protected readonly profilePage = computed(() => /página (\d+)/.exec(this.option()?.profileMarkdown ?? '')?.[1] ?? '1');

  constructor() {
    effect(() => {
      this.api.option(this.store.code(), this.code()).subscribe({
        next: (o) => {
          this.option.set(o);
          this.title.setTitle(`${o.displayName} - Admisión UNSCH`);
        },
        error: (e) => this.error.set(apiErrorMessage(e)),
      });
    });
  }
}
