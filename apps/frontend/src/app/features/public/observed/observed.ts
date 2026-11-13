import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService, apiErrorMessage } from '../../../core/api.service';
import { dateTime } from '../../../core/format';

const MODALITY: Record<string, string> = { ORD: 'Ordinario', EXO: 'Exonerados', CEPRE: 'CEPRE-UNSCH' };

/** Relación de observados: inscripciones con observaciones por subsanar (solo código, sin datos personales). */
@Component({
  selector: 'app-observed',
  imports: [RouterLink],
  template: `
    <section class="p-hero field-accent field-glow" aria-labelledby="ob-title">
      <div class="frame p-hero__grid">
        <div class="p-hero__text">
          <p class="p-kicker" data-icon="observados">Publicaciones</p>
          <h1 id="ob-title">Relación de <span>observados</span></h1>
          <p class="p-lead">Si tu código aparece aquí, tu inscripción o tu expediente tiene una observación. Revisa el detalle en «Mi inscripción» con tu DNI y tu código, y subsánala dentro del plazo.</p>
        </div>
        <ul class="p-facts" aria-label="Resumen">
          <li><b>{{ data() ? data()!.rows.length : '-' }}</b><span>{{ data()?.rows?.length === 1 ? 'inscripción observada' : 'inscripciones observadas' }}</span></li>
          <li><b>{{ data()?.callCode ?? '2027-I' }}</b><span>concurso</span></li>
        </ul>
      </div>
    </section>
    <section class="section--tight">
      <div class="frame ob">
        @if (error()) { <p class="alert alert--error" role="alert">{{ error() }}</p> }
        @if (data(); as d) {
          @if (d.rows.length) {
            <div class="table-wrap" tabindex="0" role="region" aria-label="Relación de inscripciones observadas">
              <table class="obs">
                <caption>Concurso {{ d.callCode }}: {{ d.rows.length }} {{ d.rows.length === 1 ? 'inscripción observada' : 'inscripciones observadas' }}</caption>
                <thead><tr><th scope="col">N.°</th><th scope="col">Código de postulante</th><th scope="col">Modalidad</th><th scope="col">Observada desde</th></tr></thead>
                <tbody>
                  @for (r of d.rows; track r.applicantCode; let i = $index) {
                    <tr><td>{{ i + 1 }}</td><td><span class="code">{{ r.applicantCode }}</span></td><td><span class="mod">{{ modality(r.modality) }}</span></td><td>{{ when(r.since) }}</td></tr>
                  }
                </tbody>
              </table>
            </div>
          } @else {
            <div class="p-card ob-empty">
              <span class="ob-empty__icon" aria-hidden="true"><svg viewBox="0 0 24 24" width="26" height="26"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg></span>
              <div><h2 class="p-h2">Sin observaciones</h2><p>Por ahora no hay inscripciones observadas en el concurso {{ d.callCode }}.</p></div>
            </div>
          }
        }
        <div class="ob-note">
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 11v6M12 7.5v.5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>
          <p><strong>Corrección de datos o fotografía:</strong> presenta tu solicitud con el recibo de S/ 15.00 pagado en caja de la UNSCH (tasa T-7), en la Dirección de Admisión, Jr. Arequipa N.° 175.</p>
        </div>
        <p class="p-links"><a routerLink="/mi-inscripcion" class="p-btn-soft" data-icon="inscripcion">Ir a «Mi inscripción»</a></p>
      </div>
    </section>
  `,
  styles: `
    .table-wrap { border-radius: 22px; overflow: hidden; background: #fff; box-shadow: 0 0 0 1px rgb(29 20 21 / 0.06), 0 20px 40px -30px rgb(29 20 21 / 0.55); }
    .ob { display: grid; gap: 1.25rem; }
    .obs { width: 100%; border-collapse: collapse; }
    .obs caption { text-align: left; font-weight: 700; padding: 1rem 1.4rem 0.75rem; }
    .obs th, .obs td { padding: 0.8rem 1.4rem; text-align: left; border-top: 1px solid var(--stone); }
    .obs th { background: #f4efe9; color: var(--ink-soft); font-size: 0.875rem; font-weight: 700; }
    .obs tbody tr:hover td { background: #fbf7f3; }
    .obs td:first-child { width: 4rem; color: var(--ink-soft); }
    .code { display: inline-block; padding: 0.2rem 0.65rem; border-radius: 10px; background: #f7ece9; color: var(--accent); font-weight: 800; letter-spacing: 0.04em; font-variant-numeric: tabular-nums; }
    .mod { padding: 0.15rem 0.6rem; border-radius: 999px; background: var(--stone); font-size: 0.875rem; font-weight: 600; }
    .ob-empty { display: flex; align-items: center; gap: 1rem; border-left: 5px solid #1f7a3f; }
    .ob-empty p { margin: 0.25rem 0 0; color: var(--ink-soft); }
    .ob-empty__icon { display: grid; place-items: center; width: 3rem; height: 3rem; flex: none; border-radius: 50%; background: #1f7a3f; color: #fff;
      box-shadow: 0 0 0 5px rgb(31 122 63 / 0.15); }
    .ob-note { display: flex; gap: 0.6rem; padding: 1rem 1.1rem; border-radius: 16px; background: #eef4fb; color: #1d3f66; }
    .ob-note p { margin: 0; max-width: none; }
    .ob-note svg { flex: none; margin-top: 0.15em; color: #1d4f86; }
  `,
})
export class ObservedPage {
  private readonly api = inject(ApiService);
  protected readonly data = signal<{ callCode: string; rows: { applicantCode: string; modality: string; since: string }[] } | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly when = dateTime;
  protected readonly modality = (m: string) => MODALITY[m] ?? m;

  constructor() {
    this.api.observed().subscribe({ next: (d) => this.data.set(d), error: (e) => this.error.set(apiErrorMessage(e)) });
  }
}
