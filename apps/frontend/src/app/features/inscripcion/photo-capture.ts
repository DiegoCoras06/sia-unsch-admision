import { Component, input, model, signal } from '@angular/core';

const W = 240;
const H = 320;

/**
 * Fotografía del postulante (RN-22, Art. 17.3): con la cámara del celular o desde un archivo.
 * El navegador recorta al centro en proporción 3:4 y la reduce a 240 × 320 px JPEG antes de enviarla.
 */
@Component({
  selector: 'app-photo-capture',
  template: `
    <div class="photo">
      <div class="photo__rules" role="note">
        <p class="photo__rules-title">Indicaciones para la foto</p>
        <ul>
          <li><strong>Sin lentes ni gorra</strong> (sombreros, capuchas o audífonos prohibidos).</li>
          <li>Rostro completamente descubierto y centrado en el óvalo.</li>
          <li>Fondo claro o blanco y ropa formal (saco y corbata o vestido formal).</li>
          <li>Foto actual, sin retoques ni filtros.</li>
        </ul>
      </div>
      <div class="photo__body">
        <div class="photo__frame" [class.has-photo]="value()">
          @if (value()) {
            <img [src]="value()" alt="Vista previa de tu fotografía (240 × 320)" width="240" height="320">
          } @else {
            <span class="photo__empty">Tu foto aparecerá aquí</span>
          }
          <span class="photo__oval" aria-hidden="true"></span>
        </div>
        <div class="photo__actions">
          <label class="btn" [for]="id() + '-cam'">Tomar fotografía</label>
          <input class="sr-only" type="file" accept="image/*" capture="user" [id]="id() + '-cam'" [attr.aria-describedby]="error() ? id() + '-err' : null" (change)="pick($event)">
          <label class="btn btn--quiet" [for]="id() + '-file'">Subir desde archivo</label>
          <input class="sr-only" type="file" accept="image/jpeg,image/png,image/webp" [id]="id() + '-file'" [attr.aria-describedby]="error() ? id() + '-err' : null" (change)="pick($event)">
          <p class="note">Se recorta y ajusta sola a 240 × 320 píxeles en JPG.</p>
          @if (message()) { <p class="field-error" role="alert">{{ message() }}</p> }
          @if (error()) { <p class="field-error" [id]="id() + '-err'">{{ error() }}</p> }
        </div>
      </div>
    </div>
  `,
  styles: `
    .photo { display: grid; gap: 1.25rem; }
    .photo__rules { background: var(--accent); color: var(--accent-ink); padding: 1.25rem 1.5rem; }
    .photo__rules-title { font-weight: 800; color: var(--gold); margin-bottom: 0.5rem; }
    .photo__rules ul { margin: 0; padding-left: 1.2rem; display: grid; gap: 0.35rem; }
    .photo__rules strong { color: var(--gold); }
    .photo__body { display: flex; flex-wrap: wrap; gap: 1.5rem; align-items: flex-start; }
    .photo__frame { position: relative; width: 180px; aspect-ratio: 3 / 4; background: var(--stone); display: grid; place-items: center; overflow: hidden; flex: none; }
    .photo__frame img { width: 100%; height: 100%; object-fit: cover; }
    .photo__empty { color: var(--ink-soft); font-size: var(--size-note); text-align: center; padding: 1rem; }
    .photo__oval { position: absolute; inset: 12% 18% 18%; border: 3px dashed rgb(122 28 34 / 0.55); border-radius: 50%; pointer-events: none; }
    .has-photo .photo__oval { border-color: rgb(255 255 255 / 0.75); }
    .photo__actions { display: grid; gap: 0.6rem; align-content: start; }
    .photo__actions label.btn { cursor: pointer; }
    .photo__actions input:focus-visible + label, .photo__actions label:focus-within { outline: 3px solid var(--focus); }
  `,
})
export class PhotoCapture {
  readonly id = input.required<string>();
  readonly error = input<string | null>(null);
  /** data:image/jpeg;base64,… (240 × 320) o '' */
  readonly value = model('');
  protected readonly message = signal<string | null>(null);

  protected async pick(event: Event): Promise<void> {
    const inputEl = event.target as HTMLInputElement;
    const file = inputEl.files?.[0];
    inputEl.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      this.message.set('Elige una imagen (JPG o PNG).');
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      this.message.set('La imagen es demasiado grande (máximo 15 MB antes de recortar).');
      return;
    }
    try {
      const bitmap = await createImageBitmap(file);
      // Recorte centrado en proporción 3:4.
      const target = W / H;
      let sw = bitmap.width;
      let sh = bitmap.height;
      if (sw / sh > target) sw = Math.round(sh * target);
      else sh = Math.round(sw / target);
      const sx = Math.round((bitmap.width - sw) / 2);
      const sy = Math.round((bitmap.height - sh) / 2);
      const canvas = document.createElement('canvas');
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext('2d')!;
      ctx.imageSmoothingQuality = 'high';
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, W, H);
      ctx.drawImage(bitmap, sx, sy, sw, sh, 0, 0, W, H);
      bitmap.close();
      this.value.set(canvas.toDataURL('image/jpeg', 0.9));
      this.message.set(null);
    } catch {
      this.message.set('No pudimos leer la imagen. Prueba con otra foto en JPG.');
    }
  }
}
