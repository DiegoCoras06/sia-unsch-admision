import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

/** Menú lateral de documentos y consultas, como el del portal oficial. */
@Component({
  selector: 'app-docs-sidebar',
  imports: [RouterLink, RouterLinkActive],
  template: `
    <nav class="side" aria-label="Documentos y consultas">
      <h2 class="side__title">Documentos y consultas</h2>
      <ul>
        @for (l of links; track l.path) {
          <li><a [routerLink]="l.path" routerLinkActive="is-active" ariaCurrentWhenActive="page">{{ l.label }}</a></li>
        }
      </ul>
    </nav>
  `,
  styles: `
    .side { background: var(--accent); color: var(--accent-ink); padding: 1.75rem; position: sticky; top: 6rem; }
    .side__title { font-size: 1.125rem; letter-spacing: -0.01em; margin-bottom: 1rem; }
    ul { list-style: none; margin: 0; padding: 0; display: grid; gap: 0.15rem; }
    a { display: block; padding: 0.6rem 0.75rem; font-weight: 600; text-decoration: none; transition: background-color var(--fast) var(--ease); }
    a:hover { background: var(--accent-press); }
    a.is-active { background: var(--ground); color: var(--accent); }
    @media (max-width: 960px) { .side { position: static; } ul { grid-template-columns: 1fr 1fr; } }
  `,
})
export class DocsSidebar {
  protected readonly links = [
    { path: '/documentos/cronograma', label: 'Cronograma' },
    { path: '/documentos/reglamento', label: 'Reglamento' },
    { path: '/mi-inscripcion', label: 'Mi inscripción: pagar e imprimir' },
    { path: '/buscar-aula', label: 'Buscar aula' },
    { path: '/resultados', label: 'Ver puntaje' },
    { path: '/pasos', label: 'Pasos de inscripción' },
    { path: '/documentos/requisitos', label: 'Requisitos' },
    { path: '/documentos/tasas', label: 'Tasas de pago' },
    { path: '/documentos/temario', label: 'Temario' },
    { path: '/documentos/vacantes', label: 'Vacantes' },
    { path: '/documentos/programas', label: 'Programas de estudios' },
  ];
}
