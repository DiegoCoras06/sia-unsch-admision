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
    <section class="p-hero field-accent field-glow no-print" aria-labelledby="ca-title">
      <div class="frame p-hero__grid">
        <div class="p-hero__text">
          <p class="p-kicker" data-icon="reglamento">Pueblos indígenas, Art. 49</p>
          <h1 id="ca-title">Modelo de <span>carta aval</span></h1>
          <p class="p-lead">Para la modalidad Exonerados, submodalidad Pueblos indígenas. La firma la junta directiva de tu comunidad y se adjunta al expediente.</p>
          <div class="ca-actions">
            <button type="button" class="ca-print" (click)="print()" data-icon="imprimir">Imprimir o guardar en PDF</button>
            <a routerLink="/requisitos" class="ca-ghost">Ver todos los requisitos</a>
          </div>
        </div>
        <ol class="ca-steps" aria-label="Cómo usarla">
          <li><b>1</b><span>Imprime el modelo o guárdalo en PDF.</span></li>
          <li><b>2</b><span>Complétalo a mano con los datos de tu comunidad.</span></li>
          <li><b>3</b><span>Que firmen el presidente, el secretario y el fiscal, con el sello.</span></li>
          <li><b>4</b><span>Adjúntalo a tu expediente con la vigencia de poder.</span></li>
        </ol>
      </div>
    </section>
    <section class="section--tight field-stone ca-paper">
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
    .ca-actions { display: flex; flex-wrap: wrap; gap: 0.75rem; margin-top: 0.25rem; }
    .ca-print, .ca-ghost { display: inline-flex; align-items: center; justify-content: center; gap: 0.55rem; min-height: 3.1rem; padding: 0 1.3rem; border-radius: 14px;
      font: inherit; font-weight: 700; text-decoration: none; cursor: pointer; }
    .ca-print { color: var(--ink); border: 1px solid #b38f2c; background: linear-gradient(180deg, #edd07a, #c9a23a);
      box-shadow: 0 16px 28px -14px rgb(0 0 0 / 0.75), inset 0 1px 0 rgb(255 255 255 / 0.5); }
    .ca-ghost { color: #fff; background: rgb(255 255 255 / 0.08); border: 1px solid rgb(255 255 255 / 0.3); }
    @media (hover: hover) { .ca-print:hover { filter: brightness(1.05); } .ca-ghost:hover { background: rgb(255 255 255 / 0.16); } }
    .ca-steps { margin: 0; padding: clamp(1.1rem, 2.6vw, 1.5rem); list-style: none; display: grid; gap: 0.6rem; border-radius: 22px; background: rgb(255 255 255 / 0.08);
      border: 1px solid rgb(255 255 255 / 0.22); -webkit-backdrop-filter: blur(12px); backdrop-filter: blur(12px); box-shadow: 0 30px 60px -32px rgb(20 6 8 / 0.8), inset 0 1px 0 rgb(255 255 255 / 0.18); }
    .ca-steps li { display: grid; grid-template-columns: auto minmax(0, 1fr); gap: 0.75rem; align-items: center; }
    .ca-steps b { display: grid; place-items: center; width: 2rem; height: 2rem; border-radius: 10px; color: var(--ink); background: linear-gradient(180deg, #edd07a, #c9a23a); }
    .ca-steps span { font-size: 0.9375rem; color: rgb(255 255 255 / 0.92); }
    /* La carta como una hoja sobre la mesa: papel blanco con sombra y borde dorado arriba. */
    .letter { background: #fff; max-width: 52rem; padding: clamp(1.75rem, 5vw, 3.5rem); line-height: 1.75; color: #111; border-radius: 6px; border-top: 5px solid var(--gold);
      box-shadow: 0 0 0 1px rgb(29 20 21 / 0.06), 0 30px 60px -30px rgb(29 20 21 / 0.45); }
    .right { text-align: right; }
    .subject { margin: 1.5rem 0; }
    .blank { display: inline-block; min-width: 16rem; border-bottom: 1px solid #333; }
    .blank.short { min-width: 8rem; }
    .signs { display: grid; grid-template-columns: repeat(3, 1fr); gap: 2rem; margin: 3.5rem 0 2rem; }
    .sign { display: grid; gap: 0.25rem; text-align: center; font-size: 0.9375rem; }
    .line { border-top: 1px solid #333; margin-bottom: 0.5rem; }
    @media (max-width: 640px) { .signs { grid-template-columns: 1fr; } .blank { min-width: 10rem; } .ca-actions > * { flex: 1 1 100%; } }
    @media print {
      .no-print { display: none !important; }
      .ca-paper { background: none !important; padding: 0 !important; }
      .letter { box-shadow: none; padding: 0; max-width: none; border: 0; }
    }
  `,
})
export class CartaAvalPage {
  protected readonly roles = ['Presidente(a)', 'Secretario(a)', 'Fiscal'];
  protected print(): void {
    window.print();
  }
}
