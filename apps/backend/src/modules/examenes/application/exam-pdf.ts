import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import PDFDocument from 'pdfkit';

const ESCUDO = readFileSync(path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../../assets/escudo-unsch.jpg'));
const GUINDA = '#7A1C22';
const GOLD = '#D9B44A';
const INK = '#1D1415';
const SOFT = '#5B4F50';
const STONE = '#F3EFEA';
const TZ = 'America/Lima';

export const longDate = (d: Date) => d.toLocaleDateString('es-PE', { timeZone: TZ, weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
export const hour = (d: Date) => d.toLocaleTimeString('es-PE', { timeZone: TZ, hour: 'numeric', minute: '2-digit' });

export interface RoomInfo { venue: string; address: string; building: string; floor: number; code: string; gate: string; accessible: boolean }
export interface ExamInfo { name: string; callName: string; entryOpensAt: Date; entryClosesAt: Date; durationMinutes: number; place: string; instructions: { llevar: string[]; prohibido: string[]; notas: string } }

function render(build: (doc: PDFKit.PDFDocument) => void, title: string, layout: 'portrait' | 'landscape' = 'portrait'): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', layout, margin: 40, info: { Title: title, Author: 'Dirección de Admisión UNSCH' } });
    const chunks: Buffer[] = [];
    doc.on('data', (c: Buffer) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
    build(doc);
    doc.end();
  });
}

function header(doc: PDFKit.PDFDocument, title: string, subtitle: string, height = 104) {
  const W = doc.page.width;
  doc.rect(0, 0, W, height).fill(GUINDA);
  doc.image(ESCUDO, 40, 16, { height: height - 32 });
  doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(12).text('UNIVERSIDAD NACIONAL DE SAN CRISTÓBAL DE HUAMANGA', 112, 22, { width: W - 152 });
  doc.font('Helvetica').fontSize(9.5).text(subtitle, 112, 40, { width: W - 152 });
  doc.fillColor(GOLD).font('Helvetica-Bold').fontSize(20).text(title, 112, 58, { width: W - 152 });
}

function footer(doc: PDFKit.PDFDocument, line: string) {
  doc.page.margins.bottom = 0;
  doc.fillColor(SOFT).font('Helvetica').fontSize(7.5)
    .text(line, 40, doc.page.height - 34, { width: doc.page.width - 80, align: 'center', lineBreak: false });
}

/** Ficha de examen (RF-08.06): sede, aula, horario, indicaciones y QR para el control de ingreso. */
export function examSlipPdf(p: {
  applicantCode: string; fullName: string; document: string; program: string; modality: string; seat: number;
  photo: Buffer | null; qr: Buffer; exam: ExamInfo; room: RoomInfo; issuedAt: Date; noVacancyRight: boolean;
}): Promise<Buffer> {
  return render((doc) => {
    const W = doc.page.width;
    const L = 40;
    const R = W - 40;
    header(doc, 'FICHA DE EXAMEN', `Dirección de Admisión · ${p.exam.callName} · ${p.exam.name}`);

    const top = 128;
    doc.rect(L, top, 112, 148).fill(STONE);
    if (p.photo) doc.image(p.photo, L + 6, top + 6, { width: 100, height: 133 });
    const x = L + 130;
    doc.fillColor(SOFT).font('Helvetica').fontSize(8.5).text('CÓDIGO DE POSTULANTE', x, top);
    doc.fillColor(GUINDA).font('Helvetica-Bold').fontSize(30).text(p.applicantCode, x, top + 11, { characterSpacing: 2 });
    const field = (label: string, value: string, y: number, w = R - x - 140) => {
      doc.fillColor(SOFT).font('Helvetica').fontSize(8).text(label.toUpperCase(), x, y, { width: w });
      doc.fillColor(INK).font('Helvetica-Bold').fontSize(11).text(value, x, y + 10, { width: w });
    };
    field('Apellidos y nombres', p.fullName, top + 52);
    field('Documento', p.document, top + 86);
    field('Programa · modalidad', `${p.program} · ${p.modality}`, top + 112);
    doc.image(p.qr, R - 120, top, { width: 120 });
    doc.fillColor(SOFT).font('Helvetica').fontSize(7.5).text('Control de ingreso', R - 120, top + 122, { width: 120, align: 'center' });

    // Aula: el dato principal, grande.
    let y = top + 168;
    doc.rect(L, y, R - L, 112).fill(GUINDA);
    const cell = (label: string, value: string, cx: number, w: number, size = 22) => {
      doc.fillColor(GOLD).font('Helvetica-Bold').fontSize(8).text(label.toUpperCase(), cx, y + 14, { width: w });
      doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(size).text(value, cx, y + 28, { width: w });
    };
    const cw = (R - L - 32) / 4;
    cell('Puerta', p.room.gate, L + 16, cw, 16);
    cell('Pabellón', p.room.building, L + 16 + cw, cw, 16);
    cell('Piso', String(p.room.floor), L + 16 + cw * 2, cw);
    cell('Aula · asiento', `${p.room.code} · ${p.seat}`, L + 16 + cw * 3, cw);
    doc.fillColor('#FFFFFF').font('Helvetica').fontSize(9.5).text(`${p.room.venue} - ${p.room.address}${p.room.accessible ? ' · Aula accesible' : ''}`, L + 16, y + 84, { width: R - L - 32 });

    y += 128;
    const row = (label: string, value: string) => {
      doc.fillColor(SOFT).font('Helvetica').fontSize(9).text(label, L, y, { width: 140 });
      doc.fillColor(INK).font('Helvetica-Bold').fontSize(11).text(value, L + 145, y, { width: R - L - 145 });
      y = Math.max(doc.y, y + 14) + 7;
    };
    row('Fecha', longDate(p.exam.entryOpensAt));
    row('Ingreso al local', `De ${hour(p.exam.entryOpensAt)} a ${hour(p.exam.entryClosesAt)} - después no hay ingreso`);
    row('Duración de la prueba', `${p.exam.durationMinutes} minutos`);
    if (p.noVacancyRight) row('Condición', 'Rindes SIN derecho a vacante (Art. 9)');

    y += 6;
    const half = (R - L - 12) / 2;
    const box = (title: string, items: string[], bx: number, color: string) => {
      doc.rect(bx, y, half, 150).fill(STONE);
      doc.fillColor(color).font('Helvetica-Bold').fontSize(10).text(title, bx + 12, y + 10);
      doc.fillColor(INK).font('Helvetica').fontSize(9).list(items, bx + 16, y + 28, { width: half - 30, bulletRadius: 2, paragraphGap: 3 });
    };
    box('Debes llevar', p.exam.instructions.llevar, L, '#164D2A');
    box('Está prohibido', p.exam.instructions.prohibido, L + half + 12, '#6D1212');
    y += 162;
    doc.fillColor(INK).font('Helvetica').fontSize(9).text(p.exam.instructions.notas, L, y, { width: R - L });

    footer(doc, `Emitida el ${p.issuedAt.toLocaleString('es-PE', { timeZone: TZ })} · Presenta esta ficha con tu DNI original · SIA-UNSCH, proyecto académico`);
  }, `Ficha de examen ${p.applicantCode}`);
}

/** Lista de asistencia por aula (RF-08.07): foto, nombre, código y espacio para la firma. */
export function attendancePdf(p: {
  exam: ExamInfo; room: RoomInfo; capacity: number; issuedAt: Date;
  rows: { seat: number; applicantCode: string; fullName: string; document: string; photo: Buffer | null; attendance: string }[];
}): Promise<Buffer> {
  return render((doc) => {
    const W = doc.page.width;
    const L = 40;
    const R = W - 40;
    const head = () => {
      header(doc, `LISTA DE ASISTENCIA · AULA ${p.room.code}`, `${p.exam.name} · ${longDate(p.exam.entryOpensAt)} · ${p.room.building}, piso ${p.room.floor}, ${p.room.gate}`, 96);
      doc.y = 112;
    };
    head();
    doc.fillColor(SOFT).font('Helvetica').fontSize(9).text(`${p.rows.length} postulantes asignados · capacidad ${p.capacity} · ingreso de ${hour(p.exam.entryOpensAt)} a ${hour(p.exam.entryClosesAt)}`, L, 112);
    let y = 132;
    const cols = { seat: L, photo: L + 34, name: L + 90, code: L + 300, sign: L + 380 };
    const tableHead = () => {
      doc.rect(L, y, R - L, 20).fill(STONE);
      doc.fillColor(INK).font('Helvetica-Bold').fontSize(8.5);
      doc.text('N.°', cols.seat + 4, y + 6).text('Foto', cols.photo, y + 6).text('Apellidos y nombres · documento', cols.name, y + 6).text('Código', cols.code, y + 6).text('Firma del postulante', cols.sign, y + 6);
      y += 24;
    };
    tableHead();
    for (const r of p.rows) {
      if (y + 62 > doc.page.height - 50) {
        footer(doc, `Aula ${p.room.code} · ${p.exam.name} · generada el ${p.issuedAt.toLocaleString('es-PE', { timeZone: TZ })}`);
        doc.addPage();
        head();
        y = 120;
        tableHead();
      }
      doc.fillColor(INK).font('Helvetica-Bold').fontSize(10).text(String(r.seat), cols.seat + 4, y + 22);
      if (r.photo) doc.image(r.photo, cols.photo, y, { width: 42, height: 56 });
      else doc.rect(cols.photo, y, 42, 56).fill(STONE);
      doc.fillColor(INK).font('Helvetica-Bold').fontSize(9.5).text(r.fullName, cols.name, y + 12, { width: 200 });
      doc.fillColor(SOFT).font('Helvetica').fontSize(8.5).text(r.document, cols.name, doc.y + 2, { width: 200 });
      doc.fillColor(INK).font('Helvetica-Bold').fontSize(10).text(r.applicantCode, cols.code, y + 22);
      doc.lineWidth(0.6).strokeColor('#CFC6BE').moveTo(cols.sign, y + 44).lineTo(R, y + 44).stroke();
      if (r.attendance !== 'PENDIENTE') doc.fillColor(r.attendance === 'PRESENTE' ? '#164D2A' : '#6D1212').font('Helvetica-Bold').fontSize(8).text(r.attendance === 'PRESENTE' ? 'PRESENTE' : 'AUSENTE', cols.sign, y + 48);
      doc.moveTo(L, y + 60).lineTo(R, y + 60).strokeColor('#E6DFD8').stroke();
      y += 64;
    }
    footer(doc, `Aula ${p.room.code} · ${p.exam.name} · generada el ${p.issuedAt.toLocaleString('es-PE', { timeZone: TZ })} · Firma del responsable: ____________________`);
  }, `Asistencia aula ${p.room.code}`);
}

/** Relación de aptos con su aula (RF-07.05, RN-35), para publicar o imprimir. */
export function eligibleListPdf(p: { exam: ExamInfo; issuedAt: Date; rows: { applicantCode: string; fullName: string; program: string; room: string }[] }): Promise<Buffer> {
  return render((doc) => {
    const W = doc.page.width;
    const L = 40;
    const R = W - 40;
    header(doc, 'RELACIÓN DE APTOS', `${p.exam.callName} · ${p.exam.name} · ${longDate(p.exam.entryOpensAt)}`, 96);
    let y = 112;
    const th = () => {
      doc.rect(L, y, R - L, 18).fill(STONE);
      doc.fillColor(INK).font('Helvetica-Bold').fontSize(8.5).text('N.°', L + 4, y + 5).text('Código', L + 34, y + 5).text('Apellidos y nombres', L + 90, y + 5).text('Programa', L + 290, y + 5).text('Aula', L + 440, y + 5);
      y += 22;
    };
    th();
    p.rows.forEach((r, i) => {
      if (y > doc.page.height - 60) {
        footer(doc, `Relación de aptos · ${p.exam.name}`);
        doc.addPage();
        y = 40;
        th();
      }
      doc.fillColor(INK).font('Helvetica').fontSize(8.5)
        .text(String(i + 1), L + 4, y, { width: 28 }).text(r.applicantCode, L + 34, y)
        .text(r.fullName, L + 90, y, { width: 196, lineBreak: false, ellipsis: true })
        .text(r.program, L + 290, y, { width: 146, lineBreak: false, ellipsis: true })
        .text(r.room, L + 440, y, { width: R - L - 440, lineBreak: false, ellipsis: true });
      y += 15;
    });
    footer(doc, `${p.rows.length} postulantes aptos · generada el ${p.issuedAt.toLocaleString('es-PE', { timeZone: TZ })} · quien no figura no rinde el examen (Art. 24)`);
  }, `Relación de aptos ${p.exam.name}`);
}
