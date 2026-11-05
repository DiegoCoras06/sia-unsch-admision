import { Component, input, output, signal } from '@angular/core';

/** Códigos de respaldo recién generados (ADR-022): solo se muestran esta vez, por eso se pide confirmar que se guardaron. */
@Component({
  selector: 'app-recovery-codes',
  template: `
    <p class="rc__lead"><strong>Guarda estos códigos.</strong> Si pierdes el celular, cada uno te permite entrar una sola vez. No se volverán a mostrar.</p>
    <ol class="rc__list" aria-label="Códigos de respaldo">
      @for (c of codes(); track c) { <li><code>{{ c }}</code></li> }
    </ol>
    <div class="rc__actions">
      <button type="button" class="btn btn--quiet" (click)="copy()">{{ copied() ? 'Copiados' : 'Copiar' }}</button>
      <button type="button" class="btn btn--quiet" (click)="download()" data-icon="descargar">Descargar</button>
    </div>
    <label class="rc__check"><input type="checkbox" [checked]="saved()" (change)="saved.set(!saved())"> Ya los guardé en un lugar seguro</label>
    <button type="button" class="btn rc__done" [disabled]="!saved()" (click)="done.emit()">{{ doneLabel() }}</button>
  `,
  styles: `
    :host { display: grid; gap: 1rem; }
    .rc__lead { margin: 0; color: var(--ink-soft); }
    .rc__lead strong { color: var(--ink); }
    .rc__list { list-style: none; margin: 0; padding: 0.9rem 1rem; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.5rem 1rem;
      border: 1px solid var(--stone-deep); border-radius: var(--radius-lg); background: var(--stone); }
    .rc__list code { font-size: 0.9375rem; font-weight: 600; letter-spacing: 0.04em; font-variant-numeric: tabular-nums; }
    .rc__actions { display: grid; grid-template-columns: 1fr 1fr; gap: 0.6rem; }
    .rc__check { display: flex; gap: 0.5rem; align-items: center; min-height: 2.75rem; font-weight: 600; }
    .rc__check input { width: 1.125rem; height: 1.125rem; accent-color: var(--accent); }
    .rc__done { width: 100%; }
    @media (max-width: 360px) { .rc__list { grid-template-columns: minmax(0, 1fr); } }
  `,
})
export class RecoveryCodes {
  readonly codes = input.required<string[]>();
  readonly doneLabel = input('Continuar');
  readonly done = output<void>();
  protected readonly saved = signal(false);
  protected readonly copied = signal(false);

  private text = () => `Códigos de respaldo - Panel de Admisión UNSCH\nCada código sirve una sola vez.\n\n${this.codes().join('\n')}\n`;

  protected async copy() {
    await navigator.clipboard.writeText(this.text());
    this.copied.set(true);
  }

  protected download() {
    const url = URL.createObjectURL(new Blob([this.text()], { type: 'text/plain;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'codigos-respaldo-admision-unsch.txt';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}
