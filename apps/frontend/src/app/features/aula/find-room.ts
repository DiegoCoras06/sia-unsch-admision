import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ApiService, apiErrorMessage, type ExamRoomDto } from '../../core/api.service';
import { dateTime } from '../../core/format';
import { CallStore } from '../../core/call.store';
import { CodeReminder } from '../../shared/code-reminder';
import { DocsSidebar } from '../../shared/docs-sidebar';

const TZ = 'America/Lima';
const longDate = (iso: string) => new Date(iso).toLocaleDateString('es-PE', { timeZone: TZ, weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
const hour = (iso: string) => new Date(iso).toLocaleTimeString('es-PE', { timeZone: TZ, hour: 'numeric', minute: '2-digit' });

/** Spec 006, Historia 4: «Buscar aula» con DNI + código, ficha de examen y solicitud de adecuación (RN-39). */
@Component({
  selector: 'app-find-room',
  imports: [FormsModule, RouterLink, DocsSidebar, CodeReminder],
  template: `
    <section class="page field-accent">
      <div class="frame grid">
        <div class="main">
          <h1>Buscar aula</h1>
          <p class="lead">La relación de aptos y tu aula se publican 24 horas antes del examen. Consulta con tu documento y tu código de postulante.</p>
          @if (dates().length) {
            <ul class="pubdates" aria-label="Fechas de publicación de aulas">
              @for (d of dates(); track d.name) { <li><strong>{{ d.name }}:</strong> aulas desde el {{ d.publish }} · examen el {{ d.exam }}@if (d.ready) { <span class="pubdates__ok">publicado</span> }</li> }
            </ul>
          }
          <form class="box" (ngSubmit)="search()">
            <div class="field">
              <label for="a-doc">DNI o carné de extranjería</label>
              <input id="a-doc" class="input" name="doc" [(ngModel)]="doc" inputmode="numeric" maxlength="12" autocomplete="off" required>
            </div>
            <div class="field">
              <label for="a-code">Código de postulante</label>
              <input id="a-code" class="input" name="code" [(ngModel)]="code" inputmode="numeric" maxlength="8" autocomplete="off" required>
            </div>
            <button class="btn btn--gold" type="submit" [disabled]="busy()">{{ busy() ? 'Buscando…' : 'Buscar mi aula' }}</button>
          </form>
          <app-code-reminder />
          @if (error()) { <p class="alert alert--error" role="alert">{{ error() }}</p> }

          @if (r(); as r) {
            <article class="card" aria-labelledby="room-title">
              <header class="card__who">
                <p class="card__code">{{ r.applicantCode }}</p>
                <div><h2 id="room-title">{{ r.fullName }}</h2><p>{{ r.program }} · {{ r.modality }}</p></div>
              </header>

              @if (r.state === 'ASSIGNED' && r.room; as room) {
                <section class="ticket" aria-labelledby="ticket-title">
                  <header class="ticket__head">
                    <div>
                      <p class="ticket__kicker">Ficha de examen</p>
                      <h3 id="ticket-title" class="ticket__exam">{{ r.exam?.name ?? r.modality }}</h3>
                      @if (r.exam; as e) { <p class="ticket__date">{{ long(e.entryOpensAt) }}</p> }
                    </div>
                    <p class="ticket__code"><span>Código</span>{{ r.applicantCode }}</p>
                  </header>
                  <div class="ticket__main">
                    <div class="ticket__room"><span>Aula</span><strong>{{ room.code }}</strong></div>
                    <div class="ticket__seat"><span>Asiento</span><strong>{{ room.seat }}</strong></div>
                  </div>
                  <dl class="ticket__route">
                    <div><dt>Puerta</dt><dd>{{ room.gate }}</dd></div>
                    <div><dt>Pabellón</dt><dd>{{ room.building }}</dd></div>
                    <div><dt>Piso</dt><dd>{{ room.floor }}</dd></div>
                  </dl>
                  @if (r.exam; as e) {
                    <p class="ticket__entry"><strong>Ingreso de {{ hr(e.entryOpensAt) }} a {{ hr(e.entryClosesAt) }}</strong>, después no hay ingreso</p>
                  }
                  <p class="ticket__venue">{{ room.venue }}, {{ room.address }}@if (room.accessible) { <span class="ticket__acc">Aula accesible</span> }</p>
                </section>
              } @else if (r.message) {
                <p class="alert" [class.alert--info]="r.state === 'NOT_PUBLISHED'" [class.alert--error]="r.state === 'NOT_ELIGIBLE' || r.state === 'NOT_ASSIGNED'" role="status">{{ r.message }}</p>
              }

              @if (r.exam; as e) {
                @if (r.state !== 'ASSIGNED') {
                  <dl class="when">
                    <div><dt>Examen</dt><dd>{{ e.name }}</dd></div>
                    <div><dt>Fecha</dt><dd>{{ long(e.entryOpensAt) }}</dd></div>
                    <div><dt>Ingreso al local</dt><dd>De {{ hr(e.entryOpensAt) }} a {{ hr(e.entryClosesAt) }}, después no hay ingreso</dd></div>
                    <div><dt>Duración</dt><dd>{{ e.durationMinutes }} minutos</dd></div>
                  </dl>
                } @else {
                  <p class="note">El examen dura {{ e.durationMinutes }} minutos. Lleva tu DNI original y esta ficha impresa o en tu celular.</p>
                }
                <div class="rules">
                  <section><h3>Debes llevar</h3><ul>@for (x of e.instructions.llevar; track x) { <li>{{ x }}</li> }</ul></section>
                  <section class="rules__no"><h3>Está prohibido</h3><ul>@for (x of e.instructions.prohibido; track x) { <li>{{ x }}</li> }</ul></section>
                </div>
                <p class="note">{{ e.instructions.notas }}</p>
              }

              @if (r.state === 'ASSIGNED') {
                <div class="actions">
                  <button type="button" class="btn" (click)="download()" [disabled]="downloading()">{{ downloading() ? 'Preparando…' : 'Descargar ficha de examen (PDF)' }}</button>
                  <a class="btn btn--quiet" routerLink="/mi-inscripcion">Ficha de inscripción</a>
                </div>
              }

              @if (r.accommodation; as a) {
                <p class="alert alert--info">Registramos tu solicitud de adecuación: «{{ a.needs }}» ({{ when(a.createdAt) }}).@if (a.late) { La enviaste con menos de 72 horas: la Comisión decidirá si es posible atenderla (Art. 22). }</p>
              }
              @if (r.canRequestAccommodation) {
                <details class="acc" [open]="!!r.accommodation">
                  <summary>{{ r.accommodation ? 'Actualizar mi solicitud de adecuación' : '¿Tienes una discapacidad y necesitas una adecuación para el examen?' }}</summary>
                  <form (ngSubmit)="accommodation()">
                    <p class="note">Comunícalo al menos 72 horas antes del examen (Art. 22). Te ubicaremos en un aula accesible del primer piso.</p>
                    <label for="a-needs">Describe lo que necesitas</label>
                    <textarea id="a-needs" class="input" name="needs" rows="3" [(ngModel)]="needs" maxlength="600" placeholder="Ejemplo: uso silla de ruedas; necesito aula sin escaleras."></textarea>
                    <button class="btn btn--quiet" type="submit" [disabled]="sending()">{{ sending() ? 'Enviando…' : 'Enviar solicitud' }}</button>
                  </form>
                </details>
              }
            </article>
          }
          <p>¿Aún no pagas o no ves tu ficha? <a routerLink="/mi-inscripcion">Ir a «Mi inscripción»</a></p>
        </div>
        <app-docs-sidebar />
      </div>
    </section>
  `,
  styles: `
    .pubdates { list-style: none; margin: 0; padding: 0.9rem 1.1rem; display: grid; gap: 0.35rem; background: var(--accent-press); }
    .pubdates__ok { margin-left: 0.4rem; padding: 0.1rem 0.45rem; background: var(--gold); color: var(--ink); font-size: var(--size-note); font-weight: 700; }
    .page { padding-block: clamp(2.5rem, 6vw, 5rem); }
    .grid { display: grid; grid-template-columns: minmax(0, 1fr) 18rem; gap: clamp(1.5rem, 3vw, 3rem); align-items: start; }
    .main { display: grid; gap: 1.5rem; min-width: 0; }
    h1 { font-size: clamp(2.25rem, 5vw, 4rem); }
    .box { display: grid; grid-template-columns: 1fr 1fr auto; gap: 1rem; align-items: end; background: var(--accent-press); padding: 1.5rem; }
    .box .input { background: #fff; border-color: #fff; }
    .box .input:focus { border-color: var(--gold); }
    .main > p a { color: var(--gold); font-weight: 700; }
    .card { background: var(--ground); color: var(--ink); padding: clamp(1.25rem, 3vw, 2rem); display: grid; gap: 1.25rem; }
    .card__who { display: flex; gap: 1.25rem; align-items: center; flex-wrap: wrap; }
    .card__code { font-size: clamp(1.75rem, 4vw, 2.5rem); font-weight: 800; letter-spacing: 0.04em; color: var(--accent); font-variant-numeric: tabular-nums; }
    .card__who h2 { font-size: 1.375rem; }
    .card__who p { color: var(--ink-soft); }
    /* Boleto de examen: el aula y el asiento son el foco; la ruta (puerta, pabellón, piso) la acompaña.
       Las muescas laterales y la línea punteada separan el talón, como en un boleto impreso. */
    .ticket { --notch: 0.75rem; position: relative; display: grid; border-radius: var(--radius-lg); overflow: hidden;
      background: var(--accent); color: var(--accent-ink); }
    .ticket__head { display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; padding: 1.25rem 1.5rem 1rem; }
    .ticket__kicker { margin: 0; font-size: var(--size-note); font-weight: 600; color: var(--gold); }
    .ticket__exam { margin: 0.15rem 0 0; font-size: clamp(1.125rem, 2.2vw, 1.375rem); letter-spacing: -0.01em; }
    .ticket__date { margin: 0.15rem 0 0; opacity: 0.9; }
    .ticket__code { margin: 0; display: grid; justify-items: end; font-size: clamp(1.25rem, 2.6vw, 1.625rem); font-weight: 800; color: var(--gold); font-variant-numeric: tabular-nums; letter-spacing: 0.04em; }
    .ticket__code span { font-size: 0.8125rem; font-weight: 600; letter-spacing: 0; color: var(--accent-ink); opacity: 0.85; }
    .ticket__main { position: relative; display: grid; grid-template-columns: 2fr 1fr; gap: 1px; background: rgb(255 255 255 / 0.18);
      border-top: 2px dashed rgb(255 255 255 / 0.35); }
    .ticket__main::before, .ticket__main::after { content: ''; position: absolute; top: calc(-1 * var(--notch) - 1px); width: calc(2 * var(--notch)); height: calc(2 * var(--notch));
      border-radius: 50%; background: var(--ground); }
    .ticket__main::before { left: calc(-1 * var(--notch)); }
    .ticket__main::after { right: calc(-1 * var(--notch)); }
    .ticket__main > div { display: grid; gap: 0.15rem; padding: 1.25rem 1.5rem; background: var(--accent); }
    .ticket__main span, .ticket__route dt { font-size: 0.875rem; font-weight: 600; color: var(--gold); }
    .ticket__main strong { font-size: clamp(3rem, 8vw, 4.5rem); font-weight: 800; line-height: 1; letter-spacing: -0.03em; font-variant-numeric: tabular-nums; }
    .ticket__seat { background: var(--accent-press) !important; }
    .ticket__route { margin: 0; display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 2fr) minmax(0, 1fr); background: var(--accent-press); }
    .ticket__route div { min-width: 0; padding: 0.9rem 1.5rem; display: grid; gap: 0.1rem; border-right: 1px solid rgb(255 255 255 / 0.15); }
    .ticket__route dd { overflow-wrap: anywhere; }
    .ticket__route div:last-child { border-right: 0; }
    .ticket__route dd { margin: 0; font-size: clamp(1.25rem, 2.6vw, 1.625rem); font-weight: 700; font-variant-numeric: tabular-nums; }
    .ticket__entry { margin: 0; padding: 0.9rem 1.5rem; background: var(--gold); color: var(--ink); max-width: none; }
    .ticket__venue { margin: 0; padding: 0.9rem 1.5rem 1.1rem; font-size: var(--size-note); opacity: 0.92; max-width: none; }
    .ticket__acc { margin-left: 0.5rem; padding: 0.1rem 0.5rem; border-radius: var(--radius); background: rgb(255 255 255 / 0.16); font-weight: 600; white-space: nowrap; }
    @media print { .ticket { border: 2px solid var(--accent); } .ticket__main::before, .ticket__main::after { display: none; } }
    .when { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.75rem 1.5rem; margin: 0; }
    .when dt { font-size: var(--size-note); color: var(--ink-soft); }
    .when dd { margin: 0; font-weight: 700; }
    .rules { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .rules section { background: var(--stone); padding: 1rem 1.25rem; }
    .rules h3 { font-size: 1rem; color: #164d2a; margin-bottom: 0.5rem; }
    .rules__no h3 { color: #6d1212; }
    .rules ul { margin: 0; padding-left: 1.1rem; display: grid; gap: 0.25rem; }
    .actions { display: flex; flex-wrap: wrap; gap: 0.75rem; }
    .acc { background: var(--stone); padding: 1rem 1.25rem; }
    .acc summary { cursor: pointer; font-weight: 700; }
    .acc form { display: grid; gap: 0.6rem; margin-top: 0.75rem; }
    .acc .btn { justify-self: start; }
    @media (max-width: 960px) { .grid { grid-template-columns: 1fr; } }
    @media (max-width: 640px) {
      .box, .rules, .when { grid-template-columns: 1fr; }
      .ticket__head { padding: 1.1rem 1.1rem 0.9rem; }
      .ticket__main > div, .ticket__route div, .ticket__entry, .ticket__venue { padding-inline: 1.1rem; }
    }
  `,
})
export class FindRoomPage {
  private readonly store = inject(CallStore);
  /** Fechas de publicación por examen: 24 horas antes de cada examen del cronograma. */
  protected readonly dates = computed(() => {
    const call = this.store.call();
    if (!call) return [];
    return call.stages.filter((s) => s.code === 'EXAM_EXO' || s.code === 'EXAM_ORD').map((s) => {
      const pub = new Date(new Date(s.startsAt).getTime() - 24 * 3600 * 1000).toISOString();
      return { name: s.code === 'EXAM_EXO' ? 'Exonerados' : 'Ordinario', publish: longDate(pub), exam: longDate(s.startsAt), ready: new Date(call.now) >= new Date(pub) };
    });
  });

  private readonly api = inject(ApiService);
  protected doc = '';
  protected code = '';
  protected needs = '';
  protected readonly busy = signal(false);
  protected readonly sending = signal(false);
  protected readonly downloading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly r = signal<ExamRoomDto | null>(null);
  protected readonly long = longDate;
  protected readonly hr = hour;
  protected readonly when = dateTime;
  private searched: { doc: string; code: string } | null = null;

  protected async search() {
    this.error.set(null);
    const doc = this.doc.trim();
    const code = this.code.trim();
    if (doc.length < 6 || !/^\d{8}$/.test(code)) {
      this.error.set('Escribe tu documento y tu código de postulante de 8 dígitos.');
      return;
    }
    this.busy.set(true);
    try {
      const r = await firstValueFrom(this.api.examRoom(doc, code));
      this.r.set(r);
      this.needs = r.accommodation?.needs ?? '';
      this.searched = { doc, code };
    } catch (e) {
      this.r.set(null);
      this.searched = null;
      this.error.set(apiErrorMessage(e));
    } finally {
      this.busy.set(false);
    }
  }

  protected async download() {
    if (!this.searched) return;
    this.downloading.set(true);
    try {
      const blob = await firstValueFrom(this.api.examSlip(this.searched.doc, this.searched.code));
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ficha-examen-${this.searched.code}.pdf`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e) {
      this.error.set(apiErrorMessage(e, 'No pudimos generar tu ficha de examen. Inténtalo de nuevo.'));
    } finally {
      this.downloading.set(false);
    }
  }

  protected async accommodation() {
    if (!this.searched) return;
    if (this.needs.trim().length < 10) {
      this.error.set('Describe con más detalle la adecuación que necesitas.');
      return;
    }
    this.sending.set(true);
    try {
      this.r.set(await firstValueFrom(this.api.examAccommodation(this.searched.doc, this.searched.code, this.needs.trim())));
      this.error.set(null);
    } catch (e) {
      this.error.set(apiErrorMessage(e));
    } finally {
      this.sending.set(false);
    }
  }
}
