import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import PDFDocument from 'pdfkit';

const assets = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../assets');

export const ESCUDO = readFileSync(path.join(assets, 'escudo-unsch.png'));
export const GUINDA = '#7A1C22';
export const GOLD = '#D9B44A';
export const INK = '#1D1415';
export const SOFT = '#5B4F50';
export const LINE = '#E4DCD6';
export const PAPER = '#F7F2EE';

/** Misma familia que el portal; los nombres son los que usan `doc.font(...)`. */
export const REGULAR = 'Archivo';
export const SEMIBOLD = 'Archivo-SemiBold';
export const BOLD = 'Archivo-Bold';
export const HEAVY = 'Archivo-ExtraBold';
const FONTS: [string, Buffer][] = [
  [REGULAR, readFileSync(path.join(assets, 'fonts/Archivo-Regular.woff'))],
  [SEMIBOLD, readFileSync(path.join(assets, 'fonts/Archivo-SemiBold.woff'))],
  [BOLD, readFileSync(path.join(assets, 'fonts/Archivo-Bold.woff'))],
  [HEAVY, readFileSync(path.join(assets, 'fonts/Archivo-ExtraBold.woff'))],
];

export const NOT_OFFICIAL = 'SIA-UNSCH, proyecto académico del curso de Arquitectura de Software. No es un documento oficial de la UNSCH.';

export const registerFonts = (doc: PDFKit.PDFDocument) => {
  for (const [name, data] of FONTS) doc.registerFont(name, data);
  doc.font(REGULAR);
};

/** Documento A4 de la Dirección de Admisión, con la tipografía registrada. Devuelve el PDF cuando `build` termina. */
export function renderPdf(
  title: string,
  build: (doc: PDFKit.PDFDocument) => void,
  options: { margin?: number; layout?: 'portrait' | 'landscape' } = {},
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', layout: options.layout ?? 'portrait', margin: options.margin ?? 40, info: { Title: title, Author: 'Dirección de Admisión UNSCH' } });
    registerFonts(doc);
    const chunks: Buffer[] = [];
    doc.on('data', (c: Buffer) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
    build(doc);
    doc.end();
  });
}

/**
 * Membrete sobre papel blanco, como un oficio: escudo, institución y título, con la doble línea guinda y dorada.
 * Gasta poco tóner y se lee igual en una impresora en blanco y negro. Devuelve la altura desde donde sigue el contenido.
 */
export function letterhead(doc: PDFKit.PDFDocument, p: { title: string; subtitle: string; note?: { label: string; value: string } }, margin = 40): number {
  const W = doc.page.width;
  const R = W - margin;
  const x = margin + 74;
  doc.image(ESCUDO, margin, 26, { fit: [64, 62], align: 'center', valign: 'center' });
  doc.fillColor(INK).font(BOLD).fontSize(10.5).text('Universidad Nacional de San Cristóbal de Huamanga', x, 28, { lineBreak: false });
  doc.fillColor(SOFT).font(REGULAR).fontSize(9).text(p.subtitle, x, 42, { width: R - x, lineBreak: false, ellipsis: true });
  doc.fillColor(GUINDA).font(HEAVY).fontSize(21).text(p.title, x, 57, { width: R - x, lineBreak: false, ellipsis: true });
  if (p.note) {
    doc.fillColor(SOFT).font(REGULAR).fontSize(7.5).text(p.note.label, R - 190, 62, { width: 190, align: 'right', lineBreak: false });
    doc.fillColor(INK).font(SEMIBOLD).fontSize(8.5).text(p.note.value, R - 190, 72, { width: 190, align: 'right', lineBreak: false });
  }
  doc.rect(margin, 96, R - margin, 2).fill(GUINDA);
  doc.rect(margin, 99.5, R - margin, 0.8).fill(GOLD);
  return 116;
}

/** Título de sección: guinda con una línea fina hasta el margen. */
export function sectionTitle(doc: PDFKit.PDFDocument, title: string, y: number, margin = 40) {
  const R = doc.page.width - margin;
  doc.fillColor(GUINDA).font(BOLD).fontSize(10).text(title, margin, y, { lineBreak: false });
  doc.moveTo(margin + doc.widthOfString(title) + 10, y + 6).lineTo(R, y + 6).lineWidth(0.6).strokeColor(LINE).stroke();
}

/** Pie de página. Sin margen inferior, PDFKit no abre una hoja nueva por escribirlo. */
export function pageFooter(doc: PDFKit.PDFDocument, lines: string[], margin = 40) {
  const R = doc.page.width - margin;
  const H = doc.page.height;
  doc.page.margins.bottom = 0;
  const top = H - 30 - lines.length * 10;
  doc.moveTo(margin, top).lineTo(R, top).lineWidth(0.6).strokeColor(LINE).stroke();
  doc.fillColor(SOFT).font(REGULAR).fontSize(7);
  lines.forEach((line, i) => doc.text(line, margin, top + 7 + i * 10, { width: R - margin, align: 'center', lineBreak: false }));
}
