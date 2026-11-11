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
        <img src="img/escudo-unsch-240.webp" alt="" width="56" height="68">
        <div>
          <p class="receipt__org">Universidad Nacional de San Cristóbal de Huamanga, Admisión 2027-I</p>
          <h2 id="rc-title">Orden de pago y constancia de inscripción</h2>
        </div>
      </header>

      <div class="receipt__code">
        <p>Código de postulante</p>
        <p class="receipt__code-num">{{ s.applicantCode }}</p>
        <p class="note">Úsalo para pagar y para consultar tu inscripción. También te lo enviamos a {{ s.maskedEmail }}.</p>
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

      <dl class="receipt__data">
        <div><dt>Postulante</dt><dd>{{ s.fullName }}</dd></div>
        <div><dt>Documento</dt><dd>{{ s.maskedDocument }}</dd></div>
        <div><dt>Programa de estudio</dt><dd>{{ s.program }}</dd></div>
        <div><dt>Modalidad</dt><dd>{{ s.modality }}@if (s.quotaCategoryName !== s.modality) { - {{ s.quotaCategoryName }}}</dd></div>
        <div><dt>Examen</dt><dd>{{ s.examDate }}</dd></div>
        <div><dt>Registrada</dt><dd>{{ when(s.createdAt) }}</dd></div>
      </dl>

      @if (documentNumber() && s.modalityCode === 'EXO') {
        <app-dossier-panel [documentNumber]="documentNumber()!" [applicantCode]="s.applicantCode" (changed)="refreshOnce()" />
      }

      <!-- Primero cuánto y por qué; después cómo pagar. -->
      <div class="receipt__pay">
        <h3>{{ s.status === 'APTA' ? 'Derecho de inscripción pagado' : 'Monto a pagar' }}: {{ money(s.fee.total) }}</h3>
        <ul>
          @for (l of s.fee.lines; track l.code) { <li><span>{{ l.concept }} <small>({{ l.legalNote }})</small></span><strong>{{ money(l.amount) }}</strong></li> }
        </ul>
        @if (s.status === 'PENDIENTE_VALIDACION' || s.status === 'OBSERVADA') {
          <p class="alert alert--info">Como exonerado, primero un evaluador de la Dirección de Admisión revisa tu expediente en línea. Podrás pagar cuando sea autorizado; te avisaremos por correo.</p>
        }
        <p class="note">@if (s.status === 'APTA') { Pago confirmado: descarga tu ficha más arriba. } @else { Con pago en línea tu ficha se habilita al confirmarse; con pago en ventanilla, 24 horas después. } Los pagos no se devuelven (Art. 18).</p>
      </div>

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
    .receipt { background: var(--ground); padding: clamp(1.5rem, 4vw, 3rem); display: grid; gap: 1.5rem; }
    .receipt__head { display: flex; gap: 1rem; align-items: center; }
    .receipt__org { font-size: var(--size-note); color: var(--ink-soft); font-weight: 600; }
    .receipt h2 { font-size: clamp(1.5rem, 3vw, 2.25rem); }
    .receipt__code { background: var(--accent); color: var(--accent-ink); padding: 1.5rem; display: grid; gap: 0.25rem; }
    .receipt__code .note { color: var(--accent-ink); opacity: 0.9; }
    .receipt__code-num { font-size: clamp(3rem, 9vw, 5.5rem); font-weight: 800; letter-spacing: 0.04em; color: var(--gold); line-height: 1; font-variant-numeric: tabular-nums; }
    .receipt__data { margin: 0; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1rem 2rem; }
    dt { font-size: var(--size-note); color: var(--ink-soft); font-weight: 600; }
    dd { margin: 0; font-weight: 700; font-size: 1.125rem; }
    .receipt__status { padding: 1rem 1.25rem; background: #e3f1e8; color: #164d2a; }
    .receipt__status.is-wait { background: #fbf1d9; color: #6b4a00; }
    .receipt__confirm { padding: 0.9rem 1.25rem; background: var(--accent); color: var(--accent-ink); font-weight: 700; }
    .receipt__confirm.is-slow { background: var(--stone); color: var(--ink); font-weight: 600; }
    .receipt__counter { background: var(--stone); padding: 1rem 1.5rem; }
    .receipt__counter summary { cursor: pointer; font-weight: 700; }
    .receipt__counter[open] { display: grid; gap: 0.5rem; }
    .receipt__counter ul { margin: 0; }
    .receipt__pay { background: var(--stone); padding: 1.5rem; display: grid; gap: 0.75rem; }
    .receipt__pay h3 { font-size: 1.5rem; }
    .receipt__pay ul { margin: 0; padding: 0; list-style: none; display: grid; gap: 0.35rem; }
    .receipt__pay li { display: flex; justify-content: space-between; gap: 1rem; }
    .receipt__pay small { color: var(--ink-soft); }
    .entities { padding-left: 1.2rem !important; list-style: disc !important; }
    .entities li { display: list-item !important; }
    .receipt__actions { display: flex; flex-wrap: wrap; gap: 0.5rem; }
    .receipt__ficha { display: flex; gap: 1.5rem; align-items: center; justify-content: space-between; background: var(--accent); color: var(--accent-ink); padding: 1.5rem; }
    .receipt__ficha h3 { font-size: 1.5rem; color: var(--gold); }
    .receipt__ficha a:not(.btn) { color: var(--gold); font-weight: 700; }
    .receipt__ficha p { max-width: 48ch; }
    .btn--gold { white-space: nowrap; }
    @media (max-width: 640px) { .receipt__ficha { flex-direction: column; align-items: stretch; } }
    @media (max-width: 640px) { .receipt__data { grid-template-columns: 1fr; } }
    @media print { .no-print { display: none !important; } .receipt { padding: 0; } .receipt__counter { display: block; } .receipt__counter > * { display: block; } }
  `,
})
export class InscriptionReceipt {
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
