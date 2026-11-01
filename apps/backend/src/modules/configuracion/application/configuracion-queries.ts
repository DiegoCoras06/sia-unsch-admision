import type { AnnouncementDto, HomeContentDto, PageMeta, QuickAccessKey } from '@sia/contracts';
import type { Clock } from '../../../shared/clock/clock.js';
import { toLimaIso } from '../../../shared/clock/clock.js';
import type { Db } from '../../../shared/db/prisma.js';
import { stageStatus, type ConvocatoriasQueries } from '../../convocatorias/index.js';

const PAGE_SIZE = 10;
const shortDate = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;

/** Casos de uso de lectura de M14 (spec 001, Historias 5 y 6; FR-008, FR-010, FR-013). */
export class ConfiguracionQueries {
  constructor(private readonly db: Db, private readonly convocatorias: ConvocatoriasQueries, private readonly clock: Clock) {}

  async listAnnouncements(filter: { callCode?: string | undefined; type?: AnnouncementDto['type'] | undefined; section?: string | undefined; page: number }) {
    const where = {
      publishedAt: { lte: this.clock.now() },
      ...(filter.callCode ? { callCode: filter.callCode } : {}),
      ...(filter.type ? { type: filter.type } : {}),
      ...(filter.section ? { affectsSection: filter.section } : {}),
    };
    const [rows, total] = await Promise.all([
      this.db.announcement.findMany({ where, orderBy: { publishedAt: 'desc' }, skip: (filter.page - 1) * PAGE_SIZE, take: PAGE_SIZE }),
      this.db.announcement.count({ where }),
    ]);
    const data: AnnouncementDto[] = rows.map((a) => ({
      id: a.id, type: a.type, title: a.title, bodyMarkdown: a.bodyMd, affectsSection: a.affectsSection, publishedAt: toLimaIso(a.publishedAt),
    }));
    const meta: PageMeta = { page: filter.page, pageSize: PAGE_SIZE, total };
    return { data, meta };
  }

  /** Inicio: carrusel, autoridades, bloques y accesos rápidos habilitados según la etapa en curso. */
  async home(): Promise<HomeContentDto> {
    const [slides, authorities, blocks, flags, call] = await Promise.all([
      this.db.heroSlide.findMany({ where: { active: true }, orderBy: { sortOrder: 'asc' } }),
      this.db.authorityMessage.findMany({ orderBy: { sortOrder: 'asc' } }),
      this.db.contentBlock.findMany(),
      this.db.featureFlag.findMany({ orderBy: { sortOrder: 'asc' } }),
      this.convocatorias.getCurrentCall().catch(() => null),
    ]);
    const now = this.clock.now();
    const stages = call?.stages ?? [];

    const quickAccess = flags.map((flag) => {
      const linked = stages.filter((s) => flag.linkedStageCodes.includes(s.code));
      const open = linked.some((s) => stageStatus({ startsAt: new Date(s.startsAt), endsAt: new Date(s.endsAt) }, now) === 'IN_PROGRESS');
      const upcoming = linked
        .filter((s) => new Date(s.startsAt).getTime() > now.getTime())
        .sort((a, b) => a.startsAt.localeCompare(b.startsAt))[0];
      const reason = !flag.enabled
        ? 'No disponible por el momento'
        : open
          ? 'Disponible ahora'
          : upcoming
            ? `Disponible desde el ${shortDate(upcoming.startsAt)}`
            : 'Etapa finalizada';
      return { key: flag.key as QuickAccessKey, label: flag.label, enabled: flag.enabled && open, reason };
    });

    return {
      heroSlides: slides.map((s) => ({ title: s.title, subtitle: s.subtitle, imageUrl: s.imageUrl, ctaLabel: s.ctaLabel, ctaRoute: s.ctaRoute })),
      authorities: authorities.map((a) => ({ name: a.name, position: a.position, message: a.message, photoUrl: a.photoUrl })),
      blocks: Object.fromEntries(blocks.map((b) => [b.key, b.bodyMd])),
      quickAccess,
    };
  }
}
