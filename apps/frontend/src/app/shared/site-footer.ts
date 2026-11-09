import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-site-footer',
  imports: [RouterLink],
  template: `
    <footer class="foot field-accent">
      <div class="frame">
        <div class="foot__top">
          <img src="img/escudo-unsch-240.webp" alt="" width="72" height="84" loading="lazy">
          <p class="foot__name" aria-hidden="true">UNSCH 1677</p>
        </div>
        <div class="foot__grid">
          <div class="stack">
            <p><strong>Universidad Nacional de San Cristóbal de Huamanga</strong></p>
            <p lang="la"><em>Primum vivere deinde philosophari</em></p>
            <p>Dirección de Admisión: Jr. Arequipa N.° 175, segundo piso, Ayacucho<br>Lunes a viernes: 8:00 h - 13:00 h y 14:00 h - 15:30 h</p>
          </div>
          <nav aria-labelledby="foot-concurso">
            <p class="foot__head" id="foot-concurso">El concurso</p>
            <ul>
              <li><a routerLink="/cronograma">Cronograma</a></li>
              <li><a routerLink="/programas">Programas y vacantes</a></li>
              <li><a routerLink="/tasas">Tasas y simulador</a></li>
              <li><a routerLink="/requisitos">Requisitos</a></li>
              <li><a routerLink="/temario">Temario</a></li>
            </ul>
          </nav>
          <nav aria-labelledby="foot-ayuda">
            <p class="foot__head" id="foot-ayuda">Ayuda</p>
            <ul>
              <li><a routerLink="/pasos">Cómo inscribirte</a></li>
              <li><a routerLink="/comunicados">Comunicados</a></li>
              <li><a routerLink="/documentos/reglamento">Reglamento</a></li>
              <li><a routerLink="/denuncias">Denuncias</a></li>
              <li><a routerLink="/contacto">Contactos</a></li>
              <li><a routerLink="/inscripcion">Inscripción</a></li>
              <li><a routerLink="/mi-inscripcion">Mi inscripción: pagar e imprimir</a></li>
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
    .foot { padding-block: clamp(4rem, 8vw, 7rem) 2.5rem; }
    .foot__top { display: flex; align-items: center; gap: clamp(1rem, 3vw, 2.5rem); margin-bottom: clamp(2.5rem, 5vw, 4rem); }
    .foot__top img { width: clamp(3rem, 7vw, 5.5rem); height: auto; flex: none; }
    .foot__name { font-size: clamp(3rem, 13vw, 12rem); white-space: nowrap; font-weight: 800; letter-spacing: -0.05em; line-height: 0.85; max-width: none; margin: 0; }
    .foot__head { margin: 0 0 0.9rem; font-size: var(--size-note); font-weight: 700; color: var(--gold); }
    .foot__grid { display: grid; grid-template-columns: 2fr 1fr 1fr; gap: var(--gap); }
    .foot ul { list-style: none; margin: 0; padding: 0; display: grid; gap: 0.6rem; }
    .foot a { text-decoration: none; font-weight: 600; }
    .foot a:hover { text-decoration: underline; color: var(--gold); }
    .foot__base { margin-top: 4rem; padding-top: 1.5rem; border-top: 1px solid rgb(255 255 255 / 0.25); display: flex; flex-wrap: wrap; gap: 1rem 2rem; align-items: start; justify-content: space-between; }
    .foot__legal { margin: 0; font-size: var(--size-note); opacity: 0.85; max-width: 90ch; }
    .foot__up { min-height: 2.75rem; padding: 0.5rem 1rem; border: 1px solid rgb(255 255 255 / 0.6); border-radius: var(--radius); background: none; color: inherit; font: inherit; font-weight: 600; cursor: pointer; }
    .foot__up:hover { border-color: var(--gold); color: var(--gold); }
    @media (max-width: 760px) { .foot__grid { grid-template-columns: 1fr 1fr; } .foot__grid > :first-child { grid-column: 1 / -1; } }
  `,
})
export class SiteFooter {
  protected toTop() {
    const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: calm ? 'auto' : 'smooth' });
    document.querySelector<HTMLElement>('.skip-link')?.focus({ preventScroll: true });
  }
}
