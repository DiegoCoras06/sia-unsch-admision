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
    <header class="frame page-head">
      <p class="page-kicker" data-icon="observados">Publicaciones</p>
      <h1>Relación de observados</h1>
      <p class="lead">Si tu código aparece aquí, tu inscripción o tu expediente tiene una observación. Revisa el detalle en «Mi inscripción» con tu DNI y tu código, y subsánala dentro del plazo.</p>
    </header>
    <section class="section--tight">
      <div class="frame stack-lg">
        @if (error()) { <p class="alert alert--error" role="alert">{{ error() }}</p> }
        @if (data(); as d) {
          @if (d.rows.length) {
            <div class="table-wrap" tabindex="0" role="region" aria-label="Relación de inscripciones observadas">
              <table class="obs">
                <caption>Concurso {{ d.callCode }} · {{ d.rows.length }} {{ d.rows.length === 1 ? 'inscripción observada' : 'inscripciones observadas' }}</caption>
                <thead><tr><th>N.°</th><th>Código de postulante</th><th>Modalidad</th><th>Observada desde</th></tr></thead>
                <tbody>
                  @for (r of d.rows; track r.applicantCode; let i = $index) {
                    <tr><td>{{ i + 1 }}</td><td><strong>{{ r.applicantCode }}</strong></td><td>{{ modality(r.modality) }}</td><td>{{ when(r.since) }}</td></tr>
                  }
                </tbody>
              </table>
            </div>
          } @else {
            <p class="alert alert--info">Por ahora no hay inscripciones observadas en el concurso {{ d.callCode }}.</p>
          }
        }
        <div class="alert alert--info">
          Corrección de datos o fotografía: presenta tu solicitud con el recibo de S/ 15.00 pagado en caja de la UNSCH (tasa T-7), en la Dirección de Admisión, Jr. Arequipa N.° 175.
        </div>
        <p><a routerLink="/mi-inscripcion" class="link-arrow">Ir a «Mi inscripción»</a></p>
      </div>
    </section>
  `,
  styles: `
    .table-wrap { overflow-x: auto; }
    .obs { width: 100%; border-collapse: collapse; background: var(--ground); }
    .obs caption { text-align: left; font-weight: 700; padding: 0 0 0.75rem; }
    .obs th, .obs td { padding: 0.8rem 1rem; text-align: left; border-bottom: 1px solid var(--stone-deep); }
    .obs th { background: var(--accent); color: var(--accent-ink); font-weight: 700; }
    .obs td:first-child { width: 4rem; color: var(--ink-soft); }
    .obs strong { font-variant-numeric: tabular-nums; letter-spacing: 0.04em; }
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
