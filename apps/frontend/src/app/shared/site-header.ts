import { Component, HostListener, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { filter } from 'rxjs';

type Menu = 'contenido' | 'pasos' | null;

/**
 * Encabezado como el portal oficial (spec 001, FR-015): Inicio, Contenido (menú amplio con el escudo),
 * Pasos, Buscar Aula, Denuncias y Contactos; botones Inscripción y Reinscripción.
 * Menús desplegables accesibles por teclado (Esc cierra).
 */
@Component({
  selector: 'app-site-header',
  imports: [RouterLink, RouterLinkActive],
  template: `
    <header class="bar">
      <div class="frame bar__inner">
        <a routerLink="/" class="brand" aria-label="Admisión UNSCH 2027-I, inicio">
          <img src="img/escudo-unsch-1677-112.webp" alt="" width="56" height="52">
        </a>

        <!-- Pantallas angostas: los dos botones del portal oficial siguen a la vista junto a «Menú». -->
        <div class="bar__cta">
          <a routerLink="/inscripcion" class="act act--green">Inscripción</a>
          <a routerLink="/reinscripcion" class="act act--blue">Reinscripción</a>
        </div>
        <button class="menu-btn" type="button" (click)="mobile.set(!mobile())" [attr.aria-expanded]="mobile()" aria-controls="nav-principal">
          {{ mobile() ? 'Cerrar' : 'Menú' }}
        </button>

        <nav id="nav-principal" class="nav" [class.is-open]="mobile()" aria-label="Principal">
          <ul class="nav__list">
            <li><a routerLink="/" routerLinkActive="is-active" [routerLinkActiveOptions]="{ exact: true }" ariaCurrentWhenActive="page">Inicio</a></li>
            <li class="has-menu is-wide">
              <button type="button" (click)="toggle('contenido')" [attr.aria-expanded]="open() === 'contenido'" aria-controls="menu-contenido">Contenido</button>
              @if (open() === 'contenido') {
                <div id="menu-contenido" class="mega">
                  <div class="mega__col">
                    <p class="mega__head" id="mega-tramites">Mis trámites</p>
                    <ul aria-labelledby="mega-tramites">
                      <li><a routerLink="/mi-inscripcion">Mi inscripción: pagar e imprimir</a></li>
                      <li><a routerLink="/buscar-aula">Buscar mi aula</a></li>
                      <li><a routerLink="/resultados">Ver puntaje</a></li>
                      <li><a routerLink="/observados">Relación de observados</a></li>
                      <li><a routerLink="/mi-cuenta">Mi cuenta</a></li>
                    </ul>
                  </div>
                  <div class="mega__col">
                    <p class="mega__head" id="mega-info">Antes de postular</p>
                    <ul aria-labelledby="mega-info">
                      <li><a routerLink="/documentos/reglamento">Reglamento</a></li>
                      <li><a routerLink="/programas">Programas de estudios</a></li>
                      <li><a routerLink="/cronograma">Cronograma</a></li>
                      <li><a routerLink="/requisitos">Requisitos</a></li>
                      <li><a routerLink="/tasas">Tasa de pagos</a></li>
                    </ul>
                  </div>
                  <div class="mega__col">
                    <p class="mega__head" id="mega-pub">Publicaciones</p>
                    <ul aria-labelledby="mega-pub">
                      <li><a routerLink="/documentos/vacantes">Vacantes <span class="badge">Nuevo</span></a></li>
                      <li><a routerLink="/temario">Temario</a></li>
                      <li><a routerLink="/comunicados" [queryParams]="{ tipo: 'FE_ERRATAS' }">Fe de erratas</a></li>
                      <li><a routerLink="/carta-aval">Modelo de carta aval <span class="badge">Nuevo</span></a></li>
                    </ul>
                  </div>
                  <img class="mega__crest" src="img/escudo-unsch-1677-500.webp" loading="lazy" alt="Escudo de la UNSCH: Real, Pontificia y Nacional, 1677" width="330" height="307">
                </div>
              }
            </li>
            <li class="has-menu">
              <button type="button" (click)="toggle('pasos')" [attr.aria-expanded]="open() === 'pasos'" aria-controls="menu-pasos">Pasos</button>
              @if (open() === 'pasos') {
                <ul id="menu-pasos" class="drop">
                  <li><a routerLink="/pasos" fragment="ordinario">Ordinarios</a></li>
                  <li><a routerLink="/pasos" fragment="exonerados">Exonerados</a></li>
                </ul>
              }
            </li>
            <li><a routerLink="/buscar-aula" routerLinkActive="is-active" ariaCurrentWhenActive="page">Buscar Aula</a></li>
            <li><a routerLink="/denuncias" routerLinkActive="is-active" ariaCurrentWhenActive="page">Denuncias</a></li>
            <li><a routerLink="/contacto" routerLinkActive="is-active" ariaCurrentWhenActive="page">Contactos</a></li>
          </ul>
          <div class="nav__actions">
            <a routerLink="/inscripcion" class="act act--green">Inscripción</a>
            <a routerLink="/reinscripcion" class="act act--blue">Reinscripción</a>
          </div>
        </nav>
      </div>
    </header>
  `,
  styles: `
    .bar { background: #fff; position: sticky; top: 0; z-index: 30; box-shadow: 0 1px 0 #e6e6e6; }
    .bar__inner { display: flex; align-items: center; gap: 2rem; min-height: 5.75rem; position: relative; }
    .brand { display: flex; align-items: center; text-decoration: none; margin-right: 1.5rem; }
    .brand img { width: 56px; height: auto; }
    .nav { display: flex; align-items: center; gap: 2rem; flex: 1; }
    .nav__list { display: flex; gap: 0.25rem; list-style: none; margin: 0; padding: 0; align-items: center; }
    .nav__list > li > a, .nav__list > li > button {
      display: inline-flex; align-items: center; gap: 0.35rem; min-height: 3.1rem; padding: 0 1.1rem;
      font: inherit; font-size: 1.0625rem; font-weight: 500; color: #555; text-decoration: none; background: none; border: 0; cursor: pointer;
      transition: background-color 0.15s ease, color 0.15s ease;
    }
    .has-menu > button::after { content: ''; border: 5px solid transparent; border-top-color: currentColor; border-bottom: 0; margin-left: 0.2rem; }
    .nav__list > li > a:hover, .has-menu > button:hover { color: var(--accent); }
    .nav__list > li > a.is-active { background: var(--accent); color: #fff; }
    .has-menu > button[aria-expanded='true'] { background: #4d4d4d; color: #fff; }

    .mega {
      position: absolute; left: var(--margin); right: var(--margin); top: 100%; background: #fff; border-top: 2px solid #222;
      box-shadow: 0 16px 32px rgb(0 0 0 / 0.14); display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)) 21rem; gap: 0 1.5rem; padding: 1.25rem 1rem 1.5rem;
    }
    .mega ul, .drop { list-style: none; margin: 0; padding: 0; align-content: start; }
    .mega__col { display: grid; align-content: start; }
    .mega__head { margin: 0; padding: 0.5rem 1rem 0.6rem; font-size: 1rem; font-weight: 700; color: var(--accent); border-bottom: 2px solid var(--accent); }
    .mega li { border-bottom: 1px dashed #dcdcdc; }
    .mega a { display: flex; align-items: center; justify-content: space-between; gap: 0.75rem; padding: 0.8rem 1rem; font-weight: 600; color: #333; text-decoration: none; }
    .mega a:hover { color: var(--accent); background: #faf6f6; }
    .badge { background: #2a6fb0; color: #fff; font-size: 0.8125rem; font-weight: 700; padding: 0.15rem 0.45rem; border-radius: 3px; }
    .mega__crest { width: 100%; max-width: 330px; height: auto; align-self: center; justify-self: center; }
    .has-menu { position: relative; }
    .has-menu.is-wide { position: static; }
    .drop { position: absolute; top: 100%; left: 0; min-width: 13rem; background: #fff; border-top: 2px solid #222; padding: 0.25rem 0; box-shadow: 0 16px 32px rgb(0 0 0 / 0.14); }
    .drop li { border-bottom: 1px dashed #dcdcdc; }
    .drop li:last-child { border-bottom: 0; }
    .drop a { display: block; padding: 0.75rem 1rem; font-weight: 600; color: #333; text-decoration: none; }
    .drop a:hover { color: var(--accent); background: #faf6f6; }

    .nav__actions { display: flex; gap: 2.25rem; margin-left: auto; }
    .act { display: inline-flex; align-items: center; min-height: 2.6rem; padding: 0 1rem; font-size: 1.0625rem; font-weight: 500; letter-spacing: 0.02em; text-transform: uppercase; text-decoration: none; color: #1f1f1f; }
    .act--green { background: #5cb85c; }
    .act--green:hover { background: #4cae4c; }
    .act--blue { background: #5bc0de; }
    .act--blue:hover { background: #46b8da; }
    .menu-btn { display: none; }
    .bar__cta { display: none; }
    @media (max-width: 1280px) {
      .bar__inner { min-height: 4.75rem; gap: 0.5rem; }
      .brand { margin-right: auto; }
      .bar__cta { display: flex; gap: 0.4rem; }
      .bar__cta .act { min-height: 2.75rem; padding: 0 0.75rem; font-size: 0.875rem; }
      .nav__actions { display: none; }
      .menu-btn { display: inline-flex; align-items: center; min-height: 2.75rem; padding: 0 1rem; font: inherit; font-weight: 700; background: #f1f1f1; border: 0; cursor: pointer; }
      .nav { display: none; position: absolute; inset: 4.75rem 0 auto 0; background: #fff; padding: 1rem var(--margin) 2rem; flex-direction: column; align-items: stretch; gap: 1.5rem; max-height: calc(100vh - 4.75rem); overflow: auto; box-shadow: 0 16px 32px rgb(0 0 0 / 0.14); }
      .nav.is-open { display: flex; }
      .nav__list { flex-direction: column; align-items: stretch; gap: 0; }
      .nav__list > li > a, .nav__list > li > button { width: 100%; justify-content: flex-start; font-size: 1.1875rem; }
      .mega__head { padding-top: 0.9rem; }
      .mega, .drop { position: static; box-shadow: none; border-top: 0; grid-template-columns: 1fr; padding: 0 0 0.5rem 1rem; }
      .mega__crest { display: none; }
    }
    @media (max-width: 480px) {
      .brand img { width: 44px; }
      .bar__cta .act { padding: 0 0.5rem; font-size: 0.75rem; letter-spacing: 0; }
      .menu-btn { padding: 0 0.75rem; }
    }
  `,
})
export class SiteHeader {
  protected readonly open = signal<Menu>(null);
  protected readonly mobile = signal(false);

  constructor() {
    inject(Router).events.pipe(filter((e) => e instanceof NavigationEnd)).subscribe(() => {
      this.open.set(null);
      this.mobile.set(false);
    });
  }

  protected toggle(menu: Exclude<Menu, null>): void {
    this.open.set(this.open() === menu ? null : menu);
  }

  @HostListener('document:keydown.escape')
  protected close(): void {
    this.open.set(null);
  }

  @HostListener('document:click', ['$event'])
  protected outside(e: MouseEvent): void {
    if (!(e.target as HTMLElement).closest('.has-menu')) this.open.set(null);
  }
}
