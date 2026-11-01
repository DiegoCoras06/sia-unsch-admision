import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';

type AssetMap = Record<string, { url: string; alt: string }>;

/**
 * RF-14.01: imágenes del portal reemplazadas desde el panel. Mientras no carguen, o si no hay
 * reemplazo, cada imagen usa la original que viene con el sitio.
 */
@Injectable({ providedIn: 'root' })
export class SiteImages {
  private readonly map = signal<AssetMap>({});

  constructor() {
    inject(HttpClient).get<{ data: AssetMap }>('/api/v1/site-assets').subscribe({ next: (r) => this.map.set(r.data), error: () => undefined });
  }

  src(key: string, fallback: string): string {
    return this.map()[key]?.url ?? fallback;
  }

  /** srcset de las variantes WebP de la imagen original; null si el panel la reemplazó. */
  srcset(key: string, fallback: string): string | null {
    return this.map()[key] ? null : fallback;
  }

  alt(key: string, fallback: string): string {
    return this.map()[key]?.alt ?? fallback;
  }
}
