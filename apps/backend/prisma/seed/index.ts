/**
 * Semilla idempotente: catálogo académico, convocatoria 2027-I, contenido e identidad.
 * Verifica los totales del cuadro oficial de vacantes antes de confirmar (SC-003).
 */
import 'dotenv/config';
import { createHash } from 'node:crypto';
import { statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createPrismaClient } from '../../src/shared/db/prisma.js';
import { normalizeForSearch } from '../../src/shared/text/normalize.js';
import * as catalog from './catalog.js';
import * as c27 from './call-2027-I.js';
import * as content from './content.js';
import * as identity from './identity.js';
import { knowledgeEntries } from './knowledge.js';
import * as examSeed from './exams.js';
import { DEFAULT_INSTRUCTIONS, DEFAULT_SCORING, DEFAULT_STRUCTURE } from '../../src/modules/examenes/domain/exam-rules.js';
import { writeFileSync } from 'node:fs';
import { PERMISSIONS, STAFF_ROLES } from '../../src/modules/seguridad/index.js';
import { temporaryPassword } from '../../src/modules/usuarios/index.js';
import { Argon2Hasher } from '../../src/modules/usuarios/infrastructure/argon2-hasher.js';

const caPath = process.env['DB_SSL_CA'] ? path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..', process.env['DB_SSL_CA']) : undefined;
const prisma = createPrismaClient(process.env['DATABASE_URL'] ?? 'postgresql://sia:sia_local_dev@127.0.0.1:5433/sia', 2, caPath);
const publicDocsDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../frontend/public/docs');

function verifyVacancyMatrix(): void {
  const columns = new Array<number>(16).fill(0);
  for (const [code, row] of Object.entries(c27.vacancyMatrix)) {
    if (row.length !== 16) throw new Error(`Fila ${code}: se esperaban 16 columnas`);
    row.forEach((q, i) => (columns[i]! += q));
  }
  const total = columns.reduce((a, b) => a + b, 0);
  const mismatch = columns.findIndex((v, i) => v !== c27.officialTotals.byColumn[i]);
  if (mismatch >= 0 || total !== c27.officialTotals.total) {
    throw new Error(`El cuadro de vacantes no coincide con el oficial (columna ${mismatch}, total ${total})`);
  }
}

async function seedCatalog() {
  for (const a of catalog.areas) {
    await prisma.academicArea.upsert({ where: { code: a.code }, update: { name: a.name }, create: a });
  }
  for (const name of Object.values(catalog.faculties)) {
    await prisma.faculty.upsert({ where: { name }, update: {}, create: { name } });
  }
  const areaId = Object.fromEntries((await prisma.academicArea.findMany()).map((a) => [a.code, a.id]));
  const facultyId = Object.fromEntries((await prisma.faculty.findMany()).map((f) => [f.name, f.id]));

  for (const p of catalog.programs) {
    const data = { facultyId: facultyId[catalog.faculties[p.faculty]]!, areaId: areaId[p.area]!, scheduleNumber: p.scheduleNumber };
    await prisma.program.upsert({ where: { name: p.name }, update: data, create: { name: p.name, ...data } });
  }
  const programId = Object.fromEntries((await prisma.program.findMany()).map((p) => [p.name, p.id]));

  for (const [i, o] of catalog.options.entries()) {
    const displayName = o.specialty ? `${o.program}: ${o.specialty}` : o.program;
    const data = {
      programId: programId[o.program]!,
      specialty: o.specialty,
      officialVacancyCode: o.vac,
      displayName,
      searchText: normalizeForSearch(`${displayName} ${o.title}`),
      durationYears: o.years,
      degree: o.degree,
      professionalTitle: o.title,
      profilePage: o.page,
      sortOrder: i + 1,
    };
    await prisma.applicationOption.upsert({ where: { internalCode: o.code }, update: data, create: { internalCode: o.code, ...data } });
  }

  for (const m of catalog.modalities) {
    await prisma.modality.upsert({ where: { code: m.code }, update: { name: m.name }, create: m });
  }
  const modalityId = Object.fromEntries((await prisma.modality.findMany()).map((m) => [m.code, m.id]));
  for (const [i, s] of catalog.submodalities.entries()) {
    const data = { modalityId: modalityId[s.modality]!, name: s.name, legalBasis: s.legal, usesBaseDocuments: s.base, sortOrder: i + 1 };
    await prisma.submodality.upsert({ where: { code: s.code }, update: data, create: { code: s.code, ...data } });
  }
  const submodalityId = Object.fromEntries((await prisma.submodality.findMany()).map((s) => [s.code, s.id]));
  for (const [i, q] of catalog.quotaCategories.entries()) {
    const data = { name: q.name, modalityId: modalityId[q.modality]!, submodalityId: submodalityId[q.sub] ?? null, variant: q.variant, sortOrder: i + 1 };
    await prisma.quotaCategory.upsert({ where: { code: q.code }, update: data, create: { code: q.code, ...data } });
  }
}

async function seedCall() {
  verifyVacancyMatrix();
  await prisma.admissionCall.deleteMany({ where: { code: c27.call.code } });
  const call = await prisma.admissionCall.create({
    data: { ...c27.call, status: 'PUBLISHED', publishedAt: new Date(c27.call.publishedAt) },
  });

  await prisma.scheduleStage.createMany({
    data: c27.stages.map((s, i) => ({
      callId: call.id, code: s.code, name: s.name, scope: s.scope, kind: s.kind,
      startsAt: new Date(s.startsAt), endsAt: new Date(s.endsAt), highlight: s.highlight ?? false, sortOrder: i + 1,
    })),
  });

  const optionId = Object.fromEntries((await prisma.applicationOption.findMany()).map((o) => [o.internalCode, o.id]));
  const categories = await prisma.quotaCategory.findMany({ orderBy: { sortOrder: 'asc' } });
  await prisma.vacancy.createMany({
    data: Object.entries(c27.vacancyMatrix).flatMap(([code, row]) =>
      row.map((quantity, i) => ({ callId: call.id, optionId: optionId[code]!, quotaCategoryId: categories[i]!.id, quantity })),
    ),
  });

  await prisma.fee.createMany({
    data: c27.fees.map((f, i) => ({ callId: call.id, code: f.code, concept: f.concept, amount: f.amount, kind: f.kind, legalNote: f.legal, sortOrder: i + 1 })),
  });
  const feeId = Object.fromEntries((await prisma.fee.findMany({ where: { callId: call.id } })).map((f) => [f.code, f.id]));
  await prisma.feeRule.createMany({
    data: c27.feeRules.map((r) => ({
      callId: call.id, feeId: feeId[r.fee]!, modalityCode: r.modality, submodalityCode: r.sub ?? null,
      schoolType: r.school ?? null, militaryCondition: r.military ?? null, familyLink: r.family ?? null, priority: r.priority,
    })),
  });
  await prisma.surchargeRule.createMany({
    data: c27.surchargeRules.map((r) => ({ callId: call.id, feeId: feeId[r.fee]!, appliesToScope: r.scope, stageKind: 'EXTEMPORANEOUS' as const, priority: r.priority })),
  });

  await prisma.requirementDocument.createMany({
    data: c27.requirements.map((r) => ({
      callId: call.id, code: r.code, name: r.name, description: r.description, article: r.article,
      acceptedFormats: r.formats ?? ['PDF', 'JPG', 'PNG'], isBase: r.base ?? false,
    })),
  });
  const requirementId = Object.fromEntries((await prisma.requirementDocument.findMany({ where: { callId: call.id } })).map((r) => [r.code, r.id]));
  const submodalityId = Object.fromEntries((await prisma.submodality.findMany()).map((s) => [s.code, s.id]));
  await prisma.submodalityRequirement.deleteMany({ where: { requirement: { callId: call.id } } });
  await prisma.submodalityRequirement.createMany({
    data: Object.entries(c27.submodalityRequirements).flatMap(([sub, list]) =>
      list.map((r, i) => ({ submodalityId: submodalityId[sub]!, requirementId: requirementId[r.code]!, mandatory: r.mandatory ?? true, sortOrder: i + 1 })),
    ),
  });

  for (const [ai, area] of c27.syllabus.entries()) {
    const areaNode = await prisma.syllabusNode.create({
      data: { callId: call.id, level: 'AREA', title: area.area, searchText: normalizeForSearch(area.area), sortOrder: ai + 1 },
    });
    await prisma.syllabusNode.createMany({
      data: area.courses.map((course, ci) => ({
        callId: call.id, parentId: areaNode.id, level: 'COURSE' as const, title: course, searchText: normalizeForSearch(course), sortOrder: ci + 1,
      })),
    });
  }

  await prisma.officialDocument.createMany({
    data: c27.officialDocuments.map((d) => ({
      callId: call.id, type: d.type, title: d.title, publicUrl: `/docs/${d.file}`,
      publishedAt: new Date(c27.call.publishedAt), sizeBytes: statSync(path.join(publicDocsDir, d.file)).size,
    })),
  });
  return call;
}

async function seedContent() {
  for (const b of content.contentBlocks) {
    await prisma.contentBlock.upsert({ where: { key: b.key }, update: { bodyMd: b.bodyMd }, create: b });
  }
  await prisma.heroSlide.deleteMany();
  await prisma.heroSlide.createMany({ data: content.heroSlides });
  await prisma.authorityMessage.deleteMany();
  await prisma.authorityMessage.createMany({ data: content.authorityMessages });
  for (const f of content.featureFlags) {
    await prisma.featureFlag.upsert({ where: { key: f.key }, update: f, create: f });
  }
  await prisma.announcement.deleteMany({ where: { callCode: '2027-I' } });
  await prisma.announcement.createMany({ data: content.announcements.map((a) => ({ ...a, publishedAt: new Date(a.publishedAt) })) });
}

/** M07/M08: sede, aulas y exámenes; no sobrescribe lo que Admisión ya ajustó en el panel. */
async function seedExams(callCode: string) {
  const v = await prisma.venue.upsert({ where: { code: examSeed.venue.code }, update: {}, create: examSeed.venue });
  for (const r of examSeed.rooms) {
    await prisma.room.upsert({ where: { venueId_code: { venueId: v.id, code: r.code } }, update: {}, create: { ...r, venueId: v.id } });
  }
  const all = await prisma.room.findMany({ where: { venueId: v.id }, select: { id: true } });
  for (const e of examSeed.exams) {
    if (await prisma.exam.findUnique({ where: { callCode_code: { callCode, code: e.code } } })) continue;
    const opens = new Date(e.entryOpensAt);
    const created = await prisma.exam.create({
      data: {
        ...e, callCode, entryOpensAt: opens, entryClosesAt: new Date(e.entryClosesAt), place: examSeed.venue.name,
        publishAt: new Date(opens.getTime() - 24 * 3600_000), structure: DEFAULT_STRUCTURE, scoring: DEFAULT_SCORING, instructions: DEFAULT_INSTRUCTIONS,
      },
    });
    await prisma.examRoom.createMany({ data: all.map((r) => ({ examId: created.id, roomId: r.id })) });
  }
}

async function seedIdentity() {
  const doc = identity.consentDocument;
  const textHash = createHash('sha256').update(doc.textMd).digest('hex');
  await prisma.consentDocument.upsert({
    where: { version: doc.version },
    update: { textMd: doc.textMd, textHash },
    create: { version: doc.version, textMd: doc.textMd, textHash, publishedAt: new Date(doc.publishedAt) },
  });
  for (const code of identity.permissions) {
    await prisma.permission.upsert({ where: { code }, update: {}, create: { code } });
  }
  for (const r of identity.roles) {
    const role = await prisma.role.upsert({ where: { code: r.code }, update: { name: r.name }, create: { code: r.code, name: r.name } });
    for (const code of r.permissions) {
      const permission = await prisma.permission.findUniqueOrThrow({ where: { code } });
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: role.id, permissionId: permission.id } },
        update: {},
        create: { roleId: role.id, permissionId: permission.id },
      });
    }
  }
  await prisma.disqualifiedPerson.deleteMany({ where: { resolution: { startsWith: 'PRUEBA-' } } });
  await prisma.disqualifiedPerson.createMany({
    data: identity.disqualifiedPersons.map((d) => ({
      ...d, validFrom: new Date(d.validFrom), validUntil: d.validUntil ? new Date(d.validUntil) : null,
    })),
  });
}

/**
 * Roles y permisos del personal (ADR-018) y primer administrador. La contraseña temporal se escribe
 * en apps/backend/.admin-inicial.txt (ignorado por git) y nunca se imprime ni se guarda en claro.
 */
async function seedStaff() {
  for (const code of Object.keys(PERMISSIONS)) {
    await prisma.permission.upsert({ where: { code }, update: {}, create: { code } });
  }
  for (const r of STAFF_ROLES) {
    const role = await prisma.role.upsert({ where: { code: r.code }, update: { name: r.name }, create: { code: r.code, name: r.name } });
    await prisma.rolePermission.deleteMany({ where: { roleId: role.id } });
    const perms = await prisma.permission.findMany({ where: { code: { in: r.permissions } } });
    await prisma.rolePermission.createMany({ data: perms.map((p) => ({ roleId: role.id, permissionId: p.id })) });
  }
  const email = process.env['ADMIN_EMAIL'] ?? 'admin@sia-unsch.local';
  if (await prisma.user.findUnique({ where: { email } })) return;
  const password = temporaryPassword();
  const user = await prisma.user.create({ data: { email, passwordHash: await new Argon2Hasher().hash(password), type: 'STAFF', status: 'ACTIVE' } });
  await prisma.staffProfile.create({ data: { userId: user.id, fullName: 'Administrador general' } });
  const admin = await prisma.role.findUniqueOrThrow({ where: { code: 'ADMIN' } });
  await prisma.userRole.create({ data: { userId: user.id, roleId: admin.id } });
  const file = process.env['ADMIN_INITIAL_FILE'] ?? path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..', '.admin-inicial.txt');
  writeFileSync(file, `Panel de Admisión UNSCH - primer ingreso\nCorreo: ${email}\nContraseña temporal: ${password}\nAl entrar se pide cambiarla y activar el segundo factor. Borra este archivo después.\n`, { mode: 0o600 });
  console.log(`Primer administrador creado (${email}); su contraseña temporal está en apps/backend/.admin-inicial.txt`);
}

/** Base de conocimientos del asistente (ADR-017): se reemplaza entera para reflejar el reglamento vigente. */
async function seedKnowledge() {
  await prisma.knowledgeEntry.deleteMany();
  await prisma.knowledgeEntry.createMany({
    data: knowledgeEntries.map((k) => ({ ...k, keywords: normalizeForSearch(`${k.keywords} ${k.question}`) })),
  });
}

async function main() {
  await seedCatalog();
  const call = await seedCall();
  await seedContent();
  await seedIdentity();
  await seedKnowledge();
  await seedStaff();
  await seedExams(call.code);

  const [options, vacancies, ord] = await Promise.all([
    prisma.applicationOption.count(),
    prisma.vacancy.aggregate({ where: { callId: call.id }, _sum: { quantity: true } }),
    prisma.vacancy.aggregate({ where: { callId: call.id, quotaCategory: { code: 'ORD' } }, _sum: { quantity: true } }),
  ]);
  console.log(`Semilla 2027-I: ${options} opciones · ${ord._sum.quantity} vacantes ordinario · ${vacancies._sum.quantity} vacantes en total`);
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
