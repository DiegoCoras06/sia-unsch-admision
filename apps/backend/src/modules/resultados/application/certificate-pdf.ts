import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';

const ESCUDO = readFileSync(path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../../assets/escudo-unsch.jpg'));
const GUINDA = '#7A1C22';
const GOLD = '#D9B44A';
const INK = '#1D1415';
const SOFT = '#5B4F50';

/** Constancia de ingreso (RF-09.10, RN-54) con QR que verifica su vigencia. */
export async function admissionCertificatePdf(p: {
  applicantCode: string; fullName: string; document: string; program: string; modality: string; score: string; rank: number | null;
  callName: string; issuedAt: Date; photo: Buffer | null; verifyUrl: string;
}): Promise<Buffer> {
  const qr = await QRCode.toBuffer(p.verifyUrl, { margin: 1, width: 300, errorCorrectionLevel: 'M' });
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50, info: { Title: `Constancia de ingreso ${p.applicantCode}`, Author: 'Dirección de Admisión UNSCH' } });
    const chunks: Buffer[] = [];
    doc.on('data', (c: Buffer) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
    const W = doc.page.width;
    const L = 50;
    const R = W - 50;

    doc.rect(0, 0, W, 10).fill(GUINDA);
    doc.image(ESCUDO, W / 2 - 40, 40, { height: 96 });
    doc.fillColor(INK).font('Helvetica-Bold').fontSize(14).text('UNIVERSIDAD NACIONAL DE SAN CRISTÓBAL DE HUAMANGA', L, 150, { width: R - L, align: 'center' });
    doc.fillColor(SOFT).font('Helvetica').fontSize(10.5).text(`Dirección de Admisión · ${p.callName}`, L, 172, { width: R - L, align: 'center' });
    doc.fillColor(GUINDA).font('Helvetica-Bold').fontSize(28).text('CONSTANCIA DE INGRESO', L, 205, { width: R - L, align: 'center', characterSpacing: 1 });
    doc.moveTo(W / 2 - 60, 245).lineTo(W / 2 + 60, 245).lineWidth(2).strokeColor(GOLD).stroke();

    doc.fillColor(INK).font('Helvetica').fontSize(12).text('La Dirección de Admisión hace constar que', L, 275, { width: R - L, align: 'center' });
    doc.font('Helvetica-Bold').fontSize(20).text(p.fullName, L, 300, { width: R - L, align: 'center' });
    doc.font('Helvetica').fontSize(11).fillColor(SOFT).text(`${p.document} · código de postulante ${p.applicantCode}`, L, doc.y + 4, { width: R - L, align: 'center' });
    doc.fillColor(INK).fontSize(12).text(
      `alcanzó vacante en el programa de estudio de ${p.program}, modalidad ${p.modality}, con ${p.score} puntos${p.rank ? ` (puesto ${p.rank} en su orden de mérito)` : ''}, entregó sus documentos en el plazo y es INGRESANTE a la Universidad Nacional de San Cristóbal de Huamanga.`,
      L + 20, doc.y + 18, { width: R - L - 40, align: 'center', lineGap: 4 },
    );

    const y = 520;
    if (p.photo) doc.image(p.photo, L, y, { width: 96, height: 128 });
    doc.image(qr, R - 120, y, { width: 120 });
    doc.fillColor(SOFT).fontSize(8).text('Verifica esta constancia', R - 130, y + 124, { width: 140, align: 'center' });
    doc.moveTo(W / 2 - 90, y + 100).lineTo(W / 2 + 90, y + 100).lineWidth(0.8).strokeColor(SOFT).stroke();
    doc.fillColor(SOFT).fontSize(9).text('Director(a) de Admisión', W / 2 - 90, y + 106, { width: 180, align: 'center' });
    doc.text(`Huamanga, ${p.issuedAt.toLocaleDateString('es-PE', { timeZone: 'America/Lima', day: 'numeric', month: 'long', year: 'numeric' })}`, W / 2 - 90, y + 120, { width: 180, align: 'center' });

    doc.page.margins.bottom = 0;
    doc.fontSize(7.5).text(`Verificación: ${p.verifyUrl} · SIA-UNSCH, proyecto académico del curso de Arquitectura de Software`, L, doc.page.height - 40, { width: R - L, align: 'center', lineBreak: false });
    doc.rect(0, doc.page.height - 10, W, 10).fill(GUINDA);
    doc.end();
  });
}
