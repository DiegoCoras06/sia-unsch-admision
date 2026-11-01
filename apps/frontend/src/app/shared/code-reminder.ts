import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService, apiErrorMessage } from '../core/api.service';

/**
 * «¿No encuentras tu código?» (quinta crítica, P1): con el número de documento, el código de postulante
 * se reenvía al correo registrado. La respuesta es la misma exista o no la inscripción.
 */
@Component({
  selector: 'app-code-reminder',
  imports: [FormsModule],
  template: `
    <details class="remind">
      <summary>¿No encuentras tu código de postulante?</summary>
      <p>Te lo enviamos de nuevo al correo que registraste en tu inscripción.</p>
      <form class="remind__form" (ngSubmit)="send()">
        <label for="rc-doc">DNI o carné de extranjería</label>
        <div class="remind__row">
          <input id="rc-doc" class="input" name="doc" [(ngModel)]="doc" inputmode="numeric" maxlength="12" autocomplete="off" required>
          <button class="btn btn--gold" type="submit" [disabled]="busy()">{{ busy() ? 'Enviando…' : 'Enviarme el código' }}</button>
        </div>
      </form>
      @if (done()) { <p class="remind__ok" role="status">{{ done() }}</p> }
      @if (error()) { <p class="alert alert--error" role="alert">{{ error() }}</p> }
    </details>
  `,
  styles: `
    .remind { display: grid; gap: 0.75rem; }
    .remind summary { cursor: pointer; font-weight: 700; text-decoration: underline; text-underline-offset: 0.2em; min-height: 2.75rem; display: flex; align-items: center; }
    .remind[open] { padding: 1rem 1.25rem; background: var(--accent-press); }
    .remind__form { display: grid; gap: 0.4rem; }
    .remind__form label { font-weight: 600; }
    .remind__row { display: flex; flex-wrap: wrap; gap: 0.5rem; }
    .remind__row .input { flex: 1 1 12rem; width: auto; background: #fff; border-color: #fff; }
    .remind__row .input:focus { border-color: var(--gold); }
    .remind__ok { font-weight: 600; }
  `,
})
export class CodeReminder {
  private readonly api = inject(ApiService);
  protected doc = '';
  protected readonly busy = signal(false);
  protected readonly done = signal<string | null>(null);
  protected readonly error = signal<string | null>(null);

  protected send(): void {
    const doc = this.doc.trim();
    if (doc.length < 6) {
      this.error.set('Escribe tu número de documento.');
      return;
    }
    this.busy.set(true);
    this.error.set(null);
    this.done.set(null);
    this.api.remindCode(doc).subscribe({
      next: (r) => {
        this.done.set(r.message);
        this.busy.set(false);
      },
      error: (e) => {
        this.error.set(apiErrorMessage(e));
        this.busy.set(false);
      },
    });
  }
}
