import QRCode from 'qrcode';
import type { RequestMeta } from '../../../shared/audit/audit.js';
import type { Clock } from '../../../shared/clock/clock.js';
import { businessRule } from '../../../shared/http/errors.js';
import { BOLD, GOLD, GUINDA, HEAVY, INK, letterhead, LINE, NOT_OFFICIAL, REGULAR, renderPdf, sectionTitle, SEMIBOLD, SOFT } from '../../../shared/pdf/letterhead.js';
import type { InscriptionService, InscriptionSummary } from './inscription-service.js';

/** Sello de estado: qué tiene que hacer el postulante con esta orden. */
function stamp(status: InscriptionSummary['status']): { text: string; bg: string; fg: string } {
  if (status === 'APTA') return { text: 'PAGADO', bg: '#E3F1E8', fg: '#164D2A' };
  if (status === 'PENDIENTE_VALIDACION' || status === 'OBSERVADA') return { text: 'EXPEDIENTE EN REVISIÓN', bg: '#ECE7F3', fg: '#3E2A66' };
  return { text: 'PENDIENTE DE PAGO', bg: '#FBF1D9', fg: '#6B4A00' };
}

const limaDate = (d: Date, withTime = true) =>
  d.toLocaleString('es-PE', { timeZone: 'America/Lima', dateStyle: 'long', ...(withTime ? { timeStyle: 'short' } : {}) });

/**
 * Orden de pago y constancia de inscripción en una sola hoja A4 blanca (spec 003, Historia 4; RF-03.07),
 * con la estructura de los documentos oficiales de la Dirección de Admisión: datos personales, datos de la
 * postulación y monto a pagar. Se pide con DNI + código; el documento completo se muestra porque quien lo
 * descarga ya lo escribió.
 */
export class OrdenPagoService {
  constructor(private readonly d: { inscriptions: InscriptionService; clock: Clock; frontendOrigin: string }) {}

  async pdf(documentNumber: string, applicantCode: string, meta: RequestMeta): Promise<Buffer> {
    const s = await this.d.inscriptions.status(documentNumber, applicantCode, meta);
    if (s.status === 'ANULADA') throw businessRule('INSCRIPTION_ANNULLED', 'La inscripción está anulada: no tiene orden de pago.');
    const qr = await QRCode.toBuffer(`UNSCH-ADMISION|${s.applicantCode}|S/ ${s.fee.total}`, { margin: 0, width: 240, errorCorrectionLevel: 'M' });
    const now = this.d.clock.now();
    const portal = `${this.d.frontendOrigin.replace(/^https?:\/\//, '')}/mi-inscripcion`;
    const paid = s.status === 'APTA';
    const title = paid ? 'Constancia de inscripción' : 'Orden de pago';

    return renderPdf(`${title} ${s.applicantCode}`, (doc) => {
      // Todo se dibuja con posiciones fijas: sin margen inferior, PDFKit nunca abre una segunda hoja.
      doc.page.margins.bottom = 0;
      const W = doc.page.width;
      const H = doc.page.height;
      const L = 40;
      const R = W - 40;
      const CW = R - L;
      const half = (CW - 20) / 2;

      let y = letterhead(doc, { title, subtitle: `Concurso de Admisión 2027-I${paid ? ', pago confirmado' : ''}` });

      // ── Código de postulante, estado, monto y QR ──────────────
      y += 8;
      const bandH = 74;
      doc.roundedRect(L, y, CW, bandH, 6).lineWidth(0.8).strokeColor(LINE).stroke();
      doc.fillColor(SOFT).font(SEMIBOLD).fontSize(7.5).text('CÓDIGO DE POSTULANTE', L + 18, y + 14, { characterSpacing: 0.6, lineBreak: false });
      doc.fillColor(GUINDA).font(HEAVY).fontSize(30).text(s.applicantCode, L + 18, y + 25, { characterSpacing: 3, lineBreak: false });
      const st = stamp(s.status);
      doc.font(BOLD).fontSize(7.5);
      const sw = doc.widthOfString(st.text, { characterSpacing: 0.4 }) + 22;
      const qrSize = 58;
      const qrX = R - 16 - qrSize;
      const colR = qrX - 18;
      doc.roundedRect(colR - sw, y + 12, sw, 18, 9).fill(st.bg);
      doc.fillColor(st.fg).text(st.text, colR - sw, y + 17.5, { width: sw, align: 'center', characterSpacing: 0.4, lineBreak: false });
      doc.fillColor(SOFT).font(REGULAR).fontSize(7.5).text(paid ? 'Monto pagado' : 'Monto a pagar', colR - 160, y + 38, { width: 160, align: 'right', lineBreak: false });
      doc.fillColor(INK).font(HEAVY).fontSize(17).text(`S/ ${s.fee.total}`, colR - 160, y + 48, { width: 160, align: 'right', lineBreak: false });
      doc.moveTo(qrX - 9, y + 12).lineTo(qrX - 9, y + bandH - 12).lineWidth(0.6).strokeColor(LINE).stroke();
      doc.image(qr, qrX, y + 8, { width: qrSize });
      y += bandH + 22;

      // ── Filas «dato : valor», como los documentos oficiales ────
      const row = (k: string, v: string, strong = false) => {
        doc.fillColor(SOFT).font(REGULAR).fontSize(9).text(k, L + 4, y + (strong ? 2 : 0), { width: 150, lineBreak: false });
        doc.fillColor(SOFT).text(':', L + 158, y + (strong ? 2 : 0), { lineBreak: false });
        doc.fillColor(INK).font(strong ? HEAVY : SEMIBOLD).fontSize(strong ? 12.5 : 9.5).text(v, L + 172, y, { width: CW - 176, height: 16, ellipsis: true, lineBreak: false });
        y += strong ? 21 : 17;
      };

      sectionTitle(doc, 'Datos personales', y);
      y += 19;
      row(s.maskedDocument.startsWith('CE') ? 'N.° de carné de extranjería' : 'N.° de DNI', documentNumber.toUpperCase(), true);
      row('Apellidos', s.surnames);
      row('Nombres', s.firstNames);
      row('Correo de contacto', s.maskedEmail);

      y += 12;
      sectionTitle(doc, 'Datos de la postulación', y);
      y += 19;
      row('Modalidad', s.modality);
      row('Tipo de modalidad', s.quotaCategoryName);
      row('Escuela profesional', s.program);
      row('Fecha del examen', s.examDate);
      row('Inscripción registrada', limaDate(new Date(s.createdAt)));

      // ── Detalle del pago ───────────────────────────────────────
      y += 12;
      sectionTitle(doc, 'Detalle del pago', y);
      y += 17;
      const colAmt = 90;
      const colLegal = 170;
      doc.fillColor(SOFT).font(SEMIBOLD).fontSize(7.5)
        .text('CONCEPTO', L + 4, y, { characterSpacing: 0.5, lineBreak: false })
        .text('BASE LEGAL', R - colAmt - colLegal, y, { characterSpacing: 0.5, lineBreak: false })
        .text('IMPORTE', R - colAmt, y, { width: colAmt - 4, align: 'right', characterSpacing: 0.5, lineBreak: false });
      y += 13;
      doc.moveTo(L, y).lineTo(R, y).lineWidth(0.8).strokeColor(INK).stroke();
      for (const l of s.fee.lines) {
        doc.fillColor(INK).font(REGULAR).fontSize(9.5).text(l.concept, L + 4, y + 7, { width: CW - colAmt - colLegal - 12, lineBreak: false, ellipsis: true });
        doc.fillColor(SOFT).fontSize(8).text(l.legalNote, R - colAmt - colLegal, y + 8, { width: colLegal - 10, lineBreak: false, ellipsis: true });
        doc.fillColor(INK).font(SEMIBOLD).fontSize(9.5).text(`S/ ${l.amount}`, R - colAmt, y + 7, { width: colAmt - 4, align: 'right', lineBreak: false });
        y += 24;
        doc.moveTo(L, y).lineTo(R, y).lineWidth(0.5).strokeColor(LINE).stroke();
      }
      y += 10;
      doc.fillColor(INK).font(BOLD).fontSize(11).text(paid ? 'MONTO PAGADO (S/)' : 'MONTO A PAGAR (S/)', L + 4, y + 4, { characterSpacing: 0.4, lineBreak: false });
      doc.fillColor(GUINDA).font(HEAVY).fontSize(20).text(s.fee.total, R - 200, y, { width: 196, align: 'right', lineBreak: false });
      y += 26;
      doc.rect(L, y, CW, 1.4).fill(GUINDA);
      doc.rect(L, y + 2.6, CW, 0.5).fill(GOLD);

      // ── Cómo pagar (o qué sigue, si ya pagó) ───────────────────
      y += 22;
      sectionTitle(doc, paid ? 'Siguientes pasos' : 'Cómo pagar', y);
      y += 17;
      const cardH = 82;
      const card = (x: number, n: string, head: string, lines: string[]) => {
        doc.roundedRect(x, y, half, cardH, 6).lineWidth(0.8).strokeColor(LINE).stroke();
        doc.circle(x + 20, y + 19, 9).fill(GUINDA);
        doc.fillColor('#FFFFFF').font(BOLD).fontSize(9.5).text(n, x + 11, y + 14.5, { width: 18, align: 'center', lineBreak: false });
        doc.fillColor(INK).font(BOLD).fontSize(10).text(head, x + 36, y + 13.5, { width: half - 46, lineBreak: false, ellipsis: true });
        doc.fillColor(INK).font(REGULAR).fontSize(8.5).list(lines, x + 16, y + 36, { width: half - 30, bulletRadius: 1.5, paragraphGap: 2, textIndent: 9 });
      };
      if (paid) {
        card(L, '1', 'Descarga tu ficha de inscripción', [`Entra a ${portal} con tu DNI y este código.`, 'Imprime la ficha con QR y llévala con tu DNI original.']);
        card(L + half + 20, '2', 'Revisa tu aula', ['Se publica 24 horas antes del examen en «Buscar aula».', `Examen: ${s.examDate}.`]);
      } else {
        card(L, '1', 'En línea, con confirmación inmediata', [`Entra a ${portal} con tu DNI y este código.`, 'Paga con tarjeta de débito o crédito, o con Yape.', 'Tu ficha se habilita al confirmarse el pago.']);
        card(L + half + 20, '2', 'En ventanilla', [`${s.paymentEntities.join(', ')}.`, `Indica el código ${s.applicantCode} y el monto S/ ${s.fee.total}.`, 'La ficha se habilita 24 horas después del pago.']);
      }
      y += cardH + 14;

      // ── Nota ───────────────────────────────────────────────────
      const notes = [
        'Los pagos no se devuelven ni se transfieren a otro postulante o concurso (Art. 18 del Reglamento de Admisión).',
        paid ? 'Guarda esta constancia junto con tu ficha de inscripción.' : 'Paga dentro de las fechas del cronograma y conserva tu comprobante de pago.',
      ];
      if (s.status === 'PENDIENTE_VALIDACION' || s.status === 'OBSERVADA') notes.unshift('Como exonerado, podrás pagar cuando tu expediente sea autorizado. Te avisaremos por correo.');
      if (s.noVacancyRight) notes.push('Rindes el examen sin derecho a vacante: cursas 4.° de secundaria o un grado inferior (Art. 9).');
      doc.fillColor(INK).font(BOLD).fontSize(8).text('Nota:', L + 4, y, { lineBreak: false });
      doc.fillColor(SOFT).font(REGULAR).fontSize(8).list(notes, L + 34, y, { width: CW - 38, bulletRadius: 1.3, paragraphGap: 1.5, textIndent: 8 });
      y = doc.y + 12;

      // ── Sello de la entidad recaudadora y firma (pago en ventanilla) ──
      const footTop = H - 62;
      if (!paid && footTop - y > 46) {
        const boxH = Math.min(72, footTop - y - 10);
        doc.roundedRect(L, y, half, boxH, 6).dash(3, { space: 3 }).lineWidth(0.8).strokeColor('#C9BCB4').stroke().undash();
        doc.fillColor(SOFT).font(REGULAR).fontSize(7.5).text('Sello y fecha de la entidad recaudadora', L, y + boxH - 15, { width: half, align: 'center', lineBreak: false });
        doc.moveTo(L + half + 50, y + boxH - 21).lineTo(R - 30, y + boxH - 21).lineWidth(0.8).strokeColor('#C9BCB4').stroke();
        doc.text('Firma del postulante', L + half + 20, y + boxH - 15, { width: half, align: 'center', lineBreak: false });
      }

      // ── Pie, como el de los documentos oficiales: código, página y fecha de emisión ──
      doc.moveTo(L, footTop).lineTo(R, footTop).lineWidth(0.6).strokeColor(LINE).stroke();
      doc.fillColor(SOFT).font(REGULAR).fontSize(7)
        .text(`Código ${s.applicantCode}`, L, footTop + 7, { width: CW / 3, lineBreak: false })
        .text('Página 1 de 1', L + CW / 3, footTop + 7, { width: CW / 3, align: 'center', lineBreak: false })
        .text(limaDate(now), L + (2 * CW) / 3, footTop + 7, { width: CW / 3, align: 'right', lineBreak: false });
      doc.fontSize(6.5)
        .text('Constancia del proceso de admisión. No es un comprobante electrónico SUNAT.', L, footTop + 20, { width: CW, align: 'center', lineBreak: false })
        .text(NOT_OFFICIAL, L, footTop + 30, { width: CW, align: 'center', lineBreak: false });
    });
  }
}
