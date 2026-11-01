import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import type { LlmMessage, LlmProvider, LlmResponse } from '../../src/modules/asistente/index.js';
import { testApp } from '../helpers.js';

/** Proveedor de IA guionado: pide herramientas como lo haría el modelo y guarda lo que recibe. */
class ScriptedProvider implements LlmProvider {
  readonly mode = 'ia' as const;
  readonly requests: LlmMessage[][] = [];
  failNext = false;
  constructor(private readonly script: (messages: LlmMessage[]) => LlmResponse) {}
  async complete(req: { messages: LlmMessage[] }): Promise<LlmResponse> {
    this.requests.push(structuredClone(req.messages));
    if (this.failNext) {
      this.failNext = false;
      throw new Error('OpenRouter 503: no disponible');
    }
    return this.script(req.messages);
  }
}
const usage = { tokensIn: 120, tokensOut: 40, costUsd: 0.00002 };
const toolCall = (name: string, args: Record<string, unknown> = {}): LlmResponse => ({
  content: null, toolCalls: [{ id: `c-${name}`, type: 'function', function: { name, arguments: JSON.stringify(args) } }], usage, model: 'guion',
});

// Guion: primero pide las tasas; con el resultado, redacta citando el monto que devolvió la herramienta.
const scripted = new ScriptedProvider((messages) => {
  const last = messages.at(-1)!;
  if (last.role === 'user') return toolCall('consultar_tasas');
  const tool = JSON.parse((last as { content: string }).content) as { tasas: { concepto: string; monto: string }[]; _fuente: string };
  const estatal = tool.tasas.find((t) => /estatal/i.test(t.concepto))!;
  return { content: `${estatal.concepto}: ${estatal.monto}.\n\nFuente: ${tool._fuente}`, toolCalls: [], usage, model: 'guion' };
});

const basic = testApp('2026-10-25T10:00:00-05:00');
const ai = testApp('2026-10-25T10:00:00-05:00', { assistantAi: scripted });
afterAll(async () => {
  await basic.db.$disconnect();
  await ai.db.$disconnect();
});
beforeEach(() => basic.db.rateLimitCounter.deleteMany());

const ask = (t: typeof basic, message: string, extra: Record<string, unknown> = {}) =>
  t.request.post('/api/v1/assistant/messages').send({ message, ...extra });

function fakeJpeg(): string {
  const sof = Buffer.from([0xff, 0xc0, 0x00, 0x11, 0x08, 320 >> 8, 320 & 255, 0, 240, 0x03, 1, 0x22, 0, 2, 0x11, 1, 3, 0x11, 1]);
  return `data:image/jpeg;base64,${Buffer.concat([Buffer.from([0xff, 0xd8]), sof, Buffer.from([0xff, 0xd9])]).toString('base64')}`;
}

describe('Modo básico (sin clave de OpenRouter): responde solo con datos reales', () => {
  it('tasas: el monto sale de la Tabla N.° 3 y cita la fuente', async () => {
    const res = await ask(basic, '¿Cuánto pago si vengo de colegio estatal?').expect(200);
    expect(res.body.data).toMatchObject({ mode: 'basico', identified: false });
    expect(res.body.data.reply).toContain('S/ 250.00');
    expect(res.body.data.sources[0]).toMatch(/Tabla N\.° 3/);
  });

  it('examen: qué llevar, con el artículo del reglamento', async () => {
    const res = await ask(basic, '¿Qué debo llevar al examen?').expect(200);
    expect(res.body.data.reply).toMatch(/lápiz 2B/);
    expect(res.body.data.sources).toContain('Reglamento 2027-I, Art. 26');
  });

  it('vacantes de un programa, leídas del cuadro de vacantes', async () => {
    const res = await ask(basic, '¿Cuántas vacantes tiene Ingeniería de Sistemas?').expect(200);
    expect(res.body.data.reply).toMatch(/Ingeniería de Sistemas: \d+ vacantes en Ordinario/);
  });

  it('sin información verificada no inventa; a la tercera ofrece una persona (RF-10.16, Historia 3)', async () => {
    let id: string | undefined;
    let last: { reply: string; suggestHandoff: boolean } | undefined;
    for (let i = 0; i < 3; i++) {
      const res = await ask(basic, 'receta de pachamanca con choclo', id ? { conversationId: id } : {}).expect(200);
      id = res.body.data.conversationId;
      last = res.body.data;
    }
    expect(last!.reply).toMatch(/No tengo información verificada/);
    expect(last!.suggestHandoff).toBe(true);
  });

  it('estado personal sin identificarse: pide usar «Consultar mi proceso», no el DNI en el chat (RF-10.14)', async () => {
    const res = await ask(basic, '¿Cómo va mi inscripción?').expect(200);
    expect(res.body.data.reply).toMatch(/Consultar mi proceso/);
    expect(res.body.data.identified).toBe(false);
  });
});

describe('Seguimiento con pase firmado (Historia 2)', () => {
  it('DNI + código dan un pase; con él responde el estado real; un pase alterado no sirve', async () => {
    const reg = await basic.request.post('/api/v1/inscriptions').send({
      documentType: 'DNI', documentNumber: '99900015', paternalSurname: 'X', maternalSurname: 'Y', firstNames: 'Z', sex: 'M',
      maritalStatus: 'SOLTERO', birthUbigeo: '050101', birthDate: '2008-02-02', address: 'Jr. Lima 200, Ayacucho', residenceUbigeo: '050101',
      economicDependency: 'PADRES', mobile: '987654321', email: 'chat@example.com', photo: fakeJpeg(), schoolUbigeo: '050101',
      schoolName: 'IE San Ramón', schoolType: 'ESTATAL', graduationYear: 2025, inFourthOrBelow: false, preparation: 'ACADEMIA', attempts: 1,
      modality: 'ORD', quotaCategory: 'ORD', campus: 'HUAMANGA', optionCode: 'P34', militaryCondition: 'NONE', familyLink: false, declarationAccepted: true, consentVersion: '2026-10-v1',
    }).expect(201);
    const code = reg.body.data.applicantCode as string;

    await basic.request.post('/api/v1/assistant/identify').send({ documentNumber: '12345678', applicantCode: code }).expect(404);
    const pass = (await basic.request.post('/api/v1/assistant/identify').send({ documentNumber: '99900015', applicantCode: code }).expect(200)).body.data;
    expect(pass.accessToken.startsWith(`${code}.`)).toBe(true);

    const res = await ask(basic, '¿Cómo va mi inscripción?', { accessToken: pass.accessToken }).expect(200);
    expect(res.body.data.identified).toBe(true);
    expect(res.body.data.reply).toMatch(/pendiente de pago/i);
    expect(res.body.data.reply).toMatch(/Ingeniería de Sistemas/);
    expect(res.body.data.reply).toMatch(/Aula: aún no publicada/);
    expect(res.body.data.reply).not.toContain('99900015');

    const otherCode = code === '27000025' ? '27000033' : '27000025';
    const forged = pass.accessToken.replace(code, otherCode);
    const res2 = await ask(basic, '¿Cómo va mi inscripción?', { accessToken: forged }).expect(200);
    expect(res2.body.data.identified).toBe(false);
  });
});

describe('Con IA (OpenRouter guionado)', () => {
  it('el modelo responde con lo que devolvió la herramienta y el proveedor nunca recibe el DNI (RNF-11)', async () => {
    const res = await ask(ai, 'Mi DNI es 99900030 y mi correo es ana@example.com, ¿cuánto pago si vengo de colegio estatal?').expect(200);
    expect(res.body.data.mode).toBe('ia');
    expect(res.body.data.reply).toContain('S/ 250.00');
    const sent = JSON.stringify(scripted.requests);
    expect(sent).not.toContain('99900030');
    expect(sent).not.toContain('ana@example.com');
    expect(sent).toContain('[número]');
    const saved = await ai.db.chatMessage.findFirst({ where: { conversationId: res.body.data.conversationId, role: 'user' } });
    expect(saved?.content).not.toContain('99900030');
  });

  it('si OpenRouter falla, responde en modo básico y registra el error (RF-10.15)', async () => {
    scripted.failNext = true;
    const res = await ask(ai, '¿Qué debo llevar al examen?').expect(200);
    expect(res.body.data.mode).toBe('basico');
    const day = await ai.db.chatUsageDaily.findUniqueOrThrow({ where: { day: new Date('2026-10-25T00:00:00Z') } });
    expect(day.errors).toBeGreaterThanOrEqual(1);
    expect(day.aiReplies).toBeGreaterThanOrEqual(1);
    expect(Number(day.costUsd)).toBeGreaterThan(0);
  });

  it('con el presupuesto diario agotado no llama a la IA', async () => {
    const before = scripted.requests.length;
    const day = await ai.db.chatUsageDaily.findUniqueOrThrow({ where: { day: new Date('2026-10-25T00:00:00Z') } });
    await ai.db.chatUsageDaily.update({ where: { day: day.day }, data: { costUsd: 50 } });
    const res = await ask(ai, '¿Cuánto pago si vengo de colegio estatal?').expect(200);
    expect(res.body.data.mode).toBe('basico');
    expect(scripted.requests.length).toBe(before);
    await ai.db.chatUsageDaily.update({ where: { day: day.day }, data: { costUsd: 0 } });
  });
});

describe('Derivación y retención', () => {
  it('«Hablar con una persona» crea un caso con la conversación (RF-10.10)', async () => {
    const chat = (await ask(basic, 'Quiero hablar con una persona').expect(200)).body.data;
    expect(chat.suggestHandoff).toBe(true);
    const res = await basic.request.post('/api/v1/assistant/handoff')
      .send({ conversationId: chat.conversationId, name: 'Rosa Quispe', email: 'rosa@example.com' }).expect(201);
    expect(res.body.data.caseNumber).toMatch(/^C-2027I-\d{6}$/);
    const supportCase = await basic.db.supportCase.findUniqueOrThrow({ where: { caseNumber: res.body.data.caseNumber } });
    expect(supportCase.type).toBe('CHATBOT_ESCALATION');
    expect(supportCase.message).toContain('Quiero hablar con una persona');
  });

  it('borra las conversaciones más antiguas que la retención (RF-10.11)', async () => {
    const old = await basic.db.chatConversation.create({ data: {} });
    await basic.db.$executeRaw`UPDATE asistente.conversations SET updated_at = now() - interval '400 days' WHERE id = ${old.id}::uuid`;
    const recent = await basic.db.chatConversation.create({ data: {} });
    expect(await basic.assistant.purgeExpired()).toBeGreaterThanOrEqual(1);
    expect(await basic.db.chatConversation.findUnique({ where: { id: old.id } })).toBeNull();
    expect(await basic.db.chatConversation.findUnique({ where: { id: recent.id } })).not.toBeNull();
  });
});
