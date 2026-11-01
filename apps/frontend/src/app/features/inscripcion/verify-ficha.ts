import { Component, inject, input, signal, type OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService, type FichaVerification } from '../../core/api.service';

/** Spec 003, Historia 5: página pública a la que lleva el QR de la ficha (MEJ-11). No muestra el DNI completo. */
@Component({
  selector: 'app-verify-ficha',
  imports: [RouterLink],
  template: `
    <section class="page">
      <div class="frame wrap">
        <h1>Verificación de ficha</h1>
        @if (result(); as r) {
          @if (r.valid) {
            <article class="card ok" aria-live="polite">
              <p class="badge">Ficha válida</p>
              <div class="who">
                @if (r.photo) { <img [src]="r.photo" alt="Fotografía del postulante" width="120" height="160" (error)="$any($event.target).hidden = true"> }
                <dl>
                  <div><dt>Postulante</dt><dd>{{ r.name }}</dd></div>
                  <div><dt>Código</dt><dd>{{ r.applicantCode }}</dd></div>
                  <div><dt>Documento</dt><dd>{{ r.document }}</dd></div>
                  <div><dt>Programa</dt><dd>{{ r.program }}</dd></div>
                  <div><dt>Modalidad</dt><dd>{{ r.modality }}</dd></div>
                  <div><dt>Convocatoria</dt><dd>{{ r.call }}</dd></div>
                </dl>
              </div>
              <p class="note">Compara la foto con la persona y con su DNI original.</p>
            </article>
          } @else {
            <article class="card bad" role="alert">
              <p class="badge">Ficha no válida</p>
              <p>{{ r.reason }}</p>
            </article>
          }
        } @else if (failed()) {
          <p class="alert alert--error">No pudimos verificar la ficha. Revisa tu conexión e inténtalo de nuevo.</p>
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
    h1 { font-size: clamp(2.25rem, 5vw, 3.5rem); }
    .card { padding: clamp(1.5rem, 4vw, 2.5rem); display: grid; gap: 1.25rem; }
    .ok { background: #e3f1e8; color: #164d2a; }
    .bad { background: #f7e3e3; color: #6d1212; }
    .badge { font-size: clamp(1.75rem, 4vw, 2.5rem); font-weight: 800; letter-spacing: -0.03em; }
    .who { display: flex; gap: 1.5rem; align-items: start; flex-wrap: wrap; }
    .who img { background: #fff; }
    dl { margin: 0; display: grid; gap: 0.6rem; }
    dt { font-size: var(--size-note); font-weight: 600; opacity: 0.8; }
    dd { margin: 0; font-weight: 700; font-size: 1.125rem; color: var(--ink); }
  `,
})
export class VerifyFichaPage implements OnInit {
  private readonly api = inject(ApiService);
  readonly token = input.required<string>();
  protected readonly result = signal<FichaVerification | null>(null);
  protected readonly failed = signal(false);

  ngOnInit(): void {
    this.api.verifyFicha(this.token()).subscribe({ next: (r) => this.result.set(r), error: () => this.failed.set(true) });
  }
}
