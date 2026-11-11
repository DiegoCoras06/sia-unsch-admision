import { Component, ElementRef, Injectable, effect, inject, signal, viewChild } from '@angular/core';

interface Ask {
  title: string;
  message: string;
  action: string;
  danger: boolean;
  resolve: (ok: boolean) => void;
}

/**
 * Confirmaciones del panel con la identidad del portal, en lugar del cuadro nativo del navegador.
 * Uso: `if (!(await this.ask.confirm('¿Retirar el comunicado?', { action: 'Retirar', danger: true }))) return;`
 */
@Injectable({ providedIn: 'root' })
export class AdmConfirm {
  readonly current = signal<Ask | null>(null);

  confirm(message: string, opts: { title?: string; action?: string; danger?: boolean } = {}): Promise<boolean> {
    this.current()?.resolve(false);
    return new Promise<boolean>((resolve) => {
      this.current.set({
        title: opts.title ?? 'Confirma la acción',
        message,
        action: opts.action ?? 'Confirmar',
        danger: opts.danger ?? false,
        resolve,
      });
    });
  }

  close(ok: boolean): void {
    const a = this.current();
    if (!a) return;
    this.current.set(null);
    a.resolve(ok);
  }
}

/**
 * Ventana modal nativa (<dialog>): atrapa el foco, se cierra con Esc y devuelve el foco al botón que la abrió.
 * Fondo del panel desenfocado y tarjeta de vidrio, como el ingreso.
 */
@Component({
  selector: 'app-adm-confirm',
  template: `
    <dialog #dlg class="adm-confirm" aria-labelledby="adm-confirm-title" aria-describedby="adm-confirm-msg"
      (cancel)="$event.preventDefault(); svc.close(false)" (click)="backdrop($event)">
      @if (svc.current(); as a) {
        <div class="adm-confirm__card" [class.is-danger]="a.danger">
          <span class="adm-confirm__icon" aria-hidden="true">{{ a.danger ? '!' : '?' }}</span>
          <h2 id="adm-confirm-title">{{ a.title }}</h2>
          <p id="adm-confirm-msg">{{ a.message }}</p>
          <div class="adm-confirm__actions">
            <button type="button" class="adm-confirm__no" (click)="svc.close(false)" autofocus>Cancelar</button>
            <button type="button" class="adm-confirm__yes" (click)="svc.close(true)">{{ a.action }}</button>
          </div>
        </div>
      }
    </dialog>
  `,
})
export class AdmConfirmHost {
  protected readonly svc = inject(AdmConfirm);
  private readonly dlg = viewChild.required<ElementRef<HTMLDialogElement>>('dlg');

  constructor() {
    effect(() => {
      const d = this.dlg().nativeElement;
      if (this.svc.current()) { if (!d.open) d.showModal(); }
      else if (d.open) d.close();
    });
  }

  /** Clic fuera de la tarjeta (sobre el fondo) equivale a cancelar. */
  protected backdrop(e: MouseEvent): void {
    if (e.target === this.dlg().nativeElement) this.svc.close(false);
  }
}
