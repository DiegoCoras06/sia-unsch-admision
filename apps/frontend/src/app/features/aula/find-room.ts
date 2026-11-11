import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ApiService, apiErrorMessage, type ExamRoomDto } from '../../core/api.service';
import { dateTime } from '../../core/format';
import { CallStore } from '../../core/call.store';
import { CodeReminder } from '../../shared/code-reminder';
import { DocsSidebar } from '../../shared/docs-sidebar';
import { ExamTicket, type ExamTicketData } from './exam-ticket';

const TZ = 'America/Lima';
const longDate = (iso: string) => new Date(iso).toLocaleDateString('es-PE', { timeZone: TZ, weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
/** Boleto guardado en el dispositivo (ADR-023). Solo lo que se ve en él: sin nombre ni DNI. */
const KEPT = 'sia-boleto';

function readKept(): ExamTicketData | null {
  try {
    const t = JSON.parse(localStorage.getItem(KEPT) ?? 'null') as ExamTicketData | null;
    // Después del examen ya no sirve: no se deja en el dispositivo.
    if (t?.entryClosesAt && new Date(t.entryClosesAt).getTime() + 86_400_000 < Date.now()) {
      localStorage.removeItem(KEPT);
      return null;
    }
    return t;
  } catch {
    return null;
  }
}

const hour = (iso: string) => new Date(iso).toLocaleTimeString('es-PE', { timeZone: TZ, hour: 'numeric', minute: '2-digit' });

/** Spec 006, Historia 4: «Buscar aula» con DNI + código, ficha de examen y solicitud de adecuación (RN-39). */
@Component({
  selector: 'app-find-room',
  imports: [FormsModule, RouterLink, DocsSidebar, CodeReminder, ExamTicket],
  template: `
    <section class="page field-accent field-glow">
      <div class="frame grid">
        <div class="main">
          <header class="tool-head">
            <p class="tool-head__kicker" data-icon="aula">Día del examen</p>
            <h1>Buscar aula</h1>
            <p class="lead">La relación de aptos y tu aula se publican 24 horas antes del examen. Consulta con tu documento y tu código de postulante.</p>
          </header>
          @if (dates().length) {
            <ul class="pubdates" aria-label="Fechas de publicación de aulas">
              @for (d of dates(); track d.name) {
                <li class="pubdates__card">
                  <p class="pubdates__head"><strong>{{ d.name }}</strong><span class="pubdates__state" [class.is-ready]="d.ready">{{ d.ready ? 'Aulas publicadas' : 'Próximamente' }}</span></p>
                  <dl>
                    <div><dt>Aulas desde</dt><dd>{{ d.publish }}</dd></div>
                    <div><dt>Examen</dt><dd>{{ d.exam }}</dd></div>
                  </dl>
                </li>
              }
            </ul>
          }
          @if (shownKept(); as t) {
            <article class="card" aria-labelledby="saved-title">
              <h2 id="saved-title" class="saved__title">Tu boleto guardado</h2>
              <app-exam-ticket [data]="t" />
              <p class="keep"><button type="button" class="keep__out" (click)="forget()">Quitar de este dispositivo</button></p>
            </article>
          }
          <form class="box lookup" (ngSubmit)="search()">
            <div class="field">
              <label for="a-doc">DNI o carné de extranjería</label>
              <input id="a-doc" class="input" name="doc" [(ngModel)]="doc" inputmode="numeric" maxlength="12" autocomplete="off" required>
            </div>
            <div class="field">
              <label for="a-code">Código de postulante</label>
              <input id="a-code" class="input" name="code" [(ngModel)]="code" inputmode="numeric" maxlength="8" autocomplete="off" required>
            </div>
            <button class="btn btn--gold" type="submit" [disabled]="busy()" data-icon="buscar" [attr.aria-busy]="busy()">{{ busy() ? 'Buscando…' : 'Buscar mi aula' }}</button>
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
                <app-exam-ticket [data]="ticketOf(r)" />
                <p class="keep">
                  @if (saved()?.applicantCode === r.applicantCode) {
                    <span>Guardado en este dispositivo: podrás verlo aquí sin internet.</span>
                  } @else {
                    <button type="button" class="btn btn--quiet" (click)="keep(r)">Guardar en este celular</button>
                    <span>Para verlo sin internet el día del examen. No guarda tu nombre ni tu DNI.</span>
                  }
                </p>
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
                  <button type="button" class="btn" (click)="download()" data-icon="descargar" [disabled]="downloading()" [attr.aria-busy]="downloading()">{{ downloading() ? 'Preparando…' : 'Descargar ficha de examen (PDF)' }}</button>
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
                    <button class="btn btn--quiet" type="submit" [disabled]="sending()" [attr.aria-busy]="sending()">{{ sending() ? 'Enviando…' : 'Enviar solicitud' }}</button>
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
    .saved__title { font-size: 1.25rem; letter-spacing: -0.01em; }
    .keep { margin: 0; display: flex; flex-wrap: wrap; align-items: center; gap: 0.5rem 1rem; max-width: none; font-size: var(--size-note); color: var(--ink-soft); }
    .keep__out { min-height: 2.75rem; padding: 0; font: inherit; color: var(--ink-soft); background: none; border: 0; text-decoration: underline; text-underline-offset: 0.25em; cursor: pointer; }
    @media print { .keep { display: none; } }
    /* Una tarjeta por modalidad: cuándo se publican las aulas y cuándo es el examen. */
    .pubdates { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 17rem), 1fr)); gap: 0.75rem; }
    .pubdates__card { display: grid; gap: 0.75rem; padding: 1rem 1.15rem; border-radius: var(--radius-lg); background: var(--accent-press); border: 1px solid rgb(255 255 255 / 0.12); }
    .pubdates__head { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 0.5rem; margin: 0; }
    .pubdates__head strong { font-size: 1.125rem; }
    .pubdates__state { padding: 0.15rem 0.6rem; border-radius: 999px; background: rgb(255 255 255 / 0.12); font-size: var(--size-note); font-weight: 700; }
    .pubdates__state.is-ready { background: var(--gold); color: var(--ink); }
    .pubdates dl { margin: 0; display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
    .pubdates dt { font-size: var(--size-note); color: var(--gold); font-weight: 600; }
    .pubdates dd { margin: 0.15rem 0 0; font-weight: 600; line-height: 1.35; }
    .page { padding-block: clamp(2.5rem, 6vw, 5rem); }
    .grid { display: grid; grid-template-columns: minmax(0, 1fr) 18rem; gap: clamp(1.5rem, 3vw, 3rem); align-items: start; }
    .main { display: grid; gap: 1.5rem; min-width: 0; }
    h1 { font-size: clamp(2.25rem, 5vw, 4rem); }
    .box { display: grid; grid-template-columns: 1fr 1fr auto; gap: 1rem; align-items: end; }
    .main > p a { color: var(--gold); font-weight: 700; }
    .card { background: var(--ground); color: var(--ink); padding: clamp(1.25rem, 3vw, 2rem); display: grid; gap: 1.25rem; }
    .card__who { display: flex; gap: 1.25rem; align-items: center; flex-wrap: wrap; }
    .card__code { font-size: clamp(1.75rem, 4vw, 2.5rem); font-weight: 800; letter-spacing: 0.04em; color: var(--accent); font-variant-numeric: tabular-nums; }
    .card__who h2 { font-size: 1.375rem; }
    .card__who p { color: var(--ink-soft); }
    /* Boleto de examen: el aula y el asiento son el foco; la ruta (puerta, pabellón, piso) la acompaña.
       Las muescas laterales y la línea punteada separan el talón, como en un boleto impreso. */
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
  protected readonly saved = signal<ExamTicketData | null>(readKept());
  protected doc = '';
  protected code = '';
  protected needs = '';
  protected readonly busy = signal(false);
  protected readonly sending = signal(false);
  protected readonly downloading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly r = signal<ExamRoomDto | null>(null);
  /** El boleto guardado, salvo que ya esté en pantalla por una consulta. */
  protected readonly shownKept = computed(() => (this.saved()?.applicantCode === this.r()?.applicantCode ? null : this.saved()));
  protected readonly long = longDate;
  protected readonly hr = hour;
  protected readonly when = dateTime;
  private searched: { doc: string; code: string } | null = null;

  protected ticketOf(r: ExamRoomDto): ExamTicketData {
    return { applicantCode: r.applicantCode, examName: r.exam?.name ?? r.modality, entryOpensAt: r.exam?.entryOpensAt ?? null, entryClosesAt: r.exam?.entryClosesAt ?? null, room: r.room! };
  }

  protected keep(r: ExamRoomDto) {
    const ticket = this.ticketOf(r);
    try {
      localStorage.setItem(KEPT, JSON.stringify(ticket));
      this.saved.set(ticket);
    } catch {
      this.error.set('No pudimos guardar tu boleto en este dispositivo. Descarga la ficha en PDF.');
    }
  }

  protected forget() {
    try {
      localStorage.removeItem(KEPT);
    } catch {
      // Sin acceso al almacenamiento no hay nada que quitar.
    }
    this.saved.set(null);
  }

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
