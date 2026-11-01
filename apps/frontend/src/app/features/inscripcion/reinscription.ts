import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CallStore } from '../../core/call.store';
import { longDate } from '../../core/format';

/** Reinscripción de exonerados no admitidos al examen ordinario (RN-16). Se habilita en su etapa (spec 003, H6). */
@Component({
  selector: 'app-reinscription',
  imports: [RouterLink],
  template: `
    <section class="frame section stack-lg">
      <h1>Reinscripción</h1>
      <p class="lead">
        Si postulaste por la modalidad de exonerados y no alcanzaste vacante, puedes reinscribirte al examen ordinario
        pagando S/ 180.00 (excepto traslados y graduados o titulados, Art. 21).
      </p>
      @if (stage(); as s) {
        <p class="alert alert--info">
          @if (s.status === 'IN_PROGRESS') { La reinscripción está abierta hasta el {{ longDate(s.endsAt) }}. }
          @else if (s.status === 'UPCOMING') { La reinscripción se habilita del {{ longDate(s.startsAt) }} al {{ longDate(s.endsAt) }}, después del examen de exonerados. }
          @else { La reinscripción de esta convocatoria ya cerró. }
        </p>
      }
      <p><a routerLink="/cronograma" class="link-arrow">Ver el cronograma</a></p>
    </section>
  `,
})
export class ReinscriptionPage {
  private readonly store = inject(CallStore);
  protected readonly stage = computed(() => this.store.call()?.stages.find((s) => s.code === 'REINS') ?? null);
  protected readonly longDate = longDate;
}
