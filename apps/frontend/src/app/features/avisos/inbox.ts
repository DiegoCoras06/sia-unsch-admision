import { Component, OnInit, inject, input, signal } from '@angular/core';
import { firstValueFrom, type Observable } from 'rxjs';
import { ApiService, apiErrorMessage, type InboxDto } from '../../core/api.service';
import { dateTime } from '../../core/format';

/** Spec 010, Historias 2 y 5: avisos del postulante con leídos y no leídos, y la preferencia de recordatorios. */
@Component({
  selector: 'app-inbox',
  template: `
    @if (box(); as b) {
      <section class="inbox" aria-labelledby="inbox-title">
        <header>
          <h3 id="inbox-title">Tus avisos @if (b.unread) { <span class="count">{{ b.unread }} sin leer</span> }</h3>
          <div class="actions">
            @if (b.unread) { <button type="button" class="link" (click)="readAll()">Marcar todo como leído</button> }
            <label class="pref"><input type="checkbox" [checked]="b.reminders" (change)="toggle($any($event.target).checked)"> Recibir recordatorios</label>
          </div>
        </header>
        <p class="note">Los avisos obligatorios del proceso (pagos, expediente, aula y resultados) siempre te llegan por correo.</p>
        <ul>
          @for (n of b.items; track n.id) {
            <li [class.is-unread]="!n.read">
              <details (toggle)="n.read || read(n.id)">
                <summary><span class="when">{{ when(n.at) }}</span> {{ n.subject }}</summary>
                <p class="body">{{ n.text }}</p>
              </details>
            </li>
          } @empty { <li class="empty">Aún no tienes avisos.</li> }
        </ul>
      </section>
    }
    @if (error()) { <p class="alert alert--error">{{ error() }}</p> }
  `,
  styles: `
    .inbox { background: var(--ground); color: var(--ink); padding: clamp(1.25rem, 3vw, 1.75rem); display: grid; gap: 0.75rem; }
    header { display: flex; flex-wrap: wrap; gap: 0.75rem; justify-content: space-between; align-items: center; }
    h3 { font-size: 1.375rem; display: flex; gap: 0.6rem; align-items: center; }
    .count { font-size: 0.8125rem; background: var(--accent); color: var(--accent-ink); padding: 0.15rem 0.55rem; }
    .actions { display: flex; flex-wrap: wrap; gap: 1rem; align-items: center; font-size: 0.9375rem; }
    .pref { display: flex; gap: 0.4rem; align-items: center; }
    .link { background: none; border: 0; padding: 0; font: inherit; color: var(--accent); font-weight: 700; text-decoration: underline; cursor: pointer; }
    ul { list-style: none; margin: 0; padding: 0; display: grid; gap: 2px; max-height: 24rem; overflow-y: auto; }
    li { background: var(--stone); }
    li.is-unread { border-left: 4px solid var(--accent); }
    li.is-unread summary { font-weight: 700; }
    summary { cursor: pointer; padding: 0.7rem 0.9rem; }
    .when { color: var(--ink-soft); font-size: 0.8125rem; margin-right: 0.4rem; font-weight: 400; }
    .body { padding: 0 0.9rem 0.9rem; white-space: pre-line; }
    .empty { padding: 0.9rem; color: var(--ink-soft); }
    @media print { :host { display: none; } }
  `,
})
export class InboxPanel implements OnInit {
  private readonly api = inject(ApiService);
  readonly documentNumber = input.required<string>();
  readonly applicantCode = input.required<string>();
  protected readonly box = signal<InboxDto | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly when = dateTime;

  async ngOnInit() {
    await this.run(() => this.api.inbox(this.documentNumber(), this.applicantCode()));
  }

  protected read(id: string) {
    return this.run(() => this.api.inboxRead(this.documentNumber(), this.applicantCode(), [id]));
  }

  protected readAll() {
    return this.run(() => this.api.inboxRead(this.documentNumber(), this.applicantCode(), (this.box()?.items ?? []).filter((n) => !n.read).map((n) => n.id)));
  }

  protected toggle(on: boolean) {
    return this.run(() => this.api.inboxReminders(this.documentNumber(), this.applicantCode(), on));
  }

  private async run(call: () => Observable<InboxDto>) {
    try {
      this.box.set(await firstValueFrom(call()));
      this.error.set(null);
    } catch (e) {
      this.error.set(apiErrorMessage(e));
    }
  }
}
