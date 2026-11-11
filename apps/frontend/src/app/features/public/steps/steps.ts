import { Component, inject, signal } from '@angular/core';
import { PhotoDirective } from '../../../shared/photo.directive';
import { RouterLink } from '@angular/router';
import type { HomeContentDto } from '@sia/contracts';
import { ApiService } from '../../../core/api.service';
import { MarkdownPipe } from '../../../shared/markdown.pipe';

/** Spec 001, FR-009: las infografías de pasos del portal actual, como listas accesibles. */
@Component({
  selector: 'app-steps',
  imports: [RouterLink, MarkdownPipe, PhotoDirective],
  template: `
    <header class="frame page-head">
      <h1>Cómo inscribirte</h1>
      <p class="lead">Ordinario en cuatro pasos y Exonerados en cinco. Te inscribes en línea, sin crear cuenta, y consultas tu avance con tu DNI y tu código de postulante.</p>
    </header>
    <section id="ordinario" class="section--tight mod" aria-labelledby="ord-title">
      <div class="frame mod__grid">
        <figure class="mod__info">
          <img appPhoto src="img/pasos-ordinario-1040.webp" srcset="img/pasos-ordinario-640.webp 640w, img/pasos-ordinario-1040.webp 1040w" sizes="(max-width: 760px) 100vw, 50vw" width="1042" height="822" decoding="async"
            alt="Infografía oficial del proceso de inscripción en la modalidad Ordinario, en cuatro pasos">
        </figure>
        <div class="mod__text stack-lg">
          <div class="mod__head">
            <p class="mod__kicker"><span>4 pasos</span>Inscripción en línea, sin crear cuenta</p>
            <h2 id="ord-title">Modalidad Ordinario</h2>
          </div>
          <div class="md md--steps" [innerHTML]="content()?.blocks?.['steps_ord'] | md"></div>
          <a routerLink="/inscripcion" class="btn" data-icon="inscripcion">Inscribirme en Ordinario</a>
        </div>
      </div>
    </section>
    <section id="exonerados" class="section--tight mod field-accent" aria-labelledby="exo-title">
      <div class="frame mod__grid mod__grid--flip">
        <figure class="mod__info">
          <img appPhoto src="img/pasos-exonerado-1040.webp" srcset="img/pasos-exonerado-640.webp 640w, img/pasos-exonerado-1040.webp 1040w" sizes="(max-width: 760px) 100vw, 50vw" width="1043" height="822" loading="lazy" decoding="async"
            alt="Infografía oficial del proceso de inscripción en la modalidad Exonerado, en cinco pasos">
        </figure>
        <div class="mod__text stack-lg">
          <div class="mod__head">
            <p class="mod__kicker"><span>5 pasos</span>Primero, la autorización de tu expediente</p>
            <h2 id="exo-title">Modalidad Exonerados</h2>
          </div>
          <div class="md md--light md--steps" [innerHTML]="content()?.blocks?.['steps_exo'] | md"></div>
          <a routerLink="/documentos/requisitos" class="btn btn--light" data-icon="requisitos">Ver requisitos de exonerados</a>
        </div>
      </div>
    </section>
    <section class="section field-stone" aria-labelledby="day-title">
      <div class="frame day">
        <h2 id="day-title">El día del examen</h2>
        <div class="md md--cards" [innerHTML]="content()?.blocks?.['exam_day'] | md"></div>
      </div>
    </section>
    <section class="section--tight">
      <div class="frame">
        <div class="cta">
          <div>
            <h2>¿Listo para inscribirte?</h2>
            <p>Ten a la mano tu DNI y una foto tipo carné. Al terminar recibes tu código de postulante y tu orden de pago.</p>
          </div>
          <a routerLink="/inscripcion" class="btn btn--gold" data-icon="inscripcion">Ir a la inscripción</a>
        </div>
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
    .mod__head { display: grid; gap: 0.75rem; }
    .mod__kicker { display: flex; flex-wrap: wrap; align-items: center; gap: 0.6rem; margin: 0; font-size: var(--size-note); font-weight: 600; color: var(--ink-soft); }
    .mod__kicker span { padding: 0.2rem 0.7rem; border-radius: 999px; background: var(--accent); color: var(--accent-ink); font-weight: 700; }
    .field-accent .mod__kicker { color: rgb(255 255 255 / 0.85); }
    .field-accent .mod__kicker span { background: var(--gold); color: var(--ink); }
    /* Pasos como línea de tiempo: número en círculo, línea que los une y el título del paso arriba de su explicación.
       El texto lo edita el panel en Markdown («1. **Título.** Explicación»), por eso los estilos alcanzan su HTML. */
    :host ::ng-deep .md--steps ol { list-style: none; margin: 0; padding: 0; counter-reset: paso; display: grid; gap: 0; }
    :host ::ng-deep .md--steps li { position: relative; counter-increment: paso; padding: 0 0 1.5rem 3.6rem; font-size: 1.0625rem; line-height: 1.55; color: var(--ink-soft); }
    :host ::ng-deep .md--steps li:last-child { padding-bottom: 0; }
    :host ::ng-deep .md--steps li::before { content: counter(paso); position: absolute; left: 0; top: -0.1rem; display: grid; place-items: center; width: 2.4rem; height: 2.4rem;
      border-radius: 50%; background: var(--accent); color: var(--accent-ink); font-weight: 800; font-size: 1.0625rem; box-shadow: 0 0 0 5px var(--stone); }
    :host ::ng-deep .md--steps li:not(:last-child)::after { content: ''; position: absolute; left: calc(1.2rem - 1px); top: 2.6rem; bottom: 0.2rem; width: 2px; background: var(--stone-deep); }
    :host ::ng-deep .md--steps li strong { display: block; margin-bottom: 0.2rem; font-size: 1.1875rem; line-height: 1.3; color: var(--ink); }
    :host ::ng-deep .md--light.md--steps li { color: rgb(255 255 255 / 0.88); }
    :host ::ng-deep .md--light.md--steps li strong { color: #fff; }
    :host ::ng-deep .md--light.md--steps li::before { background: var(--gold); color: var(--ink); box-shadow: 0 0 0 5px rgb(255 255 255 / 0.1); }
    :host ::ng-deep .md--light.md--steps li:not(:last-child)::after { background: rgb(255 255 255 / 0.25); }
    /* El día del examen: cada indicación en una tarjeta blanca con el título en guinda. */
    :host ::ng-deep .md--cards { display: grid; gap: 0.85rem; }
    :host ::ng-deep .md--cards p { margin: 0; padding: 1.1rem 1.25rem; border-radius: var(--radius-lg); background: var(--ground); border-left: 3px solid var(--accent); line-height: 1.55; max-width: none; }
    :host ::ng-deep .md--cards p strong { display: block; margin-bottom: 0.25rem; color: var(--accent); font-size: 1.0625rem; }
    :host ::ng-deep .md:not(.md--cards) p + p { margin-top: 1rem; }
    :host ::ng-deep .md--light a { color: var(--gold); }
    .day { display: grid; grid-template-columns: minmax(0, 5fr) minmax(0, 7fr); gap: clamp(2rem, 6vw, 6rem); }
    .day h2 { white-space: nowrap; }
    @media (max-width: 480px) { .day h2 { white-space: normal; } }
    .cta { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 1.5rem 2.5rem; padding: clamp(1.5rem, 4vw, 2.5rem); border-radius: var(--radius-lg); background: var(--accent); color: var(--accent-ink); }
    .cta h2 { margin: 0; color: #fff; }
    .cta p { margin: 0.4rem 0 0; opacity: 0.9; max-width: 56ch; }
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
