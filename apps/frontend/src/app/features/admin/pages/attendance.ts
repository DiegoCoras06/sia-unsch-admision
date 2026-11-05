import { HttpErrorResponse } from '@angular/common/http';
import { Component, ElementRef, OnDestroy, OnInit, computed, inject, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { AdminSession } from '../../../core/admin-session';
import { apiErrorMessage } from '../../../core/api.service';
import { shortDateTime } from '../../../core/format';

interface BoardRoom { id: string; code: string; building: string; floor: number; gate: string; capacity: number; assigned: number; present: number; absent: number }
interface BoardExam { id: string; name: string; status: string; entryOpensAt: string; entryClosesAt: string; closed: boolean; rooms: BoardRoom[] }
interface Row { applicantCode: string; fullName: string; document: string; seat: number; attendance: 'PENDIENTE' | 'PRESENTE' | 'AUSENTE'; late: boolean; checkedInAt: string | null }
interface CheckIn {
  applicantCode: string; fullName: string; document: string; program: string; photo: string | null;
  room: { id: string; code: string; building: string; floor: number; gate: string; seat: number }; late: boolean; already: boolean; checkedInAt: string;
}
interface Incident { id: string; typeLabel: string; description: string; room: string | null; applicantCode: string | null; at: string }

/** RF-08.08: lecturas hechas sin conexión, guardadas en este equipo hasta poder enviarlas. */
interface Pending { examId: string; scan: string; scannedAt: string }
const QUEUE_KEY = 'sia-asistencia-sin-conexion';
function readQueue(): Pending[] {
  try { return JSON.parse(localStorage.getItem(QUEUE_KEY) ?? '[]') as Pending[]; } catch { return []; }
}
function writeQueue(q: Pending[]): void {
  try { localStorage.setItem(QUEUE_KEY, JSON.stringify(q)); } catch { /* sin almacenamiento: la cola vive solo en memoria */ }
}
const isOffline = (e: unknown) => !navigator.onLine || (e instanceof HttpErrorResponse && e.status === 0);

/** Lector de códigos del navegador (Chrome/Edge en Android y escritorio); si no existe, se usa el lector externo o el teclado. */
declare const BarcodeDetector: { new (o: { formats: string[] }): { detect(src: CanvasImageSource): Promise<{ rawValue: string }[]> } } | undefined;

const INCIDENTS = [
  { code: 'DISPOSITIVO', label: 'Dispositivo electrónico' }, { code: 'SUPLANTACION', label: 'Posible suplantación' }, { code: 'DOCUMENTO', label: 'Documento alterado o falso' },
  { code: 'CONDUCTA', label: 'Conducta inapropiada' }, { code: 'SALUD', label: 'Atención de salud' }, { code: 'OTRO', label: 'Otro' },
];

/** Spec 006, Historia 5: control de ingreso por QR con la foto, lista por aula e incidencias (RF-08.07, RF-08.08). */
@Component({
  selector: 'app-admin-attendance',
  imports: [FormsModule],
  template: `
    <header class="adm-head"><div><h1>Asistencia del examen</h1><p>Escanea el QR de la ficha de examen (cámara o lector) o escribe el código. Compara la foto con la persona y su DNI antes de dejarla pasar.</p></div></header>
    <form class="adm-panel adm-filters" (ngSubmit)="loadRoom()">
      <div class="field"><label for="at-exam">Examen</label>
        <select id="at-exam" class="select" name="ex" [(ngModel)]="examId" (ngModelChange)="roomId = ''; rows.set([]); loadIncidents()">
          @for (e of board(); track e.id) { <option [value]="e.id">{{ e.name }}{{ e.closed ? ' (cerrada)' : '' }}</option> }</select></div>
      <div class="field"><label for="at-room">Aula</label>
        <select id="at-room" class="select" name="rm" [(ngModel)]="roomId" (ngModelChange)="loadRoom()"><option value="">Todas (puerta)</option>
          @for (r of exam()?.rooms ?? []; track r.id) { <option [value]="r.id">{{ r.building }} · {{ r.code }} ({{ r.present }}/{{ r.assigned }})</option> }</select></div>
      @if (roomId) { <button type="button" class="btn btn--quiet" (click)="pdf()">Lista de asistencia (PDF)</button> }
    </form>
    @if (msg()) { <p class="adm-msg" [class.err]="msgErr()" role="status">{{ msg() }}</p> }

    <div class="adm-grid">
      <section class="adm-panel adm-form">
        <h2>Registrar ingreso</h2>
        <form class="adm-row" (ngSubmit)="checkIn()">
          <input #scanInput class="input at-scan" name="scan" [(ngModel)]="scan" placeholder="Escanea el QR o escribe el código" autocomplete="off" aria-label="QR o código de postulante">
          <button class="btn" type="submit" [disabled]="busy()">Registrar</button>
          @if (canCamera) { <button class="btn btn--quiet" type="button" (click)="camera() ? stopCamera() : startCamera()">{{ camera() ? 'Cerrar cámara' : 'Usar cámara' }}</button> }
        </form>
        @if (pending().length) {
          <div class="at-offline" role="status">
            <p><strong>{{ pending().length }} {{ pending().length === 1 ? 'lectura guardada' : 'lecturas guardadas' }} sin conexión.</strong>
              {{ online() ? 'Se envían con la hora en que se leyeron.' : 'Se enviarán solas cuando vuelva la conexión.' }}</p>
            <button class="btn btn--quiet" type="button" (click)="sync()" [disabled]="!online() || syncing()" [attr.aria-busy]="syncing()">{{ syncing() ? 'Enviando…' : 'Enviar ahora' }}</button>
          </div>
        }
        @if (offlineCard(); as o) {
          <article class="at-card is-other">
            <div>
              <p class="at-code">{{ o.code }}</p>
              @if (o.row) { <h3>{{ o.row.fullName }}</h3><p>{{ o.row.document }} · asiento {{ o.row.seat }}</p> }
              @else { <h3>Código fuera de la lista de esta aula</h3> }
              <p class="at-state">Sin conexión: lectura guardada a las {{ when(o.at) }} - Compara el DNI con la persona; la foto y el estado de apto se confirman al enviar.</p>
            </div>
          </article>
        }
        <video #video class="at-video" [hidden]="!camera()" playsinline muted></video>
        @if (last(); as c) {
          <article class="at-card" [class.is-late]="c.late" [class.is-other]="roomId && c.room.id !== roomId">
            @if (c.photo) { <img [src]="c.photo" alt="Foto del postulante" width="150" height="200" (error)="$any($event.target).style.visibility = 'hidden'"> }
            <div>
              <p class="at-code">{{ c.applicantCode }}</p>
              <h3>{{ c.fullName }}</h3>
              <p>{{ c.document }} · {{ c.program }}</p>
              <p class="at-room">{{ c.room.building }} · aula <strong>{{ c.room.code }}</strong> · asiento {{ c.room.seat }}</p>
              <p class="at-state">
                @if (c.already) { Ya había ingresado ({{ when(c.checkedInAt) }}). } @else { Ingreso registrado. }
                @if (c.late) { <strong>Fuera de hora.</strong> }
                @if (roomId && c.room.id !== roomId) { <strong>No es de esta aula.</strong> }
              </p>
            </div>
          </article>
        }
      </section>

      <section class="adm-panel adm-form">
        <h2>Incidencia</h2>
        <div class="two">
          <select class="select" [(ngModel)]="inc.type" name="it" aria-label="Tipo de incidencia">@for (t of incidentTypes; track t.code) { <option [value]="t.code">{{ t.label }}</option> }</select>
          <input class="input" [(ngModel)]="inc.code" name="ic" maxlength="8" placeholder="Código (opcional)" aria-label="Código del postulante">
        </div>
        <textarea class="input" rows="3" [(ngModel)]="inc.description" name="id" maxlength="1000" placeholder="Qué pasó, dónde y quién lo detectó" aria-label="Descripción"></textarea>
        <button type="button" class="btn btn--quiet" style="justify-self:start" (click)="report()">Registrar y avisar a la Comisión</button>
        <ul class="adm-form" style="list-style:none;margin:0;padding:0">@for (i of incidents(); track i.id) {
          <li><span class="adm-muted">{{ when(i.at) }}{{ i.room ? ' · aula ' + i.room : '' }}{{ i.applicantCode ? ' · ' + i.applicantCode : '' }}</span><br><strong>{{ i.typeLabel }}</strong> - {{ i.description }}</li>
        }</ul>
      </section>
    </div>

    @if (roomId) {
      <section class="adm-panel">
        <h2>Aula {{ room()?.code }}: {{ presentCount() }} presentes de {{ rows().length }}</h2>
        <div class="adm-table-wrap"><table class="adm-table">
          <thead><tr><th class="num">Asiento</th><th>Postulante</th><th>Código</th><th>Asistencia</th><th></th></tr></thead>
          <tbody>@for (r of rows(); track r.applicantCode) {
            <tr><td class="num">{{ r.seat }}</td><td>{{ r.fullName }}<br><span class="adm-muted">{{ r.document }}</span></td><td>{{ r.applicantCode }}</td>
              <td><span class="adm-tag" [class.ok]="r.attendance === 'PRESENTE' && !r.late" [class.warn]="r.late" [class.bad]="r.attendance === 'AUSENTE'">{{ label(r) }}</span>
                @if (r.checkedInAt) { <br><span class="adm-muted">{{ when(r.checkedInAt) }}</span> }</td>
              <td>@if (!exam()?.closed) {
                @if (r.attendance !== 'PRESENTE') { <button type="button" class="adm-link" (click)="set(r, 'PRESENTE')">Presente</button> }
                @if (r.attendance !== 'AUSENTE') { <button type="button" class="adm-link" style="margin-left:0.75rem" (click)="set(r, 'AUSENTE')">Ausente</button> }
              }</td></tr>
          }</tbody>
        </table></div>
      </section>
    }
  `,
  styles: `
    .at-scan { flex: 1 1 16rem; font-size: 1.125rem; }
    .at-offline { display: flex; flex-wrap: wrap; gap: 0.75rem; align-items: center; justify-content: space-between; padding: 0.75rem 1rem; background: #fbf1d9; border-left: 6px solid #6b4a00; }
    .at-offline p { margin: 0; }
    .at-video { width: 100%; max-height: 18rem; background: #000; object-fit: cover; }
    .at-card { display: flex; gap: 1.25rem; align-items: flex-start; padding: 1rem; background: #e3f1e8; border-left: 6px solid #164d2a; }
    .at-card.is-late, .at-card.is-other { background: #fbf1d9; border-left-color: #6b4a00; }
    .at-card img { width: 150px; height: 200px; object-fit: cover; background: var(--stone); flex: none; }
    .at-code { font-size: 1.75rem; font-weight: 800; color: var(--accent); letter-spacing: 0.04em; font-variant-numeric: tabular-nums; }
    .at-card h3 { font-size: 1.25rem; }
    .at-room { margin-top: 0.5rem; }
    .at-state { margin-top: 0.5rem; font-weight: 600; }
    @media (max-width: 640px) { .at-card { flex-direction: column; } }
  `,
})
export class AttendanceAdminPage implements OnInit, OnDestroy {
  private readonly session = inject(AdminSession);
  private readonly route = inject(ActivatedRoute);
  private readonly scanInput = viewChild<ElementRef<HTMLInputElement>>('scanInput');
  private readonly video = viewChild<ElementRef<HTMLVideoElement>>('video');
  protected readonly board = signal<BoardExam[]>([]);
  protected readonly rows = signal<Row[]>([]);
  protected readonly last = signal<CheckIn | null>(null);
  protected readonly incidents = signal<Incident[]>([]);
  protected readonly msg = signal<string | null>(null);
  protected readonly msgErr = signal(false);
  protected readonly busy = signal(false);
  protected readonly camera = signal(false);
  protected readonly pending = signal<Pending[]>(readQueue());
  protected readonly online = signal(navigator.onLine);
  protected readonly syncing = signal(false);
  protected readonly offlineCard = signal<{ code: string; at: string; row: Row | null } | null>(null);
  private readonly onOnline = () => { this.online.set(true); void this.sync(); };
  private readonly onOffline = () => this.online.set(false);
  protected readonly incidentTypes = INCIDENTS;
  protected readonly canCamera = typeof BarcodeDetector !== 'undefined' && !!navigator.mediaDevices?.getUserMedia;
  protected readonly when = shortDateTime;
  protected examId = '';
  protected roomId = '';
  protected scan = '';
  protected inc = { type: 'DISPOSITIVO', code: '', description: '' };
  private stream: MediaStream | null = null;
  private lastRaw = '';
  private timer: ReturnType<typeof setInterval> | null = null;

  protected readonly exam = computed(() => this.board().find((e) => e.id === this.examId) ?? null);
  protected readonly room = computed(() => this.exam()?.rooms.find((r) => r.id === this.roomId) ?? null);
  protected readonly presentCount = computed(() => this.rows().filter((r) => r.attendance === 'PRESENTE').length);
  protected readonly label = (r: Row) => (r.attendance === 'PRESENTE' ? (r.late ? 'Presente · fuera de hora' : 'Presente') : r.attendance === 'AUSENTE' ? 'Ausente' : 'Por ingresar');

  async ngOnInit() {
    addEventListener('online', this.onOnline);
    addEventListener('offline', this.onOffline);
    if (this.online() && this.pending().length) void this.sync();
    try {
      const board = await this.session.get<BoardExam[]>('/admin/attendance');
      this.board.set(board);
      // El examen en curso (o el próximo) primero.
      const now = Date.now();
      const current = board.find((e) => !e.closed && new Date(e.entryOpensAt).getTime() - 12 * 3600_000 < now) ?? board.find((e) => !e.closed) ?? board[0];
      this.examId = current?.id ?? '';
      if (!this.examId) return this.fail(null, 'No hay exámenes con distribución para registrar asistencia.');
      await this.loadIncidents();
      // QR escaneado con la cámara del celular: abre esta página con ?c=código.firma y registra de inmediato.
      const c = this.route.snapshot.queryParamMap.get('c');
      if (c) {
        this.scan = c;
        await this.checkIn();
      }
    } catch (e) { this.fail(e); }
    setTimeout(() => this.scanInput()?.nativeElement.focus());
  }

  ngOnDestroy() {
    this.stopCamera();
    removeEventListener('online', this.onOnline);
    removeEventListener('offline', this.onOffline);
  }

  /** Guarda la lectura en el equipo; la lista del aula ya cargada sirve para reconocer a la persona. */
  private queueScan(scan: string) {
    const at = new Date().toISOString();
    const code = /(\d{8})(?:\.[\w-]+)?$/.exec(scan)?.[1] ?? scan;
    const q = [...this.pending(), { examId: this.examId, scan, scannedAt: at }];
    writeQueue(q);
    this.pending.set(q);
    this.last.set(null);
    this.msg.set(null);
    this.offlineCard.set({ code, at, row: this.rows().find((r) => r.applicantCode === code) ?? null });
  }

  /** Envía las lecturas pendientes en orden; si la red vuelve a caer, se detiene y conserva el resto. */
  protected async sync() {
    if (this.syncing() || !this.pending().length) return;
    this.syncing.set(true);
    const rejected: string[] = [];
    let sent = 0;
    try {
      while (this.pending().length) {
        const [item, ...rest] = this.pending();
        try {
          await this.session.postAuth<CheckIn>(`/admin/attendance/${item!.examId}/check-in`, { scan: item!.scan, scannedAt: item!.scannedAt });
          sent++;
        } catch (e) {
          if (isOffline(e)) break;
          rejected.push(apiErrorMessage(e));
        }
        writeQueue(rest);
        this.pending.set(rest);
      }
    } finally {
      this.syncing.set(false);
    }
    if (sent || rejected.length) {
      this.offlineCard.set(null);
      this.msg.set(`Lecturas sin conexión enviadas: ${sent}.${rejected.length ? ` No se aceptaron ${rejected.length}: ${rejected.join(' ')}` : ''}`);
      this.msgErr.set(rejected.length > 0);
      await this.refreshCounts();
    }
  }

  protected async loadRoom() {
    if (!this.examId || !this.roomId) return this.rows.set([]);
    try { this.rows.set(await this.session.get<Row[]>(`/admin/attendance/${this.examId}/rooms/${this.roomId}`)); } catch (e) { this.fail(e); }
  }

  protected async loadIncidents() {
    if (!this.examId) return;
    try { this.incidents.set(await this.session.get<Incident[]>(`/admin/attendance/${this.examId}/incidents`)); } catch (e) { this.fail(e); }
  }

  protected async checkIn() {
    const scan = this.scan.trim();
    if (!scan || this.busy()) return;
    this.busy.set(true);
    try {
      if (!navigator.onLine) { this.queueScan(scan); return; }
      const c = await this.session.postAuth<CheckIn>(`/admin/attendance/${this.examId}/check-in`, { scan });
      this.last.set(c);
      this.offlineCard.set(null);
      this.msg.set(null);
      await this.refreshCounts();
    } catch (e) {
      if (isOffline(e)) { this.queueScan(scan); return; }
      this.last.set(null);
      this.fail(e);
    } finally {
      this.scan = '';
      this.busy.set(false);
      this.scanInput()?.nativeElement.focus();
    }
  }

  protected async set(r: Row, status: Row['attendance']) {
    try {
      this.rows.set(await this.session.postAuth<Row[]>(`/admin/attendance/${this.examId}/applicants/${r.applicantCode}`, { status }));
      await this.refreshCounts(false);
    } catch (e) { this.fail(e); }
  }

  protected async report() {
    if (this.inc.description.trim().length < 5) return this.fail(null, 'Describe la incidencia.');
    try {
      this.incidents.set(await this.session.postAuth<Incident[]>(`/admin/attendance/${this.examId}/incidents`, {
        type: this.inc.type, description: this.inc.description.trim(), ...(this.roomId ? { roomId: this.roomId } : {}),
        ...(/^\d{8}$/.test(this.inc.code.trim()) ? { applicantCode: this.inc.code.trim() } : {}),
      }));
      this.inc = { type: 'DISPOSITIVO', code: '', description: '' };
      this.msg.set('Incidencia registrada; se avisó a la Comisión.');
      this.msgErr.set(false);
    } catch (e) { this.fail(e); }
  }

  protected async pdf() {
    try { await this.session.download(`/admin/attendance/${this.examId}/rooms/${this.roomId}/list.pdf`, {}, `asistencia-${this.room()?.code ?? 'aula'}.pdf`); } catch (e) { this.fail(e); }
  }

  protected async startCamera() {
    if (typeof BarcodeDetector === 'undefined') return;
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      const v = this.video()!.nativeElement;
      v.srcObject = this.stream;
      await v.play();
      this.camera.set(true);
      const detector = new BarcodeDetector({ formats: ['qr_code'] });
      this.timer = setInterval(async () => {
        if (this.busy()) return;
        const found = await detector.detect(v).catch(() => []);
        // El mismo QR frente a la cámara no se registra dos veces seguidas.
        if (found[0]?.rawValue && found[0].rawValue !== this.lastRaw) {
          this.lastRaw = found[0].rawValue;
          this.scan = found[0].rawValue;
          await this.checkIn();
        }
      }, 400);
    } catch {
      this.fail(null, 'No se pudo abrir la cámara. Usa un lector de QR o escribe el código.');
    }
  }

  protected stopCamera() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    this.stream?.getTracks().forEach((t) => t.stop());
    this.stream = null;
    this.camera.set(false);
  }

  private async refreshCounts(reloadRoom = true) {
    this.board.set(await this.session.get<BoardExam[]>('/admin/attendance'));
    if (reloadRoom) await this.loadRoom();
  }

  private fail(e: unknown, text?: string) {
    this.msg.set(text ?? apiErrorMessage(e));
    this.msgErr.set(true);
  }
}
