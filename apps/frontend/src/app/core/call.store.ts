import { Injectable, computed, inject, signal } from '@angular/core';
import type { CurrentCallDto } from '@sia/contracts';
import { ApiService } from './api.service';

const KEY_STAGES = ['ORD_REGULAR', 'EXO_REGULAR', 'ORD_EXTEMP', 'CEPRE_REGULAR', 'EXAM_EXO', 'EXAM_ORD', 'DELIVERY'];

/** Convocatoria vigente, cargada una vez y compartida por todas las páginas. */
@Injectable({ providedIn: 'root' })
export class CallStore {
  private readonly api = inject(ApiService);
  readonly call = signal<CurrentCallDto | null>(null);
  readonly unavailable = signal(false);
  readonly code = computed(() => this.call()?.code ?? '2027-I');
  readonly current = computed(() => this.call()?.stages.filter((s) => s.status === 'IN_PROGRESS') ?? []);
  /** Lo que un postulante necesita ver de un vistazo en la línea de tiempo. */
  readonly keyStages = computed(() => (this.call()?.stages ?? []).filter((s) => KEY_STAGES.includes(s.code)));
  private loading = false;

  load(): void {
    if (this.call() || this.loading) return;
    this.loading = true;
    this.api.currentCall().subscribe({
      next: (c) => this.call.set(c),
      error: () => this.unavailable.set(true),
    });
  }
}
