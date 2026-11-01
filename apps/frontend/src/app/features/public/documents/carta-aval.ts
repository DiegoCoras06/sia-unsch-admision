import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * Modelo de carta aval de la junta directiva (submodalidad Pueblos indígenas, Art. 49): acredita la residencia
 * y los estudios secundarios del postulante en su comunidad. Se completa a mano y se imprime.
 */
@Component({
  selector: 'app-carta-aval',
  imports: [RouterLink],
  template: `
    <header class="frame page-head no-print">
      <h1>Modelo de carta aval</h1>
      <p class="lead">Para la modalidad Exonerados, submodalidad Pueblos indígenas (Art. 49 del Reglamento). La firma la junta directiva de tu comunidad y se adjunta al expediente.</p>
      <div class="actions">
        <button type="button" class="btn" (click)="print()">Imprimir o guardar en PDF</button>
        <a routerLink="/requisitos" class="btn btn--quiet">Ver todos los requisitos</a>
      </div>
    </header>
    <section class="section--tight">
      <article class="frame letter">
        <p class="right">________________, ____ de ______________ de 2026</p>
        <p><strong>Señor<br>Presidente de la Comisión de Admisión<br>Universidad Nacional de San Cristóbal de Huamanga</strong><br>Presente.-</p>
        <p class="subject"><strong>Asunto:</strong> Carta aval para el Concurso de Admisión 2027-I, modalidad Exonerados – Pueblos indígenas.</p>
        <p>De nuestra consideración:</p>
        <p>
          Los que suscribimos, miembros de la junta directiva de la comunidad <span class="blank">&nbsp;</span>,
          del distrito de <span class="blank short">&nbsp;</span>, provincia de <span class="blank short">&nbsp;</span>,
          departamento de <span class="blank short">&nbsp;</span>, con personería jurídica inscrita en la partida registral
          N.° <span class="blank short">&nbsp;</span> de la SUNARP, hacemos constar que:
        </p>
        <p>
          <span class="blank">&nbsp;</span>, identificado(a) con DNI N.° <span class="blank short">&nbsp;</span>,
          es miembro de nuestra comunidad, reside en ella y cursó sus estudios secundarios en la institución educativa
          <span class="blank">&nbsp;</span>, ubicada en la jurisdicción de la comunidad.
        </p>
        <p>
          Por ello, avalamos su postulación a la Universidad Nacional de San Cristóbal de Huamanga en la modalidad
          Exonerados – Pueblos indígenas, conforme al Art. 49 del Reglamento del Concurso de Admisión y al Convenio 169 de la OIT.
        </p>
        <p>Atentamente,</p>
        <div class="signs">
          @for (r of roles; track r) {
            <div class="sign"><span class="line"></span><strong>{{ r }}</strong><span>Nombre: ______________________</span><span>DNI: __________________</span></div>
          }
        </div>
        <p class="note">Sello de la comunidad. Adjunta la copia de la vigencia de poder de la junta directiva.</p>
      </article>
    </section>
  `,
  styles: `
    .actions { display: flex; flex-wrap: wrap; gap: 0.75rem; margin-top: 1.25rem; }
    .letter { background: #fff; max-width: 52rem; padding: clamp(1.75rem, 5vw, 3.5rem); line-height: 1.75; color: #111; box-shadow: 0 1px 4px rgb(0 0 0 / 0.08); }
    .right { text-align: right; }
    .subject { margin: 1.5rem 0; }
    .blank { display: inline-block; min-width: 16rem; border-bottom: 1px solid #333; }
    .blank.short { min-width: 8rem; }
    .signs { display: grid; grid-template-columns: repeat(3, 1fr); gap: 2rem; margin: 3.5rem 0 2rem; }
    .sign { display: grid; gap: 0.25rem; text-align: center; font-size: 0.9375rem; }
    .line { border-top: 1px solid #333; margin-bottom: 0.5rem; }
    @media (max-width: 640px) { .signs { grid-template-columns: 1fr; } .blank { min-width: 10rem; } }
    @media print {
      .no-print { display: none !important; }
      .letter { box-shadow: none; padding: 0; max-width: none; }
    }
  `,
})
export class CartaAvalPage {
  protected readonly roles = ['Presidente(a)', 'Secretario(a)', 'Fiscal'];
  protected print(): void {
    window.print();
  }
}
