import QRCode from 'qrcode';
import { BOLD, ESCUDO, GOLD, GUINDA, HEAVY, INK, NOT_OFFICIAL, REGULAR, renderPdf, SOFT } from '../../../shared/pdf/letterhead.js';

/** Constancia de ingreso (RF-09.10, RN-54) con QR que verifica su vigencia. */
export async function admissionCertificatePdf(p: {
  applicantCode: string; fullName: string; document: string; program: string; modality: string; score: string; rank: number | null;
  callName: string; issuedAt: Date; photo: Buffer | null; verifyUrl: string;
}): Promise<Buffer> {
  const qr = await QRCode.toBuffer(p.verifyUrl, { margin: 1, width: 300, errorCorrectionLevel: 'M' });
  return renderPdf(`Constancia de ingreso ${p.applicantCode}`, (doc) => {
    const W = doc.page.width;
    const L = 50;
    const R = W - 50;

    // Marco doble y escudo tenue de fondo, como un diploma.
    const H = doc.page.height;
    doc.opacity(0.05).image(ESCUDO, W / 2 - 165, 300, { width: 330 }).opacity(1);
    doc.rect(22, 22, W - 44, H - 44).lineWidth(1.6).strokeColor(GUINDA).stroke();
    doc.rect(27, 27, W - 54, H - 54).lineWidth(0.6).strokeColor(GOLD).stroke();

    doc.image(ESCUDO, W / 2 - 52, 48, { fit: [104, 96], align: 'center', valign: 'center' });
    doc.fillColor(INK).font(BOLD).fontSize(14).text('Universidad Nacional de San Cristóbal de Huamanga', L, 152, { width: R - L, align: 'center' });
    doc.fillColor(SOFT).font(REGULAR).fontSize(10.5).text(`Dirección de Admisión, ${p.callName}`, L, 172, { width: R - L, align: 'center' });
    doc.fillColor(GUINDA).font(HEAVY).fontSize(30).text('Constancia de ingreso', L, 204, { width: R - L, align: 'center' });
    doc.moveTo(W / 2 - 60, 246).lineTo(W / 2 + 60, 246).lineWidth(2).strokeColor(GOLD).stroke();

    doc.fillColor(INK).font(REGULAR).fontSize(12).text('La Dirección de Admisión hace constar que', L, 275, { width: R - L, align: 'center' });
    doc.font(BOLD).fontSize(20).text(p.fullName, L, 300, { width: R - L, align: 'center' });
    doc.font(REGULAR).fontSize(11).fillColor(SOFT).text(`${p.document}, código de postulante ${p.applicantCode}`, L, doc.y + 4, { width: R - L, align: 'center' });
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
    doc.fillColor(SOFT).font(REGULAR).fontSize(7.5)
      .text(`Verificación: ${p.verifyUrl}`, L, H - 62, { width: R - L, align: 'center', lineBreak: false })
      .text(NOT_OFFICIAL, L, H - 51, { width: R - L, align: 'center', lineBreak: false });
  });
}
