import { Component, input, signal, type OnInit } from '@angular/core';
import type { SessionDto } from '@sia/contracts';
import { apiErrorMessage } from '../core/api.service';
import { dateTime } from '../core/format';

/** Dispositivos con sesión abierta, para el postulante y para el personal: cada uno pasa cómo cargar y cerrar. */
@Component({
  selector: 'app-active-sessions',
  template: `
    @if (error()) { <p class="as__error" role="alert">{{ error() }}</p> }
    @if (list(); as rows) {
      <ul class="as">
        @for (s of rows; track s.id) {
          <li>
            <span class="as__who">
              <strong>{{ s.device }}</strong>
              <span>{{ s.current ? 'Este dispositivo' : 'Última actividad: ' + when(s.lastActiveAt) }}</span>
            </span>
            @if (!s.current) { <button type="button" class="as__out" [disabled]="busy()" (click)="end(s)" [attr.aria-label]="'Cerrar la sesión de ' + s.device">Cerrar</button> }
          </li>
        } @empty { <li class="as__none">No hay otras sesiones abiertas.</li> }
      </ul>
      @if (rows.length > 1) { <p class="as__note">La sesión cerrada termina en 15 minutos como máximo.</p> }
    } @else if (!error()) {
      <div class="skel" role="status" aria-label="Cargando las sesiones"><span></span><span></span></div>
    }
  `,
  styles: `
    :host { display: grid; gap: 0.5rem; }
    .as { list-style: none; margin: 0; padding: 0; display: grid; }
    .as li { display: flex; justify-content: space-between; align-items: center; gap: 1rem; padding: 0.6rem 0; border-bottom: 1px solid var(--stone-deep); }
    .as li:last-child { border-bottom: 0; }
    .as__who { display: grid; gap: 0.1rem; min-width: 0; }
    .as__who span { font-size: var(--size-note); color: var(--ink-soft); }
    .as__out { min-height: 2.75rem; padding: 0 0.75rem; font: inherit; font-size: var(--size-note); font-weight: 600; color: var(--accent); background: none; border: 1px solid var(--field-line); border-radius: var(--radius); cursor: pointer; }
    .as__out:hover { background: var(--stone); }
    .as__none, .as__note { color: var(--ink-soft); font-size: var(--size-note); margin: 0; }
    .as__error { margin: 0; color: var(--danger); font-size: var(--size-note); }
  `,
})
export class ActiveSessions implements OnInit {
  readonly load = input.required<() => Promise<SessionDto[]>>();
  readonly close = input.required<(id: string) => Promise<void>>();
  protected readonly list = signal<SessionDto[] | null>(null);
  protected readonly busy = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly when = dateTime;

  ngOnInit() { void this.reload(); }

  private async reload() {
    try {
      this.list.set(await this.load()());
      this.error.set(null);
    } catch (e) {
      this.error.set(apiErrorMessage(e, 'No pudimos cargar tus sesiones.'));
    }
  }

  protected async end(s: SessionDto) {
    this.busy.set(true);
    try {
      await this.close()(s.id);
      await this.reload();
    } catch (e) {
      this.error.set(apiErrorMessage(e, 'No pudimos cerrar esa sesión.'));
    } finally {
      this.busy.set(false);
    }
  }
}
