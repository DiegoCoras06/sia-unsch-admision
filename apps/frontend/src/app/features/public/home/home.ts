import { PhotoDirective } from '../../../shared/photo.directive';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { AnnouncementDto, HomeContentDto, OptionSummaryDto, QuickAccessKey } from '@sia/contracts';
import { ApiService } from '../../../core/api.service';
import { CallStore } from '../../../core/call.store';
import { SiteImages } from '../../../core/site-images';
import { AREA_NAMES, closesIn, daysUntil, longDate } from '../../../core/format';
import { Countdown } from '../../../shared/countdown';
import { MarkdownPipe } from '../../../shared/markdown.pipe';
import { RevealDirective } from '../../../shared/reveal.directive';
import { StageTrack } from '../../../shared/stage-track';
import { ApplicationFinder } from './application-finder';

/** Página de cada acceso rápido y texto del botón principal cuando ese trámite es el de la etapa. */
const QUICK: Record<QuickAccessKey, { route: string; cta: string; label?: string; icon: string }> = {
  INSCRIPCION: { route: '/inscripcion', cta: 'Inscribirme', icon: 'inscripcion' },
  REINSCRIPCION: { route: '/reinscripcion', cta: 'Reinscribirme', icon: 'reinscripcion' },
  BUSCAR_AULA: { route: '/buscar-aula', cta: 'Buscar mi aula', icon: 'aula' },
  VER_PUNTAJE: { route: '/resultados', cta: 'Ver mi puntaje', icon: 'puntaje' },
  IMPRIMIR_DOCUMENTOS: { route: '/mi-inscripcion', cta: 'Ir a mi inscripción', label: 'Mi inscripción: pagar e imprimir', icon: 'pagar' },
};
/** Si hay varios abiertos, el que más busca la gente en esa etapa. */
const PRIORITY: QuickAccessKey[] = ['VER_PUNTAJE', 'BUSCAR_AULA', 'INSCRIPCION', 'REINSCRIPCION', 'IMPRIMIR_DOCUMENTOS'];

/** Principios de la UNSCH (Plan Estratégico Institucional, appweb.unsch.edu.pe/informacion-institucional). */
const PRINCIPLES = [
  'La autonomía inherente a su esencia y finalidades.',
  'Búsqueda de la verdad y estudio crítico de los problemas locales, regionales y nacionales.',
  'Gobierno propio, ejercido solo por sus miembros, con carácter democrático y representativo.',
  'Libertad de pensamiento, expresión y cátedra, con sujeción a los principios constitucionales y a los fines de la UNSCH.',
  'Afirmación de los derechos universales del hombre y del ciudadano, sustentada en el respeto irrestricto de los Derechos Humanos.',
  'Servicio permanente a la comunidad.',
  'Gratuidad de la enseñanza.',
];

/** Fotos de la Ciudad Universitaria, a su tamaño original (se muestran pequeñas para que se vean nítidas). */
const CAMPUS = [
  { src: 'img/campus/campus-01.webp', w: 474, h: 347, alt: 'Vista aérea de un pabellón de la Ciudad Universitaria con patio interior y jardín frente a la Facultad de Derecho' },
  { src: 'img/campus/campus-02.webp', w: 395, h: 188, alt: 'Pabellón de ladrillo con ventanales altos y jardín al frente' },
  { src: 'img/campus/campus-03.webp', w: 352, h: 234, alt: 'Vista aérea de edificios modernos de la universidad con explanada y veredas rojas' },
  { src: 'img/campus/campus-04.webp', w: 227, h: 234, alt: 'Fachada de la Escuela de Posgrado con jardines a los lados' },
  { src: 'img/campus/campus-05.webp', w: 258, h: 234, alt: 'Pabellón de varios pisos con balcones y las montañas de Ayacucho al fondo' },
  { src: 'img/campus/campus-06.webp', w: 318, h: 234, alt: 'Edificio de ladrillo y vidrio de la UNSCH bajo el cielo azul' },
  { src: 'img/campus/campus-07.webp', w: 387, h: 234, alt: 'Pabellones con escalera exterior y un auditorio circular en la Ciudad Universitaria' },
];

@Component({
  selector: 'app-home',
  imports: [RouterLink, Countdown, ApplicationFinder, MarkdownPipe, RevealDirective, StageTrack, PhotoDirective],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class HomePage {
  private readonly api = inject(ApiService);
  protected readonly store = inject(CallStore);
  protected readonly img = inject(SiteImages);

  protected readonly content = signal<HomeContentDto | null>(null);
  protected readonly options = signal<OptionSummaryDto[]>([]);
  protected readonly totalVacancies = signal(0);
  protected readonly news = signal<AnnouncementDto[]>([]);
  /** Estado de cada carga: un vacío solo se muestra cuando la respuesta llegó. */
  protected readonly optionsState = signal<'loading' | 'ok' | 'error'>('loading');
  protected readonly newsState = signal<'loading' | 'ok' | 'error'>('loading');

  protected readonly milestone = computed(() => this.store.call()?.nextMilestone ?? null);
  /** Píldora de la portada: dice en qué etapa está el proceso, según el cronograma real. */
  protected readonly status = computed(() => {
    const now = this.store.current();
    if (now.some((s) => s.kind === 'REGULAR')) return { open: true, label: 'Inscripciones abiertas' };
    if (now.some((s) => s.kind === 'EXTEMPORANEOUS')) return { open: true, label: 'Inscripción extemporánea abierta' };
    if (now.some((s) => s.kind === 'EXAM')) return { open: false, label: 'Examen en curso' };
    if (now.some((s) => s.kind === 'PUBLICATION' || s.kind === 'DELIVERY')) return { open: false, label: 'Resultados publicados' };
    return { open: false, label: `Proceso de admisión ${this.store.code()}` };
  });
  /** Fechas de examen como mini calendario (hora de Lima). */
  protected readonly exams = computed(() =>
    (this.store.call()?.stages ?? [])
      .filter((s) => s.kind === 'EXAM')
      .map((s) => {
        const d = new Date(s.startsAt);
        const opt = { timeZone: 'America/Lima' } as const;
        const label = this.examLabel(s.name);
        return {
          code: s.code,
          day: d.toLocaleDateString('es-PE', { ...opt, day: 'numeric' }),
          month: d.toLocaleDateString('es-PE', { ...opt, month: 'short' }).replace('.', '').toUpperCase(),
          title: /ordinario$/i.test(s.name) ? 'Examen ordinario' : label.charAt(0).toUpperCase() + label.slice(1),
          when: d.toLocaleDateString('es-PE', { ...opt, weekday: 'long', day: 'numeric', month: 'long' }).replace(/^./, (c) => c.toUpperCase()),
        };
      }),
  );
  protected readonly nowStages = computed(() => this.store.current().filter((s) => s.kind !== 'OTHER'));
  protected readonly byArea = computed(() =>
    (['I', 'II', 'III'] as const).map((code) => ({ code, name: AREA_NAMES[code], options: this.options().filter((o) => o.area === code) })),
  );

  /** Trámite principal de la etapa en curso (antes de cargar, o sin ninguno abierto: inscribirse). */
  protected readonly primary = computed<QuickAccessKey>(() => {
    const open = (this.content()?.quickAccess ?? []).filter((q) => q.enabled).map((q) => q.key);
    return PRIORITY.find((k) => open.includes(k)) ?? 'INSCRIPCION';
  });
  /** Los demás accesos; el principal ya está en la portada como botón. */
  protected readonly otherQuick = computed(() => (this.content()?.quickAccess ?? []).filter((q) => q.key !== this.primary()));
  protected readonly quick = QUICK;

  protected readonly principles = PRINCIPLES;
  protected readonly campus = CAMPUS;
  /** «Examen de admisión - modalidad Exonerados» → «examen de exonerados» (acepta guion o raya en los datos). */
  protected examLabel(name: string): string {
    return name.replace(/^Examen de admisión\s*[-–—]\s*modalidad\s+/i, 'examen de ').toLowerCase();
  }

  protected readonly longDate = longDate;
  /** Día y mes abreviado para la fecha destacada de cada comunicado (hora de Lima). */
  protected day = (iso: string) => new Date(iso).toLocaleDateString('es-PE', { day: '2-digit', timeZone: 'America/Lima' });
  protected month = (iso: string) => new Date(iso).toLocaleDateString('es-PE', { month: 'short', timeZone: 'America/Lima' }).replace('.', '');
  protected readonly newsType: Record<string, string> = { COMUNICADO: 'Comunicado', FE_ERRATAS: 'Fe de erratas', RESULTADO: 'Resultados' };
  protected left = (endsAt: string) => closesIn(endsAt, this.store.call()!.now);
  /** Tres días o menos: se resalta para que nadie se quede fuera. */
  protected soon = (endsAt: string) => daysUntil(endsAt, this.store.call()!.now) <= 3;

  constructor() {
    this.api.home().subscribe((c) => this.content.set(c));
    this.api.options('2027-I').subscribe({
      next: (r) => {
        this.options.set(r.data);
        this.totalVacancies.set(r.meta?.totalVacancies ?? 0);
        this.optionsState.set('ok');
      },
      error: () => this.optionsState.set('error'),
    });
    this.api.announcements().subscribe({
      next: (r) => {
        this.news.set(r.data.slice(0, 3));
        this.newsState.set('ok');
      },
      error: () => this.newsState.set('error'),
    });
  }
}
