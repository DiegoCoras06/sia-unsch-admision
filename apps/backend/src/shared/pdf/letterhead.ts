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
 * Membrete oficial sobre papel blanco, como los documentos de la Dirección de Admisión: escudo a la izquierda,
 * institución centrada y el título del documento debajo, con la doble línea guinda y dorada.
 * Gasta poco tóner y se lee igual en una impresora en blanco y negro. Devuelve la altura desde donde sigue el contenido.
 */
export function letterhead(doc: PDFKit.PDFDocument, p: { title: string; subtitle: string; note?: { label: string; value: string } }, margin = 40): number {
  const W = doc.page.width;
  const R = W - margin;
  const CW = R - margin;
  const center = (text: string, y: number, font: string, size: number, color: string, spacing = 0) =>
    doc.fillColor(color).font(font).fontSize(size).text(text, margin + 66, y, { width: CW - 132, align: 'center', lineBreak: false, ellipsis: true, characterSpacing: spacing });
  doc.image(ESCUDO, margin, 20, { fit: [58, 58], align: 'center', valign: 'center' });
  center('UNIVERSIDAD NACIONAL DE SAN CRISTÓBAL DE HUAMANGA', 24, BOLD, 12, INK, 0.2);
  center('VICERRECTORADO ACADÉMICO', 41, SEMIBOLD, 8.5, SOFT, 0.6);
  center('DIRECCIÓN DE ADMISIÓN', 53, SEMIBOLD, 8.5, SOFT, 0.6);
  doc.rect(margin, 74, CW, 1.6).fill(GUINDA);
  doc.rect(margin, 77, CW, 0.6).fill(GOLD);
  doc.fillColor(GUINDA).font(HEAVY).fontSize(17).text(p.title.toUpperCase(), margin, 88, { width: CW, align: 'center', characterSpacing: 0.8, lineBreak: false, ellipsis: true });
  doc.fillColor(SOFT).font(REGULAR).fontSize(8.5).text(p.subtitle, margin, 108, { width: CW, align: 'center', lineBreak: false, ellipsis: true });
  // Dato complementario (por ejemplo, la fecha de emisión) a la derecha, a la altura del subtítulo.
  if (p.note) doc.fillColor(SOFT).font(REGULAR).fontSize(7.5).text(`${p.note.label}: ${p.note.value}`, R - 170, 108, { width: 170, align: 'right', lineBreak: false });
  return 128;
}

/** Título de sección: en mayúsculas pequeñas y espaciadas, guinda, con una línea fina hasta el margen. */
export function sectionTitle(doc: PDFKit.PDFDocument, title: string, y: number, margin = 40) {
  const R = doc.page.width - margin;
  const text = title.toUpperCase();
  doc.fillColor(GUINDA).font(BOLD).fontSize(9).text(text, margin, y, { lineBreak: false, characterSpacing: 0.8 });
  const w = doc.widthOfString(text, { characterSpacing: 0.8 });
  doc.moveTo(margin + w + 10, y + 5.5).lineTo(R, y + 5.5).lineWidth(0.6).strokeColor(LINE).stroke();
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
