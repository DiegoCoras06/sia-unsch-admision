import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AdminSession } from '../../../core/admin-session';
import { apiErrorMessage } from '../../../core/api.service';
import { shortDateTime } from '../../../core/format';

interface ExamRow {
  id: string; code: string; name: string; modalities: string[]; status: string; statusLabel: string; entryOpensAt: string; entryClosesAt: string;
  publishAt: string; visible: boolean; rooms: number; capacity: number; assigned: number; eligible: number;
}
interface RoomUse { id: string; venue: string; building: string; floor: number; code: string; gate: string; capacity: number; accessible: boolean; used: number; present: number; absent: number }
interface ExamDetail {
  id: string; code: string; name: string; modalities: string[]; place: string; durationMinutes: number; entryOpensAt: string; entryClosesAt: string; publishAt: string;
  structure: Record<string, number>; scoring: Record<string, number | boolean>; instructions: { llevar: string[]; prohibido: string[]; notas: string };
  status: string; statusLabel: string; visible: boolean; version: number; distributedAt: string | null; confirmedAt: string | null; attendanceClosedAt: string | null;
  eligible: number; assigned: number; unassigned: { applicantCode: string; fullName: string }[]; released: string[]; rooms: RoomUse[];
  accommodations: { applicantCode: string; fullName: string; needs: string; late: boolean; createdAt: string }[];
  changes: { applicantCode: string; from: string; to: string; reason: string; at: string }[];
}
interface Venue { id: string; name: string; rooms: { id: string; building: string; floor: number; code: string; capacity: number; gate: string; accessible: boolean; active: boolean }[] }

const toLima = (iso: string) => new Date(new Date(iso).getTime() - 5 * 3600_000).toISOString().slice(0, 16);
const fromLima = (local: string) => `${local}:00-05:00`;
const MODALITIES = [{ code: 'ORD', name: 'Ordinario' }, { code: 'EXO', name: 'Exonerados' }, { code: 'CEPRE', name: 'CEPRE-UNSCH' }];
const STRUCTURE = [{ key: 'conocimientos', label: 'Preguntas de conocimientos' }, { key: 'aptitudVocacional', label: 'Aptitud vocacional' }, { key: 'actitudPersonal', label: 'Actitud personal' }];
const SCORING = [
  { key: 'puntosConocimientos', label: 'Puntos por pregunta de conocimientos' }, { key: 'puntosTest', label: 'Puntos por pregunta de test' },
  { key: 'factorArea', label: 'Factor de ponderación por área' }, { key: 'puntajeMaximo', label: 'Puntaje máximo' }, { key: 'puntajeMinimo', label: 'Puntaje mínimo para vacante' },
];

/** Spec 006, Historias 1, 3 y 6: programación del examen, aulas habilitadas, distribución y cambios de aula. */
@Component({
  selector: 'app-admin-exams',
  imports: [FormsModule, RouterLink],
  template: `
    @if (!sel()) {
      <header class="adm-head">
        <div><h1>Exámenes y distribución</h1><p>Programa cada examen, habilita sus aulas, distribuye a los aptos y confirma la publicación (24 horas antes, Art. 24).</p></div>
        <a class="btn btn--quiet" routerLink="/admin/sedes">Sedes y aulas</a>
      </header>
      @if (msg()) { <p class="adm-msg" [class.err]="msgErr()" role="status">{{ msg() }}</p> }
      <section class="adm-panel">
        <div class="adm-table-wrap"><table class="adm-table">
          <thead><tr><th>Examen</th><th>Fecha e ingreso</th><th class="num">Aptos</th><th class="num">Asignados</th><th class="num">Aulas · capacidad</th><th>Estado</th><th></th></tr></thead>
          <tbody>@for (e of list(); track e.id) {
            <tr><td><strong>{{ e.name }}</strong><br><span class="adm-muted">{{ e.modalities.join(', ') }}</span></td>
              <td>{{ when(e.entryOpensAt) }}<br><span class="adm-muted">cierra el ingreso: {{ hourOf(e.entryClosesAt) }}</span></td>
              <td class="num">{{ e.eligible }}</td><td class="num">{{ e.assigned }}</td><td class="num">{{ e.rooms }} · {{ e.capacity }}</td>
              <td><span class="adm-tag" [class.ok]="e.visible" [class.warn]="e.status === 'DISTRIBUIDO'">{{ e.statusLabel }}</span>
                <br><span class="adm-muted">{{ e.visible ? 'Publicada' : 'Se publica: ' + when(e.publishAt) }}</span></td>
              <td><button type="button" class="adm-link" (click)="open(e.id)">Gestionar</button></td></tr>
          } @empty { <tr class="adm-none"><td colspan="7">No hay exámenes programados.</td></tr> }</tbody>
        </table></div>
        <button type="button" class="btn btn--quiet" style="justify-self:start" (click)="create()">Programar otro examen</button>
      </section>
    } @else {
      @let d = sel()!;
      <header class="adm-head">
        <div><button type="button" class="adm-link" (click)="back()">← Volver a los exámenes</button>
          <h1>{{ d.name || 'Nuevo examen' }}</h1>
          @if (d.id) { <p>{{ when(d.entryOpensAt) }} · {{ d.assigned }} asignados de {{ d.eligible }} aptos · versión {{ d.version }}</p> }</div>
        @if (d.id) { <span class="adm-tag" [class.ok]="d.visible" [class.warn]="d.status === 'DISTRIBUIDO'">{{ d.statusLabel }}{{ d.visible ? ' · publicada' : '' }}</span> }
      </header>
      @if (d.id) {
        <div class="adm-tabs" role="tablist">
          @for (t of tabs; track t.id) { <button type="button" role="tab" [class.is-on]="tab() === t.id" [attr.aria-selected]="tab() === t.id" (click)="tab.set(t.id)">{{ t.label }}</button> }
        </div>
      }
      @if (msg()) { <p class="adm-msg" [class.err]="msgErr()" role="status">{{ msg() }}</p> }

      @if (tab() === 'prog' || !d.id) {
        <form class="adm-grid" (ngSubmit)="save()">
          <section class="adm-panel adm-form">
            <h2>Programación</h2>
            <div class="two">
              <div class="field"><label for="ex-code">Código</label><input id="ex-code" class="input" name="code" [(ngModel)]="f.code" maxlength="20" required></div>
              <div class="field"><label for="ex-dur">Duración (minutos)</label><input id="ex-dur" class="input" type="number" name="dur" [(ngModel)]="f.durationMinutes" min="30" max="600"></div>
            </div>
            <div class="field"><label for="ex-name">Nombre</label><input id="ex-name" class="input" name="name" [(ngModel)]="f.name" maxlength="120" required></div>
            <fieldset class="adm-row"><legend class="adm-muted">Modalidades que rinden este examen</legend>
              @for (m of modalities; track m.code) { <label class="adm-row"><input type="checkbox" [name]="'m' + m.code" [ngModel]="f.modalities.includes(m.code)" (ngModelChange)="toggle(m.code, $event)"> {{ m.name }}</label> }
            </fieldset>
            <div class="two">
              <div class="field"><label for="ex-open">Abre el ingreso</label><input id="ex-open" class="input" type="datetime-local" name="open" [(ngModel)]="f.open"></div>
              <div class="field"><label for="ex-close">Cierra el ingreso</label><input id="ex-close" class="input" type="datetime-local" name="close" [(ngModel)]="f.close"></div>
            </div>
            <div class="two">
              <div class="field"><label for="ex-pub">Publicación de aulas</label><input id="ex-pub" class="input" type="datetime-local" name="pub" [(ngModel)]="f.publish"></div>
              <div class="field"><label for="ex-place">Lugar</label><input id="ex-place" class="input" name="place" [(ngModel)]="f.place" maxlength="200"></div>
            </div>
            @if (d.visible) {
              <div class="field"><label for="ex-reason">Motivo, si cambias la fecha u hora (se avisa a cada postulante)</label><input id="ex-reason" class="input" name="reason" [(ngModel)]="f.reason" maxlength="400"></div>
            }
            <button class="btn" type="submit" style="justify-self:start">{{ d.id ? 'Guardar cambios' : 'Programar examen' }}</button>
          </section>
          <section class="adm-panel adm-form">
            <h2>Estructura y calificación</h2>
            <p class="adm-muted">Base para la calificación del Paso 10 (Art. 28 y 29; Tabla 5 provisional).</p>
            <div class="two">
              @for (s of structureFields; track s.key) { <div class="field"><label [for]="'st-' + s.key">{{ s.label }}</label><input class="input" type="number" [id]="'st-' + s.key" [name]="'st' + s.key" [(ngModel)]="f.structure[s.key]" min="0"></div> }
              @for (s of scoringFields; track s.key) { <div class="field"><label [for]="'sc-' + s.key">{{ s.label }}</label><input class="input" type="number" step="0.1" [id]="'sc-' + s.key" [name]="'sc' + s.key" [(ngModel)]="f.scoring[s.key]" min="0"></div> }
            </div>
            <h2>Preguntas de conocimientos por curso</h2>
            <p class="adm-muted">Reparte las {{ f.structure['conocimientos'] }} preguntas entre los cursos del temario. Llevas {{ coursesTotal() }}.</p>
            @if (f.cursos.length) {
              <div class="adm-table-wrap"><table class="adm-table">
                <thead><tr><th>Curso</th><th class="num">Preguntas</th><th></th></tr></thead>
                <tbody>@for (c of f.cursos; track $index) {
                  <tr><td>{{ c.name }}</td>
                    <td class="num"><input class="input" type="number" min="0" style="width:5rem" [name]="'cq' + $index" [(ngModel)]="c.questions" [attr.aria-label]="'Preguntas de ' + c.name"></td>
                    <td><button class="btn btn--quiet" type="button" (click)="f.cursos.splice($index, 1)">Quitar</button></td></tr>
                }</tbody>
              </table></div>
            }
            <div class="adm-row"><button class="btn btn--quiet" type="button" (click)="loadCourses()">{{ f.cursos.length ? 'Volver a cargar cursos del temario' : 'Cargar cursos del temario' }}</button></div>
            <h2>Indicaciones al postulante</h2>
            <div class="field"><label for="ex-llevar">Debe llevar (una por línea)</label><textarea id="ex-llevar" class="input" name="llevar" rows="4" [(ngModel)]="f.llevar"></textarea></div>
            <div class="field"><label for="ex-prohibido">Prohibido (una por línea)</label><textarea id="ex-prohibido" class="input" name="prohibido" rows="5" [(ngModel)]="f.prohibido"></textarea></div>
            <div class="field"><label for="ex-notas">Nota</label><textarea id="ex-notas" class="input" name="notas" rows="2" [(ngModel)]="f.notas"></textarea></div>
          </section>
        </form>
      }

      @if (d.id && tab() === 'rooms') {
        <section class="adm-panel">
          <div class="adm-row" style="justify-content:space-between">
            <h2>Aulas habilitadas: {{ picked().size }} · {{ pickedCapacity() }} asientos</h2>
            <div class="adm-row">
              <button type="button" class="btn btn--quiet" (click)="pickAll(true)">Todas</button>
              <button type="button" class="btn btn--quiet" (click)="pickAll(false)">Ninguna</button>
              <button type="button" class="btn" (click)="saveRooms()">Guardar aulas</button>
            </div>
          </div>
          <p class="adm-muted">Un aula no puede estar en dos exámenes con horarios que se cruzan. Para crear o editar aulas usa «Sedes y aulas».</p>
          @for (b of buildings(); track b.name) {
            <fieldset class="ex-building"><legend><strong>{{ b.name }}</strong> <span class="adm-muted">· {{ b.venue }}</span></legend>
              <div class="ex-rooms">@for (r of b.rooms; track r.id) {
                <label class="ex-room" [class.is-on]="picked().has(r.id)">
                  <input type="checkbox" [checked]="picked().has(r.id)" (change)="pick(r.id)">
                  <span><strong>{{ r.code }}</strong> · {{ r.capacity }}</span>
                  <span class="adm-muted">Piso {{ r.floor }} · {{ r.gate }}{{ r.accessible ? ' · accesible' : '' }}</span>
                </label>
              }</div>
            </fieldset>
          }
        </section>
      }

      @if (d.id && tab() === 'dist') {
        <div class="adm-kpis">
          <div class="adm-kpi"><strong>{{ d.eligible }}</strong><span>Aptos (pago confirmado)</span></div>
          <div class="adm-kpi"><strong>{{ d.assigned }}</strong><span>Con aula</span></div>
          <div class="adm-kpi"><strong>{{ capacity() }}</strong><span>Asientos habilitados</span></div>
          <div class="adm-kpi"><strong>{{ d.unassigned.length }}</strong><span>Aptos sin aula</span></div>
        </div>
        <div class="adm-grid">
          <section class="adm-panel adm-form">
            <h2>Distribución automática</h2>
            <p class="adm-muted">Primero quienes pidieron adecuación, en aulas accesibles; luego por área académica y orden alfabético, llenando las aulas por puerta, pabellón y piso. Si la capacidad no alcanza no se asigna a nadie.</p>
            @if (d.visible) { <div class="field"><label for="ds-reason">Justificación</label><input id="ds-reason" class="input" [(ngModel)]="reason" name="dr" maxlength="400" placeholder="Obligatoria: la distribución ya está publicada"><span class="adm-muted">Se avisa por correo a quien cambie de aula.</span></div> }
            <div class="adm-row">
              <button type="button" class="btn" (click)="distribute()" [disabled]="busy() || !!d.attendanceClosedAt" [attr.aria-busy]="busy()">{{ busy() ? 'Distribuyendo…' : d.version ? 'Volver a distribuir' : 'Distribuir aptos' }}</button>
              @if (d.status === 'DISTRIBUIDO') { <button type="button" class="btn btn--quiet" (click)="confirm()">Confirmar y programar publicación</button> }
              @if (d.assigned) { <button type="button" class="btn btn--quiet" (click)="eligiblePdf()">Relación de aptos (PDF)</button> }
              @if (d.status === 'CONFIRMADO') { <button type="button" class="btn btn--quiet" (click)="closeAttendance()">Cerrar asistencia</button> }
            </div>
            @if (d.distributedAt) { <p class="adm-muted">Última distribución: {{ when(d.distributedAt) }}@if (d.confirmedAt) { · confirmada el {{ when(d.confirmedAt) }} } · visible para el postulante desde el {{ when(d.publishAt) }}</p> }
            @if (d.unassigned.length) { <p class="adm-msg err">Aptos sin aula (pagaron después de distribuir): {{ codesOf(d.unassigned) }}. Vuelve a distribuir o asígnalos con «Cambiar de aula».</p> }
            @if (d.released.length) { <p class="adm-msg err">Asientos de quienes ya no son aptos: {{ d.released.join(', ') }}. Se liberan al volver a distribuir; no pueden ingresar.</p> }
          </section>
          <section class="adm-panel adm-form">
            <h2>Cambiar de aula</h2>
            <p class="adm-muted">Queda en el historial y, si las aulas ya están publicadas, se avisa al postulante por correo.</p>
            <div class="two">
              <input class="input" [(ngModel)]="mv.code" name="mc" placeholder="Código de postulante" maxlength="8" aria-label="Código de postulante">
              <select class="select" [(ngModel)]="mv.roomId" name="mr" aria-label="Aula de destino"><option value="">Aula de destino</option>
                @for (r of d.rooms; track r.id) { <option [value]="r.id" [disabled]="r.used >= r.capacity">{{ r.building }} · {{ r.code }} ({{ r.used }}/{{ r.capacity }})</option> }</select>
            </div>
            <input class="input" [(ngModel)]="mv.reason" name="mrs" placeholder="Motivo del cambio" maxlength="400" aria-label="Motivo del cambio">
            <button type="button" class="btn btn--quiet" style="justify-self:start" (click)="move()">Cambiar de aula</button>
          </section>
        </div>
        <section class="adm-panel">
          <h2>Ocupación por aula</h2>
          <ul class="adm-bars">@for (r of usedRooms(); track r.id) {
            <li><span>{{ r.building }} · <strong>{{ r.code }}</strong>{{ r.accessible ? ' · accesible' : '' }}</span><span class="bar"><i [style.width.%]="100 * r.used / r.capacity"></i></span><b>{{ r.used }}/{{ r.capacity }}</b></li>
          } @empty { <li>Aún no hay distribución.</li> }</ul>
        </section>
        <div class="adm-grid">
          <section class="adm-panel">
            <h2>Solicitudes de adecuación</h2>
            <ul class="adm-form" style="list-style:none;margin:0;padding:0">@for (a of d.accommodations; track a.applicantCode) {
              <li><strong>{{ a.applicantCode }}</strong> · {{ a.fullName }} @if (a.late) { <span class="adm-tag warn">Fuera de plazo (menos de 72 h)</span> }<br>{{ a.needs }}</li>
            } @empty { <li class="adm-muted">Sin solicitudes.</li> }</ul>
          </section>
          <section class="adm-panel">
            <h2>Cambios de aula recientes</h2>
            <ul class="adm-form" style="list-style:none;margin:0;padding:0">@for (c of d.changes; track $index) {
              <li><span class="adm-muted">{{ when(c.at) }}</span><br><strong>{{ c.applicantCode }}</strong>: {{ c.from }} a {{ c.to }} - {{ c.reason }}</li>
            } @empty { <li class="adm-muted">Sin cambios.</li> }</ul>
          </section>
        </div>
      }
    }
  `,
  styles: `
    .ex-building { border: 0; padding: 0; margin: 0; display: grid; gap: 0.5rem; }
    .ex-rooms { display: grid; grid-template-columns: repeat(auto-fill, minmax(10.5rem, 1fr)); gap: 0.4rem; }
    .ex-room { display: grid; grid-template-columns: auto 1fr; gap: 0 0.5rem; padding: 0.5rem 0.6rem; background: var(--stone); cursor: pointer; font-size: 0.875rem; }
    .ex-room input { grid-row: span 2; align-self: center; }
    .ex-room.is-on { background: #e3f1e8; }
    fieldset.adm-row { border: 0; padding: 0; margin: 0; gap: 1rem; }
  `,
})
export class ExamsAdminPage implements OnInit {
  private readonly session = inject(AdminSession);
  protected readonly list = signal<ExamRow[]>([]);
  protected readonly sel = signal<ExamDetail | null>(null);
  protected readonly venues = signal<Venue[]>([]);
  protected readonly picked = signal(new Set<string>());
  protected readonly tab = signal<'prog' | 'rooms' | 'dist'>('dist');
  protected readonly msg = signal<string | null>(null);
  protected readonly msgErr = signal(false);
  protected readonly busy = signal(false);
  protected readonly tabs = [{ id: 'dist' as const, label: 'Distribución' }, { id: 'rooms' as const, label: 'Aulas habilitadas' }, { id: 'prog' as const, label: 'Programación' }];
  protected readonly modalities = MODALITIES;
  protected readonly structureFields = STRUCTURE;
  protected readonly scoringFields = SCORING;
  protected readonly when = shortDateTime;
  protected readonly hourOf = (iso: string) => new Date(iso).toLocaleTimeString('es-PE', { timeZone: 'America/Lima', hour: 'numeric', minute: '2-digit' });
  protected readonly codesOf = (xs: { applicantCode: string }[]) => xs.slice(0, 12).map((x) => x.applicantCode).join(', ') + (xs.length > 12 ? '…' : '');
  protected f = this.blank();
  protected reason = '';
  protected mv = { code: '', roomId: '', reason: '' };

  protected readonly capacity = computed(() => (this.sel()?.rooms ?? []).reduce((s, r) => s + r.capacity, 0));
  protected readonly usedRooms = computed(() => (this.sel()?.rooms ?? []).filter((r) => r.used > 0));
  protected readonly allRooms = computed(() => this.venues().flatMap((v) => v.rooms.filter((r) => r.active).map((r) => ({ ...r, venue: v.name }))));
  protected readonly buildings = computed(() => {
    const m = new Map<string, { name: string; venue: string; rooms: (Venue['rooms'][number] & { venue: string })[] }>();
    for (const r of this.allRooms()) {
      const k = `${r.venue}|${r.building}`;
      if (!m.has(k)) m.set(k, { name: r.building, venue: r.venue, rooms: [] });
      m.get(k)!.rooms.push(r);
    }
    return [...m.values()];
  });
  protected readonly pickedCapacity = computed(() => this.allRooms().filter((r) => this.picked().has(r.id)).reduce((s, r) => s + r.capacity, 0));

  ngOnInit() { void this.load(); }

  private blank() {
    return {
      code: '', name: '', modalities: [] as string[], open: '', close: '', publish: '', place: 'Ciudad Universitaria UNSCH', durationMinutes: 180, reason: '',
      structure: { conocimientos: 100, aptitudVocacional: 10, actitudPersonal: 10 } as Record<string, number>,
      scoring: { puntosConocimientos: 9, puntosTest: 5, factorArea: 1, puntajeMaximo: 1000, puntajeMinimo: 450 } as Record<string, number | boolean>,
      llevar: '', prohibido: '', notas: '',
      cursos: [] as { name: string; questions: number }[],
    };
  }

  protected coursesTotal() {
    return this.f.cursos.reduce((s, c) => s + Number(c.questions || 0), 0);
  }

  /** RF-07.03: cursos del temario con las preguntas repartidas en partes iguales (se ajustan a mano). */
  protected async loadCourses() {
    try {
      const list = await this.session.get<{ area: string; name: string }[]>('/admin/exams/syllabus-courses');
      const total = Number(this.f.structure['conocimientos'] ?? 0);
      const base = list.length ? Math.floor(total / list.length) : 0;
      const extra = total - base * list.length;
      this.f.cursos = list.map((c, i) => ({ name: c.name, questions: base + (i < extra ? 1 : 0) }));
    } catch (e) { this.fail(e); }
  }

  protected async load() {
    try { this.list.set(await this.session.get<ExamRow[]>('/admin/exams')); } catch (e) { this.fail(e); }
  }

  protected async open(id: string) {
    this.msg.set(null);
    try {
      const [d, venues] = await Promise.all([this.session.get<ExamDetail>(`/admin/exams/${id}`), this.session.get<Venue[]>('/admin/venues')]);
      this.venues.set(venues);
      this.show(d);
      this.tab.set('dist');
    } catch (e) { this.fail(e); }
  }

  protected create() {
    this.f = this.blank();
    this.sel.set({ id: '', code: '', name: '', modalities: [], status: '', statusLabel: '', visible: false, rooms: [], unassigned: [], released: [], accommodations: [], changes: [] } as unknown as ExamDetail);
    this.tab.set('prog');
  }

  protected back() {
    this.sel.set(null);
    this.msg.set(null);
    void this.load();
  }

  protected toggle(code: string, on: boolean) {
    this.f.modalities = on ? [...new Set([...this.f.modalities, code])] : this.f.modalities.filter((m) => m !== code);
  }

  protected async save() {
    const d = this.sel()!;
    if (!this.f.open || !this.f.close) return this.fail(null, 'Indica la apertura y el cierre del ingreso.');
    const lines = (s: string) => s.split('\n').map((x) => x.trim()).filter(Boolean);
    const body = {
      code: this.f.code, name: this.f.name, modalities: this.f.modalities, entryOpensAt: fromLima(this.f.open), entryClosesAt: fromLima(this.f.close),
      durationMinutes: Number(this.f.durationMinutes), place: this.f.place, ...(this.f.publish ? { publishAt: fromLima(this.f.publish) } : {}),
      structure: {
        ...Object.fromEntries(Object.entries(this.f.structure).filter(([k]) => k !== 'cursos').map(([k, v]) => [k, Number(v)])),
        ...(this.f.cursos.length ? { cursos: this.f.cursos.map((c) => ({ name: c.name, questions: Number(c.questions) })) } : {}),
      },
      scoring: Object.fromEntries(Object.entries(this.f.scoring).map(([k, v]) => [k, typeof v === 'boolean' ? v : Number(v)])),
      instructions: { llevar: lines(this.f.llevar), prohibido: lines(this.f.prohibido), notas: this.f.notas.trim() },
      ...(this.f.reason.trim() ? { reason: this.f.reason.trim() } : {}),
    };
    try {
      const saved = d.id ? await this.session.put<ExamDetail>(`/admin/exams/${d.id}`, body) : await this.session.postAuth<ExamDetail>('/admin/exams', body);
      if (!d.id) this.venues.set(await this.session.get<Venue[]>('/admin/venues'));
      this.show(saved);
      this.ok(d.id ? 'Examen actualizado.' : 'Examen programado. Ahora habilita sus aulas.');
      if (!d.id) this.tab.set('rooms');
    } catch (e) { this.fail(e); }
  }

  protected pick(id: string) {
    const s = new Set(this.picked());
    if (s.has(id)) s.delete(id);
    else s.add(id);
    this.picked.set(s);
  }

  protected pickAll(on: boolean) {
    this.picked.set(new Set(on ? this.allRooms().map((r) => r.id) : []));
  }

  protected async saveRooms() {
    await this.act(() => this.session.put<ExamDetail>(`/admin/exams/${this.sel()!.id}/rooms`, { roomIds: [...this.picked()] }), 'Aulas habilitadas guardadas.');
  }

  protected async distribute() {
    this.busy.set(true);
    await this.act(() => this.session.postAuth<ExamDetail>(`/admin/exams/${this.sel()!.id}/distribute`, this.reason.trim() ? { reason: this.reason.trim() } : {}),
      'Distribución generada. Revisa la ocupación y confírmala.');
    this.busy.set(false);
  }

  protected confirm() {
    return this.act(() => this.session.postAuth<ExamDetail>(`/admin/exams/${this.sel()!.id}/confirm`), 'Distribución confirmada: el postulante la verá desde la hora de publicación.');
  }

  protected move() {
    if (!/^\d{8}$/.test(this.mv.code.trim()) || !this.mv.roomId || this.mv.reason.trim().length < 5) return this.fail(null, 'Escribe el código, elige el aula y el motivo.');
    return this.act(() => this.session.postAuth<ExamDetail>(`/admin/exams/${this.sel()!.id}/assignments/${this.mv.code.trim()}/move`, { roomId: this.mv.roomId, reason: this.mv.reason.trim() }),
      `Postulante ${this.mv.code.trim()} cambiado de aula.`);
  }

  /** Después del cierre del ingreso: quien no registró asistencia queda Ausente y se habilita la calificación. */
  protected async closeAttendance() {
    const d = this.sel()!;
    try {
      const r = await this.session.postAuth<{ absent: number }>(`/admin/exams/${d.id}/close-attendance`);
      this.show(await this.session.get<ExamDetail>(`/admin/exams/${d.id}`));
      this.ok(`Asistencia cerrada: ${r.absent} ausentes. Ya se pueden importar las calificaciones.`);
    } catch (e) { this.fail(e); }
  }

  protected async eligiblePdf() {
    const d = this.sel()!;
    try { await this.session.download(`/admin/exams/${d.id}/eligible.pdf`, {}, `relacion-de-aptos-${d.code}.pdf`); } catch (e) { this.fail(e); }
  }

  private async act(call: () => Promise<ExamDetail>, done: string) {
    try {
      this.show(await call());
      this.ok(done);
      this.reason = '';
      this.mv = { code: '', roomId: '', reason: '' };
    } catch (e) { this.fail(e); }
  }

  private show(d: ExamDetail) {
    this.sel.set(d);
    this.picked.set(new Set(d.rooms.map((r) => r.id)));
    this.f = {
      ...this.blank(), code: d.code, name: d.name, modalities: [...d.modalities], open: toLima(d.entryOpensAt), close: toLima(d.entryClosesAt), publish: toLima(d.publishAt),
      place: d.place, durationMinutes: d.durationMinutes, structure: { ...d.structure }, scoring: { ...d.scoring },
      cursos: ((d.structure as unknown as { cursos?: { name: string; questions: number }[] }).cursos ?? []).map((c) => ({ ...c })),
      llevar: d.instructions.llevar.join('\n'), prohibido: d.instructions.prohibido.join('\n'), notas: d.instructions.notas,
    };
  }

  private ok(text: string) {
    this.msg.set(text);
    this.msgErr.set(false);
  }

  private fail(e: unknown, text?: string) {
    this.msg.set(text ?? apiErrorMessage(e));
    this.msgErr.set(true);
  }
}
