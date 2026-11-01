/** Lector y validador del archivo de la lectora óptica (spec 007, Historia 1; RF-09.01, RF-09.02). */

export interface ScoreRow { applicantCode: string; knowledge: number; vocational: number; attitude: number; unreadable: boolean }
export interface Issue { line: number; applicantCode: string | null; issue: string }
export interface Structure { conocimientos: number; aptitudVocacional: number; actitudPersonal: number }

export const SCORE_FILE_HEADER = 'codigo,conocimientos,aptitud,actitud,observacion';
const UNREADABLE = new Set(['MAL_LLENADA', 'MAL LLENADA', 'NO_CALIFICABLE']);

/**
 * Valida TODO el archivo antes de procesar: si hay una sola inconsistencia, no se procesa nada.
 * `assigned`: código → asistencia registrada en el examen (M08).
 */
export function parseScoreFile(text: string, assigned: Map<string, 'PENDIENTE' | 'PRESENTE' | 'AUSENTE'>, max: Structure): { rows: ScoreRow[]; issues: Issue[] } {
  const lines = text.replace(/^﻿/, '').split(/\r?\n/).map((l) => l.trim());
  const issues: Issue[] = [];
  const rows: ScoreRow[] = [];
  const first = lines.findIndex((l) => l.length > 0);
  if (first < 0) return { rows, issues: [{ line: 0, applicantCode: null, issue: 'El archivo está vacío.' }] };
  const sep = lines[first]!.includes(';') ? ';' : ',';
  const header = lines[first]!.toLowerCase().split(sep).map((h) => h.trim());
  const col = (name: string) => header.indexOf(name);
  const idx = { code: col('codigo'), k: col('conocimientos'), v: col('aptitud'), a: col('actitud'), obs: col('observacion') };
  if (idx.code < 0 || idx.k < 0 || idx.v < 0 || idx.a < 0) {
    return { rows, issues: [{ line: first + 1, applicantCode: null, issue: `Encabezado inválido. Se espera: ${SCORE_FILE_HEADER}` }] };
  }
  const seen = new Set<string>();
  const int = (v: string | undefined, top: number) => (v !== undefined && /^\d+$/.test(v.trim()) && Number(v) <= top ? Number(v) : null);
  for (let i = first + 1; i < lines.length; i++) {
    const line = lines[i]!;
    if (!line) continue;
    const c = line.split(sep).map((x) => x.trim());
    const code = c[idx.code] ?? '';
    const n = i + 1;
    if (!/^\d{8}$/.test(code)) { issues.push({ line: n, applicantCode: code || null, issue: 'Código de postulante inválido' }); continue; }
    if (seen.has(code)) { issues.push({ line: n, applicantCode: code, issue: 'Código duplicado en el archivo' }); continue; }
    seen.add(code);
    const att = assigned.get(code);
    if (!att) { issues.push({ line: n, applicantCode: code, issue: 'No figura en la relación de este examen' }); continue; }
    if (att === 'AUSENTE') { issues.push({ line: n, applicantCode: code, issue: 'Figura como ausente en la asistencia' }); continue; }
    const unreadable = UNREADABLE.has((idx.obs >= 0 ? (c[idx.obs] ?? '') : '').toUpperCase());
    const k = int(c[idx.k], max.conocimientos);
    const v = int(c[idx.v], max.aptitudVocacional);
    const a = int(c[idx.a], max.actitudPersonal);
    if (!unreadable && (k === null || v === null || a === null)) {
      issues.push({ line: n, applicantCode: code, issue: `Aciertos fuera de rango (máximo ${max.conocimientos}, ${max.aptitudVocacional} y ${max.actitudPersonal})` });
      continue;
    }
    rows.push({ applicantCode: code, knowledge: k ?? 0, vocational: v ?? 0, attitude: a ?? 0, unreadable });
  }
  // Quien registró ingreso debe tener ficha calificada (o marcada como mal llenada).
  for (const [code, att] of assigned) {
    if (att === 'PRESENTE' && !seen.has(code)) issues.push({ line: 0, applicantCode: code, issue: 'Ingresó al examen pero no tiene registro en el archivo' });
  }
  return { rows, issues };
}
