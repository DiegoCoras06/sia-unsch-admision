import type { AuditLog, RequestMeta } from '../../../shared/audit/audit.js';
import type { Db } from '../../../shared/db/prisma.js';
import { notFound, validationError } from '../../../shared/http/errors.js';
import type { RateLimiter } from '../../../shared/rate-limit/rate-limiter.js';
import type { ConvocatoriasQueries } from '../../convocatorias/index.js';

/** Ciclo del CEPRE → categoría de vacante del cuadro oficial. */
const CYCLES: Record<string, 'CE-I' | 'CE-II'> = { I: 'CE-I', 'CE-I': 'CE-I', '1': 'CE-I', II: 'CE-II', 'CE-II': 'CE-II', '2': 'CE-II' };

export interface AwardeeRowError { line: number; message: string }

/**
 * Adjudicados del CEPRE-UNSCH (spec 004, Historia 6; Art. 8.10). Admisión carga la lista oficial en CSV
 * (dni;programa;ciclo;apellidos y nombres) y cada carga reemplaza a la anterior; solo quien figura en ella
 * puede inscribirse como adjudicado, con el programa y el ciclo adjudicados.
 */
export class CepreAwardees {
  constructor(private readonly d: { db: Db; audit: AuditLog; limiter: RateLimiter; convocatorias: ConvocatoriasQueries }) {}

  /** Consulta pública del formulario: programa adjudicado de un DNI (la lista de adjudicados es pública). */
  async lookup(documentNumber: string, meta: RequestMeta) {
    await this.d.limiter.consume(`cepre-lookup:${meta.ipHash}`, 30, 3600);
    const call = await this.d.convocatorias.getCurrentCall();
    const row = await this.d.db.cepreAwardee.findUnique({ where: { callCode_documentNumber: { callCode: call.code, documentNumber: documentNumber.trim() } } });
    if (!row) throw notFound('Tu DNI no figura en la lista de adjudicados del CEPRE-UNSCH.');
    const option = await this.d.convocatorias.getOption(call.code, row.optionCode);
    return { optionCode: row.optionCode, program: option.displayName, area: option.area, quotaCategory: row.cycle, cycle: row.cycle === 'CE-I' ? 'Ciclo I' : 'Ciclo II' };
  }

  async list() {
    const call = await this.d.convocatorias.getCurrentCall();
    const rows = await this.d.db.cepreAwardee.findMany({ where: { callCode: call.code }, orderBy: [{ optionCode: 'asc' }, { fullName: 'asc' }] });
    const registered = new Set((await this.d.db.application.findMany({
      where: { callCode: call.code, modality: 'CEPRE', documentNumber: { in: rows.map((r) => r.documentNumber) } },
      select: { documentNumber: true },
    })).map((a) => a.documentNumber));
    return {
      callCode: call.code,
      total: rows.length,
      registered: registered.size,
      items: rows.map((r) => ({ documentNumber: r.documentNumber, fullName: r.fullName, optionCode: r.optionCode, cycle: r.cycle, registered: registered.has(r.documentNumber), loadedAt: r.createdAt.toISOString() })),
    };
  }

  /** Valida todo el archivo antes de guardar: con un solo error no se reemplaza nada. */
  async replace(csv: string, actor: string, meta: RequestMeta) {
    const call = await this.d.convocatorias.getCurrentCall();
    const options = new Set((await this.d.convocatorias.searchOptions(call.code, {})).data.map((o) => o.internalCode));
    const errors: AwardeeRowError[] = [];
    const rows: { documentNumber: string; optionCode: string; cycle: 'CE-I' | 'CE-II'; fullName: string }[] = [];
    const seen = new Set<string>();
    const lines = csv.replace(/^﻿/, '').split(/\r?\n/);
    lines.forEach((raw, i) => {
      const line = i + 1;
      if (!raw.trim()) return;
      const cells = raw.split(raw.includes(';') ? ';' : ',').map((c) => c.trim().replace(/^"|"$/g, ''));
      if (i === 0 && !/^\d{8}$/.test(cells[0] ?? '')) return; // cabecera
      const [dni = '', program = '', cycle = '', ...name] = cells;
      const fullName = name.join(' ').trim().toUpperCase();
      if (!/^\d{8}$/.test(dni)) return void errors.push({ line, message: `DNI «${dni}» inválido: debe tener 8 dígitos.` });
      if (seen.has(dni)) return void errors.push({ line, message: `El DNI ${dni} está repetido.` });
      const optionCode = program.toUpperCase();
      if (!options.has(optionCode)) return void errors.push({ line, message: `El programa «${program}» no existe (usa el código P01 a P40).` });
      const cat = CYCLES[cycle.toUpperCase()];
      if (!cat) return void errors.push({ line, message: `Ciclo «${cycle}» inválido: usa I o II.` });
      if (!fullName) return void errors.push({ line, message: 'Faltan los apellidos y nombres.' });
      seen.add(dni);
      rows.push({ documentNumber: dni, optionCode, cycle: cat, fullName: fullName.slice(0, 200) });
    });
    if (!rows.length && !errors.length) errors.push({ line: 1, message: 'El archivo no tiene filas de adjudicados.' });
    if (errors.length) throw validationError(`El archivo tiene ${errors.length} error(es); no se guardó nada.`, errors.slice(0, 50).map((e) => ({ field: `linea ${e.line}`, issue: e.message })));

    await this.d.db.$transaction(async (tx) => {
      const before = await tx.cepreAwardee.count({ where: { callCode: call.code } });
      await tx.cepreAwardee.deleteMany({ where: { callCode: call.code } });
      await tx.cepreAwardee.createMany({ data: rows.map((r) => ({ ...r, callCode: call.code, loadedBy: actor })) });
      await this.d.audit.record({ actorUserId: actor, action: 'cepre.awardees_loaded', resourceType: 'cepre_awardees', resourceId: call.code, before: { total: before }, after: { total: rows.length }, ...meta }, tx);
    });
    return this.list();
  }
}
