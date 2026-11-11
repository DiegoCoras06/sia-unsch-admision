import { Component, effect, input, output } from '@angular/core';

/** Aviso flotante del panel: la confirmación se cierra sola a los 6 s; el error queda hasta que se cierre. */
@Component({
  selector: 'app-adm-toast',
  template: `
    @if (text()) {
      <div class="adm-toast" [class.err]="error()" [attr.role]="error() ? 'alert' : 'status'">
        <p>{{ text() }}</p>
        <button type="button" class="adm-toast__x" aria-label="Cerrar aviso" (click)="closed.emit()">×</button>
      </div>
    }
  `,
})
export class AdmToast {
  readonly text = input<string | null>(null);
  readonly error = input(false);
  readonly closed = output<void>();

  constructor() {
    effect((onCleanup) => {
      if (!this.text() || this.error()) return;
      const id = setTimeout(() => this.closed.emit(), 6000);
      onCleanup(() => clearTimeout(id));
    });
  }
}
