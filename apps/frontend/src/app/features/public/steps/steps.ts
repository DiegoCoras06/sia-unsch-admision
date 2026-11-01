import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { HomeContentDto } from '@sia/contracts';
import { ApiService } from '../../../core/api.service';
import { MarkdownPipe } from '../../../shared/markdown.pipe';

/** Spec 001, FR-009: las infografías de pasos del portal actual, como listas accesibles. */
@Component({
  selector: 'app-steps',
  imports: [RouterLink, MarkdownPipe],
  template: `
    <header class="frame page-head">
      <h1>Cómo inscribirte</h1>
      <p class="lead">Ordinario en cuatro pasos y Exonerados en cinco. Te inscribes en línea, sin crear cuenta, y consultas tu avance con tu DNI y tu código de postulante.</p>
    </header>
    <section id="ordinario" class="section--tight mod" aria-labelledby="ord-title">
      <div class="frame mod__grid">
        <figure class="mod__info">
          <img src="img/pasos-ordinario-1040.webp" srcset="img/pasos-ordinario-640.webp 640w, img/pasos-ordinario-1040.webp 1040w" sizes="(max-width: 760px) 100vw, 50vw" width="1042" height="822" decoding="async"
            alt="Infografía oficial del proceso de inscripción en la modalidad Ordinario, en cuatro pasos">
        </figure>
        <div class="mod__text stack-lg">
          <h2 id="ord-title">Modalidad Ordinario</h2>
          <div class="md" [innerHTML]="content()?.blocks?.['steps_ord'] | md"></div>
          <a routerLink="/inscripcion" class="btn">Inscribirme en Ordinario</a>
        </div>
      </div>
    </section>
    <section id="exonerados" class="section--tight mod field-accent" aria-labelledby="exo-title">
      <div class="frame mod__grid mod__grid--flip">
        <figure class="mod__info">
          <img src="img/pasos-exonerado-1040.webp" srcset="img/pasos-exonerado-640.webp 640w, img/pasos-exonerado-1040.webp 1040w" sizes="(max-width: 760px) 100vw, 50vw" width="1043" height="822" loading="lazy" decoding="async"
            alt="Infografía oficial del proceso de inscripción en la modalidad Exonerado, en cinco pasos">
        </figure>
        <div class="mod__text stack-lg">
          <h2 id="exo-title">Modalidad Exonerados</h2>
          <div class="md md--light" [innerHTML]="content()?.blocks?.['steps_exo'] | md"></div>
          <a routerLink="/documentos/requisitos" class="btn btn--light">Ver requisitos de exonerados</a>
        </div>
      </div>
    </section>
    <section class="section field-stone" aria-labelledby="day-title">
      <div class="frame day">
        <h2 id="day-title">El día del examen</h2>
        <div class="md" [innerHTML]="content()?.blocks?.['exam_day'] | md"></div>
      </div>
    </section>
    <section class="section--tight">
      <div class="frame cta">
        <h2>¿Listo para inscribirte?</h2>
        <a routerLink="/inscripcion" class="btn">Ir a la inscripción</a>
      </div>
    </section>
  `,
  styles: `
    /* Cada modalidad: la infografía oficial completa a tamaño de lectura y los mismos pasos en texto. */
    .mod { padding-block: clamp(3.5rem, 8vw, 7rem); }
    .mod__grid { display: grid; grid-template-columns: minmax(0, 7fr) minmax(0, 5fr); gap: clamp(2rem, 5vw, 5rem); align-items: center; }
    .mod__grid--flip { grid-template-columns: minmax(0, 5fr) minmax(0, 7fr); }
    .mod__grid--flip .mod__info { order: 2; }
    .mod__info { margin: 0; }
    .mod__info img { width: 100%; height: auto; display: block; }
    .mod__text h2 { font-size: clamp(2rem, 3.6vw, 3.25rem); letter-spacing: -0.03em; line-height: 1; }
    .mod__text .btn { justify-self: start; }
    :host ::ng-deep .md ol { margin: 0; padding-left: 1.5rem; display: grid; gap: 1.1rem; font-size: 1.1875rem; }
    :host ::ng-deep .md p + p { margin-top: 1rem; }
    :host ::ng-deep .md--light a { color: var(--gold); }
    .day { display: grid; grid-template-columns: minmax(0, 5fr) minmax(0, 7fr); gap: clamp(2rem, 6vw, 6rem); }
    .day h2 { white-space: nowrap; }
    @media (max-width: 480px) { .day h2 { white-space: normal; } }
    .cta { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 1.5rem; }
    @media (max-width: 860px) {
      .mod__grid, .day { grid-template-columns: 1fr; }
      .mod__grid--flip .mod__info { order: 0; }
    }
  `,
})
export class StepsPage {
  protected readonly content = signal<HomeContentDto | null>(null);
  constructor() {
    inject(ApiService).home().subscribe((c) => this.content.set(c));
  }
}
