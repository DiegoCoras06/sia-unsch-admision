import { Component, effect, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { SyllabusNodeDto } from '@sia/contracts';
import { ApiService } from '../../../core/api.service';
import { CallStore } from '../../../core/call.store';

/** Spec 001, Historia 4, escenario 2 - temario navegable y con búsqueda sin tildes. */
@Component({
  selector: 'app-syllabus',
  imports: [RouterLink],
  template: `
    <header class="frame page-head">
      <p class="page-kicker" data-icon="temario">Para prepararte</p>
      <h1>Temario del examen</h1>
      <p class="lead">Cinco áreas curriculares del Ministerio de Educación (Tabla N.° 1). Busca un curso para saber en qué área está.</p>
    </header>

    <section class="frame section--tight" aria-labelledby="tree-title">
      <div class="field search">
        <label for="t-q">Buscar curso</label>
        <input id="t-q" class="input" type="search" placeholder="Por ejemplo: trigonometria" (input)="search($event)">
      </div>
      <h2 id="tree-title" class="sr-only">Áreas y cursos</h2>
      <div class="areas" aria-live="polite">
        @for (area of tree(); track area.id) {
          <div class="area">
            <h3>{{ area.title }}</h3>
            <ul>
              @for (course of area.children; track course.id) { <li [class.hit]="query()">{{ course.title }}</li> }
            </ul>
          </div>
        } @empty {
          <p class="alert alert--info">No encontramos ese curso en el temario.</p>
        }
      </div>
      <p class="pdf"><a routerLink="/documentos/temario" class="link-arrow">Ver el temario completo con todos los temas (PDF)</a></p>
    </section>
  `,
  styles: `
    .search { max-width: 32rem; margin-bottom: 3rem; }
    .areas { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 22rem), 1fr)); gap: 0.35rem; }
    .area { background: var(--stone); padding: 1.75rem; display: grid; gap: 1rem; align-content: start; }
    .area h3 { font-size: 1.1875rem; }
    .area ul { margin: 0; padding-left: 1.1rem; display: grid; gap: 0.4rem; }
    .hit { font-weight: 800; color: var(--accent); }
    .pdf { margin-top: 2.5rem; }
  `,
})
export class SyllabusPage {
  private readonly api = inject(ApiService);
  private readonly store = inject(CallStore);
  protected readonly tree = signal<SyllabusNodeDto[]>([]);
  protected readonly query = signal('');
  private debounce: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    effect(() => this.api.syllabus(this.store.code(), this.query() || undefined).subscribe((t) => this.tree.set(t)));
  }

  protected search(e: Event): void {
    clearTimeout(this.debounce);
    const v = (e.target as HTMLInputElement).value.trim();
    this.debounce = setTimeout(() => this.query.set(v), 250);
  }
}
