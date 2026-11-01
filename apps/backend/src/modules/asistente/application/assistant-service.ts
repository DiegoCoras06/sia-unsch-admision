import { createHmac, timingSafeEqual } from 'node:crypto';
import type { Logger } from 'pino';
import type { AuditLog, RequestMeta } from '../../../shared/audit/audit.js';
import type { Clock } from '../../../shared/clock/clock.js';
import type { Db } from '../../../shared/db/prisma.js';
import { notFound, validationError } from '../../../shared/http/errors.js';
import type { RateLimiter } from '../../../shared/rate-limit/rate-limiter.js';
import { LIMITS, NO_INFO_REPLY, SUGGESTIONS, SYSTEM_PROMPT, asksForHuman, maskPersonal } from '../domain/assistant-rules.js';
import type { LlmMessage, LlmProvider, LlmResponse } from '../domain/ports.js';
import type { AssistantTools } from './tools.js';

export interface AssistantReply {
  conversationId: string;
  reply: string;
  sources: string[];
  mode: 'ia' | 'basico';
  suggestHandoff: boolean;
  identified: boolean;
}

/** Casos de uso del asistente (spec 009, ADR-017). */
export class AssistantService {
  constructor(
    private readonly d: {
      db: Db;
      clock: Clock;
      limiter: RateLimiter;
      audit: AuditLog;
      logger: Logger;
      tools: AssistantTools;
      /** OpenRouter si hay clave; null para usar solo el modo básico. */
      ai: LlmProvider | null;
      basic: LlmProvider;
      passSecret: string;
      dailyBudgetUsd: number;
      /** Días de retención (parámetro del panel, RF-13.10). */
      retentionDays: () => Promise<number>;
      inscriptions: { paymentContext(documentNumber: string, applicantCode: string): Promise<{ applicantCode: string; firstNames: string }> };
      support: { createCase(input: { name: string; email: string; message: string }, ipHash: string): Promise<string> };
    },
  ) {}

  suggestions() {
    return { suggestions: SUGGESTIONS, aiEnabled: Boolean(this.d.ai) };
  }

  /** Historia 2: el DNI y el código se verifican aquí, fuera del chat; el pase solo lleva el código (RF-10.14). */
  async identify(documentNumber: string, applicantCode: string, meta: RequestMeta) {
    await this.d.limiter.consume(`assistant-identify:${meta.ipHash}`, 10, 3600);
    const ctx = await this.d.inscriptions.paymentContext(documentNumber, applicantCode);
    const expiresAt = new Date(this.d.clock.now().getTime() + LIMITS.passTtlSeconds * 1000);
    const payload = `${ctx.applicantCode}.${expiresAt.getTime()}`;
    await this.d.audit.record({ actorUserId: null, action: 'assistant.identify', resourceType: 'application', resourceId: ctx.applicantCode, ...meta });
    return { accessToken: `${payload}.${this.sign(payload)}`, expiresAt: expiresAt.toISOString(), firstName: ctx.firstNames.split(' ')[0] ?? '' };
  }

  /** Código de postulante del pase, o null si no hay pase, está alterado o venció. */
  verifyPass(token: string | undefined | null): string | null {
    if (!token) return null;
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [code, exp, sig] = parts as [string, string, string];
    const expected = Buffer.from(this.sign(`${code}.${exp}`));
    const given = Buffer.from(sig);
    if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
    return Number(exp) > this.d.clock.now().getTime() ? code : null;
  }

  /** Historias 1 y 2: una pregunta; el proveedor solo responde con lo que devuelven las herramientas. */
  async chat(input: { conversationId?: string | undefined; message: string; accessToken?: string | undefined }, meta: RequestMeta): Promise<AssistantReply> {
    await this.d.limiter.consume(`assistant:${meta.ipHash}`, 30, 3600);
    const text = input.message.trim();
    if (!text) throw validationError('Escribe tu pregunta.', [{ field: 'message', issue: 'vacío' }]);
    if (text.length > LIMITS.maxInputChars) throw validationError(`Tu mensaje es muy largo (máximo ${LIMITS.maxInputChars} caracteres).`, [{ field: 'message', issue: 'muy largo' }]);

    const applicantCode = this.verifyPass(input.accessToken);
    const conversation = input.conversationId
      ? await this.d.db.chatConversation.findUnique({ where: { id: input.conversationId } })
      : null;
    if (input.conversationId && !conversation) throw notFound('La conversación ya no existe. Empieza una nueva.');
    const conv = conversation ?? (await this.d.db.chatConversation.create({ data: {} }));
    if (applicantCode && !conv.identified) await this.d.db.chatConversation.update({ where: { id: conv.id }, data: { identified: true } });

    const history = await this.d.db.chatMessage.findMany({
      where: { conversationId: conv.id },
      orderBy: { createdAt: 'desc' },
      take: LIMITS.historyMessages,
    });
    const masked = maskPersonal(text);
    const messages: LlmMessage[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...history.reverse().map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
      { role: 'user', content: masked },
    ];

    const useAi = this.d.ai && (await this.withinBudget());
    let outcome: Awaited<ReturnType<AssistantService['run']>>;
    try {
      outcome = await this.run(useAi ? this.d.ai! : this.d.basic, messages, applicantCode);
    } catch (error) {
      this.d.logger.warn({ err: error instanceof Error ? error.message : String(error) }, 'falló el proveedor de IA; se responde en modo básico');
      await this.bumpUsage({ errors: 1 });
      outcome = await this.run(this.d.basic, messages, applicantCode);
    }

    const noInfo = outcome.empty || outcome.reply === NO_INFO_REPLY;
    const failedTurns = noInfo ? conv.failedTurns + 1 : conv.failedTurns;
    await this.d.db.$transaction([
      this.d.db.chatMessage.create({ data: { conversationId: conv.id, role: 'user', content: masked, mode: outcome.mode } }),
      this.d.db.chatMessage.create({
        data: {
          conversationId: conv.id, role: 'assistant', content: outcome.reply.slice(0, 4000), mode: outcome.mode,
          tools: outcome.tools, tokensIn: outcome.tokensIn, tokensOut: outcome.tokensOut,
        },
      }),
      this.d.db.chatConversation.update({ where: { id: conv.id }, data: { failedTurns } }),
    ]);
    await this.bumpUsage({
      requests: 1, aiReplies: outcome.mode === 'ia' ? 1 : 0, tokensIn: outcome.tokensIn, tokensOut: outcome.tokensOut, costUsd: outcome.costUsd,
    });

    return {
      conversationId: conv.id,
      reply: outcome.reply,
      sources: outcome.sources,
      mode: outcome.mode,
      suggestHandoff: asksForHuman(text) || failedTurns >= LIMITS.failedTurnsBeforeHandoff,
      identified: Boolean(applicantCode),
    };
  }

  /** Historia 3: crea un caso de atención con la conversación enmascarada (RF-10.10). */
  async handoff(input: { conversationId: string; name: string; email: string; note?: string | undefined }, meta: RequestMeta) {
    const conv = await this.d.db.chatConversation.findUnique({
      where: { id: input.conversationId },
      include: { messages: { orderBy: { createdAt: 'asc' }, take: 40 } },
    });
    if (!conv) throw notFound('La conversación ya no existe.');
    if (conv.caseNumber) return { caseNumber: conv.caseNumber };
    const transcript = conv.messages.map((m) => `${m.role === 'user' ? 'Postulante' : 'Asistente'}: ${m.content}`).join('\n');
    const message = [`Derivado desde el asistente virtual.${input.note ? ` Nota: ${maskPersonal(input.note)}` : ''}`, '', transcript].join('\n').slice(0, 1900);
    const caseNumber = await this.d.support.createCase({ name: input.name, email: input.email, message }, meta.ipHash);
    await this.d.db.chatConversation.update({ where: { id: conv.id }, data: { handedOff: true, caseNumber } });
    await this.bumpUsage({ handoffs: 1 });
    return { caseNumber };
  }

  /** RF-10.11: borra conversaciones más antiguas que la política de retención. */
  async purgeExpired(): Promise<number> {
    const limit = new Date(this.d.clock.now().getTime() - (await this.d.retentionDays()) * 86_400_000);
    const r = await this.d.db.chatConversation.deleteMany({ where: { updatedAt: { lt: limit } } });
    return r.count;
  }

  /** RF-10.15 / RF-12.10: consumo de los últimos días. */
  async usage(days = 14) {
    const since = new Date(this.today().getTime() - (days - 1) * 86_400_000);
    const rows = await this.d.db.chatUsageDaily.findMany({ where: { day: { gte: since } }, orderBy: { day: 'asc' } });
    return rows.map((r) => ({ ...r, day: r.day.toISOString().slice(0, 10), costUsd: Number(r.costUsd) }));
  }

  private async run(provider: LlmProvider, base: LlmMessage[], applicantCode: string | null) {
    const messages = [...base];
    const sources = new Set<string>();
    const tools: string[] = [];
    let tokensIn = 0;
    let tokensOut = 0;
    let costUsd = 0;
    let empty = false;
    let res: LlmResponse | null = null;
    for (let round = 0; round <= LIMITS.maxToolRounds; round++) {
      res = await provider.complete({ messages, tools: this.d.tools.specs() });
      tokensIn += res.usage.tokensIn;
      tokensOut += res.usage.tokensOut;
      costUsd += res.usage.costUsd;
      if (!res.toolCalls.length || round === LIMITS.maxToolRounds) break;
      messages.push({ role: 'assistant', content: res.content, tool_calls: res.toolCalls });
      for (const tc of res.toolCalls) {
        let args: Record<string, unknown> = {};
        try {
          args = JSON.parse(tc.function.arguments || '{}') as Record<string, unknown>;
        } catch {
          args = {};
        }
        const result = await this.d.tools.run(tc.function.name, args, { applicantCode });
        tools.push(tc.function.name);
        result.sources.forEach((s) => sources.add(s));
        empty = Boolean(result.empty);
        messages.push({ role: 'tool', tool_call_id: tc.id, name: tc.function.name, content: JSON.stringify({ ...result.data, _fuente: result.sources[0] ?? null }) });
      }
    }
    const reply = res?.content?.trim() || NO_INFO_REPLY;
    return { reply, sources: [...sources], tools, tokensIn, tokensOut, costUsd, mode: provider.mode, empty: empty && !tools.includes('estado_de_mi_proceso') };
  }

  private async withinBudget(): Promise<boolean> {
    if (this.d.dailyBudgetUsd <= 0) return false;
    const row = await this.d.db.chatUsageDaily.findUnique({ where: { day: this.today() } });
    return !row || Number(row.costUsd) < this.d.dailyBudgetUsd;
  }

  private async bumpUsage(delta: Partial<Record<'requests' | 'aiReplies' | 'tokensIn' | 'tokensOut' | 'errors' | 'handoffs' | 'costUsd', number>>) {
    const inc = Object.fromEntries(Object.entries(delta).filter(([, v]) => v).map(([k, v]) => [k, { increment: v }]));
    await this.d.db.chatUsageDaily.upsert({
      where: { day: this.today() },
      create: { day: this.today(), ...Object.fromEntries(Object.entries(delta).map(([k, v]) => [k, v ?? 0])) },
      update: inc,
    });
  }

  /** Día calendario en Lima, como fecha UTC a medianoche (columna DATE). */
  private today(): Date {
    const lima = new Date(this.d.clock.now().getTime() - 5 * 3600_000).toISOString().slice(0, 10);
    return new Date(`${lima}T00:00:00Z`);
  }

  private sign(payload: string): string {
    return createHmac('sha256', this.d.passSecret).update(payload).digest('base64url');
  }
}
