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
          <p class="re-kicker">
            <span aria-hidden="true"></span>
            Segunda oportunidad de postulación
          </p>
          <h1 id="re-title">Reinscripción al Ordinario</h1>
          <p class="lead">
            Si postulaste por Exonerados y no alcanzaste vacante, puedes reinscribirte al examen
            ordinario pagando S/ 180.00, sin volver a llenar tus datos. No aplica a traslados ni a
            graduados o titulados (Art. 21).
          </p>
          <ul class="re-benefits" aria-label="Ventajas de la reinscripción">
            <li><span aria-hidden="true">✓</span> Conservas tus datos y tu fotografía</li>
            <li><span aria-hidden="true">✓</span> Eliges un programa con vacantes del Ordinario</li>
          </ul>
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
            <div class="re-period__head">
              <span class="re-period__icon" aria-hidden="true">
                @if (s.status === 'IN_PROGRESS') {
                  <svg viewBox="0 0 24 24"><path d="m6 12 4 4 8-9" /></svg>
                } @else if (s.status === 'UPCOMING') {
                  <svg viewBox="0 0 24 24"><path d="M7 3v3M17 3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v14H4V6a1 1 0 0 1 1-1Z" /></svg>
                } @else {
                  <svg viewBox="0 0 24 24"><path d="M7 11V8a5 5 0 0 1 10 0v3M5 11h14v10H5Z" /></svg>
                }
              </span>
              <div>
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
              </div>
            </div>
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
              <span class="re-card__step" aria-hidden="true">1</span>
              <div>
                <h2 id="re-check-title">Tu inscripción de Exonerados</h2>
                <p class="re-card__help">
                  Ingresa el DNI y el código de postulante de tu inscripción por Exonerados.
                </p>
              </div>
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
                  placeholder="8 dígitos"
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
                  placeholder="8 dígitos"
                  required
                />
              </div>
            </div>
            <div class="re-actions">
              <button class="btn" type="submit" [disabled]="busy()" [attr.aria-busy]="busy()">
                {{ busy() ? 'Verificando…' : 'Verificar mis datos' }}
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
                <span class="re-card__step" aria-hidden="true">2</span>
                <div>
                  <h2 id="re-result-title">
                    {{ st.eligible ? 'Puedes reinscribirte' : 'No corresponde la reinscripción' }}
                  </h2>
                </div>
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
            <span aria-hidden="true">▷</span>
            Consulta las fechas oficiales en el
            <a routerLink="/cronograma" class="link-arrow">cronograma</a>
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
      position: relative;
      display: grid;
      align-content: center;
      gap: 1rem;
      padding: 0.35rem 0 0.35rem clamp(1.25rem, 2.5vw, 2rem);
    }
    .re-intro::before {
      position: absolute;
      inset: 0 auto 0 0;
      width: 5px;
      background: linear-gradient(to bottom, var(--gold) 0 27%, var(--accent) 27% 100%);
      border-radius: 999px;
      content: '';
    }
    .re-kicker {
      display: flex;
      align-items: center;
      gap: 0.55rem;
      margin: 0;
      color: var(--accent);
      font-size: 0.78rem;
      font-weight: 800;
      letter-spacing: 0.09em;
      text-transform: uppercase;
    }
    .re-kicker span {
      width: 0.45rem;
      height: 0.45rem;
      background: var(--gold);
      border-radius: 50%;
    }
    .re-intro h1 {
      max-width: 15ch;
      font-size: clamp(2.75rem, 5vw, 4rem);
      line-height: 0.98;
      letter-spacing: -0.045em;
    }
    .re-intro .lead {
      max-width: 54ch;
      color: var(--ink-soft);
    }
    .re-benefits {
      display: flex;
      flex-wrap: wrap;
      gap: 0.55rem 1.25rem;
      margin: 0.25rem 0 0;
      padding: 0;
      color: var(--ink-soft);
      font-size: var(--size-note);
      list-style: none;
    }
    .re-benefits li {
      display: flex;
      align-items: center;
      gap: 0.45rem;
    }
    .re-benefits span {
      display: inline-grid;
      width: 1.2rem;
      height: 1.2rem;
      place-items: center;
      flex: 0 0 auto;
      background: #f3e8c2;
      color: #6b4a00;
      border-radius: 50%;
      font-size: 0.72rem;
      font-weight: 900;
    }
    .re-period {
      position: relative;
      display: grid;
      align-content: start;
      gap: 1rem;
      min-height: 11rem;
      padding: clamp(1.35rem, 2.5vw, 1.8rem);
      overflow: hidden;
      background: linear-gradient(145deg, #74141d, #4a0d14);
      color: #fff;
      border: 1px solid rgb(255 255 255 / 12%);
      border-radius: 6px 24px 6px 24px;
      box-shadow: 0 20px 45px rgb(72 13 20 / 16%);
    }
    .re-period::before {
      position: absolute;
      inset: 0 0 auto;
      height: 4px;
      background: #95898b;
      content: '';
    }
    .re-period--open::before {
      background: #83c59d;
    }
    .re-period--upcoming::before {
      background: var(--gold);
    }
    .re-period__head {
      display: flex;
      align-items: center;
      gap: 0.9rem;
    }
    .re-period__icon {
      display: grid;
      width: 2.75rem;
      height: 2.75rem;
      place-items: center;
      flex: 0 0 auto;
      background: rgb(255 255 255 / 11%);
      border: 1px solid rgb(255 255 255 / 15%);
      border-radius: 50%;
    }
    .re-period__icon svg {
      width: 1.35rem;
      fill: none;
      stroke: currentColor;
      stroke-linecap: round;
      stroke-linejoin: round;
      stroke-width: 1.8;
    }
    .re-period__label,
    .re-period__copy {
      margin: 0;
      font-size: var(--size-note);
    }
    .re-period__label {
      color: rgb(255 255 255 / 68%);
      font-weight: 600;
    }
    .re-period__state {
      margin: 0.15rem 0 0;
      font-size: clamp(1.25rem, 2vw, 1.5rem);
      font-weight: 700;
      line-height: 1.25;
    }
    .re-period__copy {
      max-width: 31ch;
      color: rgb(255 255 255 / 74%);
      line-height: 1.5;
    }
    .re-content {
      display: grid;
      gap: 1.25rem;
      max-width: 68rem;
      margin: clamp(2.5rem, 5vw, 4rem) auto 0;
    }
    .re-card {
      position: relative;
      display: grid;
      gap: 1.5rem;
      padding: clamp(1.25rem, 3vw, 2rem);
      overflow: hidden;
      background: #fff;
      border: 1px solid var(--stone-deep);
      border-radius: 6px 22px 6px 22px;
      box-shadow: 0 18px 55px rgb(42 27 29 / 8%);
    }
    .re-card::before {
      position: absolute;
      inset: 0 0 auto;
      height: 3px;
      background: linear-gradient(to right, var(--accent) 0 76%, var(--gold) 76% 100%);
      content: '';
    }
    .re-card__intro {
      display: flex;
      align-items: flex-start;
      gap: 0.9rem;
    }
    .re-card__intro > div {
      display: grid;
      gap: 0.4rem;
      min-width: 0;
    }
    .re-card__step {
      display: grid;
      width: 2.5rem;
      height: 2.5rem;
      place-items: center;
      flex: 0 0 auto;
      background: var(--accent);
      color: #fff;
      border-radius: 4px 12px 4px 12px;
      box-shadow: inset 0 -3px var(--gold);
      font-weight: 800;
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
    .re-card .input,
    .re-card .select {
      min-height: 3.25rem;
      background: #fcfbfa;
      border-color: #b9acae;
    }
    .re-card .input::placeholder {
      color: #8c8182;
    }
    .re-card .input:focus,
    .re-card .select:focus {
      background: #fff;
      border-color: var(--accent);
      outline: 3px solid rgb(126 24 34 / 14%);
      outline-offset: 1px;
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
      display: flex;
      align-items: center;
      gap: 0.4rem;
      margin: 0;
      color: var(--ink-soft);
      font-size: var(--size-note);
    }
    .re-schedule > span {
      color: var(--accent);
      font-size: 1rem;
      font-weight: 800;
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
        padding-left: 1.1rem;
      }
      .re-intro h1 {
        font-size: clamp(2.25rem, 10vw, 3rem);
      }
      .re-content {
        margin-top: 2rem;
      }
      .re-benefits {
        display: grid;
        gap: 0.55rem;
      }
      .re-period {
        min-height: 0;
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
