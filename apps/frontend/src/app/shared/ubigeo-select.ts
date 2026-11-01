import { Component, computed, effect, inject, input, model, signal } from '@angular/core';
import { UbigeoService } from '../core/ubigeo.service';

/** Departamento → Provincia → Distrito; el valor es el código de distrito INEI (6 dígitos). */
@Component({
  selector: 'app-ubigeo-select',
  template: `
    <fieldset class="ubi" [attr.aria-describedby]="error() ? id() + '-err' : null">
      <legend [class.sr-only]="hideLegend()">{{ label() }}<span class="req" aria-hidden="true"> *</span></legend>
      <div class="ubi__row">
        <div class="field">
          <label [for]="id() + '-dep'">Departamento</label>
          <select class="select" [id]="id() + '-dep'" (change)="setDep($any($event.target).value)" [attr.aria-invalid]="!!error()">
            <option value="">Seleccione</option>
            @for (d of ubigeo.departments(); track d.id) { <option [value]="d.id" [selected]="d.id === dep()">{{ d.name }}</option> }
          </select>
        </div>
        <div class="field">
          <label [for]="id() + '-prov'">Provincia</label>
          <select class="select" [id]="id() + '-prov'" (change)="setProv($any($event.target).value)" [disabled]="!dep()" [attr.aria-invalid]="!!error()">
            <option value="">Seleccione</option>
            @for (p of provinces(); track p.id) { <option [value]="p.id" [selected]="p.id === prov()">{{ p.name }}</option> }
          </select>
        </div>
        <div class="field">
          <label [for]="id() + '-dist'">Distrito</label>
          <select class="select" [id]="id() + '-dist'" (change)="value.set($any($event.target).value)" [disabled]="!prov()" [attr.aria-invalid]="!!error()">
            <option value="">Seleccione</option>
            @for (d of districts(); track d[0]) { <option [value]="d[0]" [selected]="d[0] === value()">{{ d[1] }}</option> }
          </select>
        </div>
      </div>
      @if (error()) { <p class="field-error" [id]="id() + '-err'">{{ error() }}</p> }
    </fieldset>
  `,
  styles: `
    .ubi { border: 0; margin: 0; padding: 0; min-width: 0; }
    legend { font-weight: 600; padding: 0; margin-bottom: 0.5rem; }
    .req { color: var(--accent); }
    .ubi__row { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 0.75rem; }
    .field label { font-weight: 500; font-size: var(--size-note); color: var(--ink-soft); }
    @media (max-width: 640px) { .ubi__row { grid-template-columns: 1fr; } }
  `,
})
export class UbigeoSelect {
  readonly id = input.required<string>();
  readonly label = input.required<string>();
  readonly error = input<string | null>(null);
  /** Oculta visualmente la leyenda cuando la fila ya muestra la etiqueta (sigue disponible para lectores de pantalla). */
  readonly hideLegend = input(false);
  /** Código de distrito seleccionado ('' si falta). */
  readonly value = model('');
  protected readonly ubigeo = inject(UbigeoService);
  protected readonly dep = signal('');
  protected readonly prov = signal('');
  protected readonly provinces = computed(() => this.ubigeo.departments().find((d) => d.id === this.dep())?.provinces ?? []);
  protected readonly districts = computed(() => this.provinces().find((p) => p.id === this.prov())?.districts ?? []);

  constructor() {
    this.ubigeo.load();
    // Si llega un valor desde fuera (p. ej. "copiar del lugar de nacimiento"), sincroniza departamento y provincia.
    effect(() => {
      const v = this.value();
      if (v.length === 6) {
        this.dep.set(v.slice(0, 2));
        this.prov.set(v.slice(0, 4));
      }
    });
  }

  protected setDep(id: string): void {
    this.dep.set(id);
    this.prov.set('');
    this.value.set('');
  }

  protected setProv(id: string): void {
    this.prov.set(id);
    this.value.set('');
  }
}
