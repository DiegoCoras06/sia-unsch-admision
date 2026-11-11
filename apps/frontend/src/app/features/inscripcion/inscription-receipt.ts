import { Component, inject, input, output, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { InscriptionSummaryDto } from '@sia/contracts';
import { ApiService } from '../../core/api.service';
import { dateTime, soles } from '../../core/format';
import { DossierPanel } from '../expediente/dossier-panel';
import { OnlinePayment } from '../pago/online-payment';
import { InscriptionTrack } from './inscription-track';

/** Constancia de inscripción y orden de pago (pantalla de éxito y "Mi inscripción"). Imprimible. */
@Component({
  selector: 'app-inscription-receipt',
  imports: [RouterLink, OnlinePayment, DossierPanel, InscriptionTrack],
  template: `
    @let s = summary();
    <article class="receipt" aria-labelledby="rc-title">
      <header class="receipt__head">
        <img src="img/escudo-unsch-oficial-120.webp" srcset="img/escudo-unsch-oficial-120.webp 1x, img/escudo-unsch-oficial-240.webp 2x" alt="" width="51" height="68">
        <div class="receipt__inst">
          <p class="receipt__uni">Universidad Nacional de San Cristóbal de Huamanga</p>
          <p class="receipt__dep">Vicerrectorado Académico</p>
          <p class="receipt__dep">Dirección de Admisión</p>
        </div>
      </header>
      <div class="receipt__rule" aria-hidden="true"></div>
      <div class="receipt__title">
        <h2 id="rc-title">{{ s.status === 'APTA' ? 'Constancia de inscripción' : 'Orden de pago' }}</h2>
        <p>Concurso de Admisión 2027-I</p>
      </div>

      <div class="receipt__code">
        <div>
          <p class="receipt__label">Código de postulante</p>
          <p class="receipt__code-num">{{ s.applicantCode }}</p>
          <p class="note">Úsalo para pagar y para consultar tu inscripción. También te lo enviamos a {{ s.maskedEmail }}.</p>
        </div>
        <div class="receipt__amount">
          <span class="receipt__stamp" [attr.data-state]="stampState()">{{ stampText() }}</span>
          <span class="receipt__label">{{ s.status === 'APTA' ? 'Monto pagado' : 'Monto a pagar' }}</span>
          <strong>{{ money(s.fee.total) }}</strong>
        </div>
      </div>

      <!-- El trámite completo: dónde está el postulante y qué sigue (reemplaza la línea de estado). -->
      <app-inscription-track [summary]="s" />
      @switch (payState()) {
        @case ('confirming') { <p class="receipt__confirm" role="status">Confirmando tu pago con Culqi… No cierres esta página.</p> }
        @case ('slow') { <p class="receipt__confirm is-slow" role="status">Tu pago se está procesando y puede tardar unos minutos. Vuelve a consultar con tu DNI y tu código en «Mi inscripción»; también te avisaremos por correo.</p> }
      }
      @if (s.noVacancyRight) {
        <p class="alert alert--info">Cursas 4.º de secundaria o un grado inferior: rendirás el examen <strong>sin derecho a vacante</strong> (Art. 9).</p>
      }

      <!-- Con el pago confirmado, lo primero es la ficha (la única acción destacada). -->
      @if (s.fichaAvailable) {
        <div class="receipt__ficha no-print">
          <div>
            <h3>Tu ficha de inscripción está lista</h3>
            <p>PDF con tu foto, programa, fecha del examen y un código QR que verifica que es auténtica. Imprímela y llévala con tu DNI original.</p>
            <p>Tu aula se publica 24 horas antes del examen en <a routerLink="/buscar-aula">«Buscar aula»</a>.</p>
          </div>
          @if (documentNumber()) {
            <button type="button" class="btn btn--gold" (click)="downloadFicha()" data-icon="descargar" [disabled]="downloading()" [attr.aria-busy]="downloading()">{{ downloading() ? 'Preparando…' : 'Descargar ficha (PDF)' }}</button>
          } @else {
            <a routerLink="/mi-inscripcion" class="btn btn--gold">Descargar en «Mi inscripción»</a>
          }
        </div>
        @if (fichaError()) { <p class="alert alert--error" role="alert">{{ fichaError() }}</p> }
      }

      <section class="receipt__sec" aria-labelledby="rc-personal">
        <h3 id="rc-personal" class="receipt__sec-title">Datos personales</h3>
        <dl class="receipt__rows">
          <div class="is-strong"><dt>N.° de documento</dt><dd>{{ s.maskedDocument }}</dd></div>
          <div><dt>Apellidos</dt><dd>{{ s.surnames }}</dd></div>
          <div><dt>Nombres</dt><dd>{{ s.firstNames }}</dd></div>
          <div><dt>Correo de contacto</dt><dd>{{ s.maskedEmail }}</dd></div>
        </dl>
      </section>
      <section class="receipt__sec" aria-labelledby="rc-postulacion">
        <h3 id="rc-postulacion" class="receipt__sec-title">Datos de la postulación</h3>
        <dl class="receipt__rows">
          <div><dt>Modalidad</dt><dd>{{ s.modality }}</dd></div>
          <div><dt>Tipo de modalidad</dt><dd>{{ s.quotaCategoryName }}</dd></div>
          <div><dt>Escuela profesional</dt><dd>{{ s.program }}</dd></div>
          <div><dt>Fecha del examen</dt><dd>{{ s.examDate }}</dd></div>
          <div><dt>Inscripción registrada</dt><dd>{{ when(s.createdAt) }}</dd></div>
        </dl>
      </section>

      @if (documentNumber() && s.modalityCode === 'EXO') {
        <app-dossier-panel [documentNumber]="documentNumber()!" [applicantCode]="s.applicantCode" (changed)="refreshOnce()" />
      }

      <!-- Primero cuánto y por qué; después cómo pagar. -->
      <section class="receipt__sec" aria-labelledby="rc-pago">
        <h3 id="rc-pago" class="receipt__sec-title">Detalle del pago</h3>
        <table class="receipt__fee">
          <thead><tr><th scope="col">Concepto</th><th scope="col">Base legal</th><th scope="col">Importe</th></tr></thead>
          <tbody>
            @for (l of s.fee.lines; track l.code) { <tr><td>{{ l.concept }}</td><td>{{ l.legalNote }}</td><td>{{ money(l.amount) }}</td></tr> }
          </tbody>
        </table>
        <p class="receipt__total"><span>{{ s.status === 'APTA' ? 'Monto pagado (S/)' : 'Monto a pagar (S/)' }}</span><strong>{{ s.fee.total }}</strong></p>
        @if (s.status === 'PENDIENTE_VALIDACION' || s.status === 'OBSERVADA') {
          <p class="alert alert--info">Como exonerado, primero un evaluador de la Dirección de Admisión revisa tu expediente en línea. Podrás pagar cuando sea autorizado; te avisaremos por correo.</p>
        }
        <p class="note">@if (s.status === 'APTA') { Pago confirmado: descarga tu ficha más arriba. } @else { Con pago en línea tu ficha se habilita al confirmarse; con pago en ventanilla, 24 horas después. } Los pagos no se devuelven (Art. 18).</p>
      </section>

      @if (documentNumber() && (s.status === 'PENDIENTE_PAGO' || s.status === 'APTA')) {
        <app-online-payment [documentNumber]="documentNumber()!" [applicantCode]="s.applicantCode" [amount]="s.fee.total" (paid)="onPaid()" />
      }
      @if (s.status === 'PENDIENTE_PAGO') {
        <details class="receipt__counter">
          <summary>¿Prefieres pagar en ventanilla?</summary>
          <p>Indica tu <strong>código de postulante {{ s.applicantCode }}</strong> en:</p>
          <ul class="entities">
            @for (e of s.paymentEntities; track e) { <li>{{ e }}</li> }
          </ul>
          <p class="note">Descarga tu orden de pago (una hoja) con el botón de abajo, imprímela y llévala.</p>
        </details>
      }

      <div class="receipt__actions no-print">
        @if (documentNumber()) {
          <button type="button" class="btn" (click)="downloadOrden()" data-icon="descargar" [disabled]="downloadingOrden()" [attr.aria-busy]="downloadingOrden()">{{ downloadingOrden() ? 'Preparando…' : s.status === 'APTA' ? 'Descargar constancia (PDF)' : 'Descargar orden de pago (PDF)' }}</button>
        } @else {
          <button type="button" class="btn" (click)="print()" data-icon="imprimir">{{ s.status === 'APTA' ? 'Imprimir constancia' : 'Imprimir orden de pago' }}</button>
        }
        <a routerLink="/mi-inscripcion" class="btn btn--quiet">Consultar mi inscripción</a>
      </div>
      @if (ordenError()) { <p class="alert alert--error no-print" role="alert">{{ ordenError() }}</p> }
    </article>
  `,
  styles: `
    .receipt { background: var(--ground); padding: clamp(1.5rem, 4vw, 3rem); display: grid; gap: 1.5rem; border-radius: var(--radius-lg); box-shadow: 0 18px 40px -28px rgb(29 20 21 / 0.45); }
    /* Membrete como la orden de pago impresa: escudo, institución centrada y la doble línea guinda y dorada. */
    .receipt__head { display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: 1rem; }
    .receipt__head::after { content: ''; width: 51px; }
    .receipt__inst { text-align: center; display: grid; gap: 0.2rem; }
    .receipt__inst p { margin: 0; max-width: none; }
    .receipt__uni { font-size: clamp(0.9375rem, 1.6vw, 1.125rem); font-weight: 800; letter-spacing: 0.01em; text-transform: uppercase; }
    .receipt__dep { font-size: var(--size-note); font-weight: 600; color: var(--ink-soft); letter-spacing: 0.06em; text-transform: uppercase; }
    .receipt__rule { height: 5px; border-top: 2px solid var(--accent); border-bottom: 1px solid var(--gold); margin-top: -0.5rem; }
    .receipt__title { text-align: center; display: grid; gap: 0.3rem; }
    .receipt__title h2 { font-size: clamp(1.5rem, 3vw, 2rem); color: var(--accent); text-transform: uppercase; letter-spacing: 0.04em; }
    .receipt__title p { margin: 0 auto; color: var(--ink-soft); font-size: var(--size-note); }
    .receipt__label { margin: 0; font-size: 0.8125rem; font-weight: 700; color: var(--ink-soft); letter-spacing: 0.06em; text-transform: uppercase; }
    /* Recuadro blanco con el código, el estado y el monto. */
    .receipt__code { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 1rem 2rem; padding: 1.25rem 1.5rem; border: 1px solid var(--stone-deep); border-radius: var(--radius-lg); }
    .receipt__code .note { margin: 0.35rem 0 0; color: var(--ink-soft); max-width: 46ch; }
    .receipt__code-num { margin: 0.2rem 0 0; font-size: clamp(2.5rem, 7vw, 3.75rem); font-weight: 800; letter-spacing: 0.06em; color: var(--accent); line-height: 1; font-variant-numeric: tabular-nums; }
    .receipt__amount { display: grid; justify-items: end; gap: 0.3rem; text-align: right; }
    .receipt__amount strong { font-size: clamp(1.5rem, 3vw, 2rem); font-weight: 800; letter-spacing: -0.02em; }
    .receipt__stamp { padding: 0.25rem 0.8rem; border-radius: 999px; font-size: 0.8125rem; font-weight: 800; letter-spacing: 0.04em; text-transform: uppercase; background: #fbf1d9; color: #6b4a00; }
    .receipt__stamp[data-state='ok'] { background: #e3f1e8; color: #164d2a; }
    .receipt__stamp[data-state='review'] { background: #ece7f3; color: #3e2a66; }
    /* Secciones con título en mayúsculas pequeñas y una línea fina hasta el borde. */
    .receipt__sec { display: grid; gap: 0.85rem; }
    .receipt__sec-title { display: flex; align-items: center; gap: 0.75rem; font-size: 0.875rem; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; color: var(--accent); }
    .receipt__sec-title::after { content: ''; flex: 1; height: 1px; background: var(--stone-deep); }
    .receipt__rows { margin: 0; display: grid; gap: 0.55rem; }
    .receipt__rows div { display: grid; grid-template-columns: minmax(9rem, 13rem) auto 1fr; gap: 0.75rem; align-items: baseline; }
    .receipt__rows div::before { content: ':'; grid-column: 2; grid-row: 1; color: var(--ink-soft); }
    .receipt__rows dt { grid-column: 1; grid-row: 1; font-size: 0.9375rem; color: var(--ink-soft); font-weight: 500; }
    .receipt__rows dd { grid-column: 3; grid-row: 1; margin: 0; font-weight: 700; font-size: 1rem; }
    .receipt__rows .is-strong dd { font-size: 1.25rem; font-weight: 800; letter-spacing: 0.02em; }
    /* Detalle del pago: tabla limpia y el total destacado sobre la doble línea. */
    .receipt__fee { width: 100%; border-collapse: collapse; font-size: 0.9375rem; }
    .receipt__fee th { padding: 0 0.25rem 0.5rem; text-align: left; font-size: 0.75rem; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: var(--ink-soft); border-bottom: 1.5px solid var(--ink); }
    .receipt__fee td { padding: 0.65rem 0.25rem; border-bottom: 1px solid var(--stone-deep); }
    .receipt__fee td:nth-child(2) { color: var(--ink-soft); font-size: var(--size-note); }
    .receipt__fee th:last-child, .receipt__fee td:last-child { text-align: right; white-space: nowrap; font-weight: 700; }
    .receipt__total { max-width: none; display: flex; flex-wrap: wrap; align-items: baseline; justify-content: space-between; gap: 0.5rem; margin: 0.25rem 0 0; padding-bottom: 0.6rem;
      border-bottom: 2px solid var(--accent); box-shadow: 0 3px 0 -1px var(--gold); }
    .receipt__total span { font-weight: 800; letter-spacing: 0.04em; text-transform: uppercase; }
    .receipt__total strong { font-size: clamp(1.75rem, 4vw, 2.25rem); font-weight: 800; color: var(--accent); font-variant-numeric: tabular-nums; }
    .receipt__status { padding: 1rem 1.25rem; background: #e3f1e8; color: #164d2a; }
    .receipt__status.is-wait { background: #fbf1d9; color: #6b4a00; }
    .receipt__confirm { padding: 0.9rem 1.25rem; background: var(--accent); color: var(--accent-ink); font-weight: 700; }
    .receipt__confirm.is-slow { background: var(--stone); color: var(--ink); font-weight: 600; }
    .receipt__counter { background: var(--stone); padding: 1rem 1.5rem; }
    .receipt__counter summary { cursor: pointer; font-weight: 700; }
    .receipt__counter[open] { display: grid; gap: 0.5rem; }
    .receipt__counter ul { margin: 0; }
    .entities { padding-left: 1.2rem !important; list-style: disc !important; }
    .entities li { display: list-item !important; }
    .receipt__actions { display: flex; flex-wrap: wrap; gap: 0.5rem; }
    .receipt__ficha { display: flex; gap: 1.5rem; align-items: center; justify-content: space-between; background: var(--accent); color: var(--accent-ink); padding: 1.5rem; }
    .receipt__ficha h3 { font-size: 1.5rem; color: var(--gold); }
    .receipt__ficha a:not(.btn) { color: var(--gold); font-weight: 700; }
    .receipt__ficha p { max-width: 48ch; }
    .btn--gold { white-space: nowrap; }
    @media (max-width: 640px) { .receipt__ficha { flex-direction: column; align-items: stretch; } }
    @media (max-width: 640px) {
      .receipt__head { grid-template-columns: auto 1fr; }
      .receipt__head::after { display: none; }
      .receipt__inst { text-align: left; }
      .receipt__amount { justify-items: start; text-align: left; }
      .receipt__rows div { grid-template-columns: 1fr; gap: 0.1rem; }
      .receipt__rows div::before { display: none; }
      .receipt__rows dd { grid-column: 1; grid-row: 2; }
      .receipt__fee td:nth-child(2), .receipt__fee th:nth-child(2) { display: none; }
    }
    @media print { .no-print { display: none !important; } .receipt { padding: 0; } .receipt__counter { display: block; } .receipt__counter > * { display: block; } }
  `,
})
export class InscriptionReceipt {
  /** Sello del estado, como en la orden impresa: qué tiene que hacer el postulante. */
  protected stampState(): 'ok' | 'review' | 'wait' {
    const st = this.summary().status;
    return st === 'APTA' ? 'ok' : st === 'PENDIENTE_VALIDACION' || st === 'OBSERVADA' ? 'review' : 'wait';
  }
  protected stampText(): string {
    return { ok: 'Pagado', review: 'Expediente en revisión', wait: 'Pendiente de pago' }[this.stampState()];
  }
  readonly summary = input.required<InscriptionSummaryDto>();
  /** Documento completo (no enmascarado) que el postulante acaba de escribir; habilita el pago en línea. */
  readonly documentNumber = input<string | null>(null);
  /** Estado actualizado de la inscripción (tras pagar o tras un cambio del expediente). */
  readonly updated = output<InscriptionSummaryDto>();
  /** Tras pagar: la inscripción pasa a Apta por evento, en uno o dos segundos (a veces más). */
  protected readonly payState = signal<'idle' | 'confirming' | 'slow'>('idle');
  protected readonly money = soles;
  protected readonly when = dateTime;
  private readonly api = inject(ApiService);
  protected readonly downloading = signal(false);
  protected readonly fichaError = signal<string | null>(null);
  protected readonly downloadingOrden = signal(false);
  protected readonly ordenError = signal<string | null>(null);

  /** Pago aprobado: se consulta el estado hasta que la inscripción quede Apta (unos 15 s como máximo). */
  protected onPaid(): void {
    const doc = this.documentNumber();
    if (!doc || this.summary().status === 'APTA') return;
    this.payState.set('confirming');
    const poll = (left: number) => setTimeout(() => this.api.inscriptionStatus(doc, this.summary().applicantCode).subscribe({
      next: (fresh) => {
        this.updated.emit(fresh);
        if (fresh.status === 'APTA') this.payState.set('idle');
        else if (left > 1) poll(left - 1);
        else this.payState.set('slow');
      },
      error: () => (left > 1 ? poll(left - 1) : this.payState.set('slow')),
    }), 1500);
    poll(10);
  }

  /** Cambio del expediente: una sola consulta del estado. */
  protected refreshOnce(): void {
    const doc = this.documentNumber();
    if (!doc) return;
    this.api.inscriptionStatus(doc, this.summary().applicantCode).subscribe({ next: (fresh) => this.updated.emit(fresh), error: () => undefined });
  }

  protected print(): void {
    window.print();
  }

  /** Orden de pago (o constancia, si ya pagó) en una sola hoja A4, generada en el servidor. */
  protected downloadOrden(): void {
    const s = this.summary();
    const doc = this.documentNumber();
    if (!doc) return;
    this.downloadingOrden.set(true);
    this.ordenError.set(null);
    this.api.ordenPagoPdf(doc, s.applicantCode).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `orden-de-pago-${s.applicantCode}.pdf`;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        this.downloadingOrden.set(false);
      },
      error: () => {
        this.ordenError.set('No pudimos generar tu orden de pago. Inténtalo de nuevo en unos minutos.');
        this.downloadingOrden.set(false);
      },
    });
  }

  protected downloadFicha(): void {
    const s = this.summary();
    const doc = this.documentNumber();
    if (!doc) return;
    this.downloading.set(true);
    this.fichaError.set(null);
    this.api.fichaPdf(doc, s.applicantCode).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ficha-inscripcion-${s.applicantCode}.pdf`;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        this.downloading.set(false);
      },
      error: () => {
        this.fichaError.set('No pudimos generar tu ficha. Inténtalo de nuevo en unos minutos.');
        this.downloading.set(false);
      },
    });
  }
}
