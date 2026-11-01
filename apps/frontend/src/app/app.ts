import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs';
import { CallStore } from './core/call.store';
import { Assistant } from './shared/assistant';
import { SiteFooter } from './shared/site-footer';
import { SiteHeader } from './shared/site-header';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, SiteHeader, SiteFooter, Assistant],
  template: `
    @if (inPanel()) {
      <router-outlet />
    } @else {
      <a class="skip-link" href="#contenido">Saltar al contenido</a>
      <app-site-header />
      <main id="contenido" tabindex="-1"><router-outlet /></main>
      <app-site-footer />
      <app-assistant />
    }
  `,
  styles: `main { display: block; min-height: 60vh; } main:focus { outline: none; }`,
})
export class App {
  private readonly router = inject(Router);
  /** El panel del personal tiene su propio marco: sin encabezado, pie ni asistente del portal. */
  protected readonly inPanel = toSignal(
    this.router.events.pipe(filter((e) => e instanceof NavigationEnd), map(() => this.router.url.startsWith('/admin'))),
    { initialValue: location.pathname.startsWith('/admin') },
  );

  constructor() {
    inject(CallStore).load();
  }
}
