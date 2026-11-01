// Genera las variantes WebP de las imágenes del portal (apps/frontend/public/img) para usar con srcset.
// Uso: node scripts/optimizar-imagenes.mjs   (requiere sharp, dependencia de desarrollo del frontend)
import { readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const sharp = require('sharp');
const dir = new URL('../apps/frontend/public/img/', import.meta.url);

// Anchos por imagen: fotos a 640 y 1280 px; escudos al doble del tamaño en que se muestran.
const WIDTHS = {
  'campus-fachada.jpg': [640, 1280],
  'campus-ingreso.jpg': [640, 1280],
  'pasos-ordinario.jpg': [640, 1040],
  'pasos-exonerado.jpg': [640, 1040],
  'rector-ramirez-roca.jpg': [480, 960],
  'escudo-unsch-1677.png': [112, 500],
  'escudo-unsch.jpg': [80, 240],
};

const base = dir.pathname.replace(/^\/([A-Za-z]:)/, '$1');
for (const name of await readdir(base)) {
  const widths = WIDTHS[name];
  if (!widths) continue;
  const src = join(base, name);
  const meta = await sharp(src).metadata();
  const before = (await stat(src)).size;
  for (const w of widths) {
    const width = Math.min(w, meta.width ?? w);
    const out = join(base, name.replace(/\.(jpg|png)$/, `-${w}.webp`));
    await sharp(src).resize({ width, withoutEnlargement: true }).webp({ quality: name.endsWith('.png') ? 90 : 72, alphaQuality: 90 }).toFile(out);
    console.log(`${name} (${Math.round(before / 1024)} KB, ${meta.width} px) → ${out.split(/[\\/]/).pop()} ${Math.round((await stat(out)).size / 1024)} KB`);
  }
}
