import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { ApiService, apiErrorMessage, type AdmittedListDto, type MyResultDto } from '../../core/api.service';
import { CallStore } from '../../core/call.store';
import { CodeReminder } from '../../shared/code-reminder';
import { DocsSidebar } from '../../shared/docs-sidebar';

const day = (iso: string | null | undefined) => (iso ? new Date(iso).toLocaleDateString('es-PE', { timeZone: 'America/Lima', weekday: 'long', day: 'numeric', month: 'long' }) : '');

/** Spec 007, Historias 4, 5 y 7: «Ver puntaje», trámite de ingreso, constancia y lista pública de admitidos. */
@Component({
  selector: 'app-my-result',
  imports: [FormsModule, DocsSidebar, CodeReminder],
  template: `
    <section class="page field-accent">
      <div class="frame grid">
        <div class="main">
          <h1>Ver puntaje</h1>
          <p class="lead">Los resultados oficiales se publican el mismo día del examen, a la hora que autoriza la Comisión. Consulta con tu documento y tu código de postulante.</p>
          @if (dates().length) {
            <ul class="pubdates" aria-label="Fechas de publicación de resultados">
              @for (d of dates(); track d.name) { <li><strong>{{ d.name }}:</strong> resultados el {{ d.exam }}@if (d.past) { <span class="pubdates__ok">examen rendido</span> }</li> }
            </ul>
          }
          <form class="box" (ngSubmit)="search()">
            <div class="field"><label for="r-doc">DNI o carné de extranjería</label>
              <input id="r-doc" class="input" name="doc" [(ngModel)]="doc" inputmode="numeric" maxlength="12" autocomplete="off" required></div>
            <div class="field"><label for="r-code">Código de postulante</label>
              <input id="r-code" class="input" name="code" [(ngModel)]="code" inputmode="numeric" maxlength="8" autocomplete="off" required></div>
            <button class="btn btn--gold" type="submit" [disabled]="busy()" [attr.aria-busy]="busy()">{{ busy() ? 'Buscando…' : 'Ver mi puntaje' }}</button>
          </form>
          <app-code-reminder />
          @if (error()) { <p class="alert alert--error" role="alert">{{ error() }}</p> }

          @if (r(); as r) {
            <article class="card" aria-labelledby="res-title">
              <header class="card__who">
                <p class="card__code">{{ r.applicantCode }}</p>
                <div><h2 id="res-title">{{ r.fullName }}</h2><p>{{ r.program }} · {{ r.modality }}@if (r.exam) { · {{ r.exam }} }</p></div>
              </header>

              @if (r.state === 'PUBLISHED') {
                <!-- La condición es el foco; puntaje, puesto y vacantes la explican. -->
                <section class="verdict" [class]="'verdict is-' + (r.condition ?? 'NO_ADMITIDO').toLowerCase()" aria-labelledby="verdict-title">
                  <div class="verdict__main">
                    <p class="verdict__kicker">Tu resultado</p>
                    <h3 id="verdict-title" class="verdict__cond">{{ r.conditionLabel }}</h3>
                    <p class="verdict__where">{{ r.program }}, modalidad {{ r.modality }}</p>
                  </div>
                  <div class="verdict__score">
                    <p class="verdict__label">Puntaje</p>
                    <p class="verdict__num">{{ r.score ?? '-' }}<span> de 1000</span></p>
                    @if (scorePct(r) !== null) {
                      <div class="meter" aria-hidden="true">
                        <div class="meter__fill" [style.width.%]="scorePct(r)"></div>
                        <div class="meter__min" [style.left.%]="minPct(r)"><span>mínimo {{ r.minimum }}</span></div>
                      </div>
                    }
                    <p class="sr-only">El mínimo para alcanzar vacante es {{ r.minimum }} puntos.</p>
                  </div>
                  <dl class="verdict__facts">
                    <div><dt>Puesto</dt><dd>{{ r.rank ?? '-' }}@if (r.rank) { <span>de {{ r.groupSize }}</span> }</dd></div>
                    <div><dt>Vacantes en tu programa y modalidad</dt><dd>{{ r.vacancies }}</dd></div>
                  </dl>
                </section>
                @if (r.breakdown; as b) {
                  <table class="parts"><caption>Desglose por componente</caption>
                    <thead><tr><th scope="col">Componente</th><th scope="col" class="num">Aciertos</th><th scope="col" class="num">Puntos</th></tr></thead>
                    <tbody>@for (x of b; track x.label) { <tr><td>{{ x.label }}</td><td class="num">{{ x.correct }}</td><td class="num">{{ x.points }}</td></tr> }</tbody>
                  </table>
                }
                @if (r.condition === 'ADMITIDO' && r.admission; as a) {
                  <section class="next">
                    @if (a.status === 'INGRESANTE') {
                      <h3>¡Eres ingresante de la UNSCH!</h3>
                      <p>Admisión registró la entrega de tus documentos. Descarga tu constancia de ingreso con código QR.</p>
                      <button type="button" class="btn btn--gold" (click)="certificate()" [disabled]="downloading()" [attr.aria-busy]="downloading()">{{ downloading() ? 'Preparando…' : 'Descargar constancia de ingreso (PDF)' }}</button>
                    } @else if (a.status === 'PERDIDA') {
                      <h3>Perdiste la condición de admitido</h3>
                      <p>No se registró la entrega de tus documentos dentro del plazo (Art. 34). La vacante no se cubre con otro postulante.</p>
                    } @else {
                      <h3>¡Felicitaciones, alcanzaste una vacante!</h3>
                      <p>Para ser <strong>ingresante</strong> entrega tus documentos originales en la Dirección de Admisión y paga la constancia de ingreso (S/ {{ a.fee }}).</p>
                      <ul>
                        <li>Plazo: del {{ day(a.deliveryFrom) }} al {{ day(a.deliveryTo) }}, según el cronograma de tu programa.</li>
                        <li>Entrega extemporánea: {{ day(a.lateDay) }}, con recargo de S/ {{ a.surcharge }}.</li>
                        <li>Si no entregas en el plazo pierdes la vacante automáticamente (Art. 34).</li>
                      </ul>
                    }
                  </section>
                }
                <details class="review">
                  <summary>¿Encontraste un error material en tu resultado?</summary>
                  <form (ngSubmit)="review()">
                    <p class="note">Los resultados son inimpugnables (Disposición Final 7.ª). Solo se revisan errores materiales, como un código mal leído. Te responderemos por escrito.</p>
                    <label for="r-rev">Describe el error</label>
                    <textarea id="r-rev" class="input" name="rev" rows="3" maxlength="2000" [(ngModel)]="reviewText"></textarea>
                    <button class="btn btn--quiet" type="submit">Enviar solicitud</button>
                    @if (caseNumber()) { <p class="alert alert--info" role="status">Registramos tu solicitud con el número de caso <strong>{{ caseNumber() }}</strong>.</p> }
                  </form>
                </details>
              } @else {
                <p class="alert alert--info" role="status">{{ r.message }}</p>
              }
            </article>
          }

          <section class="list" aria-labelledby="adm-title">
            <div class="list__head">
              <h2 id="adm-title">Lista de admitidos</h2>
              <div class="list__tabs" role="tablist">
                @for (e of exams; track e.code) { <button type="button" role="tab" [class.is-on]="exam() === e.code" [attr.aria-selected]="exam() === e.code" (click)="loadList(e.code)">{{ e.name }}</button> }
              </div>
            </div>
            @if (list(); as l) {
              @if (!l.published) { <p>Los resultados de este examen aún no se publican.</p> }
              @else {
                <input class="input list__q" [(ngModel)]="q" name="q" placeholder="Buscar por código, nombre o programa" aria-label="Buscar en la lista de admitidos">
                <div class="list__wrap"><table>
                  <thead><tr><th scope="col">Código</th><th scope="col">Apellidos y nombres</th><th scope="col">Programa</th><th scope="col" class="num">Puntaje</th><th scope="col" class="num">Puesto</th></tr></thead>
                  <tbody>@for (a of filtered(l); track a.applicantCode) { <tr><td>{{ a.applicantCode }}</td><td>{{ a.fullName }}</td><td>{{ a.program }}</td><td class="num">{{ a.score }}</td><td class="num">{{ a.rank }}</td></tr> }
                    @empty { <tr><td colspan="5">Sin coincidencias.</td></tr> }</tbody>
                </table></div>
              }
            }
          </section>
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
    .card, .list { background: var(--ground); color: var(--ink); padding: clamp(1.25rem, 3vw, 2rem); display: grid; gap: 1.25rem; }
    .card__who { display: flex; gap: 1.25rem; align-items: center; flex-wrap: wrap; }
    .card__code { font-size: clamp(1.75rem, 4vw, 2.5rem); font-weight: 800; letter-spacing: 0.04em; color: var(--accent); font-variant-numeric: tabular-nums; }
    .card__who h2 { font-size: 1.375rem; }
    .card__who p { color: var(--ink-soft); }
    /* Resultado: la condición manda (color sobrio según el caso); el puntaje se lee sobre una regla de 0 a 1000. */
    .verdict { --tone: var(--accent); --tone-ink: var(--accent-ink); display: grid; grid-template-columns: minmax(0, 6fr) minmax(0, 5fr);
      border-radius: var(--radius-lg); overflow: hidden; border: 1px solid var(--stone-deep); }
    .verdict.is-admitido { --tone: var(--ok); }
    .verdict.is-no_admitido, .verdict.is-sin_derecho_vacante { --tone: #4a3f40; }
    .verdict.is-ausente, .verdict.is-no_calificable { --tone: #5b4f50; }
    .verdict__main { display: grid; align-content: center; gap: 0.35rem; padding: clamp(1.25rem, 3vw, 2rem); background: var(--tone); color: var(--tone-ink); }
    .verdict__kicker { margin: 0; font-size: var(--size-note); font-weight: 600; opacity: 0.85; }
    .verdict__cond { margin: 0; font-size: clamp(2rem, 4.4vw, 3rem); font-weight: 800; line-height: 1.05; letter-spacing: -0.03em; text-wrap: balance; }
    .verdict__where { margin: 0.25rem 0 0; opacity: 0.9; max-width: 40ch; }
    .verdict__score { display: grid; align-content: center; gap: 0.5rem; padding: clamp(1.25rem, 3vw, 2rem); background: var(--ground); }
    .verdict__label { margin: 0; font-size: var(--size-note); font-weight: 600; color: var(--ink-soft); }
    .verdict__num { margin: 0; font-size: clamp(2.25rem, 4.6vw, 3.25rem); font-weight: 800; line-height: 1; letter-spacing: -0.03em; font-variant-numeric: tabular-nums; }
    .verdict__num span { font-size: 1rem; font-weight: 600; letter-spacing: 0; color: var(--ink-soft); }
    .meter { position: relative; height: 0.625rem; margin: 0.75rem 0 1.5rem; border-radius: 999px; background: var(--stone-deep); }
    .meter__fill { height: 100%; border-radius: 999px; background: var(--tone); }
    .meter__min { position: absolute; top: -0.3rem; bottom: -0.3rem; width: 2px; background: var(--ink); }
    .meter__min span { position: absolute; top: 100%; left: 50%; transform: translateX(-50%); margin-top: 0.3rem; white-space: nowrap; font-size: 0.8125rem; font-weight: 600; color: var(--ink-soft); }
    .verdict__facts { grid-column: 1 / -1; margin: 0; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); border-top: 1px solid var(--stone-deep); background: var(--stone); }
    .verdict__facts div { display: grid; gap: 0.15rem; padding: 0.9rem clamp(1.25rem, 3vw, 2rem); }
    .verdict__facts div + div { border-left: 1px solid var(--stone-deep); }
    .verdict__facts dt { font-size: var(--size-note); color: var(--ink-soft); }
    .verdict__facts dd { margin: 0; font-size: 1.5rem; font-weight: 700; font-variant-numeric: tabular-nums; }
    .verdict__facts dd span { font-size: 1rem; font-weight: 500; color: var(--ink-soft); margin-left: 0.3rem; }
    .parts { width: 100%; border-collapse: collapse; }
    .parts caption { text-align: left; font-weight: 700; margin-bottom: 0.5rem; }
    .parts th, .parts td { padding: 0.55rem 0.75rem; border-bottom: 1px solid var(--stone); text-align: left; }
    .parts th { background: var(--stone); }
    .num { text-align: right !important; font-variant-numeric: tabular-nums; }
    .next { background: #e3f1e8; color: #164d2a; padding: 1.25rem 1.5rem; display: grid; gap: 0.6rem; }
    .next h3 { font-size: 1.375rem; }
    .next ul { margin: 0; padding-left: 1.1rem; display: grid; gap: 0.25rem; color: var(--ink); }
    .next .btn { justify-self: start; }
    .review { background: var(--stone); padding: 1rem 1.25rem; }
    .review summary { cursor: pointer; font-weight: 700; }
    .review form { display: grid; gap: 0.6rem; margin-top: 0.75rem; }
    .review .btn { justify-self: start; }
    .list__head { display: flex; flex-wrap: wrap; gap: 1rem; justify-content: space-between; align-items: center; }
    .list__head h2 { font-size: 1.5rem; }
    .list__tabs { display: flex; gap: 2px; }
    .list__tabs button { font: inherit; font-weight: 700; padding: 0.5rem 1rem; border: 0; background: var(--stone); cursor: pointer; }
    .list__tabs button.is-on { background: var(--accent); color: var(--accent-ink); }
    .list__wrap { overflow-x: auto; max-height: 32rem; overflow-y: auto; }
    .list table { width: 100%; border-collapse: collapse; font-size: 0.9375rem; }
    .list th, .list td { padding: 0.5rem 0.65rem; border-bottom: 1px solid var(--stone); text-align: left; }
    .list th { background: var(--stone); position: sticky; top: 0; }
    @media (max-width: 960px) { .grid { grid-template-columns: 1fr; } }
    @media (max-width: 640px) { .box { grid-template-columns: 1fr; } .verdict { grid-template-columns: minmax(0, 1fr); } }
  `,
})
export class MyResultPage {
  /** Posición del puntaje y del mínimo en la regla de 0 a 1000; null si no hay puntaje. */
  protected scorePct(r: MyResultDto): number | null {
    const n = Number(r.score);
    return r.score == null || Number.isNaN(n) ? null : Math.max(0, Math.min(100, n / 10));
  }
  protected minPct(r: MyResultDto): number {
    return Math.max(0, Math.min(100, Number(r.minimum ?? 0) / 10));
  }

  private readonly store = inject(CallStore);
  /** Día de publicación por examen (el mismo día del examen, según el cronograma). */
  protected readonly dates = computed(() => {
    const call = this.store.call();
    if (!call) return [];
    return call.stages.filter((s) => s.code === 'EXAM_EXO' || s.code === 'EXAM_ORD')
      .map((s) => ({ name: s.code === 'EXAM_EXO' ? 'Exonerados' : 'Ordinario', exam: day(s.startsAt), past: new Date(call.now) >= new Date(s.startsAt) }));
  });

  private readonly api = inject(ApiService);
  protected doc = '';
  protected code = '';
  protected reviewText = '';
  protected q = '';
  protected readonly busy = signal(false);
  protected readonly downloading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly caseNumber = signal<string | null>(null);
  protected readonly r = signal<MyResultDto | null>(null);
  protected readonly list = signal<AdmittedListDto | null>(null);
  protected readonly exam = signal('ORD');
  protected readonly exams = [{ code: 'ORD', name: 'Ordinario' }, { code: 'EXO', name: 'Exonerados' }];
  protected readonly day = day;
  private searched: { doc: string; code: string } | null = null;

  constructor() {
    void this.loadList('ORD');
  }

  protected filtered(l: AdmittedListDto) {
    const q = this.q.trim().toUpperCase();
    return q ? l.rows.filter((a) => a.applicantCode.includes(q) || a.fullName.toUpperCase().includes(q) || a.program.toUpperCase().includes(q)) : l.rows;
  }

  protected async loadList(code: string) {
    this.exam.set(code);
    try { this.list.set(await firstValueFrom(this.api.admitted(code))); } catch { this.list.set(null); }
  }

  protected async search() {
    this.error.set(null);
    this.caseNumber.set(null);
    const doc = this.doc.trim();
    const code = this.code.trim();
    if (doc.length < 6 || !/^\d{8}$/.test(code)) return this.error.set('Escribe tu documento y tu código de postulante de 8 dígitos.');
    this.busy.set(true);
    try {
      this.r.set(await firstValueFrom(this.api.myResult(doc, code)));
      this.searched = { doc, code };
    } catch (e) {
      this.r.set(null);
      this.searched = null;
      this.error.set(apiErrorMessage(e));
    } finally {
      this.busy.set(false);
    }
  }

  protected async certificate() {
    if (!this.searched) return;
    this.downloading.set(true);
    try {
      const blob = await firstValueFrom(this.api.admissionCertificate(this.searched.doc, this.searched.code));
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `constancia-ingreso-${this.searched.code}.pdf`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e) {
      this.error.set(apiErrorMessage(e, 'No pudimos generar tu constancia. Inténtalo de nuevo.'));
    } finally {
      this.downloading.set(false);
    }
  }

  protected async review() {
    if (!this.searched || this.reviewText.trim().length < 20) return this.error.set('Describe el error material con al menos 20 caracteres.');
    try {
      this.caseNumber.set((await firstValueFrom(this.api.resultReview(this.searched.doc, this.searched.code, this.reviewText.trim()))).caseNumber);
      this.reviewText = '';
    } catch (e) {
      this.error.set(apiErrorMessage(e));
    }
  }
}
