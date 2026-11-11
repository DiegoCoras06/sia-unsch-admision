import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import type { InscriptionSummaryDto } from '@sia/contracts';
import { ApiService, apiErrorMessage } from '../../core/api.service';
import { CodeReminder } from '../../shared/code-reminder';
import { DocsSidebar } from '../../shared/docs-sidebar';
import { InboxPanel } from '../avisos/inbox';
import { InscriptionReceipt } from './inscription-receipt';
import { ExtraDocuments } from './extra-documents';

/** Spec 003, H4 (ADR-015): «Mi inscripción» (antes «Imprimir documentos») - consulta con DNI + código de postulante, sin cuenta. */
@Component({
  selector: 'app-my-inscription',
  imports: [FormsModule, RouterLink, InscriptionReceipt, DocsSidebar, InboxPanel, ExtraDocuments, CodeReminder],
  template: `
    <section class="page field-accent">
      <div class="frame grid">
        <div class="main">
          <header class="tool-head">
            <p class="tool-head__kicker" data-icon="inscripcion">Tu trámite en línea</p>
            <h1>Mi inscripción</h1>
            <p class="lead">Consulta el estado de tu inscripción y continúa tu trámite con tu documento y tu código de postulante.</p>
            <ul class="tool-head__chips" aria-label="Lo que puedes hacer aquí">
              <li data-icon="pagar">Pagar en línea</li>
              <li data-icon="expedientes">Subir tus documentos</li>
              <li data-icon="imprimir">Imprimir tu ficha</li>
            </ul>
          </header>
          <form class="box" (ngSubmit)="search()">
            <div class="field">
              <label for="m-doc">DNI o carné de extranjería</label>
              <input id="m-doc" class="input" name="doc" [(ngModel)]="doc" inputmode="numeric" maxlength="12" autocomplete="off" required>
            </div>
            <div class="field">
              <label for="m-code">Código de postulante</label>
              <input id="m-code" class="input" name="code" [(ngModel)]="code" inputmode="numeric" maxlength="8" autocomplete="off" required aria-describedby="m-code-hint">
            </div>
            <button class="btn btn--gold" type="submit" [disabled]="busy()" [attr.aria-busy]="busy()">{{ busy() ? 'Buscando…' : 'Ver mi inscripción' }}</button>
          </form>
          <p id="m-code-hint" class="code-note">Tu código de postulante está en tu orden de pago y en el correo que te enviamos.</p>
          <app-code-reminder />
          @if (error()) { <p class="alert alert--error" role="alert">{{ error() }}</p> }
          @if (summary(); as s) {
            <app-inscription-receipt [summary]="s" [documentNumber]="searched()" (updated)="summary.set($event)" />
            @if (searched(); as d) {
              <app-extra-documents [documentNumber]="d" [applicantCode]="s.applicantCode" />
              <app-inbox [documentNumber]="d" [applicantCode]="s.applicantCode" />
            }
          }
          <p>¿Aún no te inscribes? <a routerLink="/inscripcion">Ir a la inscripción</a></p>
        </div>
        <app-docs-sidebar />
      </div>
    </section>
  `,
  styles: `
    .page { padding-block: clamp(2.5rem, 6vw, 5rem); }
    .grid { display: grid; grid-template-columns: minmax(0, 1fr) 18rem; gap: clamp(1.5rem, 3vw, 3rem); align-items: start; }
    .main { display: grid; gap: 1.5rem; min-width: 0; }
    h1 { font-size: clamp(2.25rem, 5vw, 4rem); }
    .code-note { margin: 0.6rem 0 0; font-size: var(--size-note); color: rgb(255 255 255 / 0.85); }
    .box { display: grid; grid-template-columns: 1fr 1fr auto; gap: 1rem; align-items: end; background: var(--accent-press); padding: 1.5rem; }
    .box .input { background: #fff; border-color: #fff; }
    .box .input:focus { border-color: var(--gold); }
    .main > p a { color: var(--gold); font-weight: 700; }
    app-inscription-receipt { color: var(--ink); }
    @media (max-width: 960px) { .grid { grid-template-columns: 1fr; } }
    @media (max-width: 640px) { .box { grid-template-columns: 1fr; } }
  `,
})
export class MyInscriptionPage {
  private readonly api = inject(ApiService);
  protected doc = '';
  protected code = '';
  protected readonly busy = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly summary = signal<InscriptionSummaryDto | null>(null);
  protected readonly searched = signal<string | null>(null);

  protected search(): void {
    this.error.set(null);
    if (this.doc.trim().length < 6 || !/^\d{8}$/.test(this.code.trim())) {
      this.error.set('Escribe tu documento y tu código de postulante de 8 dígitos.');
      return;
    }
    this.busy.set(true);
    const doc = this.doc.trim();
    this.api.inscriptionStatus(doc, this.code.trim()).subscribe({
      next: (s) => {
        this.summary.set(s);
        this.searched.set(doc);
        this.busy.set(false);
      },
      error: (e) => {
        this.summary.set(null);
        this.searched.set(null);
        this.error.set(apiErrorMessage(e));
        this.busy.set(false);
      },
    });
  }
}
