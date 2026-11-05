import { createHmac, timingSafeEqual } from 'node:crypto';
import QRCode from 'qrcode';
import type { Clock } from '../../../shared/clock/clock.js';
import type { Db } from '../../../shared/db/prisma.js';
import { businessRule, notFound } from '../../../shared/http/errors.js';
import type { RateLimiter } from '../../../shared/rate-limit/rate-limiter.js';
import type { RequestMeta } from '../../../shared/audit/audit.js';
import type { FileStorage } from '../../../shared/storage/file-storage.js';
import type { ConvocatoriasQueries } from '../../convocatorias/index.js';
import { MODALITIES, STATUS_LABEL, maskDocument } from '../domain/inscription-rules.js';
import { BOLD, GUINDA, HEAVY, INK, letterhead, NOT_OFFICIAL, PAPER, pageFooter, REGULAR, renderPdf, sectionTitle, SOFT } from '../../../shared/pdf/letterhead.js';

/** Horario de ingreso al local por modalidad (RN-36, Art. 25). */
const ENTRY: Record<string, string> = {
  ORD: '6:30 a 8:30 a.m., puertas 1 y 2 de la Ciudad Universitaria',
  EXO: '7:00 a 8:30 a.m., puertas 1 y 2 de la Ciudad Universitaria',
  CEPRE: 'Adjudicado por el CEPRE-UNSCH: no rinde examen',
};
const longDate = (d: Date) => d.toLocaleDateString('es-PE', { timeZone: 'America/Lima', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

/** Nombre abreviado para la verificación pública: nombres completos e iniciales de los apellidos. */
export function shortName(firstNames: string, paternal: string, maternal: string): string {
  return `${firstNames} ${paternal.charAt(0)}. ${maternal ? `${maternal.charAt(0)}.` : ''}`.trim();
}

/**
 * Ficha de inscripción en PDF con QR verificable (spec 003, Historia 5; RF-03.08 a RF-03.10, MEJ-11).
 * El QR lleva el código y una firma HMAC corta: nadie puede fabricar un QR válido para otro código.
 */
export class FichaService {
  constructor(
    private readonly d: {
      db: Db;
      clock: Clock;
      limiter: RateLimiter;
      storage: FileStorage;
      convocatorias: ConvocatoriasQueries;
      secret: string;
      frontendOrigin: string;
    },
  ) {}

  token(applicantCode: string): string {
    return `${applicantCode}.${this.sign(applicantCode)}`;
  }

  verifyUrl(applicantCode: string): string {
    return `${this.d.frontendOrigin}/verificar/${this.token(applicantCode)}`;
  }

  /** Historia 5, escenario 4: descarga con DNI + código; solo con la inscripción Apta (pago confirmado). */
  async pdf(documentNumber: string, applicantCode: string, meta: RequestMeta): Promise<Buffer> {
    await this.d.limiter.consume(`ficha:${meta.ipHash}`, 30, 3600);
    const row = await this.d.db.application.findUnique({ where: { applicantCode } });
    if (!row || row.documentNumber !== documentNumber.trim().toUpperCase()) throw notFound('No encontramos una inscripción con ese documento y código.');
    if (row.status !== 'APTA') {
      throw businessRule('FICHA_NOT_AVAILABLE', row.status === 'ANULADA'
        ? 'La inscripción está anulada: no tiene ficha.'
        : 'Tu ficha se habilita cuando tu pago esté confirmado y tu inscripción quede Apta.');
    }
    const call = await this.d.convocatorias.getCurrentCall();
    const [option, categories, photo] = await Promise.all([
      this.d.convocatorias.getOption(row.callCode, row.optionCode),
      this.d.convocatorias.listQuotaCategories(row.callCode),
      this.d.storage.get(row.photoKey),
    ]);
    const exam = call.stages.find((s) => s.kind === 'EXAM' && s.scope === row.modality);
    const qr = await QRCode.toBuffer(this.verifyUrl(applicantCode), { margin: 1, width: 300, errorCorrectionLevel: 'M' });
    const category = categories.find((c) => c.code === row.quotaCategory)?.name ?? row.quotaCategory;
    const modality = MODALITIES[row.modality as keyof typeof MODALITIES] ?? row.modality;

    return renderPdf(`Ficha de inscripción ${applicantCode}`, (doc) => {
      const W = doc.page.width;
      const L = 40;
      const R = W - 40;

      const top = letterhead(doc, { title: 'Ficha de inscripción', subtitle: `Dirección de Admisión, ${call.name}` });

      // Código de postulante y foto.
      doc.roundedRect(L, top, 132, 176, 6).fill(PAPER);
      if (photo) doc.image(photo, L + 6, top + 6, { width: 120, height: 160 });
      else doc.fillColor(SOFT).fontSize(9).text('Fotografía', L, top + 80, { width: 132, align: 'center' });
      const x = L + 152;
      doc.fillColor(SOFT).font(REGULAR).fontSize(9).text('Código de postulante', x, top);
      doc.fillColor(GUINDA).font(HEAVY).fontSize(34).text(applicantCode, x, top + 12, { characterSpacing: 2 });
      const field = (label: string, value: string, y: number, w = R - x) => {
        doc.fillColor(SOFT).font(REGULAR).fontSize(8.5).text(label, x, y, { width: w });
        doc.fillColor(INK).font(BOLD).fontSize(11.5).text(value, x, y + 11, { width: w });
      };
      field('Apellidos y nombres', `${row.paternalSurname} ${row.maternalSurname}, ${row.firstNames}`, top + 58);
      field('Documento de identidad', `${row.documentType} ${row.documentNumber}`, top + 92, 150);
      doc.fillColor(SOFT).font(REGULAR).fontSize(8.5).text('Estado', x + 170, top + 92);
      doc.fillColor('#164D2A').font(BOLD).fontSize(11.5).text(STATUS_LABEL[row.status], x + 170, top + 103);
      field('Modalidad', category === modality ? modality : `${modality} - ${category}`, top + 126);

      // Datos del examen.
      let y = top + 196;
      sectionTitle(doc, 'Programa de estudio y examen', y);
      y += 22;
      const row2 = (label: string, value: string) => {
        doc.fillColor(SOFT).font(REGULAR).fontSize(9).text(label, L, y, { width: 150 });
        doc.fillColor(INK).font(BOLD).fontSize(11).text(value, L + 155, y, { width: R - L - 155 - 150 });
        y = Math.max(doc.y, y + 14) + 8;
      };
      row2('Programa de estudio', option.displayName);
      row2('Área académica', { I: 'I - Ciencias', II: 'II - Letras', III: 'III - Biomédicas' }[option.area] ?? option.area);
      row2('Fecha del examen', exam ? longDate(new Date(exam.startsAt)) : 'No rinde examen');
      row2('Lugar', 'Ciudad Universitaria de la UNSCH, Huamanga, Ayacucho');
      row2('Ingreso al local', ENTRY[row.modality] ?? '');
      row2('Aula', 'Se publica 24 horas antes del examen en «Buscar aula»');
      if (row.noVacancyRight) row2('Condición', 'Rinde el examen SIN derecho a vacante (4.º de secundaria o grado inferior, Art. 9)');

      // QR de verificación.
      const qrTop = top + 230;
      doc.image(qr, R - 130, qrTop, { width: 130 });
      doc.fillColor(SOFT).font(REGULAR).fontSize(8).text('Escanea para verificar esta ficha', R - 140, qrTop + 134, { width: 150, align: 'center' });

      // Indicaciones (Art. 26).
      y = Math.max(y, qrTop + 160) + 6;
      doc.roundedRect(L, y, R - L, 92, 6).fill(PAPER);
      doc.fillColor(INK).font(BOLD).fontSize(10).text('Indicaciones para el día del examen', L + 12, y + 10);
      doc.font(REGULAR).fontSize(9).fillColor(INK).list([
        'Presenta tu DNI original vigente y esta ficha impresa. Sin ellos no ingresas al local.',
        'Lleva solo lápiz 2B, borrador y tajador.',
        'Prohibido: celulares, relojes y equipos electrónicos, objetos metálicos, joyas, lapiceros, mochilas y ropa con capucha o de jean.',
        'Después de las 8:30 a.m. no hay ingreso. Los resultados se publican el mismo día del examen.',
      ], L + 16, y + 26, { width: R - L - 32, bulletRadius: 2, paragraphGap: 2 });

      // Firma y huella.
      y += 112;
      doc.lineWidth(0.8).strokeColor(SOFT);
      doc.moveTo(L + 20, y + 54).lineTo(L + 220, y + 54).stroke();
      doc.rect(R - 110, y, 90, 70).stroke();
      doc.fillColor(SOFT).fontSize(8.5).text('Firma del postulante', L + 20, y + 58, { width: 200, align: 'center' });
      doc.text('Huella digital', R - 110, y + 74, { width: 90, align: 'center' });

      pageFooter(doc, [
        `Emitida el ${this.d.clock.now().toLocaleString('es-PE', { timeZone: 'America/Lima' })} - Verificación: ${this.verifyUrl(applicantCode)}`,
        NOT_OFFICIAL,
      ]);
    });
  }

  /** Historia 5, escenarios 2 y 3: verificación pública del QR, sin DNI completo. */
  async verify(token: string) {
    const [code, sig] = token.split('.');
    const valid = Boolean(code && sig && /^\d{8}$/.test(code) && this.safeEqual(sig, this.sign(code)));
    if (!valid) return { valid: false as const, reason: 'El código QR no corresponde a una ficha emitida por la UNSCH.' };
    const row = await this.d.db.application.findUnique({ where: { applicantCode: code } });
    if (!row) return { valid: false as const, reason: 'La ficha no existe.' };
    if (row.status !== 'APTA') {
      return { valid: false as const, reason: row.status === 'ANULADA' ? 'La inscripción fue anulada: la ficha no es válida.' : 'La inscripción aún no está habilitada.' };
    }
    const [option, photo, call] = await Promise.all([
      this.d.convocatorias.getOption(row.callCode, row.optionCode),
      this.d.storage.get(row.photoKey),
      this.d.convocatorias.getCurrentCall(),
    ]);
    return {
      valid: true as const,
      applicantCode: row.applicantCode,
      name: shortName(row.firstNames, row.paternalSurname, row.maternalSurname),
      document: maskDocument(row.documentNumber),
      program: option.displayName,
      modality: MODALITIES[row.modality as keyof typeof MODALITIES] ?? row.modality,
      call: call.name,
      photo: photo ? `data:image/jpeg;base64,${photo.toString('base64')}` : null,
    };
  }

  private sign(code: string): string {
    return createHmac('sha256', this.d.secret).update(`ficha:${code}`).digest('base64url').slice(0, 16);
  }

  private safeEqual(a: string, b: string): boolean {
    const x = Buffer.from(a);
    const y = Buffer.from(b);
    return x.length === y.length && timingSafeEqual(x, y);
  }
}
