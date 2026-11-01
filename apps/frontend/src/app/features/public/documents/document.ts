import { Component, computed, effect, inject, input } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { docBySlug } from '../../../core/documents';
import { DocsSidebar } from '../../../shared/docs-sidebar';
import { PdfViewer } from '../../../shared/pdf-viewer';

/** Spec 001, FR-014: documento oficial como PDF dentro de la página, como el portal oficial. */
@Component({
  selector: 'app-document',
  imports: [RouterLink, PdfViewer, DocsSidebar],
  template: `
    <div class="page field-accent">
      <div class="frame grid">
        <div class="main">
          @if (doc(); as d) {
            <h1>{{ d.title }}</h1>
            @if (d.html) {
              <p class="lead">También puedes verlo como página interactiva: <a [routerLink]="d.html">abrir la versión web</a>.</p>
            }
            <app-pdf-viewer [file]="d.file" [title]="d.title" />
          } @else {
            <h1>Documento no encontrado</h1>
            <p class="lead"><a routerLink="/documentos/reglamento">Ver el reglamento</a></p>
          }
        </div>
        <app-docs-sidebar />
      </div>
    </div>
  `,
  styles: `
    .page { padding-block: clamp(2.5rem, 6vw, 5rem); }
    .grid { display: grid; grid-template-columns: minmax(0, 1fr) 18rem; gap: clamp(1.5rem, 3vw, 3rem); align-items: start; }
    .main { display: grid; gap: 1.5rem; }
    h1 { font-size: clamp(2rem, 4.2vw, 3.75rem); }
    .lead a { color: var(--gold); font-weight: 700; }
    @media (max-width: 960px) { .grid { grid-template-columns: 1fr; } }
  `,
})
export class DocumentPage {
  readonly slug = input.required<string>();
  protected readonly doc = computed(() => docBySlug(this.slug()));
  private readonly title = inject(Title);

  constructor() {
    effect(() => this.title.setTitle(`${this.doc()?.title ?? 'Documento'} - Admisión UNSCH`));
  }
}
