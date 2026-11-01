import { Component, inject, input, signal, type OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';

type Verification = { valid: true; applicantCode: string; name: string; program: string; modality: string } | { valid: false; reason: string };

/** Spec 007, Historia 5: página pública a la que lleva el QR de la constancia de ingreso. */
@Component({
  selector: 'app-verify-admission',
  imports: [RouterLink],
  template: `
    <section class="page">
      <div class="frame wrap">
        <h1>Verificación de constancia de ingreso</h1>
        @if (result(); as r) {
          @if (r.valid) {
            <article class="card ok" aria-live="polite">
              <p class="badge">Constancia vigente</p>
              <dl>
                <div><dt>Ingresante</dt><dd>{{ r.name }}</dd></div>
                <div><dt>Código</dt><dd>{{ r.applicantCode }}</dd></div>
                <div><dt>Programa de estudio</dt><dd>{{ r.program }}</dd></div>
                <div><dt>Modalidad</dt><dd>{{ r.modality }}</dd></div>
              </dl>
            </article>
          } @else {
            <article class="card bad" role="alert"><p class="badge">Constancia no válida</p><p>{{ r.reason }}</p></article>
          }
        } @else if (failed()) {
          <p class="alert alert--error">No pudimos verificar la constancia. Revisa tu conexión e inténtalo de nuevo.</p>
        } @else {
          <p>Verificando…</p>
        }
        <p><a routerLink="/">Ir al portal de Admisión</a></p>
      </div>
    </section>
  `,
  styles: `
    .page { padding-block: clamp(2.5rem, 6vw, 5rem); }
    .wrap { display: grid; gap: 1.5rem; max-width: 46rem; }
    h1 { font-size: clamp(2rem, 5vw, 3.25rem); }
    .card { padding: clamp(1.5rem, 4vw, 2.5rem); display: grid; gap: 1.25rem; }
    .ok { background: #e3f1e8; color: #164d2a; }
    .bad { background: #f7e3e3; color: #6d1212; }
    .badge { font-size: clamp(1.75rem, 4vw, 2.5rem); font-weight: 800; letter-spacing: -0.03em; }
    dl { margin: 0; display: grid; gap: 0.6rem; }
    dt { font-size: var(--size-note); font-weight: 600; opacity: 0.8; }
    dd { margin: 0; font-weight: 700; font-size: 1.125rem; color: var(--ink); }
  `,
})
export class VerifyAdmissionPage implements OnInit {
  private readonly api = inject(ApiService);
  readonly token = input.required<string>();
  protected readonly result = signal<Verification | null>(null);
  protected readonly failed = signal(false);

  ngOnInit(): void {
    this.api.verifyAdmission(this.token()).subscribe({ next: (r) => this.result.set(r), error: () => this.failed.set(true) });
  }
}
