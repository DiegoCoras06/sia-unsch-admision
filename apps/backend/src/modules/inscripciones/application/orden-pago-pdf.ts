import QRCode from 'qrcode';
import type { RequestMeta } from '../../../shared/audit/audit.js';
import type { Clock } from '../../../shared/clock/clock.js';
import { businessRule } from '../../../shared/http/errors.js';
import { BOLD, GOLD, GUINDA, HEAVY, INK, letterhead, LINE, NOT_OFFICIAL, PAPER, pageFooter, REGULAR, renderPdf, sectionTitle, SOFT } from '../../../shared/pdf/letterhead.js';
import type { InscriptionService, InscriptionSummary } from './inscription-service.js';

/** Sello de estado: qué tiene que hacer el postulante con esta orden. */
function stamp(status: InscriptionSummary['status']): { text: string; bg: string; fg: string } {
  if (status === 'APTA') return { text: 'Pagado', bg: '#E3F1E8', fg: '#164D2A' };
  if (status === 'PENDIENTE_VALIDACION' || status === 'OBSERVADA') return { text: 'Expediente en revisión', bg: '#ECE7F3', fg: '#3E2A66' };
  return { text: 'Pendiente de pago', bg: '#FBF1D9', fg: '#6B4A00' };
}

/**
 * Orden de pago y constancia de inscripción en una sola hoja A4 (spec 003, Historia 4; RF-03.07).
 * Reemplaza la impresión de la página web, que ocupaba varias hojas. Se pide con DNI + código.
 */
export class OrdenPagoService {
  constructor(private readonly d: { inscriptions: InscriptionService; clock: Clock; frontendOrigin: string }) {}

  async pdf(documentNumber: string, applicantCode: string, meta: RequestMeta): Promise<Buffer> {
    const s = await this.d.inscriptions.status(documentNumber, applicantCode, meta);
    if (s.status === 'ANULADA') throw businessRule('INSCRIPTION_ANNULLED', 'La inscripción está anulada: no tiene orden de pago.');
    const qr = await QRCode.toBuffer(`UNSCH-ADMISION|${s.applicantCode}|S/ ${s.fee.total}`, { margin: 0, width: 240, errorCorrectionLevel: 'M' });
    const issued = this.d.clock.now().toLocaleString('es-PE', { timeZone: 'America/Lima', dateStyle: 'long', timeStyle: 'short' });
    const portal = `${this.d.frontendOrigin.replace(/^https?:\/\//, '')}/mi-inscripcion`;
    const paid = s.status === 'APTA';

    return renderPdf(`Orden de pago ${s.applicantCode}`, (doc) => {
      // Todo se dibuja con posiciones fijas: sin margen inferior, PDFKit nunca abre una segunda hoja.
      doc.page.margins.bottom = 0;
      const W = doc.page.width;
      const H = doc.page.height;
      const L = 40;
      const R = W - 40;
      const CW = R - L;

      const label = (text: string, x: number, y: number, w?: number) =>
        doc.fillColor(SOFT).font(REGULAR).fontSize(8).text(text, x, y, { width: w, lineBreak: false });
      const section = (title: string, y: number) => sectionTitle(doc, title, y);

      letterhead(doc, { title: 'Orden de pago', subtitle: 'Dirección de Admisión, Concurso de Admisión 2027-I. Constancia de inscripción', note: { label: 'Emitida', value: issued } });

      // ── Código, QR y estado ────────────────────────────────────
      let y = 116;
      doc.roundedRect(L, y, CW, 104, 6).fill(PAPER);
      label('Código de postulante', L + 18, y + 16);
      doc.fillColor(GUINDA).font(HEAVY).fontSize(40).text(s.applicantCode, L + 18, y + 28, { characterSpacing: 3, lineBreak: false });
      doc.fillColor(SOFT).font(REGULAR).fontSize(8.5).text('Indícalo en ventanilla o úsalo para pagar en línea.', L + 18, y + 78, { lineBreak: false });
      const st = stamp(s.status);
      doc.font(BOLD).fontSize(8.5);
      const sw = doc.widthOfString(st.text) + 20;
      const sx = R - 112 - 18 - sw;
      doc.roundedRect(sx, y + 18, sw, 20, 10).fill(st.bg);
      doc.fillColor(st.fg).text(st.text, sx, y + 24.5, { width: sw, align: 'center' });
      doc.fillColor(SOFT).font(REGULAR).fontSize(7.5).text('Total', sx - 40, y + 50, { width: sw + 40, align: 'right', lineBreak: false });
      doc.fillColor(INK).font(BOLD).fontSize(18).text(`S/ ${s.fee.total}`, sx - 40, y + 60, { width: sw + 40, align: 'right', lineBreak: false });
      doc.image(qr, R - 18 - 78, y + 10, { width: 78 });
      doc.fillColor(SOFT).font(REGULAR).fontSize(6.5).text('Código para ventanilla', R - 18 - 88, y + 92, { width: 98, align: 'center', lineBreak: false });

      // ── Datos del postulante ───────────────────────────────────
      y += 128;
      section('Datos del postulante', y);
      y += 18;
      const half = (CW - 20) / 2;
      const field = (k: string, v: string, x: number, yy: number, w = half) => {
        label(k, x, yy, w);
        doc.fillColor(INK).font(BOLD).fontSize(10.5).text(v, x, yy + 10, { width: w, height: 28, ellipsis: true });
      };
      field('Apellidos y nombres', s.fullName, L, y);
      field('Documento de identidad', s.maskedDocument, L + half + 20, y);
      y += 38;
      field('Programa de estudio', s.program, L, y);
      field('Modalidad', s.quotaCategoryName !== s.modality ? `${s.modality} - ${s.quotaCategoryName}` : s.modality, L + half + 20, y);
      y += 38;
      field('Fecha del examen', s.examDate, L, y);
      field('Inscripción registrada', new Date(s.createdAt).toLocaleString('es-PE', { timeZone: 'America/Lima', dateStyle: 'long', timeStyle: 'short' }), L + half + 20, y);

      // ── Detalle del pago ───────────────────────────────────────
      y += 46;
      section('Detalle del pago', y);
      y += 16;
      const colAmt = 90;
      const colLegal = 170;
      doc.rect(L, y, CW, 20).fill(INK);
      doc.fillColor('#FFFFFF').font(BOLD).fontSize(8)
        .text('Concepto', L + 12, y + 6.5, { lineBreak: false })
        .text('Base legal', R - colAmt - colLegal, y + 6.5, { lineBreak: false })
        .text('Importe', R - colAmt, y + 6.5, { width: colAmt - 12, align: 'right', lineBreak: false });
      y += 20;
      s.fee.lines.forEach((l, i) => {
        const h = 24;
        if (i % 2 === 1) doc.rect(L, y, CW, h).fill(PAPER);
        doc.fillColor(INK).font(REGULAR).fontSize(9.5).text(l.concept, L + 12, y + 7, { width: CW - colAmt - colLegal - 24, lineBreak: false, ellipsis: true });
        doc.fillColor(SOFT).fontSize(8).text(l.legalNote, R - colAmt - colLegal, y + 8, { width: colLegal - 10, lineBreak: false, ellipsis: true });
        doc.fillColor(INK).font(BOLD).fontSize(9.5).text(`S/ ${l.amount}`, R - colAmt, y + 7, { width: colAmt - 12, align: 'right', lineBreak: false });
        y += h;
      });
      doc.rect(L, y, CW, 34).fill(GUINDA);
      doc.fillColor('#FFFFFF').font(BOLD).fontSize(10).text(paid ? 'Total pagado' : 'Total a pagar', L + 12, y + 12, { lineBreak: false });
      doc.fillColor(GOLD).fontSize(17).text(`S/ ${s.fee.total}`, R - 200, y + 9, { width: 188, align: 'right', lineBreak: false });
      y += 34;

      // ── Cómo pagar (o qué sigue, si ya pagó) ───────────────────
      y += 22;
      section(paid ? 'Siguientes pasos' : 'Cómo pagar', y);
      y += 18;
      const cardH = 104;
      const card = (x: number, n: string, title: string, lines: string[]) => {
        doc.roundedRect(x, y, half, cardH, 6).lineWidth(0.8).strokeColor(LINE).stroke();
        doc.circle(x + 22, y + 22, 10).fill(GUINDA);
        doc.fillColor('#FFFFFF').font(BOLD).fontSize(10).text(n, x + 12, y + 17.5, { width: 20, align: 'center' });
        doc.fillColor(INK).font(BOLD).fontSize(10.5).text(title, x + 40, y + 16, { width: half - 52 });
        doc.fillColor(INK).font(REGULAR).fontSize(8.8).list(lines, x + 18, y + 42, { width: half - 34, bulletRadius: 1.6, paragraphGap: 2.5, textIndent: 9 });
      };
      if (paid) {
        card(L, '1', 'Descarga tu ficha de inscripción', [`Entra a ${portal} con tu DNI y este código.`, 'Imprime la ficha con QR y llévala con tu DNI original.']);
        card(L + half + 20, '2', 'Revisa tu aula', ['Se publica 24 horas antes del examen en «Buscar aula».', `Examen: ${s.examDate}.`]);
      } else {
        card(L, '1', 'En línea, con confirmación inmediata', [`Entra a ${portal} con tu DNI y este código.`, 'Paga con tarjeta de débito o crédito, o con Yape.', 'Tu ficha se habilita al confirmarse el pago.']);
        card(L + half + 20, '2', 'En ventanilla', [`${s.paymentEntities.join(', ')}.`, `Indica el código ${s.applicantCode} y el monto S/ ${s.fee.total}.`, 'La ficha se habilita 24 horas después del pago.']);
      }
      y += cardH;

      // ── Avisos ─────────────────────────────────────────────────
      y += 18;
      const notes = [
        'Los pagos no se devuelven ni se transfieren a otro postulante o concurso (Art. 18 del Reglamento de Admisión).',
        paid ? 'Guarda esta constancia junto con tu ficha de inscripción.' : 'Paga dentro de las fechas del cronograma. Conserva tu comprobante de pago.',
      ];
      if (s.status === 'PENDIENTE_VALIDACION' || s.status === 'OBSERVADA') notes.unshift('Como exonerado, podrás pagar cuando tu expediente sea autorizado. Te avisaremos por correo.');
      if (s.noVacancyRight) notes.push('Rindes el examen sin derecho a vacante: cursas 4.º de secundaria o un grado inferior (Art. 9).');
      doc.roundedRect(L, y, CW, 16 + notes.length * 13, 6).fill(PAPER);
      doc.fillColor(SOFT).font(REGULAR).fontSize(8).list(notes, L + 14, y + 9, { width: CW - 28, bulletRadius: 1.4, paragraphGap: 2, textIndent: 8 });
      y += 16 + notes.length * 13;

      // ── Sello de la entidad recaudadora y firma (pago en ventanilla) ──
      if (!paid) {
        y += 22;
        const boxH = Math.min(84, H - 70 - y);
        doc.roundedRect(L, y, half, boxH, 6).dash(3, { space: 3 }).lineWidth(0.8).strokeColor('#C9BCB4').stroke().undash();
        doc.fillColor(SOFT).font(REGULAR).fontSize(7.5).text('Sello y fecha de la entidad recaudadora', L, y + boxH - 16, { width: half, align: 'center', lineBreak: false });
        doc.moveTo(L + half + 50, y + boxH - 22).lineTo(R - 30, y + boxH - 22).lineWidth(0.8).strokeColor('#C9BCB4').stroke();
        doc.text('Firma del postulante', L + half + 20, y + boxH - 16, { width: half, align: 'center', lineBreak: false });
      }

      // ── Pie ──────────────────────────────────────────────────
      pageFooter(doc, ['Constancia de inscripción del proceso de admisión. No es un comprobante electrónico SUNAT.', NOT_OFFICIAL]);
    });
  }
}
