import { createHmac, timingSafeEqual } from 'node:crypto';
import QRCode from 'qrcode';
import type { AuditLog, RequestMeta } from '../../../shared/audit/audit.js';
import type { Clock } from '../../../shared/clock/clock.js';
import type { Db } from '../../../shared/db/prisma.js';
import type { Outbox } from '../../../shared/events/outbox.js';
import { businessRule, conflict, notFound, validationError } from '../../../shared/http/errors.js';
import type { RateLimiter } from '../../../shared/rate-limit/rate-limiter.js';
import type { FileStorage } from '../../../shared/storage/file-storage.js';
import type { ConvocatoriasQueries } from '../../convocatorias/index.js';
import { distribute, roomOrder, type Candidate } from '../domain/distribution.js';
import {
  ACCOMMODATION_HOURS, DEFAULT_INSTRUCTIONS, DEFAULT_SCORING, DEFAULT_STRUCTURE, EXAM_STATUS_LABEL, PUBLISH_HOURS_BEFORE, occupiedWindow, overlaps,
} from '../domain/exam-rules.js';
import { eligibleListPdf, examSlipPdf, longDate, hour, type ExamInfo, type RoomInfo } from './exam-pdf.js';

export interface ExamPerson {
  applicantCode: string; surname: string; firstNames: string; fullName: string; document: string; modality: string;
  program: string; area: string; photoKey: string; email: string; noVacancyRight: boolean; optionCode: string; quotaCategory: string;
}
export interface ExamInscriptions {
  eligibleFor(callCode: string, modalities: string[]): Promise<ExamPerson[]>;
  examContext(applicantCode: string, documentNumber?: string): Promise<(ExamPerson & { callCode: string; status: string; statusLabel: string }) | null>;
}

/** RF-07.03: preguntas por área y, dentro de conocimientos, por curso del temario. */
export type ExamStructure = {
  conocimientos: number; aptitudVocacional: number; actitudPersonal: number;
  cursos?: { name: string; questions: number }[];
};

export interface ExamInput {
  code: string; name: string; modalities: string[]; entryOpensAt: string; entryClosesAt: string; durationMinutes: number; place: string;
  publishAt?: string | undefined; structure?: ExamStructure | undefined; scoring?: Record<string, number | boolean> | undefined;
  instructions?: { llevar: string[]; prohibido: string[]; notas: string } | undefined; reason?: string | undefined;
}

type ExamRow = NonNullable<Awaited<ReturnType<Db['exam']['findUnique']>>>;
type RoomRow = NonNullable<Awaited<ReturnType<Db['room']['findUnique']>>> & { venue: { name: string; address: string } };

const MODALITY_LABEL: Record<string, string> = { ORD: 'Ordinario', EXO: 'Exonerados', CEPRE: 'CEPRE-UNSCH' };
const iso = (d: Date | null | undefined) => (d ? d.toISOString() : null);

export function roomInfo(r: RoomRow): RoomInfo {
  return { venue: r.venue.name, address: r.venue.address, building: r.building, floor: r.floor, code: r.code, gate: r.gate, accessible: r.accessible };
}

/**
 * M07 Exámenes y M08 Sedes y aulas (spec 006): programación, aulas, distribución, publicación y consulta.
 * La asistencia del día del examen está en AttendanceService.
 */
export class ExamService {
  constructor(
    readonly d: {
      db: Db;
      clock: Clock;
      outbox: Outbox;
      audit: AuditLog;
      limiter: RateLimiter;
      storage: FileStorage;
      convocatorias: ConvocatoriasQueries;
      inscriptions: ExamInscriptions;
      secret: string;
      frontendOrigin: string;
    },
  ) {}

  // ── Utilidades compartidas ─────────────────────────────────────────
  async requireExam(id: string): Promise<ExamRow> {
    const e = await this.d.db.exam.findUnique({ where: { id } });
    if (!e) throw notFound('Examen no encontrado.');
    return e;
  }

  examInfo(e: ExamRow, callName: string): ExamInfo {
    return {
      name: e.name, callName, entryOpensAt: e.entryOpensAt, entryClosesAt: e.entryClosesAt, durationMinutes: e.durationMinutes, place: e.place,
      instructions: e.instructions as ExamInfo['instructions'],
    };
  }

  /** La distribución es visible para el postulante cuando está confirmada y llegó la hora de publicación (RN-35). */
  isVisible(e: ExamRow): boolean {
    return (e.status === 'CONFIRMADO' || e.status === 'FINALIZADO') && this.d.clock.now() >= e.publishAt;
  }

  /** QR de la ficha de examen: abre el registro de ingreso del panel con el código firmado. */
  token(applicantCode: string): string {
    return `${applicantCode}.${this.sign(applicantCode)}`;
  }

  checkToken(token: string): boolean {
    const [code, sig] = token.split('.');
    if (!code || !sig) return false;
    const a = Buffer.from(sig);
    const b = Buffer.from(this.sign(code));
    return a.length === b.length && timingSafeEqual(a, b);
  }

  private sign(code: string) {
    return createHmac('sha256', this.d.secret).update(`examen:${code}`).digest('base64url').slice(0, 16);
  }

  // ── H1: programar exámenes (RF-07.01 a RF-07.09) ───────────────────
  async list() {
    const call = await this.d.convocatorias.getCurrentCall();
    const exams = await this.d.db.exam.findMany({
      where: { callCode: call.code }, orderBy: { entryOpensAt: 'asc' },
      include: { rooms: { include: { room: true } }, _count: { select: { assignments: true } } },
    });
    return Promise.all(exams.map(async (e) => ({
      id: e.id, code: e.code, name: e.name, modalities: e.modalities, status: e.status, statusLabel: EXAM_STATUS_LABEL[e.status],
      entryOpensAt: iso(e.entryOpensAt), entryClosesAt: iso(e.entryClosesAt), publishAt: iso(e.publishAt), visible: this.isVisible(e),
      rooms: e.rooms.length, capacity: e.rooms.reduce((s, r) => s + r.room.capacity, 0), assigned: e._count.assignments,
      eligible: (await this.d.inscriptions.eligibleFor(e.callCode, e.modalities)).length,
    })));
  }

  async detail(id: string) {
    const e = await this.requireExam(id);
    const [rooms, assignments, eligible, requests, changes] = await Promise.all([
      this.d.db.examRoom.findMany({ where: { examId: id }, include: { room: { include: { venue: true } } } }),
      this.d.db.examAssignment.findMany({ where: { examId: id } }),
      this.d.inscriptions.eligibleFor(e.callCode, e.modalities),
      this.d.db.accommodationRequest.findMany({ where: { examId: id }, orderBy: { createdAt: 'asc' } }),
      this.d.db.assignmentChange.findMany({ where: { assignment: { examId: id }, fromRoomId: { not: null } }, include: { assignment: true }, orderBy: { at: 'desc' }, take: 30 }),
    ]);
    const eligibleSet = new Set(eligible.map((p) => p.applicantCode));
    const assignedSet = new Set(assignments.map((a) => a.applicantCode));
    const names = new Map(eligible.map((p) => [p.applicantCode, p.fullName]));
    const roomName = new Map(rooms.map((r) => [r.roomId, `${r.room.building} · ${r.room.code}`]));
    const byRoom = new Map<string, { total: number; present: number; absent: number }>();
    for (const a of assignments) {
      const c = byRoom.get(a.roomId) ?? { total: 0, present: 0, absent: 0 };
      c.total++;
      if (a.attendance === 'PRESENTE') c.present++;
      if (a.attendance === 'AUSENTE') c.absent++;
      byRoom.set(a.roomId, c);
    }
    return {
      id: e.id, code: e.code, name: e.name, modalities: e.modalities, place: e.place, durationMinutes: e.durationMinutes,
      entryOpensAt: iso(e.entryOpensAt), entryClosesAt: iso(e.entryClosesAt), publishAt: iso(e.publishAt),
      structure: e.structure, scoring: e.scoring, instructions: e.instructions,
      status: e.status, statusLabel: EXAM_STATUS_LABEL[e.status], visible: this.isVisible(e), version: e.distributionVersion,
      distributedAt: iso(e.distributedAt), confirmedAt: iso(e.confirmedAt), attendanceClosedAt: iso(e.attendanceClosedAt),
      eligible: eligible.length,
      assigned: assignments.length,
      // Aptos sin asiento (p. ej. pagaron después de distribuir) y asientos de quienes dejaron de ser aptos (casos límite).
      unassigned: eligible.filter((p) => !assignedSet.has(p.applicantCode)).map((p) => ({ applicantCode: p.applicantCode, fullName: p.fullName })),
      released: assignments.filter((a) => !eligibleSet.has(a.applicantCode)).map((a) => a.applicantCode),
      rooms: rooms.map((r) => r.room).sort(roomOrder).map((r) => ({
        id: r.id, venue: r.venue.name, building: r.building, floor: r.floor, code: r.code, gate: r.gate, capacity: r.capacity, accessible: r.accessible,
        used: byRoom.get(r.id)?.total ?? 0, present: byRoom.get(r.id)?.present ?? 0, absent: byRoom.get(r.id)?.absent ?? 0,
      })),
      accommodations: requests.map((q) => ({ applicantCode: q.applicantCode, fullName: names.get(q.applicantCode) ?? q.applicantCode, needs: q.needs, late: q.late, createdAt: iso(q.createdAt) })),
      changes: changes.map((c) => ({
        applicantCode: c.assignment.applicantCode, from: c.fromRoomId ? (roomName.get(c.fromRoomId) ?? '-') : '-', to: roomName.get(c.toRoomId) ?? '-', reason: c.reason, at: iso(c.at),
      })),
    };
  }

  async save(id: string | null, input: ExamInput, actorId: string, meta: RequestMeta) {
    const call = await this.d.convocatorias.getCurrentCall();
    const opens = new Date(input.entryOpensAt);
    const closes = new Date(input.entryClosesAt);
    if (!(closes > opens)) throw validationError('El cierre del ingreso debe ser posterior a su apertura.', [{ field: 'entryClosesAt', issue: 'orden' }]);
    const publishAt = input.publishAt ? new Date(input.publishAt) : new Date(opens.getTime() - PUBLISH_HOURS_BEFORE * 3600_000);
    if (publishAt >= opens) throw validationError('La distribución se publica antes del examen.', [{ field: 'publishAt', issue: 'orden' }]);
    const courses = input.structure?.cursos ?? [];
    if (courses.length) {
      const sum = courses.reduce((s, c) => s + c.questions, 0);
      if (sum !== input.structure!.conocimientos) {
        throw validationError(`Las preguntas por curso suman ${sum} y conocimientos tiene ${input.structure!.conocimientos}.`, [{ field: 'structure.cursos', issue: 'suma' }]);
      }
      if (new Set(courses.map((c) => c.name)).size !== courses.length) throw validationError('Hay cursos repetidos.', [{ field: 'structure.cursos', issue: 'repetido' }]);
    }
    const data = {
      code: input.code.trim().toUpperCase(), name: input.name.trim(), modalities: input.modalities, entryOpensAt: opens, entryClosesAt: closes,
      durationMinutes: input.durationMinutes, place: input.place.trim(), publishAt,
      ...(input.structure ? { structure: input.structure } : {}), ...(input.scoring ? { scoring: input.scoring } : {}),
      ...(input.instructions ? { instructions: input.instructions } : {}),
    };

    // RF-07.06: una modalidad no puede estar en dos exámenes de la misma convocatoria.
    const others = await this.d.db.exam.findMany({ where: { callCode: call.code, ...(id ? { id: { not: id } } : {}) }, include: { rooms: true } });
    const dup = others.find((o) => o.modalities.some((m) => input.modalities.includes(m)));
    if (dup) throw conflict('MODALITY_TAKEN', `La modalidad ya tiene examen: ${dup.name}.`);

    if (!id) {
      const created = await this.d.db.$transaction(async (tx) => {
        const e = await tx.exam.create({
          data: { ...data, callCode: call.code, structure: input.structure ?? DEFAULT_STRUCTURE, scoring: input.scoring ?? DEFAULT_SCORING, instructions: input.instructions ?? DEFAULT_INSTRUCTIONS },
        });
        await this.d.audit.record({ actorUserId: actorId, action: 'exam.created', resourceType: 'exam', resourceId: e.id, after: { code: e.code, modalities: e.modalities, opens: iso(opens) }, ...meta }, tx);
        return e;
      });
      return this.detail(created.id);
    }

    const before = await this.requireExam(id);
    const rescheduled = before.entryOpensAt.getTime() !== opens.getTime() || before.entryClosesAt.getTime() !== closes.getTime();
    const notify = rescheduled && this.isVisible(before);
    // RF-07.09: una reprogramación con aulas ya publicadas exige motivo y avisa a cada postulante.
    if (notify && (input.reason?.trim().length ?? 0) < 10) {
      throw validationError('Las aulas ya están publicadas: indica el motivo de la reprogramación (mínimo 10 caracteres).', [{ field: 'reason', issue: 'obligatorio' }]);
    }
    if (rescheduled) await this.ensureNoClash(id, (await this.d.db.examRoom.findMany({ where: { examId: id } })).map((r) => r.roomId), { entryOpensAt: opens, entryClosesAt: closes, durationMinutes: input.durationMinutes });
    const people = notify ? await this.assignedPeople(before) : [];
    await this.d.db.$transaction(async (tx) => {
      await tx.exam.update({ where: { id }, data });
      await this.d.audit.record({
        actorUserId: actorId, action: rescheduled ? 'exam.rescheduled' : 'exam.updated', resourceType: 'exam', resourceId: id,
        before: { opens: iso(before.entryOpensAt), closes: iso(before.entryClosesAt) }, after: { opens: iso(opens), closes: iso(closes), reason: input.reason ?? null }, ...meta,
      }, tx);
      for (const p of people) {
        await this.d.outbox.publish(tx, 'ExamenReprogramado', {
          applicantCode: p.applicantCode, email: p.email, firstNames: p.firstNames, exam: data.name,
          when: `${longDate(opens)}, ingreso de ${hour(opens)} a ${hour(closes)}`, reason: input.reason!.trim(),
        }, meta.requestId);
      }
    });
    return this.detail(id);
  }

  /** RF-07.07: un aula no puede estar en dos exámenes cuyos horarios se cruzan. */
  private async ensureNoClash(examId: string, roomIds: string[], when: { entryOpensAt: Date; entryClosesAt: Date; durationMinutes: number }) {
    if (!roomIds.length) return;
    const mine = occupiedWindow(when);
    const others = await this.d.db.exam.findMany({ where: { id: { not: examId }, rooms: { some: { roomId: { in: roomIds } } } }, include: { rooms: { include: { room: true } } } });
    for (const o of others) {
      if (!overlaps(mine, occupiedWindow(o))) continue;
      const shared = o.rooms.filter((r) => roomIds.includes(r.roomId)).map((r) => r.room.code);
      throw conflict('SCHEDULE_CONFLICT', `Cruce de horario con «${o.name}» en las aulas ${shared.slice(0, 6).join(', ')}${shared.length > 6 ? '…' : ''}.`, { exam: o.name, rooms: shared });
    }
  }

  async setRooms(id: string, roomIds: string[], actorId: string, meta: RequestMeta) {
    const e = await this.requireExam(id);
    const rooms = await this.d.db.room.findMany({ where: { id: { in: roomIds }, active: true } });
    if (rooms.length !== new Set(roomIds).size) throw validationError('Hay aulas inexistentes o inactivas.', [{ field: 'roomIds', issue: 'inválido' }]);
    const used = await this.d.db.examAssignment.groupBy({ by: ['roomId'], where: { examId: id }, _count: { _all: true } });
    const removedInUse = used.filter((u) => !roomIds.includes(u.roomId));
    if (removedInUse.length) throw businessRule('ROOM_IN_USE', 'No puedes quitar aulas con postulantes asignados: muévelos o vuelve a distribuir.');
    await this.ensureNoClash(id, roomIds, e);
    await this.d.db.$transaction(async (tx) => {
      await tx.examRoom.deleteMany({ where: { examId: id } });
      await tx.examRoom.createMany({ data: roomIds.map((roomId) => ({ examId: id, roomId })) });
      await this.d.audit.record({ actorUserId: actorId, action: 'exam.rooms_set', resourceType: 'exam', resourceId: id, after: { rooms: roomIds.length }, ...meta }, tx);
    });
    return this.detail(id);
  }

  // ── H2: sedes, pabellones, pisos y aulas (RF-08.01, RF-08.02) ──────
  async venues() {
    const venues = await this.d.db.venue.findMany({ orderBy: { name: 'asc' }, include: { rooms: true } });
    return venues.map((v) => ({
      id: v.id, code: v.code, name: v.name, address: v.address, active: v.active,
      capacity: v.rooms.filter((r) => r.active).reduce((s, r) => s + r.capacity, 0),
      rooms: [...v.rooms].sort((a, b) => roomOrder({ ...a, id: a.id }, { ...b, id: b.id })).map((r) => ({
        id: r.id, building: r.building, floor: r.floor, code: r.code, capacity: r.capacity, gate: r.gate, accessible: r.accessible, active: r.active,
      })),
    }));
  }

  async saveVenue(id: string | null, input: { code: string; name: string; address: string; active: boolean }, actorId: string, meta: RequestMeta) {
    const data = { code: input.code.trim().toUpperCase(), name: input.name.trim(), address: input.address.trim(), active: input.active };
    const dup = await this.d.db.venue.findUnique({ where: { code: data.code } });
    if (dup && dup.id !== id) throw conflict('VENUE_CODE_TAKEN', 'Ya existe una sede con ese código.');
    const v = id ? await this.d.db.venue.update({ where: { id }, data }) : await this.d.db.venue.create({ data });
    await this.d.audit.record({ actorUserId: actorId, action: id ? 'venue.updated' : 'venue.created', resourceType: 'venue', resourceId: v.id, after: data, ...meta });
    return this.venues();
  }

  async saveRoom(id: string | null, input: { venueId: string; building: string; floor: number; code: string; capacity: number; gate: string; accessible: boolean; active: boolean }, actorId: string, meta: RequestMeta) {
    const data = { ...input, building: input.building.trim(), code: input.code.trim().toUpperCase(), gate: input.gate.trim() };
    const dup = await this.d.db.room.findFirst({ where: { venueId: data.venueId, code: data.code } });
    if (dup && dup.id !== id) throw conflict('ROOM_CODE_TAKEN', 'Ya existe un aula con ese código en la sede.');
    if (id) {
      // No se puede bajar la capacidad por debajo de los asientos ya asignados en algún examen.
      const max = await this.d.db.examAssignment.aggregate({ where: { roomId: id }, _max: { seat: true } });
      if ((max._max.seat ?? 0) > data.capacity) throw businessRule('CAPACITY_BELOW_ASSIGNED', `El aula ya tiene ${max._max.seat} asientos asignados.`);
      if (!data.active && (await this.d.db.examAssignment.count({ where: { roomId: id } }))) throw businessRule('ROOM_IN_USE', 'El aula tiene postulantes asignados: muévelos antes de desactivarla.');
    }
    const r = id ? await this.d.db.room.update({ where: { id }, data }) : await this.d.db.room.create({ data });
    await this.d.audit.record({ actorUserId: actorId, action: id ? 'room.updated' : 'room.created', resourceType: 'room', resourceId: r.id, after: { code: r.code, capacity: r.capacity, accessible: r.accessible }, ...meta });
    return this.venues();
  }

  // ── H3: distribución (RF-07.05, RF-08.03, RF-08.04) ────────────────
  async distribute(id: string, reason: string | undefined, actorId: string, meta: RequestMeta) {
    const e = await this.requireExam(id);
    if (e.status === 'FINALIZADO') throw businessRule('EXAM_FINISHED', 'La asistencia del examen ya se cerró.');
    if (await this.d.db.examAssignment.count({ where: { examId: id, attendance: { not: 'PENDIENTE' } } })) {
      throw businessRule('ATTENDANCE_STARTED', 'Ya se registró asistencia: usa el cambio de aula individual.');
    }
    const visible = this.isVisible(e);
    if (visible && (reason?.trim().length ?? 0) < 10) {
      throw validationError('La distribución ya está publicada: indica la justificación (mínimo 10 caracteres).', [{ field: 'reason', issue: 'obligatorio' }]);
    }
    const started = Date.now();
    const [people, links, requests, old] = await Promise.all([
      this.d.inscriptions.eligibleFor(e.callCode, e.modalities),
      this.d.db.examRoom.findMany({ where: { examId: id }, include: { room: true } }),
      this.d.db.accommodationRequest.findMany({ where: { examId: id } }),
      this.d.db.examAssignment.findMany({ where: { examId: id } }),
    ]);
    if (!people.length) throw businessRule('NO_ELIGIBLE', 'Aún no hay postulantes aptos para este examen.');
    const needs = new Set(requests.map((r) => r.applicantCode));
    const candidates: Candidate[] = people.map((p) => ({ applicantCode: p.applicantCode, surname: p.surname, firstNames: p.firstNames, area: p.area, needsAccessible: needs.has(p.applicantCode) }));
    const result = distribute(candidates, links.map((l) => l.room).filter((r) => r.active));
    if (!result.ok) {
      throw businessRule('INSUFFICIENT_CAPACITY', result.reason === 'CAPACITY'
        ? `La capacidad no alcanza: faltan ${result.missing} asientos. No se asignó a nadie; habilita más aulas.`
        : `Faltan ${result.missing} asientos en aulas accesibles para quienes pidieron adecuación.`, { missing: result.missing });
    }

    const version = e.distributionVersion + 1;
    const oldRoom = new Map(old.map((a) => [a.applicantCode, a]));
    const byPerson = new Map(people.map((p) => [p.applicantCode, p]));
    const roomLabel = new Map(links.map((l) => [l.roomId, `${l.room.building}, piso ${l.room.floor}, aula ${l.room.code} (${l.room.gate})`]));
    const why = reason?.trim() || `Distribución automática v${version}`;
    await this.d.db.$transaction(async (tx) => {
      // Asientos temporales negativos para reordenar sin chocar con la restricción única (aula, asiento).
      await tx.$executeRaw`UPDATE examenes.exam_assignments SET seat = -seat WHERE exam_id = ${id}::uuid`;
      const keep = new Set(result.seats.map((s) => s.applicantCode));
      await tx.examAssignment.deleteMany({ where: { examId: id, applicantCode: { notIn: [...keep] } } });
      const fresh = result.seats.filter((s) => !oldRoom.has(s.applicantCode));
      if (fresh.length) await tx.examAssignment.createMany({ data: fresh.map((s) => ({ examId: id, applicantCode: s.applicantCode, roomId: s.roomId, seat: s.seat, version })) });
      const created = new Map((await tx.examAssignment.findMany({ where: { examId: id, version, applicantCode: { in: fresh.map((s) => s.applicantCode) } } })).map((a) => [a.applicantCode, a.id]));
      if (created.size) await tx.assignmentChange.createMany({ data: fresh.map((s) => ({ assignmentId: created.get(s.applicantCode)!, fromRoomId: null, toRoomId: s.roomId, reason: why, actorId })) });
      for (const s of result.seats) {
        const prev = oldRoom.get(s.applicantCode);
        if (!prev) continue;
        await tx.examAssignment.update({ where: { id: prev.id }, data: { roomId: s.roomId, seat: s.seat, version } });
        if (prev.roomId === s.roomId) continue;
        await tx.assignmentChange.create({ data: { assignmentId: prev.id, fromRoomId: prev.roomId, toRoomId: s.roomId, reason: why, actorId } });
        // Historia 3, escenario 4: con la distribución publicada, se avisa a quien cambia de aula.
        const p = byPerson.get(s.applicantCode)!;
        if (visible) await this.d.outbox.publish(tx, 'AulaCambiada', { applicantCode: p.applicantCode, email: p.email, firstNames: p.firstNames, exam: e.name, room: roomLabel.get(s.roomId)!, reason: why }, meta.requestId);
      }
      await tx.exam.update({
        where: { id },
        data: { distributionVersion: version, distributedAt: this.d.clock.now(), ...(visible ? {} : { status: 'DISTRIBUIDO', confirmedAt: null }) },
      });
      await this.d.audit.record({
        actorUserId: actorId, action: 'exam.distributed', resourceType: 'exam', resourceId: id,
        after: { version, assigned: result.seats.length, rooms: result.occupancy.filter((o) => o.used).length, reason: reason ?? null, ms: Date.now() - started }, ...meta,
      }, tx);
    }, { timeout: 60_000 });
    return this.detail(id);
  }

  /** Historia 3, escenario 3: confirmar la distribución; el postulante la ve desde la hora de publicación. */
  async confirm(id: string, actorId: string, meta: RequestMeta) {
    const e = await this.requireExam(id);
    if (e.status !== 'DISTRIBUIDO') throw businessRule('NOT_DISTRIBUTED', e.status === 'PROGRAMADO' ? 'Primero genera la distribución.' : 'La distribución ya está confirmada.');
    await this.d.db.$transaction(async (tx) => {
      await tx.exam.update({ where: { id }, data: { status: 'CONFIRMADO', confirmedAt: this.d.clock.now() } });
      await this.d.audit.record({ actorUserId: actorId, action: 'exam.confirmed', resourceType: 'exam', resourceId: id, after: { version: e.distributionVersion, publishAt: iso(e.publishAt) }, ...meta }, tx);
    });
    return this.detail(id);
  }

  /** Historia 6: cambio de aula autorizado de un postulante, con historial y aviso (RF-08.09). */
  async move(id: string, applicantCode: string, roomId: string, reason: string, actorId: string, meta: RequestMeta) {
    const e = await this.requireExam(id);
    const a = await this.d.db.examAssignment.findUnique({ where: { examId_applicantCode: { examId: id, applicantCode } } });
    if (!a) throw notFound('El postulante no tiene aula en este examen.');
    if (a.roomId === roomId) throw businessRule('SAME_ROOM', 'El postulante ya está en esa aula.');
    const link = await this.d.db.examRoom.findUnique({ where: { examId_roomId: { examId: id, roomId } }, include: { room: true } });
    if (!link) throw validationError('El aula no está habilitada para este examen.', [{ field: 'roomId', issue: 'no habilitada' }]);
    const taken = new Set((await this.d.db.examAssignment.findMany({ where: { examId: id, roomId }, select: { seat: true } })).map((s) => s.seat));
    let seat = 1;
    while (taken.has(seat)) seat++;
    if (seat > link.room.capacity) throw businessRule('ROOM_FULL', `El aula ${link.room.code} está llena.`);
    const person = await this.d.inscriptions.examContext(applicantCode);
    await this.d.db.$transaction(async (tx) => {
      await tx.examAssignment.update({ where: { id: a.id }, data: { roomId, seat } });
      await tx.assignmentChange.create({ data: { assignmentId: a.id, fromRoomId: a.roomId, toRoomId: roomId, reason: reason.trim(), actorId } });
      await this.d.audit.record({ actorUserId: actorId, action: 'exam.assignment_moved', resourceType: 'exam_assignment', resourceId: applicantCode, before: { roomId: a.roomId, seat: a.seat }, after: { roomId, seat, reason }, ...meta }, tx);
      if (person && this.isVisible(e)) {
        await this.d.outbox.publish(tx, 'AulaCambiada', {
          applicantCode, email: person.email, firstNames: person.firstNames, exam: e.name,
          room: `${link.room.building}, piso ${link.room.floor}, aula ${link.room.code} (${link.room.gate})`, reason: reason.trim(),
        }, meta.requestId);
      }
    });
    return this.detail(id);
  }

  /** Lista de asignados con aula, para el panel y la relación de aptos. */
  async assignments(id: string, filter: { roomId?: string | undefined; q?: string | undefined }) {
    const e = await this.requireExam(id);
    const [rows, people] = await Promise.all([
      this.d.db.examAssignment.findMany({ where: { examId: id, ...(filter.roomId ? { roomId: filter.roomId } : {}) }, include: { room: true }, orderBy: [{ room: { code: 'asc' } }, { seat: 'asc' }] }),
      this.d.inscriptions.eligibleFor(e.callCode, e.modalities),
    ]);
    const who = new Map(people.map((p) => [p.applicantCode, p]));
    const q = filter.q?.trim().toUpperCase();
    return rows
      .map((a) => ({
        applicantCode: a.applicantCode, fullName: who.get(a.applicantCode)?.fullName ?? '(ya no es apto)', document: who.get(a.applicantCode)?.document ?? '',
        program: who.get(a.applicantCode)?.program ?? '', roomId: a.roomId, room: a.room.code, building: a.room.building, seat: a.seat,
        attendance: a.attendance, late: a.late, checkedInAt: iso(a.checkedInAt),
      }))
      .filter((r) => !q || r.applicantCode.includes(q) || r.fullName.toUpperCase().includes(q) || r.document.includes(q));
  }

  async eligiblePdf(id: string) {
    const e = await this.requireExam(id);
    const call = await this.d.convocatorias.getCurrentCall();
    const [people, rows] = await Promise.all([
      this.d.inscriptions.eligibleFor(e.callCode, e.modalities),
      this.d.db.examAssignment.findMany({ where: { examId: id }, include: { room: true } }),
    ]);
    const seat = new Map(rows.map((a) => [a.applicantCode, `${a.room.building} · ${a.room.code}`]));
    const sorted = [...people].sort((a, b) => a.fullName.localeCompare(b.fullName, 'es'));
    return eligibleListPdf({
      exam: this.examInfo(e, call.name), issuedAt: this.d.clock.now(),
      rows: sorted.map((p) => ({ applicantCode: p.applicantCode, fullName: p.fullName, program: p.program, room: seat.get(p.applicantCode) ?? 'Sin aula' })),
    });
  }

  // ── H4: consulta pública del aula (RF-08.05, RF-08.06) ─────────────
  /** Busca la inscripción con DNI + código; ante cualquier discrepancia, la misma respuesta genérica. */
  private async applicant(documentNumber: string, applicantCode: string, meta: RequestMeta) {
    await this.d.limiter.consume(`aula:${meta.ipHash}`, 30, 3600);
    const ctx = await this.d.inscriptions.examContext(applicantCode, documentNumber);
    if (!ctx) throw notFound('Datos no encontrados. Revisa tu número de documento y tu código de postulante.');
    const exam = (await this.d.db.exam.findMany({ where: { callCode: ctx.callCode } })).find((x) => x.modalities.includes(ctx.modality)) ?? null;
    return { ctx, exam };
  }

  async findRoom(documentNumber: string, applicantCode: string, meta: RequestMeta) {
    const { ctx, exam } = await this.applicant(documentNumber, applicantCode, meta);
    const base = { applicantCode: ctx.applicantCode, fullName: ctx.fullName, program: ctx.program, modality: MODALITY_LABEL[ctx.modality] ?? ctx.modality };
    if (!exam) return { ...base, state: 'NO_EXAM' as const, message: 'Tu modalidad no rinde examen en este proceso.' };
    const request = await this.d.db.accommodationRequest.findUnique({ where: { applicantCode } });
    const examPart = {
      exam: {
        name: exam.name, date: iso(exam.entryOpensAt), entryOpensAt: iso(exam.entryOpensAt), entryClosesAt: iso(exam.entryClosesAt),
        durationMinutes: exam.durationMinutes, place: exam.place, publishAt: iso(exam.publishAt), instructions: exam.instructions,
      },
      accommodation: request ? { needs: request.needs, late: request.late, createdAt: iso(request.createdAt) } : null,
      canRequestAccommodation: this.d.clock.now() < exam.entryOpensAt && ctx.status !== 'ANULADA',
    };
    if (ctx.status !== 'APTA') {
      const why = ctx.status === 'ANULADA' ? 'tu inscripción está anulada' : ctx.status === 'PENDIENTE_PAGO' ? 'tu pago aún no está confirmado' : 'tu expediente aún no está autorizado o tu pago no está confirmado';
      return { ...base, ...examPart, state: 'NOT_ELIGIBLE' as const, message: `No figuras en la relación de aptos: ${why}. Si crees que es un error, comunícate con la Dirección de Admisión.` };
    }
    if (!this.isVisible(exam)) {
      return { ...base, ...examPart, state: 'NOT_PUBLISHED' as const, message: `Tu aula se publica el ${longDate(exam.publishAt)} a las ${hour(exam.publishAt)}.` };
    }
    const a = await this.d.db.examAssignment.findUnique({ where: { examId_applicantCode: { examId: exam.id, applicantCode } }, include: { room: { include: { venue: true } } } });
    if (!a) return { ...base, ...examPart, state: 'NOT_ASSIGNED' as const, message: 'No figuras en la relación de aptos de este examen. Comunícate de inmediato con la Dirección de Admisión.' };
    return { ...base, ...examPart, state: 'ASSIGNED' as const, message: null, room: { ...roomInfo(a.room), seat: a.seat } };
  }

  /** Historia 4, escenario 4: ficha de examen con aula, horario y QR. */
  async slip(documentNumber: string, applicantCode: string, meta: RequestMeta) {
    const { ctx, exam } = await this.applicant(documentNumber, applicantCode, meta);
    if (!exam || ctx.status !== 'APTA' || !this.isVisible(exam)) throw businessRule('SLIP_NOT_AVAILABLE', 'Tu ficha de examen estará disponible cuando se publique tu aula.');
    const a = await this.d.db.examAssignment.findUnique({ where: { examId_applicantCode: { examId: exam.id, applicantCode } }, include: { room: { include: { venue: true } } } });
    if (!a) throw businessRule('SLIP_NOT_AVAILABLE', 'No figuras en la relación de aptos de este examen.');
    const [call, photo, qr] = await Promise.all([
      this.d.convocatorias.getCurrentCall(),
      this.d.storage.get(ctx.photoKey),
      QRCode.toBuffer(`${this.d.frontendOrigin}/admin/asistencia?c=${this.token(applicantCode)}`, { margin: 1, width: 300, errorCorrectionLevel: 'M' }),
    ]);
    return examSlipPdf({
      applicantCode, fullName: ctx.fullName, document: ctx.document, program: ctx.program, modality: MODALITY_LABEL[ctx.modality] ?? ctx.modality,
      seat: a.seat, photo, qr, exam: this.examInfo(exam, call.name), room: roomInfo(a.room), issuedAt: this.d.clock.now(), noVacancyRight: ctx.noVacancyRight,
    });
  }

  /** RN-39, FR-013: solicitud de adecuación; con menos de 72 h se registra fuera de plazo para la Comisión. */
  async requestAccommodation(documentNumber: string, applicantCode: string, needs: string, meta: RequestMeta) {
    const { ctx, exam } = await this.applicant(documentNumber, applicantCode, meta);
    if (!exam) throw businessRule('NO_EXAM', 'Tu modalidad no rinde examen en este proceso.');
    if (ctx.status === 'ANULADA') throw businessRule('ANNULLED', 'La inscripción está anulada.');
    const now = this.d.clock.now();
    if (now >= exam.entryOpensAt) throw businessRule('EXAM_STARTED', 'El examen ya empezó: acércate al personal de la puerta.');
    const late = now.getTime() > exam.entryOpensAt.getTime() - ACCOMMODATION_HOURS * 3600_000;
    await this.d.db.$transaction(async (tx) => {
      await tx.accommodationRequest.upsert({
        where: { applicantCode }, create: { applicantCode, examId: exam.id, needs: needs.trim(), late }, update: { needs: needs.trim(), late, examId: exam.id },
      });
      await this.d.audit.record({ actorUserId: null, action: 'exam.accommodation_requested', resourceType: 'application', resourceId: applicantCode, after: { late }, ...meta }, tx);
    });
    return this.findRoom(documentNumber, applicantCode, meta);
  }

  /** M10 (RF-10.07): aula del postulante ya identificado, solo si la distribución es visible. */
  async roomFor(applicantCode: string) {
    const ctx = await this.d.inscriptions.examContext(applicantCode);
    if (!ctx) return null;
    const exam = (await this.d.db.exam.findMany({ where: { callCode: ctx.callCode } })).find((x) => x.modalities.includes(ctx.modality));
    if (!exam) return { publicada: false, detalle: 'Tu modalidad no rinde examen en este proceso.' };
    if (!this.isVisible(exam)) return { publicada: false, detalle: `Se publica el ${longDate(exam.publishAt)} a las ${hour(exam.publishAt)}.` };
    const a = await this.d.db.examAssignment.findUnique({ where: { examId_applicantCode: { examId: exam.id, applicantCode } }, include: { room: { include: { venue: true } } } });
    if (!a) return { publicada: true, detalle: 'No figuras en la relación de aptos de este examen; comunícate con la Dirección de Admisión.' };
    return {
      publicada: true,
      detalle: `${a.room.gate}, ${a.room.building}, piso ${a.room.floor}, aula ${a.room.code}, asiento ${a.seat}. Ingreso de ${hour(exam.entryOpensAt)} a ${hour(exam.entryClosesAt)} del ${longDate(exam.entryOpensAt)}.`,
    };
  }

  // ── Fuentes para M11 y M09 ─────────────────────────────────────────
  /** RF-11.06: exámenes cuya distribución ya es visible y aún no se avisó. */
  async roomNotices() {
    const exams = await this.d.db.exam.findMany({ where: { status: { in: ['CONFIRMADO', 'FINALIZADO'] }, publishAt: { lte: this.d.clock.now() }, roomsNotifiedAt: null } });
    return Promise.all(exams.map(async (e) => ({ examId: e.id, exam: e.name, people: await this.assignedPeople(e) })));
  }

  async markRoomsNotified(examId: string) {
    await this.d.db.exam.update({ where: { id: examId }, data: { roomsNotifiedAt: this.d.clock.now() } });
  }

  /** H3-2 de la spec 010: exámenes que empiezan dentro de `withinHours`, con sus asignados. */
  async examsSoon(withinHours: number) {
    const now = this.d.clock.now();
    const exams = await this.d.db.exam.findMany({ where: { status: { in: ['CONFIRMADO'] }, entryOpensAt: { gt: now, lte: new Date(now.getTime() + withinHours * 3600_000) } } });
    return Promise.all(exams.map(async (e) => ({
      examId: e.id, exam: e.name, opens: e.entryOpensAt, closes: e.entryClosesAt,
      bring: (e.instructions as ExamInfo['instructions']).llevar, people: await this.assignedPeople(e),
    })));
  }

  /** M09: lo que necesita la calificación de un examen (estructura, puntajes y asistencia). */
  async gradingContext(id: string) {
    const e = await this.requireExam(id);
    const rows = await this.d.db.examAssignment.findMany({ where: { examId: id }, select: { applicantCode: true, attendance: true } });
    return {
      id: e.id, code: e.code, name: e.name, callCode: e.callCode, modalities: e.modalities, closedAt: e.attendanceClosedAt,
      structure: e.structure as { conocimientos: number; aptitudVocacional: number; actitudPersonal: number },
      scoring: e.scoring as { puntosConocimientos: number; puntosTest: number; factorArea: number | Record<string, number>; puntajeMinimo: number },
      attendance: new Map(rows.map((r) => [r.applicantCode, r.attendance])),
    };
  }

  /** Cursos del temario de la convocatoria vigente, para repartir las preguntas de conocimientos. */
  async syllabusCourses() {
    const call = await this.d.convocatorias.getCurrentCall();
    const tree = await this.d.convocatorias.getSyllabus(call.code);
    const out: { area: string; name: string }[] = [];
    for (const area of tree) for (const c of area.children) if (c.level === 'COURSE' && !out.some((o) => o.name === c.title)) out.push({ area: area.title, name: c.title });
    return out;
  }

  async examList() {
    const call = await this.d.convocatorias.getCurrentCall();
    return (await this.d.db.exam.findMany({ where: { callCode: call.code }, orderBy: { entryOpensAt: 'asc' } })).map((e) => ({ id: e.id, code: e.code, name: e.name, modalities: e.modalities, status: e.status, date: e.entryOpensAt }));
  }

  private async assignedPeople(e: ExamRow) {
    const codes = new Set((await this.d.db.examAssignment.findMany({ where: { examId: e.id }, select: { applicantCode: true } })).map((a) => a.applicantCode));
    return (await this.d.inscriptions.eligibleFor(e.callCode, e.modalities)).filter((p) => codes.has(p.applicantCode));
  }
}
