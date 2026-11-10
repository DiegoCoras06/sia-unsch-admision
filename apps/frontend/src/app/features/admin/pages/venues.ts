import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AdminSession } from '../../../core/admin-session';
import { apiErrorMessage } from '../../../core/api.service';

interface Room { id: string; building: string; floor: number; code: string; capacity: number; gate: string; accessible: boolean; active: boolean }
interface Venue { id: string; code: string; name: string; address: string; active: boolean; capacity: number; rooms: Room[] }

/** Spec 006, Historia 2: sedes, pabellones, pisos y aulas con capacidad, puerta y accesibilidad (RF-08.01, RF-08.02). */
@Component({
  selector: 'app-admin-venues',
  imports: [FormsModule, RouterLink],
  template: `
    <header class="adm-head">
      <div><h1>Sedes y aulas</h1><p>Capacidad máxima, puerta de ingreso y accesibilidad de cada aula. Las aulas accesibles reciben primero a quienes pidieron adecuación.</p></div>
      <a class="btn btn--quiet" routerLink="/admin/examenes">Exámenes y distribución</a>
    </header>
    @if (msg()) { <p class="adm-msg" [class.err]="msgErr()" role="status">{{ msg() }}</p> }

    @for (v of venues(); track v.id) {
      <section class="adm-panel">
        <div class="adm-row" style="justify-content:space-between">
          <div><h2>{{ v.name }}</h2><p class="adm-muted">{{ v.address }}, {{ v.rooms.length }} aulas, {{ v.capacity }} asientos activos</p></div>
        </div>
        <div class="adm-table-wrap"><table class="adm-table">
          <thead><tr><th>Pabellón</th><th class="num">Piso</th><th>Aula</th><th class="num">Capacidad</th><th>Puerta</th><th>Accesible</th><th>Activa</th><th></th></tr></thead>
          <tbody>@for (r of v.rooms; track r.id) {
            <tr><td><input class="input" [(ngModel)]="r.building" [attr.aria-label]="'Pabellón de ' + r.code"></td>
              <td class="num"><input class="input" type="number" style="width:4.5rem" [(ngModel)]="r.floor" [attr.aria-label]="'Piso de ' + r.code"></td>
              <td><strong>{{ r.code }}</strong></td>
              <td class="num"><input class="input" type="number" style="width:5.5rem" min="1" [(ngModel)]="r.capacity" [attr.aria-label]="'Capacidad de ' + r.code"></td>
              <td><input class="input" style="width:7rem" [(ngModel)]="r.gate" [attr.aria-label]="'Puerta de ' + r.code"></td>
              <td><input type="checkbox" [(ngModel)]="r.accessible" [attr.aria-label]="'Aula ' + r.code + ' accesible'"></td>
              <td><input type="checkbox" [(ngModel)]="r.active" [attr.aria-label]="'Aula ' + r.code + ' activa'"></td>
              <td><button type="button" class="adm-link" (click)="saveRoom(v.id, r)">Guardar</button></td></tr>
          }</tbody>
        </table></div>
        <form class="adm-filters" (ngSubmit)="addRoom(v.id)">
          <div class="field"><label [for]="'nb-' + v.id">Pabellón</label><input class="input" [id]="'nb-' + v.id" name="b" [(ngModel)]="nr.building" placeholder="Pabellón G"></div>
          <div class="field"><label [for]="'nf-' + v.id">Piso</label><input class="input" type="number" [id]="'nf-' + v.id" name="f" [(ngModel)]="nr.floor" style="width:5rem"></div>
          <div class="field"><label [for]="'nc-' + v.id">Código</label><input class="input" [id]="'nc-' + v.id" name="c" [(ngModel)]="nr.code" placeholder="G-101"></div>
          <div class="field"><label [for]="'nk-' + v.id">Capacidad</label><input class="input" type="number" [id]="'nk-' + v.id" name="k" [(ngModel)]="nr.capacity" style="width:6rem"></div>
          <div class="field"><label [for]="'ng-' + v.id">Puerta</label><input class="input" [id]="'ng-' + v.id" name="g" [(ngModel)]="nr.gate"></div>
          <label class="adm-row"><input type="checkbox" name="a" [(ngModel)]="nr.accessible"> Accesible</label>
          <button class="btn btn--quiet" type="submit">Agregar aula</button>
        </form>
      </section>
    }

    <form class="adm-panel adm-form" (ngSubmit)="addVenue()">
      <h2>Nueva sede</h2>
      <div class="two">
        <div class="field"><label for="nv-code">Código</label><input id="nv-code" class="input" name="vc" [(ngModel)]="nv.code" maxlength="20"></div>
        <div class="field"><label for="nv-name">Nombre</label><input id="nv-name" class="input" name="vn" [(ngModel)]="nv.name" maxlength="120"></div>
      </div>
      <div class="field"><label for="nv-addr">Dirección</label><input id="nv-addr" class="input" name="va" [(ngModel)]="nv.address" maxlength="200"></div>
      <button class="btn btn--quiet" type="submit" style="justify-self:start">Registrar sede</button>
    </form>
  `,
})
export class VenuesAdminPage implements OnInit {
  private readonly session = inject(AdminSession);
  protected readonly venues = signal<Venue[]>([]);
  protected readonly msg = signal<string | null>(null);
  protected readonly msgErr = signal(false);
  protected nr = { building: '', floor: 1, code: '', capacity: 40, gate: 'Puerta 1', accessible: false };
  protected nv = { code: '', name: '', address: '' };

  async ngOnInit() {
    try { this.venues.set(await this.session.get<Venue[]>('/admin/venues')); } catch (e) { this.fail(e); }
  }

  protected saveRoom(venueId: string, r: Room) {
    const { id, ...rest } = r;
    return this.act(() => this.session.put<Venue[]>(`/admin/rooms/${id}`, { ...rest, venueId, floor: Number(r.floor), capacity: Number(r.capacity) }), `Aula ${r.code} guardada.`);
  }

  protected addRoom(venueId: string) {
    return this.act(async () => {
      const v = await this.session.postAuth<Venue[]>('/admin/rooms', { ...this.nr, venueId, floor: Number(this.nr.floor), capacity: Number(this.nr.capacity), active: true });
      this.nr = { ...this.nr, code: '' };
      return v;
    }, 'Aula agregada.');
  }

  protected addVenue() {
    return this.act(async () => {
      const v = await this.session.postAuth<Venue[]>('/admin/venues', { ...this.nv, active: true });
      this.nv = { code: '', name: '', address: '' };
      return v;
    }, 'Sede registrada.');
  }

  private async act(call: () => Promise<Venue[]>, done: string) {
    try {
      this.venues.set(await call());
      this.msg.set(done);
      this.msgErr.set(false);
    } catch (e) { this.fail(e); }
  }

  private fail(e: unknown) {
    this.msg.set(apiErrorMessage(e));
    this.msgErr.set(true);
  }
}
