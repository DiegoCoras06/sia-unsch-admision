// Genera el ícono de la pestaña (favicon) en PNG con efecto 3D: el escudo de la UNSCH sobre una placa guinda
// con relieve, borde dorado, brillo y sombra. Uso: node scripts/generar-favicon.mjs
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const require = createRequire(import.meta.url);
const sharp = require('sharp');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const img = (f) => path.join(root, 'apps/frontend/public/img', f);

const S = 512;
// Placa: cuadro redondeado guinda con luz dorada, bisel claro arriba, borde dorado y sombra interior abajo.
const plate = `
<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" viewBox="0 0 ${S} ${S}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#a3323a"/><stop offset="0.5" stop-color="#7a1c22"/><stop offset="1" stop-color="#4a0f13"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.78" cy="0.12" r="0.7">
      <stop offset="0" stop-color="#f3d98a" stop-opacity="0.55"/><stop offset="1" stop-color="#f3d98a" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="rim" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#fbe7a6"/><stop offset="0.45" stop-color="#d9b44a"/><stop offset="1" stop-color="#8f6a1c"/>
    </linearGradient>
    <linearGradient id="gloss" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0.38"/><stop offset="0.55" stop-color="#ffffff" stop-opacity="0"/>
    </linearGradient>
    <radialGradient id="disc" cx="0.42" cy="0.32" r="0.75">
      <stop offset="0" stop-color="#ffffff"/><stop offset="0.7" stop-color="#f4ece4"/><stop offset="1" stop-color="#d9cbbd"/>
    </radialGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="10" stdDeviation="10" flood-color="#2a0709" flood-opacity="0.55"/>
    </filter>
  </defs>
  <rect x="16" y="16" width="480" height="480" rx="112" fill="url(#rim)"/>
  <rect x="30" y="30" width="452" height="452" rx="100" fill="url(#bg)"/>
  <rect x="30" y="30" width="452" height="452" rx="100" fill="url(#glow)"/>
  <circle cx="256" cy="258" r="214" fill="url(#disc)" filter="url(#shadow)"/>
  <circle cx="256" cy="258" r="214" fill="none" stroke="url(#rim)" stroke-width="10"/>
  <rect x="30" y="30" width="452" height="220" rx="100" fill="url(#gloss)"/>
</svg>`;

// Escudo con sombra propia para que parezca levantarse de la placa.
const crestH = 392;
const crest = await sharp(img('escudo-unsch-oficial.png')).resize({ height: crestH }).png().toBuffer();
const { width: crestW } = await sharp(crest).metadata();
const shadow = await sharp(crest).ensureAlpha().tint('#2a0709').blur(9).modulate({ brightness: 0.3 }).png().toBuffer();
const left = Math.round((S - crestW) / 2);
const top = Math.round(258 - crestH / 2);

const master = await sharp(Buffer.from(plate))
  .composite([
    { input: shadow, left: left + 4, top: top + 12, blend: 'multiply' },
    { input: crest, left, top },
  ])
  .png()
  .toBuffer();

const out = [
  ['favicon-16.png', 16], ['favicon-32.png', 32], ['favicon-48.png', 48], ['favicon-96.png', 96], ['favicon-180.png', 180], ['favicon-192.png', 192], ['favicon-512.png', 512],
];
for (const [name, size] of out) {
  await sharp(master).resize(size, size, { kernel: 'lanczos3' }).png({ compressionLevel: 9 }).toFile(img(name));
  console.log('listo', name);
}
