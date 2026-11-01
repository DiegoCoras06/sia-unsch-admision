import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  imports: [RouterLink],
  template: `
    <section class="frame section stack-lg">
      <h1>No encontramos esa página</h1>
      <p class="lead">Puede que el enlace haya cambiado. Vuelve al inicio o revisa el cronograma.</p>
      <p><a routerLink="/" class="btn">Ir al inicio</a></p>
    </section>
  `,
})
export class NotFoundPage {}
