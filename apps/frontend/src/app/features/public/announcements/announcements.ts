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
    <section class="p-hero field-accent field-glow" aria-labelledby="an-title">
      <div class="frame p-hero__grid">
        <div class="p-hero__text">
          <p class="p-kicker" data-icon="carta">Avisos oficiales</p>
          <h1 id="an-title"><span>Comunicados</span></h1>
          <p class="p-lead">Avisos oficiales del concurso, del más reciente al más antiguo. Las fe de erratas señalan qué sección cambia.</p>
        </div>
        <ul class="p-facts" aria-label="Resumen">
          <li><b>{{ meta()?.total ?? items().length }}</b><span>{{ type() ? 'de este tipo' : 'publicados' }}</span></li>
          <li><b>{{ items()[0] ? day(items()[0].publishedAt) : '-' }}</b><span>{{ items()[0] ? 'último, ' + monthName(items()[0].publishedAt) : 'sin avisos' }}</span></li>
        </ul>
      </div>
    </section>
    <section class="frame section--tight" aria-labelledby="list-title">
      <div class="an-head">
        <h2 id="list-title" class="p-h2">Lista de comunicados</h2>
        <div class="p-pills" role="group" aria-label="Tipo de comunicado">
          @for (t of types; track t.value) {
            <button type="button" [class.is-on]="type() === t.value" [attr.aria-pressed]="type() === t.value" (click)="setType(t.value)">{{ t.label }}</button>
          }
        </div>
      </div>
      <ul class="items">
        @for (a of items(); track a.id) {
          <li class="item">
            <time class="item__date" [attr.datetime]="a.publishedAt">
              <span class="item__day">{{ day(a.publishedAt) }}</span>
              <span class="item__month">{{ month(a.publishedAt) }}</span>
            </time>
            <div class="item__body">
              <p class="item__meta"><span class="item__tag" [attr.data-type]="a.type">{{ label(a.type) }}</span><span><svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true" focusable="false"><rect x="3.5" y="5" width="17" height="15.5" rx="2.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M3.5 10h17M8 3v4M16 3v4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>{{ dateTime(a.publishedAt) }}</span></p>
              <h3>{{ a.title }}</h3>
              <div class="item__text" [innerHTML]="a.bodyMarkdown | md"></div>
            </div>
          </li>
        } @empty {
          <li class="p-card"><p>No hay comunicados de este tipo.</p></li>
        }
      </ul>
      @if (meta(); as m) {
        @if (m.total > m.pageSize) {
          <div class="pager">
            <button type="button" class="p-btn-soft" [disabled]="page() === 1" (click)="page.set(page() - 1)">Anteriores</button>
            <span class="pager__info">Página {{ page() }} de {{ pages(m) }}</span>
            <button type="button" class="p-btn-soft" [disabled]="page() * m.pageSize >= m.total" (click)="page.set(page() + 1)">Siguientes</button>
          </div>
        }
      }
    </section>
  `,
  styles: `
    .an-head { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 1rem 1.5rem; margin-bottom: 1.25rem; }
    .items { list-style: none; margin: 0; padding: 0; display: grid; gap: 1rem; }
    .item { display: grid; grid-template-columns: 4.75rem minmax(0, 1fr); gap: 1.5rem; padding: clamp(1.2rem, 3vw, 1.75rem); border-radius: 22px; background: #fff;
      box-shadow: 0 0 0 1px rgb(29 20 21 / 0.06), 0 18px 36px -28px rgb(29 20 21 / 0.55); }
    .item__date { align-self: start; display: grid; justify-items: center; padding: 0.75rem 0.25rem 0.65rem; border-radius: 16px; color: #fff;
      background: radial-gradient(6rem 4rem at 100% 0%, rgb(217 180 74 / 0.3), transparent 70%), linear-gradient(160deg, #8d242b, var(--accent) 55%, #5e1419);
      box-shadow: 0 12px 22px -14px rgb(94 20 25 / 0.9), inset 0 1px 0 rgb(255 255 255 / 0.18); }
    .item__day { font-size: 1.75rem; font-weight: 800; line-height: 1; font-variant-numeric: tabular-nums; }
    .item__month { margin-top: 0.2rem; font-size: 0.8125rem; font-weight: 700; color: var(--gold); text-transform: capitalize; }
    .item__body { display: grid; gap: 0.6rem; min-width: 0; }
    .item__meta { display: flex; flex-wrap: wrap; align-items: center; gap: 0.4rem 0.9rem; margin: 0; font-size: var(--size-note); color: var(--ink-soft); }
    .item__meta > span:last-child { display: inline-flex; align-items: center; gap: 0.35rem; }
    .item__meta svg { color: var(--accent); }
    .item__tag { padding: 0.15rem 0.6rem; border-radius: 999px; background: var(--stone); color: var(--accent); font-weight: 700; }
    .item__tag[data-type='FE_ERRATAS'] { background: #fbf1d9; color: #6b4a00; }
    .item__tag[data-type='RESULTADO'] { background: #e3f1e8; color: #164d2a; }
    .item__body h3 { font-size: clamp(1.125rem, 1.8vw, 1.375rem); line-height: 1.25; letter-spacing: -0.01em; }
    .item__text { color: var(--ink-soft); line-height: 1.6; }
    .pager { display: flex; flex-wrap: wrap; align-items: center; gap: 0.75rem; margin-top: 1.5rem; }
    .pager button { font: inherit; font-weight: 700; border: 0; cursor: pointer; }
    .pager button[disabled] { opacity: 0.5; cursor: not-allowed; }
    .pager__info { font-size: var(--size-note); color: var(--ink-soft); }
    @media (max-width: 640px) { .item { grid-template-columns: 3.75rem minmax(0, 1fr); gap: 1rem; } }
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
  protected readonly day = (iso: string) => new Date(iso).toLocaleDateString('es-PE', { day: '2-digit', timeZone: 'America/Lima' });
  protected readonly month = (iso: string) => new Date(iso).toLocaleDateString('es-PE', { month: 'short', timeZone: 'America/Lima' }).replace('.', '');
  protected readonly monthName = (iso: string) => new Date(iso).toLocaleDateString('es-PE', { month: 'long', timeZone: 'America/Lima' }).toLowerCase();
  protected readonly pages = (m: PageMeta) => Math.max(1, Math.ceil(m.total / m.pageSize));

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
