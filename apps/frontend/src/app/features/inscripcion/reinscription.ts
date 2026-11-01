import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import type { InscriptionSummaryDto, OptionSummaryDto } from '@sia/contracts';
import { ApiService, apiErrorMessage, type ReinscriptionCheck } from '../../core/api.service';
import { CallStore } from '../../core/call.store';
import { longDate } from '../../core/format';
import { InscriptionReceipt } from './inscription-receipt';

/**
 * Reinscripción de exonerados no admitidos al examen Ordinario (spec 003, Historia 6; RN-16, Art. 21).
 * Con DNI + código de la inscripción de Exonerados se verifica si corresponde, se elige el programa
 * y se genera la nueva inscripción con la tasa de S/ 180.00 y sus datos precargados.
 */
@Component({
  selector: 'app-reinscription',
  imports: [RouterLink, FormsModule, InscriptionReceipt],
  template: `
    <section class="frame section stack-lg">
      <header class="stack">
        <h1>Reinscripción al Ordinario</h1>
        <p class="lead">
          Si postulaste por Exonerados y no alcanzaste vacante, puedes reinscribirte al examen ordinario pagando S/ 180.00,
          sin volver a llenar tus datos. No aplica a traslados ni a graduados o titulados (Art. 21).
        </p>
        @if (stage(); as s) {
          <p class="alert alert--info">
            @if (s.status === 'IN_PROGRESS') { La reinscripción está abierta hasta el {{ longDate(s.endsAt) }}. }
            @else if (s.status === 'UPCOMING') { La reinscripción se habilita del {{ longDate(s.startsAt) }} al {{ longDate(s.endsAt) }}, después de los resultados de Exonerados. }
            @else { La reinscripción de esta convocatoria ya cerró. }
          </p>
        }
      </header>

      @if (result(); as r) {
        <app-inscription-receipt [summary]="r" [documentNumber]="doc" (updated)="result.set($event)" />
      } @else {
        <form class="re-card" (ngSubmit)="check()">
          <h2>1. Tu inscripción de Exonerados</h2>
          <div class="re-grid">
            <div class="field"><label for="re-doc">DNI</label>
              <input id="re-doc" class="input" name="doc" [(ngModel)]="doc" inputmode="numeric" maxlength="8" autocomplete="off" required></div>
            <div class="field"><label for="re-code">Código de postulante (Exonerados)</label>
              <input id="re-code" class="input" name="code" [(ngModel)]="code" inputmode="numeric" maxlength="8" autocomplete="off" required></div>
          </div>
          <button class="btn" type="submit" [disabled]="busy()">{{ busy() ? 'Verificando…' : 'Verificar' }}</button>
        </form>

        @if (status(); as st) {
          <div class="re-card">
            <h2>2. {{ st.eligible ? 'Puedes reinscribirte' : 'No corresponde la reinscripción' }}</h2>
            <dl class="re-data">
              <div><dt>Postulante</dt><dd>{{ st.fullName }}</dd></div>
              <div><dt>Postulaste por</dt><dd>{{ st.fromModality }}</dd></div>
              <div><dt>Tasa de reinscripción</dt><dd>{{ st.amount ? 'S/ ' + st.amount : '—' }}</dd></div>
            </dl>
            @if (!st.eligible) { <p class="alert alert--error" role="alert">{{ st.reason }}</p> }
            @else {
              <form class="stack" (ngSubmit)="reinscribe()">
                <div class="field">
                  <label for="re-prog">Programa de estudio (vacantes del Ordinario)</label>
                  <input class="input" type="search" placeholder="Buscar: sistemas, medicina, educación…" [ngModel]="query()" (ngModelChange)="query.set($event)" name="q" aria-controls="re-prog">
                  <select id="re-prog" class="select" name="prog" [(ngModel)]="optionCode" required>
                    <option value="">Seleccione ({{ visible().length }} con vacantes)</option>
                    @for (p of visible(); track p.internalCode) { <option [value]="p.internalCode">{{ p.displayName }} - {{ p.ordinaryVacancies }} vacantes</option> }
                  </select>
                </div>
                <p class="note">Tus datos personales y tu foto se copian de tu inscripción de Exonerados. Después de reinscribirte no podrás cambiar de programa; el pago no se devuelve (Art. 18).</p>
                <button class="btn btn--gold" type="submit" [disabled]="!optionCode || busy()">{{ busy() ? 'Registrando…' : 'Reinscribirme por S/ ' + st.amount }}</button>
              </form>
            }
          </div>
        }
        @if (error()) { <p class="alert alert--error" role="alert">{{ error() }}</p> }
        <p><a routerLink="/cronograma" class="link-arrow">Ver el cronograma</a></p>
      }
    </section>
  `,
  styles: `
    .re-card { background: var(--ground, #fff); padding: clamp(1.25rem, 3vw, 2rem); display: grid; gap: 1rem; max-width: 48rem; }
    .re-card h2 { font-size: 1.375rem; }
    .re-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1rem; }
    .re-data { margin: 0; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 1rem; }
    .re-data dt { font-size: var(--size-note); color: var(--ink-soft); font-weight: 600; }
    .re-data dd { margin: 0; font-weight: 700; }
    .field { display: grid; gap: 0.4rem; }
    @media (max-width: 640px) { .re-grid, .re-data { grid-template-columns: minmax(0, 1fr); } }
  `,
})
export class ReinscriptionPage {
  private readonly api = inject(ApiService);
  private readonly store = inject(CallStore);
  protected readonly stage = computed(() => this.store.call()?.stages.find((s) => s.code === 'REINS') ?? null);
  protected readonly longDate = longDate;
  protected readonly status = signal<ReinscriptionCheck | null>(null);
  protected readonly result = signal<InscriptionSummaryDto | null>(null);
  protected readonly programs = signal<OptionSummaryDto[]>([]);
  protected readonly query = signal('');
  protected readonly busy = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly visible = computed(() => {
    const fold = (s: string) => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
    const q = fold(this.query().trim());
    return this.programs().filter((p) => p.ordinaryVacancies > 0 && (!q || fold(p.displayName).includes(q)));
  });
  protected doc = '';
  protected code = '';
  protected optionCode = '';

  protected check(): void {
    this.error.set(null);
    this.status.set(null);
    if (!/^\d{8}$/.test(this.doc.trim()) || !/^\d{8}$/.test(this.code.trim())) {
      this.error.set('Escribe tu DNI y tu código de postulante: 8 dígitos cada uno.');
      return;
    }
    this.busy.set(true);
    this.api.reinscriptionCheck(this.doc.trim(), this.code.trim()).subscribe({
      next: (st) => {
        this.status.set(st);
        this.busy.set(false);
        const call = this.store.call()?.code;
        if (st.eligible && call && !this.programs().length) this.api.options(call, { category: 'ORD' }).subscribe((r) => this.programs.set(r.data));
      },
      error: (e) => { this.error.set(apiErrorMessage(e)); this.busy.set(false); },
    });
  }

  protected reinscribe(): void {
    this.busy.set(true);
    this.error.set(null);
    this.api.reinscribe(this.doc.trim(), this.code.trim(), this.optionCode).subscribe({
      next: (r) => { this.result.set(r); this.busy.set(false); },
      error: (e) => { this.error.set(apiErrorMessage(e)); this.busy.set(false); },
    });
  }
}
