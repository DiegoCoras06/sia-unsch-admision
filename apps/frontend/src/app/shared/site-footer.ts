import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-site-footer',
  imports: [RouterLink],
  template: `
    <footer class="foot field-accent">
      <div class="frame">
        <div class="foot__brand">
          <img src="img/escudo-unsch-1677-500.webp" alt="" width="96" height="89" loading="lazy">
          <div>
            <p class="foot__uni">Universidad Nacional de San Cristóbal de Huamanga</p>
            <p class="foot__dir">Dirección de Admisión, fundada en 1677</p>
            <p class="foot__motto" lang="la"><em>Primum vivere deinde philosophari</em></p>
          </div>
        </div>

        <div class="foot__grid">
          <section aria-labelledby="foot-atencion">
            <p class="foot__head" id="foot-atencion">Atención al postulante</p>
            <ul class="foot__info">
              <li data-icon="aula"><span>Jr. Arequipa N.° 175, segundo piso, Ayacucho</span></li>
              <li data-icon="cronograma"><span>Lunes a viernes, de 8:00 a 13:00 h y de 14:00 a 15:30 h</span></li>
              <li data-icon="carta"><span><a routerLink="/contacto">Teléfonos y correos de contacto</a></span></li>
            </ul>
          </section>
          <nav aria-labelledby="foot-concurso">
            <p class="foot__head" id="foot-concurso">El concurso</p>
            <ul>
              <li><a routerLink="/cronograma">Cronograma</a></li>
              <li><a routerLink="/programas">Programas y vacantes</a></li>
              <li><a routerLink="/tasas">Tasas y simulador</a></li>
              <li><a routerLink="/requisitos">Requisitos</a></li>
              <li><a routerLink="/temario">Temario</a></li>
              <li><a routerLink="/documentos/reglamento">Reglamento</a></li>
            </ul>
          </nav>
          <nav aria-labelledby="foot-tramites">
            <p class="foot__head" id="foot-tramites">Trámites</p>
            <ul>
              <li><a routerLink="/inscripcion">Inscripción</a></li>
              <li><a routerLink="/mi-inscripcion">Mi inscripción: pagar e imprimir</a></li>
              <li><a routerLink="/buscar-aula">Buscar aula</a></li>
              <li><a routerLink="/resultados">Ver puntaje</a></li>
            </ul>
          </nav>
          <nav aria-labelledby="foot-ayuda">
            <p class="foot__head" id="foot-ayuda">Ayuda</p>
            <ul>
              <li><a routerLink="/pasos">Cómo inscribirte</a></li>
              <li><a routerLink="/comunicados">Comunicados</a></li>
              <li><a routerLink="/contacto">Contactos</a></li>
              <li><a routerLink="/denuncias">Denuncias</a></li>
            </ul>
          </nav>
        </div>

        <div class="foot__base">
          <p class="foot__legal">
            Proyecto académico del curso de Arquitectura de Software, no es el portal oficial de la UNSCH.
            Datos tomados del Prospecto de Admisión 2027-I. Fotografías y escudo: portal de Admisión UNSCH, usados con fines académicos.
          </p>
          <button type="button" class="foot__up" (click)="toTop()">Volver arriba</button>
        </div>
      </div>
    </footer>
  `,
  styles: `
    .foot { padding-block: clamp(3.5rem, 7vw, 5.5rem) 2rem; }
    .foot__brand { display: flex; align-items: center; gap: clamp(1rem, 2.5vw, 1.75rem); padding-bottom: clamp(2rem, 4vw, 3rem); margin-bottom: clamp(2rem, 4vw, 3rem); border-bottom: 1px solid rgb(255 255 255 / 0.18); }
    .foot__brand img { width: clamp(4rem, 7vw, 6rem); height: auto; flex: none; filter: drop-shadow(0 6px 14px rgb(0 0 0 / 0.25)); }
    .foot__brand p { margin: 0; max-width: none; }
    .foot__uni { font-size: clamp(1.25rem, 2.4vw, 1.875rem); font-weight: 800; letter-spacing: -0.02em; line-height: 1.15; }
    .foot__dir { margin-top: 0.35rem !important; font-weight: 600; color: var(--gold); }
    .foot__motto { margin-top: 0.25rem !important; opacity: 0.85; }
    .foot__grid { display: grid; grid-template-columns: minmax(0, 1.6fr) repeat(3, minmax(0, 1fr)); gap: clamp(1.5rem, 3vw, 2.5rem); }
    .foot__head { margin: 0 0 1rem; font-size: var(--size-note); font-weight: 700; color: var(--gold); }
    .foot ul { list-style: none; margin: 0; padding: 0; display: grid; gap: 0.65rem; }
    .foot a { text-decoration: none; font-weight: 600; }
    .foot a:hover { text-decoration: underline; text-underline-offset: 0.25em; color: var(--gold); }
    .foot__info li { display: grid; grid-template-columns: 1.25rem minmax(0, 1fr); gap: 0.65rem; align-items: start; line-height: 1.45; }
    .foot__info li::before { width: 1.1rem; height: 1.1rem; margin-top: 0.15rem; color: var(--gold); background: var(--gold); }
    .foot__base { margin-top: clamp(2.5rem, 5vw, 3.5rem); padding-top: 1.5rem; border-top: 1px solid rgb(255 255 255 / 0.18); display: flex; flex-wrap: wrap; gap: 1rem 2rem; align-items: center; justify-content: space-between; }
    .foot__legal { margin: 0; font-size: var(--size-note); opacity: 0.8; max-width: 90ch; }
    .foot__up { min-height: 2.75rem; padding: 0.5rem 1.1rem; border: 1px solid rgb(255 255 255 / 0.55); border-radius: var(--radius); background: none; color: inherit; font: inherit; font-weight: 600; cursor: pointer; }
    .foot__up:hover { border-color: var(--gold); color: var(--gold); }
    @media (max-width: 960px) { .foot__grid { grid-template-columns: 1fr 1fr; } .foot__grid > :first-child { grid-column: 1 / -1; } }
    @media (max-width: 420px) { .foot__grid { grid-template-columns: 1fr; } .foot__brand { align-items: flex-start; } }
  `,
})
export class SiteFooter {
  protected toTop() {
    const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: calm ? 'auto' : 'smooth' });
    document.querySelector<HTMLElement>('.skip-link')?.focus({ preventScroll: true });
  }
}
