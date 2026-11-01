import type { Clock } from '../../../shared/clock/clock.js';
import type { Db, Tx } from '../../../shared/db/prisma.js';

/** Roles y padrón de inhabilitados (M13). */
export class AccessService {
  constructor(private readonly db: Db, private readonly clock: Clock) {}

  async rolesOf(userId: string): Promise<string[]> {
    const rows = await this.db.userRole.findMany({ where: { userId }, include: { role: true } });
    return rows.map((r) => r.role.code);
  }

  async assignRole(tx: Tx, userId: string, roleCode: string): Promise<void> {
    const role = await tx.role.findUniqueOrThrow({ where: { code: roleCode } });
    await tx.userRole.create({ data: { userId, roleId: role.id } });
  }

  /** RN-09: inhabilitación vigente a la fecha actual. */
  async isDisqualified(documentType: string, documentNumber: string): Promise<boolean> {
    const today = this.clock.now();
    const found = await this.db.disqualifiedPerson.findFirst({
      where: {
        documentType,
        documentNumber,
        validFrom: { lte: today },
        OR: [{ validUntil: null }, { validUntil: { gte: today } }],
      },
      select: { id: true },
    });
    return Boolean(found);
  }
}
