// Prepara las fotos del portal: amplía ×2 con remuestreo de alta calidad, aplica una máscara de enfoque suave
// y exporta JPEG de calidad alta, usando el lienzo de Microsoft Edge (sin instalar librerías de imagen).
// No inventa detalle: evita que el navegador las estire borrosas en pantallas de alta densidad.
// Uso: node scripts/mejorar-imagenes.mjs   (lee docs/fuentes/imagenes, escribe apps/frontend/public/img)
import { readFileSync, writeFileSync } from 'node:fs';
import { chromium } from 'playwright-core';

const SRC = 'docs/fuentes/imagenes';
const OUT = 'apps/frontend/public/img';
const jobs = [
  { file: 'rector-ramirez-roca.jpg', scale: 2, amount: 0.45 },
  { file: 'ciudad-universitaria.jpg', scale: 2, amount: 0.6 },
  { file: 'pasos-ordinario.jpg', scale: 2, amount: 0.5 },
  { file: 'pasos-exonerado.jpg', scale: 2, amount: 0.5 },
];

const browser = await chromium.launch({ channel: 'msedge', headless: true });
const page = await browser.newPage();
for (const job of jobs) {
  const dataUrl = `data:image/jpeg;base64,${readFileSync(`${SRC}/${job.file}`).toString('base64')}`;
  const result = await page.evaluate(async ({ dataUrl, scale, amount }) => {
    const img = new Image();
    img.src = dataUrl;
    await img.decode();
    const w = img.naturalWidth * scale;
    const h = img.naturalHeight * scale;
    // Ampliación en dos pasos (×1.41 y ×1.41) con suavizado de alta calidad: menos escalones que un salto ×2.
    const mid = document.createElement('canvas');
    mid.width = Math.round(img.naturalWidth * Math.SQRT2);
    mid.height = Math.round(img.naturalHeight * Math.SQRT2);
    const m = mid.getContext('2d');
    m.imageSmoothingQuality = 'high';
    m.drawImage(img, 0, 0, mid.width, mid.height);
    const big = document.createElement('canvas');
    big.width = w;
    big.height = h;
    const b = big.getContext('2d', { willReadFrequently: true });
    b.imageSmoothingQuality = 'high';
    b.drawImage(mid, 0, 0, w, h);

    // Máscara de enfoque: original + amount × (original − desenfoque 3×3).
    const src = b.getImageData(0, 0, w, h);
    const blur = document.createElement('canvas');
    blur.width = w;
    blur.height = h;
    const bl = blur.getContext('2d', { willReadFrequently: true });
    bl.filter = 'blur(1.2px)';
    bl.drawImage(big, 0, 0);
    const soft = bl.getImageData(0, 0, w, h).data;
    const px = src.data;
    for (let i = 0; i < px.length; i += 4) {
      for (let c = 0; c < 3; c++) {
        const v = px[i + c] + amount * (px[i + c] - soft[i + c]);
        px[i + c] = v < 0 ? 0 : v > 255 ? 255 : v;
      }
    }
    b.putImageData(src, 0, 0);
    return { url: big.toDataURL('image/jpeg', 0.9), w, h };
  }, { dataUrl, scale: job.scale, amount: job.amount });
  writeFileSync(`${OUT}/${job.file}`, Buffer.from(result.url.split(',')[1], 'base64'));
  console.log(`✔ ${job.file}: ${result.w}×${result.h}`);
}
await browser.close();
