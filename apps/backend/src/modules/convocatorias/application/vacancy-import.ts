import ExcelJS from 'exceljs';
import type { AuditLog, RequestMeta } from '../../../shared/audit/audit.js';
import type { Db } from '../../../shared/db/prisma.js';
import { businessRule, notFound, validationError } from '../../../shared/http/errors.js';

export interface VacancyImportRow {
  line: number;
  optionCode: string;
  name: string | null;
  byCategory: Record<string, number>;
  sum: number;
  declaredTotal: number | null;
  changes: { category: string; from: number; to: number }[];
  errors: string[];
}

export interface VacancyImportPreview {
  categories: string[];
  rows: VacancyImportRow[];
  errors: string[];
  totals: { before: number; after: number; changedCells: number };
  valid: boolean;
}

/**
 * Cuadro de vacantes desde Excel (spec 008, Historia 1, escenario 2; RF-01.05). La plantilla trae una fila
 * por programa y una columna por categoría más «TOTAL»: cada fila debe sumar su total. Primero se previsualiza
 * (diferencias con lo vigente y errores) y solo un archivo sin errores se guarda, todo o nada.
 */
export class VacancyImport {
  constructor(private readonly d: { db: Db; audit: AuditLog }) {}

  /** Plantilla con el cuadro vigente: se descarga, se corrige en Excel y se vuelve a subir. */
  async template(code: string): Promise<Buffer> {
    const { call, categories, options, current } = await this.context(code);
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Vacantes');
    ws.addRow(['CÓDIGO', 'PROGRAMA', ...categories.map((c) => c.code), 'TOTAL']);
    for (const o of options) {
      const values = categories.map((c) => current.get(`${o.internalCode}/${c.code}`) ?? 0);
      ws.addRow([o.internalCode, o.displayName, ...values, values.reduce((a, b) => a + b, 0)]);
    }
    ws.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    ws.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF7A1C22' } };
    ws.getColumn(2).width = 48;
    ws.views = [{ state: 'frozen', xSplit: 2, ySplit: 1 }];
    wb.creator = `Dirección de Admisión · ${call.code}`;
    return Buffer.from(await wb.xlsx.writeBuffer());
  }

  async preview(code: string, fileBase64: string): Promise<VacancyImportPreview> {
    const { categories, options, current } = await this.context(code);
    const known = new Set(categories.map((c) => c.code));
    const names = new Map(options.map((o) => [o.internalCode, o.displayName]));
    const wb = new ExcelJS.Workbook();
    try {
      await wb.xlsx.load(Buffer.from(fileBase64, 'base64') as unknown as ArrayBuffer);
    } catch {
      throw validationError('No pudimos leer el archivo. Sube la plantilla en formato .xlsx.', [{ field: 'file', issue: 'xlsx inválido' }]);
    }
    const ws = wb.worksheets[0];
    if (!ws) throw validationError('El archivo no tiene hojas.', [{ field: 'file', issue: 'vacío' }]);

    const cell = (v: ExcelJS.CellValue): string => {
      if (v && typeof v === 'object' && 'result' in v) return String(v.result ?? '').trim();
      return String(v ?? '').trim();
    };
    const header = (ws.getRow(1).values as ExcelJS.CellValue[]).slice(1).map((v) => cell(v).toUpperCase());
    const codeCol = header.findIndex((h) => h === 'CÓDIGO' || h === 'CODIGO');
    const totalCol = header.indexOf('TOTAL');
    const errors: string[] = [];
    if (codeCol < 0) errors.push('Falta la columna «CÓDIGO» con el código del programa (P01 a P40).');
    if (totalCol < 0) errors.push('Falta la columna «TOTAL».');
    const catCols = header.map((h, i) => ({ h, i })).filter(({ h, i }) => i !== codeCol && i !== totalCol && h !== 'PROGRAMA' && h);
    for (const { h } of catCols) if (!known.has(h)) errors.push(`La columna «${h}» no es una categoría de vacante del concurso.`);
    if (errors.length) return { categories: [], rows: [], errors, totals: { before: 0, after: 0, changedCells: 0 }, valid: false };

    const rows: VacancyImportRow[] = [];
    const seen = new Set<string>();
    ws.eachRow((row, line) => {
      if (line === 1) return;
      const values = (row.values as ExcelJS.CellValue[]).slice(1);
      const optionCode = cell(values[codeCol]).toUpperCase();
      if (!optionCode) return;
      const r: VacancyImportRow = { line, optionCode, name: names.get(optionCode) ?? null, byCategory: {}, sum: 0, declaredTotal: null, changes: [], errors: [] };
      if (!names.has(optionCode)) r.errors.push(`El programa ${optionCode} no existe.`);
      if (seen.has(optionCode)) r.errors.push(`El programa ${optionCode} está repetido.`);
      seen.add(optionCode);
      for (const { h, i } of catCols) {
        const raw = cell(values[i]);
        const n = raw === '' ? 0 : Number(raw);
        if (!Number.isInteger(n) || n < 0 || n > 500) { r.errors.push(`${h}: «${raw}» no es una cantidad válida (0 a 500).`); continue; }
        r.byCategory[h] = n;
        r.sum += n;
        const before = current.get(`${optionCode}/${h}`) ?? 0;
        if (before !== n) r.changes.push({ category: h, from: before, to: n });
      }
      const total = Number(cell(values[totalCol]));
      r.declaredTotal = Number.isFinite(total) ? total : null;
      if (r.declaredTotal !== r.sum) r.errors.push(`La fila suma ${r.sum} pero su TOTAL dice ${cell(values[totalCol]) || 'vacío'}.`);
      rows.push(r);
    });
    if (!rows.length) errors.push('El archivo no tiene filas de programas.');
    const missing = options.filter((o) => !seen.has(o.internalCode)).map((o) => o.internalCode);
    if (missing.length) errors.push(`Faltan programas en el archivo: ${missing.join(', ')}. Se conservarían sus vacantes actuales; inclúyelos para evitar confusiones.`);

    const before = [...current.values()].reduce((a, b) => a + b, 0);
    const changedCells = rows.reduce((a, r) => a + r.changes.length, 0);
    const after = before + rows.reduce((a, r) => a + r.changes.reduce((x, c) => x + c.to - c.from, 0), 0);
    const valid = !errors.length && rows.every((r) => !r.errors.length);
    return { categories: catCols.map((c) => c.h), rows, errors, totals: { before, after, changedCells }, valid };
  }

  /** Guarda solo si la previsualización no tiene errores; con la convocatoria publicada exige resolución (RN-03). */
  async apply(code: string, fileBase64: string, input: { resolution?: string | undefined; reason?: string | undefined }, actor: string, meta: RequestMeta) {
    const { call, categories, options } = await this.context(code);
    if (call.status === 'PUBLISHED' && (!input.resolution?.trim() || !input.reason?.trim())) {
      throw businessRule('RESOLUTION_REQUIRED', 'La convocatoria está publicada: registra la resolución y el motivo del cambio (RN-03).');
    }
    const p = await this.preview(code, fileBase64);
    if (!p.valid) throw businessRule('VACANCY_FILE_INVALID', 'El archivo tiene errores: revísalos en la vista previa antes de guardar.');
    const catId = new Map(categories.map((c) => [c.code, c.id]));
    const optId = new Map(options.map((o) => [o.internalCode, o.id]));
    const changes = p.rows.flatMap((r) => r.changes.map((c) => ({ ...c, optionCode: r.optionCode })));
    await this.d.db.$transaction(async (tx) => {
      for (const c of changes) {
        const key = { callId: call.id, optionId: optId.get(c.optionCode)!, quotaCategoryId: catId.get(c.category)! };
        await tx.vacancy.upsert({ where: { callId_optionId_quotaCategoryId: key }, create: { ...key, quantity: c.to }, update: { quantity: c.to } });
      }
      await this.d.audit.record({
        actorUserId: actor, action: 'call.vacancies_imported', resourceType: 'vacancy', resourceId: code,
        before: { total: p.totals.before }, after: { total: p.totals.after, changedCells: changes.length, resolution: input.resolution ?? null, reason: input.reason ?? null }, ...meta,
      }, tx);
    }, { timeout: 30_000 });
    return { changedCells: changes.length, total: p.totals.after };
  }

  private async context(code: string) {
    const call = await this.d.db.admissionCall.findUnique({ where: { code } });
    if (!call) throw notFound(`No existe la convocatoria ${code}.`);
    const [categories, options, vacancies] = await Promise.all([
      this.d.db.quotaCategory.findMany({ orderBy: { sortOrder: 'asc' } }),
      this.d.db.applicationOption.findMany({ orderBy: { internalCode: 'asc' } }),
      this.d.db.vacancy.findMany({ where: { callId: call.id }, include: { option: true, quotaCategory: true } }),
    ]);
    const current = new Map(vacancies.map((v) => [`${v.option.internalCode}/${v.quotaCategory.code}`, v.quantity]));
    return { call, categories, options, current };
  }
}
