import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';

export interface Column { key: string; header: string; width: number }

const GUINDA = '7A1C22';

/** Excel con encabezado institucional, filtros aplicados y la tabla con autofiltro (RF-12.08). */
export async function toExcel(title: string, filters: string, columns: Column[], rows: Record<string, unknown>[]): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'SIA-UNSCH';
  wb.created = new Date();
  const ws = wb.addWorksheet(title.slice(0, 31));
  ws.mergeCells(1, 1, 1, columns.length);
  ws.getCell(1, 1).value = `Universidad Nacional de San Cristóbal de Huamanga - ${title}`;
  ws.getCell(1, 1).font = { bold: true, size: 14, color: { argb: `FF${GUINDA}` } };
  ws.mergeCells(2, 1, 2, columns.length);
  ws.getCell(2, 1).value = `${filters} · Generado: ${new Date().toLocaleString('es-PE', { timeZone: 'America/Lima' })} · ${rows.length} filas`;
  ws.getCell(2, 1).font = { size: 10, color: { argb: 'FF5B4F50' } };
  const header = ws.getRow(4);
  columns.forEach((c, i) => {
    header.getCell(i + 1).value = c.header;
    ws.getColumn(i + 1).width = c.width;
  });
  header.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  header.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${GUINDA}` } };
  rows.forEach((r) => ws.addRow(columns.map((c) => r[c.key] ?? '')));
  ws.autoFilter = { from: { row: 4, column: 1 }, to: { row: 4 + rows.length, column: columns.length } };
  ws.views = [{ state: 'frozen', ySplit: 4 }];
  return Buffer.from(await wb.xlsx.writeBuffer());
}

/** PDF horizontal A4 con la misma tabla, paginado y con pie de página. */
export function toPdf(title: string, filters: string, columns: Column[], rows: Record<string, unknown>[]): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 36, bufferPages: true, info: { Title: title, Author: 'SIA-UNSCH' } });
    const chunks: Buffer[] = [];
    doc.on('data', (c: Buffer) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const left = doc.page.margins.left;
    const usable = doc.page.width - left - doc.page.margins.right;
    const totalW = columns.reduce((s, c) => s + c.width, 0);
    const widths = columns.map((c) => (c.width / totalW) * usable);
    const head = () => {
      doc.fillColor(`#${GUINDA}`).font('Helvetica-Bold').fontSize(14).text(`Universidad Nacional de San Cristóbal de Huamanga - ${title}`, left, 36);
      doc.fillColor('#5B4F50').font('Helvetica').fontSize(8)
        .text(`${filters} · Generado: ${new Date().toLocaleString('es-PE', { timeZone: 'America/Lima' })} · ${rows.length} filas`);
      let x = left;
      const y = doc.y + 8;
      doc.rect(left, y - 3, usable, 16).fill(`#${GUINDA}`);
      doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(8);
      columns.forEach((c, i) => {
        doc.text(c.header, x + 3, y, { width: widths[i]! - 6, lineBreak: false, ellipsis: true });
        x += widths[i]!;
      });
      doc.y = y + 16;
    };
    head();
    doc.font('Helvetica').fontSize(7.5).fillColor('#1D1415');
    rows.forEach((r, n) => {
      if (doc.y > doc.page.height - 50) {
        doc.addPage();
        head();
        doc.font('Helvetica').fontSize(7.5).fillColor('#1D1415');
      }
      const y = doc.y;
      if (n % 2 === 1) doc.rect(left, y - 2, usable, 13).fill('#F3EFEA').fillColor('#1D1415');
      let x = left;
      columns.forEach((c, i) => {
        doc.text(String(r[c.key] ?? ''), x + 3, y, { width: widths[i]! - 6, lineBreak: false, ellipsis: true });
        x += widths[i]!;
      });
      doc.y = y + 13;
    });
    const range = doc.bufferedPageRange();
    for (let i = range.start; i < range.start + range.count; i++) {
      doc.switchToPage(i);
      doc.fillColor('#5B4F50').fontSize(7).text(`SIA-UNSCH · proyecto académico · página ${i + 1} de ${range.count}`, left, doc.page.height - 28, { width: usable, align: 'right', lineBreak: false });
    }
    doc.end();
  });
}
