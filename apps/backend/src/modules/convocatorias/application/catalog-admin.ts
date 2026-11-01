import type { AuditLog, RequestMeta } from '../../../shared/audit/audit.js';
import type { Db } from '../../../shared/db/prisma.js';
import { conflict, notFound, validationError } from '../../../shared/http/errors.js';

const FORMATS = ['PDF', 'JPG', 'PNG'] as const;

/**
 * Catálogo del concurso editable en el panel (spec 008): modalidades, submodalidades y tipos (RF-01.02),
 * facultades, áreas y programas (RF-01.04), requisitos por submodalidad (RF-06.01, RF-14.03) y
 * criterios de evaluación (RF-04.11). Cada cambio queda auditado con el antes y el después.
 */
export class CatalogAdmin {
  constructor(private readonly d: { db: Db; audit: AuditLog }) {}

  async catalog(callCode: string) {
    const call = await this.call(callCode);
    const [modalities, faculties, areas, programs, requirements] = await Promise.all([
      this.d.db.modality.findMany({
        orderBy: { code: 'asc' },
        include: {
          submodalities: { orderBy: { sortOrder: 'asc' }, include: { requirements: { where: { requirement: { callId: call.id } }, orderBy: { sortOrder: 'asc' } } } },
          quotaCategories: { orderBy: { sortOrder: 'asc' } },
        },
      }),
      this.d.db.faculty.findMany({ orderBy: { name: 'asc' }, include: { _count: { select: { programs: true } } } }),
      this.d.db.academicArea.findMany({ orderBy: { code: 'asc' }, include: { _count: { select: { programs: true } } } }),
      this.d.db.program.findMany({ orderBy: { scheduleNumber: 'asc' }, include: { faculty: true, area: true, options: { orderBy: { sortOrder: 'asc' } } } }),
      this.d.db.requirementDocument.findMany({ where: { callId: call.id }, orderBy: [{ isBase: 'desc' }, { code: 'asc' }] }),
    ]);
    return {
      callCode: call.code,
      modalities: modalities.map((m) => ({
        code: m.code, name: m.name,
        categories: m.quotaCategories.map((c) => ({ code: c.code, name: c.name, submodality: m.submodalities.find((s) => s.id === c.submodalityId)?.code ?? null })),
        submodalities: m.submodalities.map((s) => ({
          code: s.code, name: s.name, legalBasis: s.legalBasis, usesBaseDocuments: s.usesBaseDocuments, evaluationCriteria: s.evaluationCriteria,
          requirements: s.requirements.map((r) => ({ requirementId: r.requirementId, mandatory: r.mandatory })),
        })),
      })),
      faculties: faculties.map((f) => ({ id: f.id, name: f.name, programs: f._count.programs })),
      areas: areas.map((a) => ({ id: a.id, code: a.code, name: a.name, programs: a._count.programs })),
      programs: programs.map((p) => ({
        id: p.id, name: p.name, scheduleNumber: p.scheduleNumber, facultyId: p.facultyId, faculty: p.faculty.name, areaId: p.areaId, area: p.area.code,
        options: p.options.map((o) => ({ code: o.internalCode, displayName: o.displayName, durationYears: o.durationYears, degree: o.degree, professionalTitle: o.professionalTitle })),
      })),
      requirements: requirements.map((r) => ({ id: r.id, code: r.code, name: r.name, description: r.description, article: r.article, acceptedFormats: r.acceptedFormats, isBase: r.isBase })),
    };
  }

  async updateModality(code: string, input: { name: string }, actor: string, meta: RequestMeta) {
    const before = await this.d.db.modality.findUnique({ where: { code } });
    if (!before) throw notFound('No existe esa modalidad.');
    await this.d.db.$transaction(async (tx) => {
      await tx.modality.update({ where: { code }, data: { name: input.name } });
      await this.d.audit.record({ actorUserId: actor, action: 'catalog.modality.updated', resourceType: 'modality', resourceId: code, before: { name: before.name }, after: input, ...meta }, tx);
    });
  }

  async updateSubmodality(code: string, input: { name: string; legalBasis: string; usesBaseDocuments: boolean; evaluationCriteria: string | null }, actor: string, meta: RequestMeta) {
    const before = await this.d.db.submodality.findUnique({ where: { code } });
    if (!before) throw notFound('No existe esa submodalidad.');
    await this.d.db.$transaction(async (tx) => {
      await tx.submodality.update({ where: { code }, data: input });
      await this.d.audit.record({
        actorUserId: actor, action: 'catalog.submodality.updated', resourceType: 'submodality', resourceId: code,
        before: { name: before.name, legalBasis: before.legalBasis, usesBaseDocuments: before.usesBaseDocuments, evaluationCriteria: before.evaluationCriteria }, after: input, ...meta,
      }, tx);
    });
  }

  async updateCategory(code: string, input: { name: string }, actor: string, meta: RequestMeta) {
    const before = await this.d.db.quotaCategory.findUnique({ where: { code } });
    if (!before) throw notFound('No existe ese tipo de vacante.');
    await this.d.db.$transaction(async (tx) => {
      await tx.quotaCategory.update({ where: { code }, data: { name: input.name } });
      await this.d.audit.record({ actorUserId: actor, action: 'catalog.category.updated', resourceType: 'quota_category', resourceId: code, before: { name: before.name }, after: input, ...meta }, tx);
    });
  }

  async saveFaculty(input: { id?: string | undefined; name: string }, actor: string, meta: RequestMeta) {
    const clash = await this.d.db.faculty.findUnique({ where: { name: input.name } });
    if (clash && clash.id !== input.id) throw conflict('DUPLICATED', 'Ya existe una facultad con ese nombre.');
    return this.d.db.$transaction(async (tx) => {
      const before = input.id ? await tx.faculty.findUnique({ where: { id: input.id } }) : null;
      if (input.id && !before) throw notFound('No existe esa facultad.');
      const row = input.id ? await tx.faculty.update({ where: { id: input.id }, data: { name: input.name } }) : await tx.faculty.create({ data: { name: input.name } });
      await this.d.audit.record({ actorUserId: actor, action: input.id ? 'catalog.faculty.updated' : 'catalog.faculty.created', resourceType: 'faculty', resourceId: row.id, before: before ? { name: before.name } : null, after: { name: row.name }, ...meta }, tx);
      return { id: row.id };
    });
  }

  async updateArea(code: string, input: { name: string }, actor: string, meta: RequestMeta) {
    const before = await this.d.db.academicArea.findUnique({ where: { code } });
    if (!before) throw notFound('No existe esa área.');
    await this.d.db.$transaction(async (tx) => {
      await tx.academicArea.update({ where: { code }, data: { name: input.name } });
      await this.d.audit.record({ actorUserId: actor, action: 'catalog.area.updated', resourceType: 'academic_area', resourceId: code, before: { name: before.name }, after: input, ...meta }, tx);
    });
  }

  /** Programa de estudio: nombre, facultad, área y número del cronograma. Las opciones de postulación siguen el programa. */
  async saveProgram(input: { id?: string | undefined; name: string; facultyId: string; areaId: string; scheduleNumber: number }, actor: string, meta: RequestMeta) {
    const clash = await this.d.db.program.findUnique({ where: { name: input.name } });
    if (clash && clash.id !== input.id) throw conflict('DUPLICATED', 'Ya existe un programa con ese nombre.');
    const [faculty, area] = await Promise.all([
      this.d.db.faculty.findUnique({ where: { id: input.facultyId } }),
      this.d.db.academicArea.findUnique({ where: { id: input.areaId } }),
    ]);
    if (!faculty || !area) throw validationError('Elige una facultad y un área existentes.', [{ field: faculty ? 'areaId' : 'facultyId', issue: 'no existe' }]);
    const data = { name: input.name, facultyId: input.facultyId, areaId: input.areaId, scheduleNumber: input.scheduleNumber };
    return this.d.db.$transaction(async (tx) => {
      const before = input.id ? await tx.program.findUnique({ where: { id: input.id } }) : null;
      if (input.id && !before) throw notFound('No existe ese programa.');
      const row = input.id ? await tx.program.update({ where: { id: input.id }, data }) : await tx.program.create({ data });
      await this.d.audit.record({
        actorUserId: actor, action: input.id ? 'catalog.program.updated' : 'catalog.program.created', resourceType: 'program', resourceId: row.id,
        before: before ? { name: before.name, facultyId: before.facultyId, areaId: before.areaId, scheduleNumber: before.scheduleNumber } : null, after: data, ...meta,
      }, tx);
      return { id: row.id };
    });
  }

  /** RF-14.03: documento exigido en la convocatoria (nuevo o editado). */
  async saveRequirement(
    callCode: string,
    input: { id?: string | undefined; code: string; name: string; description: string; article: string; acceptedFormats: string[]; isBase: boolean },
    actor: string, meta: RequestMeta,
  ) {
    const call = await this.call(callCode);
    if (input.acceptedFormats.some((f) => !FORMATS.includes(f as (typeof FORMATS)[number]))) throw validationError('Formato no admitido.', [{ field: 'acceptedFormats', issue: 'PDF, JPG o PNG' }]);
    const clash = await this.d.db.requirementDocument.findUnique({ where: { callId_code: { callId: call.id, code: input.code } } });
    if (clash && clash.id !== input.id) throw conflict('DUPLICATED', 'Ya existe un requisito con ese código en la convocatoria.');
    const { id, ...data } = input;
    return this.d.db.$transaction(async (tx) => {
      const before = id ? await tx.requirementDocument.findFirst({ where: { id, callId: call.id } }) : null;
      if (id && !before) throw notFound('No existe ese requisito.');
      const row = id ? await tx.requirementDocument.update({ where: { id }, data }) : await tx.requirementDocument.create({ data: { ...data, callId: call.id } });
      await this.d.audit.record({
        actorUserId: actor, action: id ? 'catalog.requirement.updated' : 'catalog.requirement.created', resourceType: 'requirement', resourceId: `${call.code}:${row.code}`,
        before: before ? { name: before.name, description: before.description, article: before.article, acceptedFormats: before.acceptedFormats, isBase: before.isBase } : null, after: data, ...meta,
      }, tx);
      return { id: row.id };
    });
  }

  /** RF-06.01: qué documentos pide cada submodalidad (en orden) y cuáles son obligatorios. */
  async setSubmodalityRequirements(callCode: string, subCode: string, items: { requirementId: string; mandatory: boolean }[], actor: string, meta: RequestMeta) {
    const call = await this.call(callCode);
    const sub = await this.d.db.submodality.findUnique({ where: { code: subCode }, include: { requirements: { where: { requirement: { callId: call.id } } } } });
    if (!sub) throw notFound('No existe esa submodalidad.');
    const ids = [...new Set(items.map((i) => i.requirementId))];
    const valid = await this.d.db.requirementDocument.count({ where: { callId: call.id, id: { in: ids } } });
    if (valid !== ids.length || ids.length !== items.length) throw validationError('Hay requisitos repetidos o de otra convocatoria.', [{ field: 'items', issue: 'inválido' }]);
    await this.d.db.$transaction(async (tx) => {
      await tx.submodalityRequirement.deleteMany({ where: { submodalityId: sub.id, requirement: { callId: call.id } } });
      await tx.submodalityRequirement.createMany({ data: items.map((i, n) => ({ submodalityId: sub.id, requirementId: i.requirementId, mandatory: i.mandatory, sortOrder: n + 1 })) });
      await this.d.audit.record({
        actorUserId: actor, action: 'catalog.submodality.requirements', resourceType: 'submodality', resourceId: `${call.code}:${subCode}`,
        before: { items: sub.requirements.map((r) => ({ requirementId: r.requirementId, mandatory: r.mandatory })) }, after: { items }, ...meta,
      }, tx);
    });
  }

  private async call(code: string) {
    const call = await this.d.db.admissionCall.findUnique({ where: { code } });
    if (!call) throw notFound('No existe esa convocatoria.');
    return call;
  }
}
