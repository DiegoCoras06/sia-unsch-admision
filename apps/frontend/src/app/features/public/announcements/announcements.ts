import { Component, effect, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import type { AnnouncementDto, PageMeta } from '@sia/contracts';
import { ApiService } from '../../../core/api.service';
import { dateTime } from '../../../core/format';
import { MarkdownPipe } from '../../../shared/markdown.pipe';

const TYPE_LABEL: Record<string, string> = { COMUNICADO: 'Comunicado', FE_ERRATAS: 'Fe de erratas', RESULTADO: 'Resultados' };

/** Spec 001, Historia 5 - FR-008. */
@Component({
  selector: 'app-announcements',
  imports: [MarkdownPipe],
  template: `
    <header class="frame page-head">
      <p class="page-kicker" data-icon="carta">Avisos oficiales</p>
      <h1>Comunicados</h1>
      <p class="lead">Avisos oficiales del concurso, del más reciente al más antiguo. Las fe de erratas señalan qué sección cambia.</p>
    </header>
    <section class="frame section--tight" aria-labelledby="list-title">
      <h2 id="list-title" class="sr-only">Lista de comunicados</h2>
      <div class="filter" role="group" aria-label="Tipo de comunicado">
        @for (t of types; track t.value) {
          <button type="button" [class.is-on]="type() === t.value" [attr.aria-pressed]="type() === t.value" (click)="setType(t.value)">{{ t.label }}</button>
        }
      </div>
      <ul class="items">
        @for (a of items(); track a.id) {
          <li>
            <p class="meta"><strong>{{ label(a.type) }}</strong> · {{ dateTime(a.publishedAt) }}</p>
            <h3>{{ a.title }}</h3>
            <div [innerHTML]="a.bodyMarkdown | md"></div>
          </li>
        } @empty {
          <li><p>No hay comunicados de este tipo.</p></li>
        }
      </ul>
      @if (meta(); as m) {
        @if (m.total > m.pageSize) {
          <div class="pager">
            <button type="button" class="btn btn--quiet" [disabled]="page() === 1" (click)="page.set(page() - 1)">Anteriores</button>
            <button type="button" class="btn btn--quiet" [disabled]="page() * m.pageSize >= m.total" (click)="page.set(page() + 1)">Siguientes</button>
          </div>
        }
      }
    </section>
  `,
  styles: `
    .filter { display: flex; flex-wrap: wrap; gap: 0.25rem; margin-bottom: 2.5rem; }
    .filter button { min-height: 2.75rem; padding: 0 1.1rem; font: inherit; font-weight: 600; border: 0; background: var(--stone); cursor: pointer; }
    .filter button:hover { background: var(--stone-deep); }
    .filter button.is-on { background: var(--accent); color: var(--accent-ink); }
    .items { list-style: none; margin: 0; padding: 0; display: grid; gap: 0.35rem; }
    .items li { background: var(--stone); padding: clamp(1.5rem, 3vw, 2.5rem); display: grid; gap: 0.75rem; }
    .meta { color: var(--ink-soft); }
    .pager { display: flex; gap: 0.5rem; margin-top: 2rem; }
  `,
})
export class AnnouncementsPage {
  private readonly api = inject(ApiService);
  protected readonly items = signal<AnnouncementDto[]>([]);
  protected readonly meta = signal<PageMeta | null>(null);
  protected readonly type = signal('');
  protected readonly page = signal(1);
  protected readonly dateTime = dateTime;
  protected readonly types = [
    { value: '', label: 'Todos' },
    { value: 'COMUNICADO', label: 'Comunicados' },
    { value: 'FE_ERRATAS', label: 'Fe de erratas' },
    { value: 'RESULTADO', label: 'Resultados' },
  ];
  protected readonly label = (t: string) => TYPE_LABEL[t] ?? t;

  constructor() {
    // Enlace directo desde el menú: /comunicados?tipo=FE_ERRATAS.
    const tipo = inject(ActivatedRoute).snapshot.queryParamMap.get('tipo');
    if (tipo && this.types.some((t) => t.value === tipo)) this.type.set(tipo);
    effect(() => {
      this.api.announcements({ type: this.type(), page: this.page() }).subscribe((r) => {
        this.items.set(r.data);
        this.meta.set(r.meta ?? null);
      });
    });
  }

  protected setType(t: string): void {
    this.type.set(t);
    this.page.set(1);
  }
}
