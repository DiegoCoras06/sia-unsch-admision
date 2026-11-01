import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-site-footer',
  imports: [RouterLink],
  template: `
    <footer class="foot field-accent">
      <div class="frame">
        <p class="foot__name" aria-hidden="true">UNSCH 1677</p>
        <div class="foot__grid">
          <div class="stack">
            <p><strong>Universidad Nacional de San Cristóbal de Huamanga</strong></p>
            <p lang="la"><em>Primum vivere deinde philosophari</em></p>
            <p>Dirección de Admisión · Jr. Arequipa N.° 175, Segundo Piso, Ayacucho<br>Lunes a viernes: 8:00 h - 13:00 h y 14:00 h - 15:30 h</p>
          </div>
          <nav aria-label="El concurso">
            <ul>
              <li><a routerLink="/cronograma">Cronograma</a></li>
              <li><a routerLink="/programas">Programas y vacantes</a></li>
              <li><a routerLink="/tasas">Tasas y simulador</a></li>
              <li><a routerLink="/requisitos">Requisitos</a></li>
              <li><a routerLink="/temario">Temario</a></li>
            </ul>
          </nav>
          <nav aria-label="Ayuda">
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
        <p class="foot__legal">
          Proyecto académico del curso de Arquitectura de Software - no es el portal oficial de la UNSCH.
          Datos tomados del Prospecto de Admisión 2027-I. Fotografías y escudo: portal de Admisión UNSCH, usados con fines académicos.
        </p>
      </div>
    </footer>
  `,
  styles: `
    .foot { padding-block: clamp(4rem, 8vw, 7rem) 2.5rem; }
    .foot__name { font-size: clamp(3.25rem, 15.5vw, 14rem); white-space: nowrap; font-weight: 800; letter-spacing: -0.05em; line-height: 0.85; max-width: none; margin-bottom: clamp(2.5rem, 5vw, 4rem); }
    .foot__grid { display: grid; grid-template-columns: 2fr 1fr 1fr; gap: var(--gap); }
    .foot ul { list-style: none; margin: 0; padding: 0; display: grid; gap: 0.6rem; }
    .foot a { text-decoration: none; font-weight: 600; }
    .foot a:hover { text-decoration: underline; color: var(--gold); }
    .foot__legal { margin-top: 4rem; font-size: var(--size-note); opacity: 0.85; max-width: 90ch; }
    @media (max-width: 760px) { .foot__grid { grid-template-columns: 1fr 1fr; } .foot__grid > :first-child { grid-column: 1 / -1; } }
  `,
})
export class SiteFooter {}
