import type { RequestMeta } from '../../../shared/audit/audit.js';
import { businessRule, notFound, validationError } from '../../../shared/http/errors.js';
import { roomOrder } from '../domain/distribution.js';
import { INCIDENT_TYPES, codeFromScan, type IncidentType } from '../domain/exam-rules.js';
import { attendancePdf } from './exam-pdf.js';
import { roomInfo, type ExamService } from './exam-service.js';

const iso = (d: Date | null | undefined) => (d ? d.toISOString() : null);

/**
 * Día del examen (spec 006, Historia 5; RF-08.07, RF-08.08): listas por aula, ingreso por QR o código
 * con la foto para comparar, ausentes al cerrar e incidencias con aviso a la Comisión.
 */
export class AttendanceService {
  constructor(
    private readonly exams: ExamService,
    private readonly commission: () => Promise<string[]>,
  ) {}

  private get d() {
    return this.exams.d;
  }

  /** Exámenes y aulas para el responsable de aula. */
  async board() {
    const call = await this.d.convocatorias.getCurrentCall();
    const exams = await this.d.db.exam.findMany({
      where: { callCode: call.code, status: { in: ['CONFIRMADO', 'FINALIZADO', 'DISTRIBUIDO'] } }, orderBy: { entryOpensAt: 'asc' },
      include: { rooms: { include: { room: true } }, assignments: { select: { roomId: true, attendance: true } } },
    });
    return exams.map((e) => ({
      id: e.id, name: e.name, status: e.status, entryOpensAt: iso(e.entryOpensAt), entryClosesAt: iso(e.entryClosesAt), closed: Boolean(e.attendanceClosedAt),
      rooms: e.rooms.map((r) => r.room).sort(roomOrder).map((r) => {
        const seats = e.assignments.filter((a) => a.roomId === r.id);
        return {
          id: r.id, code: r.code, building: r.building, floor: r.floor, gate: r.gate, capacity: r.capacity,
          assigned: seats.length, present: seats.filter((a) => a.attendance === 'PRESENTE').length, absent: seats.filter((a) => a.attendance === 'AUSENTE').length,
        };
      }).filter((r) => r.assigned > 0),
    }));
  }

  /** H5, escenario 2: registra el ingreso con el QR de la ficha de examen (o el código escrito) y devuelve la foto. */
  /**
   * Registro del ingreso. `scannedAt` llega solo con las lecturas hechas sin conexión (RF-08.08): se usa
   * esa hora para «fuera de hora», siempre que esté en el día del examen y no sea futura.
   */
  async checkIn(examId: string, scan: string, actorId: string, meta: RequestMeta, scannedAt?: string) {
    const e = await this.exams.requireExam(examId);
    if (e.attendanceClosedAt) throw businessRule('ATTENDANCE_CLOSED', 'La asistencia de este examen ya se cerró.');
    const code = codeFromScan(scan);
    if (!code) throw validationError('Escanea el QR de la ficha de examen o escribe el código de 8 dígitos.', [{ field: 'scan', issue: 'formato' }]);
    // Un QR con firma debe ser auténtico; el código escrito a mano se acepta (el responsable compara la foto).
    const token = /(\d{8}\.[\w-]+)$/.exec(scan.trim())?.[1];
    if (token && !this.exams.checkToken(token)) throw businessRule('QR_INVALID', 'El QR no corresponde a una ficha de examen emitida por la UNSCH.');
    const a = await this.d.db.examAssignment.findUnique({ where: { examId_applicantCode: { examId, applicantCode: code } }, include: { room: { include: { venue: true } } } });
    if (!a) throw notFound(`El código ${code} no figura en la relación de este examen: no puede ingresar.`);
    const person = await this.d.inscriptions.examContext(code);
    if (!person || person.status !== 'APTA') throw businessRule('NOT_ELIGIBLE', `El postulante ${code} ya no está apto (${person?.statusLabel ?? 'sin inscripción'}): no puede ingresar.`);
    const photo = await this.d.storage.get(person.photoKey);
    const already = a.attendance === 'PRESENTE';
    const serverNow = this.d.clock.now();
    let now = serverNow;
    if (scannedAt) {
      const at = new Date(scannedAt);
      if (at.getTime() > serverNow.getTime() + 60_000 || at.getTime() < e.entryOpensAt.getTime() - 3 * 3600_000) {
        throw validationError('La hora de la lectura sin conexión no corresponde al día del examen.', [{ field: 'scannedAt', issue: 'fuera de rango' }]);
      }
      now = at;
    }
    // H5, escenario 3: después del cierre del ingreso queda marcado fuera de hora (RN-36).
    const late = already ? a.late : now > e.entryClosesAt;
    if (!already) {
      await this.d.db.$transaction(async (tx) => {
        await tx.examAssignment.update({ where: { id: a.id }, data: { attendance: 'PRESENTE', checkedInAt: now, late, checkedBy: actorId } });
        await this.d.audit.record({ actorUserId: actorId, action: 'exam.check_in', resourceType: 'exam_assignment', resourceId: code, after: { examId, roomId: a.roomId, late, ...(scannedAt ? { offline: true, syncedAt: serverNow.toISOString() } : {}) }, ...meta }, tx);
      });
    }
    return {
      applicantCode: code, fullName: person.fullName, document: person.document, program: person.program,
      photo: photo ? `data:image/jpeg;base64,${photo.toString('base64')}` : null,
      room: { ...roomInfo(a.room), id: a.roomId, seat: a.seat }, late, already, checkedInAt: iso(already ? a.checkedInAt : now),
    };
  }

  /** Corrección manual de la asistencia de un postulante. */
  async setAttendance(examId: string, applicantCode: string, status: 'PRESENTE' | 'AUSENTE' | 'PENDIENTE', actorId: string, meta: RequestMeta) {
    const e = await this.exams.requireExam(examId);
    if (e.attendanceClosedAt) throw businessRule('ATTENDANCE_CLOSED', 'La asistencia de este examen ya se cerró.');
    const a = await this.d.db.examAssignment.findUnique({ where: { examId_applicantCode: { examId, applicantCode } } });
    if (!a) throw notFound('El postulante no figura en este examen.');
    const now = this.d.clock.now();
    await this.d.db.$transaction(async (tx) => {
      await tx.examAssignment.update({
        where: { id: a.id },
        data: { attendance: status, checkedInAt: status === 'PRESENTE' ? (a.checkedInAt ?? now) : null, late: status === 'PRESENTE' ? (a.checkedInAt ? a.late : now > e.entryClosesAt) : false, checkedBy: actorId },
      });
      await this.d.audit.record({ actorUserId: actorId, action: 'exam.attendance_set', resourceType: 'exam_assignment', resourceId: applicantCode, before: { attendance: a.attendance }, after: { attendance: status }, ...meta }, tx);
    });
    return this.roomList(examId, a.roomId);
  }

  /** Cierra la asistencia: quienes no registraron ingreso quedan Ausentes (RF-08.08). */
  async close(examId: string, actorId: string, meta: RequestMeta) {
    const e = await this.exams.requireExam(examId);
    if (e.attendanceClosedAt) throw businessRule('ATTENDANCE_CLOSED', 'La asistencia ya estaba cerrada.');
    if (this.d.clock.now() < e.entryClosesAt) throw businessRule('ENTRY_STILL_OPEN', 'Espera a que cierre el ingreso al local.');
    const absent = await this.d.db.$transaction(async (tx) => {
      const r = await tx.examAssignment.updateMany({ where: { examId, attendance: 'PENDIENTE' }, data: { attendance: 'AUSENTE' } });
      await tx.exam.update({ where: { id: examId }, data: { attendanceClosedAt: this.d.clock.now(), status: 'FINALIZADO' } });
      await this.d.audit.record({ actorUserId: actorId, action: 'exam.attendance_closed', resourceType: 'exam', resourceId: examId, after: { absent: r.count }, ...meta }, tx);
      return r.count;
    });
    return { absent };
  }

  /** Lista de un aula con el estado de asistencia (pantalla del responsable). */
  async roomList(examId: string, roomId: string) {
    const rows = await this.exams.assignments(examId, { roomId });
    return rows.map(({ roomId: _r, room: _c, building: _b, program: _p, ...r }) => r);
  }

  /** H5, escenario 1: lista PDF por aula con foto (RF-08.07). */
  async roomPdf(examId: string, roomId: string) {
    const e = await this.exams.requireExam(examId);
    const room = await this.d.db.room.findUnique({ where: { id: roomId }, include: { venue: true } });
    if (!room) throw notFound('Aula no encontrada.');
    const [call, rows, people] = await Promise.all([
      this.d.convocatorias.getCurrentCall(),
      this.d.db.examAssignment.findMany({ where: { examId, roomId }, orderBy: { seat: 'asc' } }),
      this.d.inscriptions.eligibleFor(e.callCode, e.modalities),
    ]);
    const who = new Map(people.map((p) => [p.applicantCode, p]));
    const withPhotos = await Promise.all(rows.map(async (a) => {
      const p = who.get(a.applicantCode);
      return {
        seat: a.seat, applicantCode: a.applicantCode, fullName: p?.fullName ?? '(ya no es apto)', document: p?.document ?? '',
        photo: p ? await this.d.storage.get(p.photoKey) : null, attendance: a.attendance,
      };
    }));
    return attendancePdf({ exam: this.exams.examInfo(e, call.name), room: roomInfo(room), capacity: room.capacity, issuedAt: this.d.clock.now(), rows: withPhotos });
  }

  /** H5, escenario 4: incidencia con tipo, descripción, hora, aula y responsable; aviso a la Comisión (RN-60). */
  async incident(examId: string, input: { roomId?: string | undefined; applicantCode?: string | undefined; type: IncidentType; description: string }, actorId: string, meta: RequestMeta) {
    const e = await this.exams.requireExam(examId);
    const room = input.roomId ? await this.d.db.room.findUnique({ where: { id: input.roomId } }) : null;
    if (input.roomId && !room) throw notFound('Aula no encontrada.');
    if (input.applicantCode && !(await this.d.db.examAssignment.findUnique({ where: { examId_applicantCode: { examId, applicantCode: input.applicantCode } } }))) {
      throw validationError('Ese código no figura en este examen.', [{ field: 'applicantCode', issue: 'no asignado' }]);
    }
    const to = await this.commission();
    const now = this.d.clock.now();
    await this.d.db.$transaction(async (tx) => {
      const i = await tx.examIncident.create({ data: { examId, roomId: input.roomId ?? null, applicantCode: input.applicantCode ?? null, type: input.type, description: input.description.trim(), reportedBy: actorId, at: now } });
      await this.d.audit.record({ actorUserId: actorId, action: 'exam.incident', resourceType: 'exam_incident', resourceId: i.id, after: { type: input.type, roomId: input.roomId ?? null, applicantCode: input.applicantCode ?? null }, ...meta }, tx);
      if (to.length) {
        await this.d.outbox.publish(tx, 'IncidenciaRegistrada', {
          to, exam: e.name, room: room ? `${room.building} · aula ${room.code}` : 'Sin aula', type: INCIDENT_TYPES[input.type], description: input.description.trim(),
          applicantCode: input.applicantCode ?? null, at: now.toISOString(),
        }, meta.requestId);
      }
    });
    return this.incidents(examId);
  }

  async incidents(examId: string) {
    const rows = await this.d.db.examIncident.findMany({ where: { examId }, orderBy: { at: 'desc' } });
    const rooms = new Map((await this.d.db.room.findMany({ where: { id: { in: rows.map((r) => r.roomId).filter((x): x is string => Boolean(x)) } } })).map((r) => [r.id, r.code]));
    return rows.map((r) => ({
      id: r.id, type: r.type, typeLabel: INCIDENT_TYPES[r.type as IncidentType] ?? r.type, description: r.description,
      room: r.roomId ? (rooms.get(r.roomId) ?? '-') : null, applicantCode: r.applicantCode, at: iso(r.at),
    }));
  }
}
