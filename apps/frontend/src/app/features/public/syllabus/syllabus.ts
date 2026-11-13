import { Component, computed, effect, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { SyllabusNodeDto } from '@sia/contracts';
import { ApiService } from '../../../core/api.service';
import { CallStore } from '../../../core/call.store';

/** Spec 001, Historia 4, escenario 2 - temario navegable y con búsqueda sin tildes. */
@Component({
  selector: 'app-syllabus',
  imports: [RouterLink],
  template: `
    <section class="p-hero field-accent field-glow" aria-labelledby="sy-title">
      <div class="frame p-hero__grid">
        <div class="p-hero__text">
          <p class="p-kicker" data-icon="temario">Para prepararte</p>
          <h1 id="sy-title">Temario del <span>examen</span></h1>
          <p class="p-lead">Cinco áreas curriculares del Ministerio de Educación (Tabla N.° 1). Busca un curso para saber en qué área está.</p>
        </div>
        <ul class="p-facts" aria-label="El temario en cifras">
          <li><b>5</b><span>áreas curriculares</span></li>
          <li><b>{{ courses() || '-' }}</b><span>{{ query() ? 'cursos encontrados' : 'cursos' }}</span></li>
        </ul>
      </div>
    </section>

    <section class="frame sy-search-wrap" aria-label="Buscar en el temario">
      <div class="p-card sy-search">
        <div class="field">
          <label for="t-q">Buscar curso</label>
          <div class="search" data-icon="buscar">
            <input id="t-q" class="input" type="search" placeholder="Por ejemplo: trigonometría" (input)="search($event)">
          </div>
        </div>
        <a routerLink="/documentos/temario" class="p-btn-soft" data-icon="descargar">Temario completo (PDF)</a>
      </div>
    </section>

    <section class="frame section--tight" aria-labelledby="tree-title">
      <h2 id="tree-title" class="sr-only">Áreas y cursos</h2>
      <div class="areas" aria-live="polite">
        @for (area of tree(); track area.id; let i = $index) {
          <div class="area">
            <header class="area__head">
              <span class="area__n" aria-hidden="true">{{ i + 1 }}</span>
              <h3>{{ area.title }}</h3>
              <span class="area__count">{{ area.children?.length ?? 0 }} {{ (area.children?.length ?? 0) === 1 ? 'curso' : 'cursos' }}</span>
            </header>
            <ul>
              @for (course of area.children; track course.id) { <li [class.hit]="query()">{{ course.title }}</li> }
            </ul>
          </div>
        } @empty {
          <p class="alert alert--info">No encontramos ese curso en el temario.</p>
        }
      </div>
    </section>
  `,
  styles: `
    .sy-search-wrap { margin-top: clamp(-2.5rem, -4vh, -1.5rem); position: relative; z-index: 1; }
    .sy-search { display: flex; flex-wrap: wrap; align-items: end; justify-content: space-between; gap: 1rem 1.5rem; }
    .sy-search .field { flex: 1 1 22rem; max-width: 34rem; }
    .sy-search label { font-weight: 600; }
    .search { position: relative; }
    .search[data-icon]::before { position: absolute; left: 0.95rem; top: 50%; transform: translateY(-50%); width: 1.15rem; height: 1.15rem; background: var(--ink-soft); z-index: 1; }
    .search .input { padding-left: 2.6rem; }
    .areas { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 20rem), 1fr)); gap: 1rem; align-items: start; }
    .area { border-radius: 22px; background: #fff; overflow: hidden; box-shadow: 0 0 0 1px rgb(29 20 21 / 0.06), 0 18px 36px -26px rgb(29 20 21 / 0.5); }
    .area__head { display: grid; grid-template-columns: auto minmax(0, 1fr); gap: 0.2rem 0.85rem; align-items: center; padding: 1rem 1.2rem; color: #fff;
      background: radial-gradient(14rem 9rem at 100% 0%, rgb(217 180 74 / 0.28), transparent 70%), linear-gradient(155deg, #8d242b 0%, var(--accent) 55%, #5e1419 100%); }
    .area__n { grid-row: span 2; display: grid; place-items: center; width: 2.4rem; height: 2.4rem; border-radius: 12px; font-weight: 800; color: var(--ink);
      background: linear-gradient(180deg, #edd07a, #c9a23a); box-shadow: inset 0 1px 0 rgb(255 255 255 / 0.5); }
    .area__head h3 { font-size: 1.0625rem; line-height: 1.25; color: #fff; }
    .area__count { font-size: var(--size-note); color: rgb(255 255 255 / 0.85); }
    .area ul { list-style: none; margin: 0; padding: 0.6rem 0.9rem 0.9rem; display: grid; }
    .area li { position: relative; padding: 0.5rem 0.4rem 0.5rem 1.4rem; line-height: 1.35; }
    .area li + li { border-top: 1px solid var(--stone); }
    .area li::before { content: ''; position: absolute; left: 0.4rem; top: 1rem; width: 0.4rem; height: 0.4rem; border-radius: 50%; background: var(--gold); }
    .hit { font-weight: 800; color: var(--accent); }
    @media (max-width: 900px) { .sy-search-wrap { margin-top: 1.25rem; } }
  `,
})
export class SyllabusPage {
  private readonly api = inject(ApiService);
  private readonly store = inject(CallStore);
  protected readonly tree = signal<SyllabusNodeDto[]>([]);
  protected readonly query = signal('');
  /** Cursos en el temario (o encontrados con la búsqueda). */
  protected readonly courses = computed(() => this.tree().reduce((n, a) => n + (a.children?.length ?? 0), 0));
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
