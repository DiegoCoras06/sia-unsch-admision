import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';

export type District = [code: string, name: string];
export interface Province { id: string; name: string; districts: District[] }
export interface Department { id: string; name: string; provinces: Province[] }

/** Ubigeos INEI (25 departamentos, 196 provincias, 1874 distritos), cargados una vez desde /data/ubigeo.json. */
@Injectable({ providedIn: 'root' })
export class UbigeoService {
  private readonly http = inject(HttpClient);
  readonly departments = signal<Department[]>([]);
  private requested = false;

  load(): void {
    if (this.requested) return;
    this.requested = true;
    this.http.get<Department[]>('data/ubigeo.json').subscribe((d) => this.departments.set(d));
  }
}
