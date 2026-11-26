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
    <section class="frame re-page" aria-labelledby="re-title">
      <div class="re-layout">
        <header class="re-intro">
          <h1 id="re-title">Reinscripción al Ordinario</h1>
          <p class="lead">
            Si postulaste por Exonerados y no alcanzaste vacante, puedes reinscribirte al examen
            ordinario pagando S/ 180.00, sin volver a llenar tus datos. No aplica a traslados ni a
            graduados o titulados (Art. 21).
          </p>
        </header>

        @if (stage(); as s) {
          <aside
            class="re-period"
            [class.re-period--open]="s.status === 'IN_PROGRESS'"
            [class.re-period--upcoming]="s.status === 'UPCOMING'"
            [class.re-period--closed]="s.status !== 'IN_PROGRESS' && s.status !== 'UPCOMING'"
            role="status"
            aria-live="polite"
          >
            <p class="re-period__label">Estado del periodo</p>
            <p class="re-period__state">
              @if (s.status === 'IN_PROGRESS') {
                Reinscripción abierta
              } @else if (s.status === 'UPCOMING') {
                Próximamente
              } @else {
                Periodo cerrado
              }
            </p>
            <p class="re-period__copy">
              @if (s.status === 'IN_PROGRESS') {
                La reinscripción está abierta hasta el {{ longDate(s.endsAt) }}.
              } @else if (s.status === 'UPCOMING') {
                La reinscripción se habilita del {{ longDate(s.startsAt) }} al
                {{ longDate(s.endsAt) }}, después de los resultados de Exonerados.
              } @else {
                La reinscripción de esta convocatoria ya cerró.
              }
            </p>
          </aside>
        }
      </div>

      @if (result(); as r) {
        <div class="re-content">
          <app-inscription-receipt
            [summary]="r"
            [documentNumber]="doc"
            (updated)="result.set($event)"
          />
        </div>
      } @else {
        <div class="re-content">
          <form class="re-card" aria-labelledby="re-check-title" (ngSubmit)="check()">
            <header class="re-card__intro">
              <h2 id="re-check-title">1. Tu inscripción de Exonerados</h2>
              <p class="re-card__help">
                Ingresa el DNI y el código de postulante de tu inscripción por Exonerados.
              </p>
            </header>
            <div class="re-grid">
              <div class="field">
                <label for="re-doc">DNI</label>
                <input
                  id="re-doc"
                  class="input"
                  name="doc"
                  [(ngModel)]="doc"
                  inputmode="numeric"
                  maxlength="8"
                  autocomplete="off"
                  required
                />
              </div>
              <div class="field">
                <label for="re-code">Código de postulante (Exonerados)</label>
                <input
                  id="re-code"
                  class="input"
                  name="code"
                  [(ngModel)]="code"
                  inputmode="numeric"
                  maxlength="8"
                  autocomplete="off"
                  required
                />
              </div>
            </div>
            <div class="re-actions">
              <button class="btn" type="submit" [disabled]="busy()" [attr.aria-busy]="busy()">
                {{ busy() ? 'Verificando…' : 'Verificar' }}
              </button>
            </div>
          </form>

          @if (status(); as st) {
            <section
              class="re-card re-result"
              [class.re-result--eligible]="st.eligible"
              [class.re-result--ineligible]="!st.eligible"
              aria-labelledby="re-result-title"
            >
              <header class="re-card__intro">
                <h2 id="re-result-title">
                  2. {{ st.eligible ? 'Puedes reinscribirte' : 'No corresponde la reinscripción' }}
                </h2>
              </header>
              <dl class="re-data">
                <div>
                  <dt>Postulante</dt>
                  <dd>{{ st.fullName }}</dd>
                </div>
                <div>
                  <dt>Postulaste por</dt>
                  <dd>{{ st.fromModality }}</dd>
                </div>
                <div>
                  <dt>Tasa de reinscripción</dt>
                  <dd>{{ st.amount ? 'S/ ' + st.amount : '-' }}</dd>
                </div>
              </dl>
              @if (!st.eligible) {
                <p class="alert alert--error" role="alert">{{ st.reason }}</p>
              } @else {
                <form class="re-select-form" (ngSubmit)="reinscribe()">
                  <div class="re-program-grid">
                    <div class="field">
                      <label for="re-search">Buscar programa</label>
                      <input
                        id="re-search"
                        class="input"
                        type="search"
                        placeholder="Sistemas, medicina, educación…"
                        [ngModel]="query()"
                        (ngModelChange)="query.set($event)"
                        name="q"
                        aria-controls="re-prog"
                      />
                    </div>
                    <div class="field">
                      <label for="re-prog">Programa de estudio (vacantes del Ordinario)</label>
                      <select
                        id="re-prog"
                        class="select"
                        name="prog"
                        [(ngModel)]="optionCode"
                        required
                      >
                        <option value="">Seleccione ({{ visible().length }} con vacantes)</option>
                        @for (p of visible(); track p.internalCode) {
                          <option [value]="p.internalCode">
                            {{ p.displayName }} - {{ p.ordinaryVacancies }} vacantes
                          </option>
                        }
                      </select>
                    </div>
                  </div>
                  <p class="re-warning">
                    Tus datos personales y tu foto se copian de tu inscripción de Exonerados.
                    Después de reinscribirte no podrás cambiar de programa; el pago no se devuelve
                    (Art. 18).
                  </p>
                  <div class="re-actions">
                    <button
                      class="btn btn--gold"
                      type="submit"
                      [disabled]="!optionCode || busy()"
                      [attr.aria-busy]="busy()"
                    >
                      {{ busy() ? 'Registrando…' : 'Reinscribirme por S/ ' + st.amount }}
                    </button>
                  </div>
                </form>
              }
            </section>
          }
          @if (error()) {
            <p class="alert alert--error" role="alert">{{ error() }}</p>
          }
          <p class="re-schedule">
            Consulta las fechas en el <a routerLink="/cronograma" class="link-arrow">cronograma</a>.
          </p>
        </div>
      }
    </section>
  `,
  styles: `
    .re-page {
      padding-block: clamp(2.5rem, 5vw, 4.5rem) clamp(4rem, 8vw, 7rem);
    }
    .re-layout {
      display: grid;
      grid-template-columns: minmax(0, 1.35fr) minmax(18rem, 0.65fr);
      align-items: center;
      gap: clamp(2rem, 5vw, 4.5rem);
      max-width: 76rem;
      margin-inline: auto;
    }
    .re-intro {
      display: grid;
      gap: 1.25rem;
    }
    .re-intro h1 {
      max-width: 17ch;
      font-size: clamp(2.5rem, 5vw, 4.25rem);
      line-height: 1.04;
    }
    .re-intro .lead {
      max-width: 58ch;
    }
    .re-period {
      display: grid;
      align-content: start;
      gap: 0.55rem;
      padding: clamp(1.25rem, 2.5vw, 1.75rem);
      background: var(--stone);
      border: 1px solid var(--stone-deep);
      border-radius: var(--radius-lg);
    }
    .re-period__label,
    .re-period__copy {
      margin: 0;
      font-size: var(--size-note);
    }
    .re-period__label {
      color: var(--ink-soft);
      font-weight: 600;
    }
    .re-period__state {
      margin: 0;
      font-size: clamp(1.25rem, 2vw, 1.5rem);
      font-weight: 700;
      line-height: 1.25;
    }
    .re-period__state::before {
      display: inline-block;
      width: 0.55rem;
      height: 0.55rem;
      margin: 0 0.55rem 0.15rem 0;
      border-radius: 50%;
      background: var(--ink-soft);
      content: '';
    }
    .re-period--open .re-period__state::before {
      background: var(--ok);
    }
    .re-period--upcoming .re-period__state::before {
      background: var(--warn);
    }
    .re-period__copy {
      color: var(--ink-soft);
      line-height: 1.5;
    }
    .re-content {
      display: grid;
      gap: 1.25rem;
      max-width: 68rem;
      margin: clamp(2.5rem, 5vw, 4rem) auto 0;
    }
    .re-card {
      display: grid;
      gap: 1.5rem;
      padding: clamp(1.25rem, 3vw, 2rem);
      background: var(--ground);
      border: 1px solid var(--stone-deep);
      border-radius: var(--radius-lg);
    }
    .re-card__intro {
      display: grid;
      gap: 0.5rem;
    }
    .re-card h2 {
      font-size: clamp(1.25rem, 2.2vw, 1.5rem);
      line-height: 1.25;
    }
    .re-card__help {
      margin: 0;
      color: var(--ink-soft);
      font-size: var(--size-note);
    }
    .re-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 1.25rem;
    }
    .re-actions {
      display: flex;
      justify-content: flex-end;
    }
    .re-data {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      margin: 0;
      padding-block: 0.25rem;
      border-block: 1px solid var(--stone-deep);
    }
    .re-data > div {
      min-width: 0;
      padding: 0.75rem 1rem;
    }
    .re-data > div:first-child {
      padding-left: 0;
    }
    .re-data > div + div {
      border-left: 1px solid var(--stone-deep);
    }
    .re-data dt {
      color: var(--ink-soft);
      font-size: var(--size-note);
      font-weight: 600;
    }
    .re-data dd {
      margin: 0.2rem 0 0;
      font-weight: 700;
      overflow-wrap: anywhere;
    }
    .re-result--eligible h2 {
      color: var(--ok);
    }
    .re-result--ineligible h2 {
      color: var(--danger);
    }
    .re-program-grid {
      display: grid;
      grid-template-columns: minmax(0, 0.8fr) minmax(0, 1.2fr);
      gap: 1rem;
    }
    .re-warning {
      margin: 0;
      padding: 0.9rem 1rem;
      background: #fbf1d9;
      color: #6b4a00;
      border-radius: var(--radius);
      font-size: var(--size-note);
    }
    .re-schedule {
      margin: 0;
      color: var(--ink-soft);
      font-size: var(--size-note);
    }
    @media (max-width: 880px) {
      .re-layout {
        grid-template-columns: minmax(0, 1fr);
        align-items: start;
        gap: 1.5rem;
      }
      .re-intro h1 {
        max-width: 20ch;
      }
      .re-period {
        max-width: 38rem;
      }
    }
    @media (max-width: 640px) {
      .re-page {
        padding-block: 2rem 4rem;
      }
      .re-intro {
        gap: 1rem;
      }
      .re-intro h1 {
        font-size: clamp(2.25rem, 10vw, 3rem);
      }
      .re-content {
        margin-top: 2rem;
      }
      .re-grid,
      .re-data,
      .re-program-grid {
        grid-template-columns: minmax(0, 1fr);
      }
      .re-data > div,
      .re-data > div:first-child {
        padding: 0.75rem 0;
      }
      .re-data > div + div {
        border-top: 1px solid var(--stone-deep);
        border-left: 0;
      }
      .re-actions .btn {
        width: 100%;
      }
    }
  `,
})
export class ReinscriptionPage {
  private readonly api = inject(ApiService);
  private readonly store = inject(CallStore);
  protected readonly stage = computed(
    () => this.store.call()?.stages.find((s) => s.code === 'REINS') ?? null,
  );
  protected readonly longDate = longDate;
  protected readonly status = signal<ReinscriptionCheck | null>(null);
  protected readonly result = signal<InscriptionSummaryDto | null>(null);
  protected readonly programs = signal<OptionSummaryDto[]>([]);
  protected readonly query = signal('');
  protected readonly busy = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly visible = computed(() => {
    const fold = (s: string) =>
      s
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .toLowerCase();
    const q = fold(this.query().trim());
    return this.programs().filter(
      (p) => p.ordinaryVacancies > 0 && (!q || fold(p.displayName).includes(q)),
    );
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
        if (st.eligible && call && !this.programs().length)
          this.api.options(call, { category: 'ORD' }).subscribe((r) => this.programs.set(r.data));
      },
      error: (e) => {
        this.error.set(apiErrorMessage(e));
        this.busy.set(false);
      },
    });
  }

  protected reinscribe(): void {
    this.busy.set(true);
    this.error.set(null);
    this.api.reinscribe(this.doc.trim(), this.code.trim(), this.optionCode).subscribe({
      next: (r) => {
        this.result.set(r);
        this.busy.set(false);
      },
      error: (e) => {
        this.error.set(apiErrorMessage(e));
        this.busy.set(false);
      },
    });
  }
}
