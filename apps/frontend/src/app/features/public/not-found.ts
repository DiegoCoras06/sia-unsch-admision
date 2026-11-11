import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

/** Quien llega aquí buscaba un trámite: se le ofrecen los más comunes en lugar de solo «volver al inicio». */
const LINKS = [
  { path: '/inscripcion', title: 'Inscribirme', note: 'Formulario de inscripción' },
  { path: '/mi-inscripcion', title: 'Mi inscripción', note: 'Pagar e imprimir documentos' },
  { path: '/cronograma', title: 'Cronograma', note: 'Fechas y etapas del proceso' },
  { path: '/programas', title: 'Programas', note: 'Carreras y vacantes' },
];

@Component({
  selector: 'app-not-found',
  imports: [RouterLink],
  template: `
    <section class="frame section nf">
      <div class="nf__head">
        <img src="img/escudo-unsch-oficial-240.webp" srcset="img/escudo-unsch-oficial-240.webp 1x, img/escudo-unsch-oficial.png 2x" alt="" width="90" height="121">
        <div>
          <p class="nf__code">Error 404</p>
          <h1>No encontramos esa página</h1>
          <p class="lead">Puede que el enlace haya cambiado o esté incompleto. Estos son los trámites más buscados:</p>
        </div>
      </div>
      <nav aria-label="Trámites más buscados">
        <ul class="nf__links">
          @for (l of links; track l.path) {
            <li><a [routerLink]="l.path"><strong>{{ l.title }}</strong><span>{{ l.note }}</span></a></li>
          }
        </ul>
      </nav>
      <p><a routerLink="/" class="btn">Ir al inicio</a></p>
    </section>
  `,
  styles: `
    .nf { display: grid; gap: 2rem; }
    .nf__head { display: flex; flex-wrap: wrap; gap: 1.5rem 2rem; align-items: center; }
    .nf__head img { height: auto; }
    .nf__head div { flex: 1 1 20rem; display: grid; gap: 0.5rem; }
    .nf__code { margin: 0; font-size: var(--size-note); font-weight: 700; color: var(--accent); }
    .nf__head h1 { font-size: clamp(2rem, 4.5vw, 3.25rem); letter-spacing: -0.03em; line-height: 1.05; }
    .nf__links { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr)); gap: 0.75rem; }
    .nf__links a { display: grid; gap: 0.2rem; height: 100%; padding: 1rem 1.15rem; border: 1px solid var(--stone-deep); border-radius: var(--radius-lg); color: var(--ink); text-decoration: none;
      transition: border-color var(--fast) var(--ease), background-color var(--fast) var(--ease); }
    .nf__links a:hover { border-color: var(--accent); background: #fbf8f4; }
    .nf__links span { font-size: var(--size-note); color: var(--ink-soft); }
  `,
})
export class NotFoundPage {
  protected readonly links = LINKS;
}
