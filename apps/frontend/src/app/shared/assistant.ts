import { Component, ElementRef, HostListener, inject, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { ApiService, apiErrorMessage } from '../core/api.service';

interface Line { kind: 'p' | 'li'; text: string }
interface Msg { role: 'user' | 'assistant'; lines: Line[]; sources: string[]; mode?: 'ia' | 'basico' }
type Panel = 'chat' | 'identify' | 'handoff';

const KEY = 'sia-asistente';
const TIP_KEY = 'sia-asistente-globo';

/** Convierte la respuesta en párrafos y viñetas sin usar HTML (no se inyecta nada del modelo). */
function toLines(text: string): Line[] {
  return text
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !/^fuente:/i.test(l))
    .map((l) => (/^([-•*]|\d+\.)\s+/.test(l) ? { kind: 'li' as const, text: l.replace(/^([-•*]|\d+\.)\s+/, '') } : { kind: 'p' as const, text: l }));
}

/**
 * Asistente virtual de Admisión (spec 009, ADR-017): disponible en todas las páginas.
 * El DNI y el código se escriben en «Consultar mi proceso», nunca en la conversación.
 */
@Component({
  selector: 'app-assistant',
  imports: [FormsModule],
  host: { '[class.is-tucked]': 'tucked() && !open()' },
  template: `
    @if (!open()) {
      <button type="button" class="launcher" (click)="toggle()" aria-haspopup="dialog" aria-label="Abrir el asistente de Admisión">
        <span class="launcher__tip" [class.is-quiet]="tipQuiet()" aria-hidden="true">¿Te ayudo con tu admisión?</span>
        <img src="img/asistente-aguila-256.webp" srcset="img/asistente-aguila-128.webp 128w, img/asistente-aguila-256.webp 256w" sizes="88px"
          alt="" width="88" height="88" decoding="async">
      </button>
    } @else {
      <section class="panel" role="dialog" aria-modal="false" aria-labelledby="as-title" (keydown.escape)="toggle()">
        <header class="panel__head">
          <img class="panel__avatar" src="img/asistente-aguila-128.webp" alt="" width="44" height="44">
          <div class="panel__title">
            <h2 id="as-title">Asistente de Admisión</h2>
            <p>{{ aiEnabled() ? 'Con inteligencia artificial · responde con datos oficiales' : 'Respuestas automáticas con datos oficiales' }}@if (who()) { · {{ who() }}}</p>
          </div>
          <button type="button" class="icon-btn" (click)="toggle()" aria-label="Cerrar el asistente">✕</button>
        </header>

        @switch (panel()) {
          @case ('identify') {
            <form class="side" (ngSubmit)="identify()">
              <h3>Consultar mi proceso</h3>
              <p>Escribe tu DNI y tu código de postulante. No se envían a la inteligencia artificial.</p>
              <label for="as-doc">DNI o carné de extranjería</label>
              <input id="as-doc" class="input" name="doc" [(ngModel)]="doc" inputmode="numeric" maxlength="12" autocomplete="off" required>
              <label for="as-code">Código de postulante</label>
              <input id="as-code" class="input" name="code" [(ngModel)]="code" inputmode="numeric" maxlength="8" autocomplete="off" required>
              <div class="row">
                <button class="btn" type="submit" [disabled]="busy()" [attr.aria-busy]="busy()">{{ busy() ? 'Verificando…' : 'Verificar' }}</button>
                <button class="btn btn--quiet" type="button" (click)="panel.set('chat')">Volver</button>
              </div>
            </form>
          }
          @case ('handoff') {
            <form class="side" (ngSubmit)="handoff()">
              <h3>Hablar con una persona</h3>
              <p>La Dirección de Admisión recibirá esta conversación y te responderá por correo.</p>
              <label for="as-name">Nombre</label>
              <input id="as-name" class="input" name="name" [(ngModel)]="name" autocomplete="name" required>
              <label for="as-mail">Correo</label>
              <input id="as-mail" class="input" type="email" name="mail" [(ngModel)]="mail" autocomplete="email" required>
              <div class="row">
                <button class="btn" type="submit" [disabled]="busy() || !conversationId" [attr.aria-busy]="busy()">{{ busy() ? 'Enviando…' : 'Enviar' }}</button>
                <button class="btn btn--quiet" type="button" (click)="panel.set('chat')">Volver</button>
              </div>
              @if (!conversationId) { <p class="note">Escribe primero tu consulta en el chat.</p> }
            </form>
          }
          @default {
            <div class="log" #log aria-live="polite">
              @if (!messages().length) {
                <div class="hello">
                  <p>Hola, te ayudo con fechas, tasas, vacantes, requisitos y el examen. Para ver tu inscripción, pago o aula usa «Consultar mi proceso».</p>
                  <ul class="chips">
                    @for (s of suggestions(); track s) { <li><button type="button" (click)="send(s)">{{ s }}</button></li> }
                  </ul>
                </div>
              }
              @for (m of messages(); track $index) {
                <div class="msg" [class.msg--me]="m.role === 'user'">
                  @for (l of m.lines; track $index) {
                    @if (l.kind === 'li') { <p class="li">{{ l.text }}</p> } @else { <p>{{ l.text }}</p> }
                  }
                  @if (m.sources.length) { <p class="src">Fuente: {{ m.sources.join(' · ') }}</p> }
                </div>
              }
              @if (busy()) { <p class="typing">Consultando datos oficiales…</p> }
            </div>
            @if (notice(); as n) { <p class="notice" role="status">{{ n }}</p> }
            <div class="actions">
              <button type="button" (click)="panel.set('identify')">{{ token ? 'Proceso verificado ✓' : 'Consultar mi proceso' }}</button>
              <button type="button" [class.is-hot]="offerHandoff()" (click)="panel.set('handoff')">Hablar con una persona</button>
            </div>
            <form class="ask" (ngSubmit)="send()">
              <label class="sr-only" for="as-q">Tu pregunta</label>
              <input id="as-q" class="input" name="q" [(ngModel)]="question" maxlength="600" placeholder="Escribe tu pregunta" autocomplete="off" #ask>
              <button class="btn" type="submit" [disabled]="busy() || !question.trim()">Enviar</button>
            </form>
          }
        }
      </section>
    }
  `,
  styles: `
    :host { position: fixed; right: max(1rem, env(safe-area-inset-right)); bottom: max(1rem, env(safe-area-inset-bottom)); z-index: 50;
      transition: transform var(--fast) var(--ease), opacity var(--fast) var(--ease); }
    /* Mientras escribes en un formulario (celular y tableta), el asistente se aparta para no tapar campos. */
    :host(.is-tucked) { transform: translateY(calc(100% + 2rem)); opacity: 0; pointer-events: none; }
    /* Mascota del asistente: el águila sin fondo, con una sombra que la separa del contenido. */
    .launcher { display: flex; align-items: center; gap: 0.25rem; padding: 0; background: transparent; border: 0; font: inherit; cursor: pointer; }
    .launcher img { width: 64px; height: 64px; filter: drop-shadow(0 6px 14px rgba(29, 20, 21, 0.35)); transition: transform var(--fast) var(--ease); }
    .launcher:hover img { transform: translateY(-3px) rotate(-3deg); }
    .launcher:active img { transform: scale(0.96); }
    .launcher:focus-visible { outline: 3px solid var(--gold); outline-offset: 4px; }
    .launcher__tip { background: var(--accent); color: var(--accent-ink); font-weight: 700; font-size: 0.9375rem; padding: 0.55rem 0.85rem;
      box-shadow: 0 6px 18px rgba(29, 20, 21, 0.25); position: relative; transition: background-color var(--fast) var(--ease); }
    .launcher__tip::after { content: ''; position: absolute; right: -7px; top: 50%; margin-top: -7px; border: 7px solid transparent; border-right: 0; border-left-color: var(--accent); }
    .launcher__tip.is-quiet { opacity: 0; transform: translateX(0.5rem); pointer-events: none;
      transition: opacity var(--fast) var(--ease), transform var(--fast) var(--ease); }
    .launcher:hover .launcher__tip, .launcher:focus-visible .launcher__tip { opacity: 1; transform: none; }
    .launcher:hover .launcher__tip { background: var(--accent-press); }
    .launcher:hover .launcher__tip::after { border-left-color: var(--accent-press); }
    .panel__avatar { width: 44px; height: 44px; flex: none; background: var(--ground); }
    .panel__title { flex: 1; min-width: 0; }
    .panel { width: min(26rem, calc(100vw - 2rem)); height: min(40rem, calc(100dvh - 2rem)); display: grid; grid-template-rows: auto 1fr auto auto auto;
      background: var(--ground); box-shadow: 0 16px 48px rgba(29, 20, 21, 0.32); }
    .panel__head { display: flex; align-items: center; gap: 0.75rem; padding: 1rem 1.1rem; background: var(--accent); color: var(--accent-ink); }
    .panel__head h2 { font-size: 1.125rem; letter-spacing: -0.01em; }
    .panel__head p { font-size: 0.8125rem; opacity: 0.9; }
    .icon-btn { background: transparent; color: inherit; border: 0; font-size: 1.1rem; cursor: pointer; width: 2.25rem; height: 2.25rem; }
    .icon-btn:focus-visible { outline: 2px solid var(--gold); }
    .log { overflow-y: auto; padding: 1rem; display: grid; align-content: start; gap: 0.75rem; background: var(--stone); }
    .hello { display: grid; gap: 0.75rem; }
    .chips { list-style: none; margin: 0; padding: 0; display: flex; flex-wrap: wrap; gap: 0.4rem; }
    .chips button { font: inherit; font-size: 0.875rem; text-align: left; padding: 0.45rem 0.7rem; background: var(--ground); border: 0; cursor: pointer; color: var(--accent); font-weight: 600; }
    .chips button:hover { background: var(--accent); color: var(--accent-ink); }
    .msg { background: var(--ground); padding: 0.75rem 0.9rem; display: grid; gap: 0.35rem; max-width: 92%; font-size: 0.9375rem; line-height: 1.45; }
    .msg--me { justify-self: end; background: var(--accent); color: var(--accent-ink); }
    .li { padding-left: 1rem; position: relative; }
    .li::before { content: ''; position: absolute; left: 0.2rem; top: 0.6em; width: 0.35rem; height: 0.35rem; background: var(--accent); }
    .src { font-size: 0.75rem; color: var(--ink-soft); margin-top: 0.25rem; }
    .typing { font-size: 0.875rem; color: var(--ink-soft); }
    .notice { padding: 0.5rem 1rem; font-size: 0.875rem; background: #fbf1d9; color: #6b4a00; }
    .actions { display: flex; gap: 0.35rem; padding: 0.6rem 0.75rem 0; }
    .actions button { flex: 1; font: inherit; font-size: 0.8125rem; font-weight: 700; padding: 0.5rem; background: var(--stone); border: 0; cursor: pointer; color: var(--ink); }
    .actions button:hover, .actions button.is-hot { background: var(--gold); }
    .ask { display: flex; gap: 0.5rem; padding: 0.75rem; }
    .ask .input { flex: 1; min-width: 0; }
    .side { padding: 1.1rem; display: grid; gap: 0.6rem; align-content: start; overflow-y: auto; grid-row: 2 / -1; }
    .side h3 { font-size: 1.25rem; }
    .side label { font-weight: 600; font-size: 0.875rem; margin-top: 0.25rem; }
    .row { display: flex; gap: 0.5rem; margin-top: 0.5rem; }
    .note { font-size: 0.8125rem; color: var(--ink-soft); }
    .sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); }
    @media (max-width: 520px) {
      :host { right: 0.75rem; bottom: 0.75rem; }
      .launcher__tip { display: none; }
      .launcher img { width: 60px; height: 60px; }
      .panel { position: fixed; inset: auto 0 0 0; width: 100vw; height: min(88dvh, 40rem); }
    }
    @media (prefers-reduced-motion: reduce) { :host { transition: none; } .launcher { transition: none; } .launcher:hover { transform: none; } }
    @media print { :host { display: none; } }
  `,
})
export class Assistant {
  private readonly api = inject(ApiService);
  private readonly log = viewChild<ElementRef<HTMLElement>>('log');
  private readonly askInput = viewChild<ElementRef<HTMLInputElement>>('ask');
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  /** Hay un campo de otro formulario enfocado en pantalla angosta: el lanzador se oculta hasta salir del campo. */
  protected readonly tucked = signal(false);
  /** El globo ya se mostró en esta visita: queda oculto salvo al pasar el puntero o enfocar el botón. */
  protected readonly tipQuiet = signal(false);

  protected readonly open = signal(false);
  protected readonly panel = signal<Panel>('chat');
  protected readonly busy = signal(false);
  protected readonly messages = signal<Msg[]>([]);
  protected readonly suggestions = signal<string[]>([]);
  protected readonly aiEnabled = signal(false);
  protected readonly notice = signal<string | null>(null);
  protected readonly offerHandoff = signal(false);
  protected readonly who = signal<string | null>(null);

  protected question = '';
  protected doc = '';
  protected code = '';
  protected name = '';
  protected mail = '';
  protected conversationId: string | undefined;
  protected token: string | undefined;

  @HostListener('document:focusin', ['$event'])
  protected onFocusIn(e: FocusEvent): void {
    const t = e.target as HTMLElement | null;
    this.tucked.set(!!t && !this.host.nativeElement.contains(t) && t.matches('input, select, textarea') && matchMedia('(max-width: 1100px)').matches);
  }

  /** Otra parte de la página (la barra fija de la inscripción) pide abrir el asistente. */
  @HostListener('window:sia-asistente')
  protected openFromPage(): void {
    if (!this.open()) this.toggle();
  }

  @HostListener('document:focusout')
  protected onFocusOut(): void {
    this.tucked.set(false);
  }

  constructor() {
    try {
      if (sessionStorage.getItem(TIP_KEY)) this.tipQuiet.set(true);
      else setTimeout(() => {
        this.tipQuiet.set(true);
        sessionStorage.setItem(TIP_KEY, '1');
      }, 8000);
    } catch {
      this.tipQuiet.set(true);
    }
    try {
      const saved = JSON.parse(sessionStorage.getItem(KEY) ?? '{}') as { conversationId?: string; token?: string; exp?: string; who?: string; messages?: Msg[] };
      this.conversationId = saved.conversationId;
      if (saved.token && saved.exp && new Date(saved.exp) > new Date()) {
        this.token = saved.token;
        this.who.set(saved.who ?? null);
      }
      this.messages.set(saved.messages ?? []);
    } catch {
      // Sin almacenamiento de sesión: el asistente funciona igual, sin recordar la conversación.
    }
  }

  protected toggle(): void {
    this.open.update((v) => !v);
    if (this.open()) {
      if (!this.suggestions().length) {
        this.api.assistantSuggestions().subscribe((s) => {
          this.suggestions.set(s.suggestions);
          this.aiEnabled.set(s.aiEnabled);
        });
      }
      setTimeout(() => this.askInput()?.nativeElement.focus(), 0);
    }
  }

  protected async send(text = this.question): Promise<void> {
    const message = text.trim();
    if (!message || this.busy()) return;
    this.question = '';
    this.notice.set(null);
    this.push({ role: 'user', lines: [{ kind: 'p', text: message }], sources: [] });
    this.busy.set(true);
    try {
      const r = await firstValueFrom(this.api.assistantAsk({
        message,
        ...(this.conversationId ? { conversationId: this.conversationId } : {}),
        ...(this.token ? { accessToken: this.token } : {}),
      }));
      this.conversationId = r.conversationId;
      this.aiEnabled.set(r.mode === 'ia' || this.aiEnabled());
      this.offerHandoff.set(r.suggestHandoff);
      if (this.token && !r.identified) this.forgetPass('Tu verificación venció. Vuelve a «Consultar mi proceso».');
      this.push({ role: 'assistant', lines: toLines(r.reply), sources: r.sources, mode: r.mode });
    } catch (e) {
      this.notice.set(apiErrorMessage(e));
    } finally {
      this.busy.set(false);
    }
  }

  protected async identify(): Promise<void> {
    if (this.doc.trim().length < 6 || !/^\d{8}$/.test(this.code.trim())) {
      this.notice.set('Escribe tu documento y tu código de postulante de 8 dígitos.');
      this.panel.set('chat');
      return;
    }
    this.busy.set(true);
    try {
      const pass = await firstValueFrom(this.api.assistantIdentify(this.doc.trim(), this.code.trim()));
      this.token = pass.accessToken;
      this.who.set(pass.firstName ? `Hola, ${pass.firstName.charAt(0)}${pass.firstName.slice(1).toLowerCase()}` : null);
      this.doc = '';
      this.code = '';
      this.save(pass.expiresAt);
      this.panel.set('chat');
    } catch (e) {
      this.notice.set(apiErrorMessage(e));
      this.panel.set('chat');
      return;
    } finally {
      this.busy.set(false);
    }
    // Con el pase listo, la primera consulta personal sale sola.
    await this.send('¿Cómo va mi proceso?');
  }

  protected async handoff(): Promise<void> {
    if (!this.conversationId) return;
    this.busy.set(true);
    try {
      const r = await firstValueFrom(this.api.assistantHandoff({ conversationId: this.conversationId, name: this.name.trim(), email: this.mail.trim() }));
      this.panel.set('chat');
      this.offerHandoff.set(false);
      this.push({ role: 'assistant', lines: [{ kind: 'p', text: `Listo. Tu caso es el ${r.caseNumber}. La Dirección de Admisión te responderá a ${this.mail.trim()}.` }], sources: [] });
    } catch (e) {
      this.notice.set(apiErrorMessage(e));
      this.panel.set('chat');
    } finally {
      this.busy.set(false);
    }
  }

  private push(m: Msg): void {
    this.messages.update((list) => [...list, m].slice(-40));
    this.save();
    setTimeout(() => {
      const el = this.log()?.nativeElement;
      if (el) el.scrollTop = el.scrollHeight;
    }, 0);
  }

  private forgetPass(notice: string): void {
    this.token = undefined;
    this.who.set(null);
    this.notice.set(notice);
    this.save();
  }

  private save(exp?: string): void {
    try {
      const prev = JSON.parse(sessionStorage.getItem(KEY) ?? '{}') as { exp?: string };
      sessionStorage.setItem(KEY, JSON.stringify({
        conversationId: this.conversationId, token: this.token, exp: exp ?? prev.exp, who: this.who(), messages: this.messages(),
      }));
    } catch {
      // Ver constructor.
    }
  }
}
