import { Component, computed, inject, input } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

/**
 * Visor de PDF incrustado (visor nativo del navegador) con botón para abrirlo completo.
 * Solo acepta rutas locales de `docs/` (lista cerrada en core/documents.ts), por eso se marca como recurso confiable.
 */
@Component({
  selector: 'app-pdf-viewer',
  template: `
    <div class="viewer">
      <div class="viewer__bar">
        <p class="viewer__name">{{ title() }}</p>
        <div class="viewer__actions">
          <a class="btn" [href]="file()" target="_blank" rel="noopener">Ver documento completo</a>
          <a class="btn btn--quiet" [href]="file()" download data-icon="descargar">Descargar</a>
        </div>
      </div>
      @if (safeUrl(); as url) {
        <iframe class="viewer__frame" [src]="url" [title]="'Documento PDF: ' + title()" loading="lazy"></iframe>
      }
      <p class="viewer__fallback note">Si tu celular no muestra el PDF aquí, usa «Ver documento completo».</p>
    </div>
  `,
  styles: `
    .viewer { background: #2b2b2b; }
    .viewer__bar { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 1rem; padding: 1rem 1.25rem; background: var(--ink); color: #fff; }
    .viewer__name { font-weight: 700; }
    .viewer__actions { display: flex; flex-wrap: wrap; gap: 0.5rem; }
    .viewer__actions .btn { min-height: 2.75rem; }
    .viewer__actions .btn--quiet { background: #3a3a3a; color: #fff; }
    .viewer__actions .btn--quiet:hover { background: #4a4a4a; }
    .viewer__frame { display: block; width: 100%; height: min(82vh, 1100px); border: 0; background: #525659; }
    .viewer__fallback { padding: 0.75rem 1.25rem; color: #ddd; background: var(--ink); max-width: none; }
    @media (max-width: 640px) { .viewer__frame { height: 70vh; } }
  `,
})
export class PdfViewer {
  readonly file = input.required<string>();
  readonly title = input.required<string>();
  private readonly sanitizer = inject(DomSanitizer);
  protected readonly safeUrl = computed(() =>
    this.file().startsWith('docs/') && this.file().endsWith('.pdf')
      ? this.sanitizer.bypassSecurityTrustResourceUrl(`${this.file()}#view=FitH`)
      : null,
  );
}
