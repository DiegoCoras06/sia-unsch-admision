import { Component, computed, inject, input, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ApiService, apiErrorCode, apiErrorMessage } from '../../core/api.service';

/** Las 10 afirmaciones del System Usability Scale (Brooke, 1996), en el orden original. */
const STATEMENTS = [
  'Creo que me gustaría usar este portal con frecuencia.',
  'Encontré el portal innecesariamente complicado.',
  'Pensé que el portal era fácil de usar.',
  'Creo que necesitaría ayuda de una persona con conocimientos técnicos para usar este portal.',
  'Encontré que las funciones del portal estaban bien integradas.',
  'Pensé que había demasiada inconsistencia en el portal.',
  'Imagino que la mayoría de las personas aprendería a usar este portal muy rápidamente.',
  'Encontré el portal muy difícil de usar.',
  'Me sentí muy seguro al usar el portal.',
  'Necesité aprender muchas cosas antes de poder usar el portal.',
];
const SCALE = [
  { value: 1, label: 'Totalmente en desacuerdo' },
  { value: 2, label: 'En desacuerdo' },
  { value: 3, label: 'Ni de acuerdo ni en desacuerdo' },
  { value: 4, label: 'De acuerdo' },
  { value: 5, label: 'Totalmente de acuerdo' },
];

const read = (key: string) => { try { return localStorage.getItem(key); } catch { return null; } };
const write = (key: string, value: string) => { try { localStorage.setItem(key, value); } catch { /* sin almacenamiento: no pasa nada */ } };

/**
 * AC07 (EQ-07): encuesta SUS opcional al terminar la inscripción. Una respuesta por inscripción;
 * se guarda sin datos personales (solo el código, para no contar dos veces a la misma persona).
 */
@Component({
  selector: 'app-usability-survey',
  template: `
    @switch (state()) {
      @case ('invite') {
        <aside class="sus sus--invite no-print" aria-labelledby="sus-title">
          <div>
            <p class="sus__kicker">Encuesta de 1 minuto</p>
            <h2 id="sus-title">¿Qué tal fue inscribirte?</h2>
            <p>Responde 10 afirmaciones sobre el portal. Es opcional y no guarda tus datos personales: nos ayuda a mejorarlo.</p>
          </div>
          <div class="sus__row">
            <button type="button" class="sus__go" (click)="state.set('form')">Responder</button>
            <button type="button" class="sus__later" (click)="later()">Ahora no</button>
          </div>
        </aside>
      }
      @case ('form') {
        <form class="sus no-print" aria-labelledby="sus-title" (submit)="$event.preventDefault(); send()">
          <header class="sus__head">
            <div>
              <p class="sus__kicker">Encuesta de usabilidad</p>
              <h2 id="sus-title">¿Qué tal fue inscribirte?</h2>
              <p>Marca qué tan de acuerdo estás con cada afirmación: 1 es «totalmente en desacuerdo» y 5, «totalmente de acuerdo».</p>
            </div>
            <p class="sus__progress" aria-live="polite"><strong>{{ answered() }}</strong> de 10</p>
          </header>
          <div class="sus__bar" aria-hidden="true"><span [style.width.%]="answered() * 10"></span></div>

          <ol class="sus__list">
            @for (text of statements; track $index; let i = $index) {
              <li>
                <fieldset class="sus__q" [class.is-done]="answers()[i] !== null">
                  <legend><span class="sus__n" aria-hidden="true">{{ i + 1 }}</span>{{ text }}</legend>
                  <div class="sus__scale">
                    @for (o of scale; track o.value) {
                      <label class="sus__opt" [title]="o.label">
                        <input type="radio" [name]="'sus-' + i" [value]="o.value" [checked]="answers()[i] === o.value" (change)="pick(i, o.value)" [attr.aria-label]="o.value + ', ' + o.label">
                        <span>{{ o.value }}</span>
                      </label>
                    }
                  </div>
                  <p class="sus__ends" aria-hidden="true"><span>Totalmente en desacuerdo</span><span>Totalmente de acuerdo</span></p>
                </fieldset>
              </li>
            }
          </ol>

          <div class="field sus__comment">
            <label for="sus-comment">¿Algo que mejorarías? <span class="sus__opt-label">(opcional)</span></label>
            <textarea id="sus-comment" class="input" rows="3" maxlength="500" [value]="comment()" (input)="comment.set(text($event))"></textarea>
          </div>
          @if (error()) { <p class="alert alert--error" role="alert">{{ error() }}</p> }
          <div class="sus__row">
            <button type="submit" class="sus__go" [disabled]="answered() < 10 || busy()" [attr.aria-busy]="busy()">{{ busy() ? 'Enviando…' : 'Enviar respuestas' }}</button>
            <button type="button" class="sus__later" (click)="later()">Ahora no</button>
          </div>
        </form>
      }
      @case ('thanks') {
        <p class="sus sus--thanks no-print" role="status"><strong>¡Gracias por responder!</strong> Tus respuestas nos ayudan a mejorar el portal de admisión.</p>
      }
    }
  `,
  styles: `
    :host { display: block; margin-top: 1.5rem; }
    .sus { display: grid; gap: 1.25rem; padding: clamp(1.25rem, 3vw, 2rem); border-radius: 22px;
      background: linear-gradient(180deg, #fff 0%, #fbf7f3 100%);
      box-shadow: 0 0 0 1px var(--stone-deep), 0 24px 48px -30px rgb(29 20 21 / 0.45), inset 0 1px 0 #fff; }
    .sus h2 { font-size: clamp(1.35rem, 2.4vw, 1.75rem); letter-spacing: -0.02em; }
    .sus p { margin: 0; }
    .sus__kicker { font-size: var(--size-note); font-weight: 700; color: var(--accent); }
    .sus--invite { grid-template-columns: minmax(0, 1fr) auto; align-items: center; border-left: 5px solid var(--gold); }
    .sus__row { display: flex; flex-wrap: wrap; gap: 0.75rem; align-items: center; }
    .sus__go, .sus__later { min-height: 3rem; padding: 0 1.4rem; border-radius: 12px; font: inherit; font-weight: 700; cursor: pointer; }
    .sus__go { color: #fff; border: 1px solid var(--accent-press); background: linear-gradient(180deg, #932830 0%, var(--accent) 55%, #62161b 100%);
      box-shadow: 0 14px 24px -14px rgb(122 28 34 / 0.85), inset 0 1px 0 rgb(255 255 255 / 0.2); }
    .sus__go[disabled] { background: var(--stone-deep); border-color: var(--stone-deep); color: var(--ink-soft); box-shadow: none; cursor: not-allowed; }
    .sus__later { color: var(--ink); background: #fff; border: 1px solid var(--field-line); font-weight: 600; }
    .sus__head { display: flex; justify-content: space-between; gap: 1rem; align-items: flex-start; }
    .sus__head > div { display: grid; gap: 0.35rem; }
    .sus__progress { flex: none; padding: 0.35rem 0.8rem; border-radius: 999px; background: var(--stone); font-size: var(--size-note); white-space: nowrap; }
    .sus__progress strong { color: var(--accent); font-size: 1rem; }
    .sus__bar { height: 6px; border-radius: 999px; background: var(--stone-deep); overflow: hidden; margin-top: -0.5rem; }
    .sus__bar span { display: block; height: 100%; border-radius: inherit; background: linear-gradient(90deg, var(--gold), #e8c86c); transition: width 200ms var(--ease); }
    .sus__list { list-style: none; margin: 0; padding: 0; display: grid; gap: 0.75rem; }
    .sus__q { margin: 0; padding: 0.9rem 1rem; border: 1px solid var(--stone-deep); border-radius: 16px; background: #fff; display: grid; gap: 0.7rem; min-width: 0; }
    .sus__q.is-done { border-color: rgb(217 180 74 / 0.6); box-shadow: inset 4px 0 0 var(--gold); }
    .sus__q legend { display: flex; gap: 0.6rem; align-items: flex-start; padding: 0; font-weight: 600; line-height: 1.4; float: left; width: 100%; }
    .sus__q legend + * { clear: both; }
    .sus__n { display: grid; place-items: center; width: 1.6rem; height: 1.6rem; flex: none; border-radius: 50%; background: var(--stone); color: var(--accent); font-size: 0.8125rem; font-weight: 800; }
    .sus__scale { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 0.4rem; padding: 0.3rem; border-radius: 12px; background: #f1ebe5;
      box-shadow: inset 2px 2px 6px rgb(29 20 21 / 0.1); }
    .sus__opt { position: relative; display: block; cursor: pointer; }
    .sus__opt input { position: absolute; inset: 0; opacity: 0; margin: 0; cursor: pointer; }
    .sus__opt span { display: grid; place-items: center; min-height: 2.75rem; border-radius: 9px; font-weight: 700; color: var(--ink-soft);
      transition: background-color var(--fast) var(--ease), color var(--fast) var(--ease); }
    .sus__opt input:checked + span { background: var(--accent); color: #fff; box-shadow: 0 6px 12px -8px rgb(122 28 34 / 0.9); }
    .sus__opt input:focus-visible + span { outline: 3px solid var(--gold); outline-offset: 2px; }
    @media (hover: hover) { .sus__opt:hover input:not(:checked) + span { background: #fff; color: var(--accent); } }
    .sus__ends { display: flex; justify-content: space-between; gap: 1rem; max-width: none; font-size: 0.75rem; color: var(--ink-soft); }
    .sus__ends span:last-child { text-align: right; }
    .sus__comment label { font-weight: 600; }
    .sus__opt-label { font-weight: 400; color: var(--ink-soft); }
    .sus__comment .input { border-radius: 12px; background: #fbf7f3; resize: vertical; }
    .sus--thanks { display: block; border-left: 5px solid var(--ok, #1f7a3f); }
    @media (max-width: 640px) {
      .sus--invite { grid-template-columns: 1fr; }
      .sus__head { flex-direction: column; }
      .sus__row > button { flex: 1 1 100%; }
    }
    @media (prefers-reduced-motion: reduce) { .sus__bar span, .sus__opt span { transition: none; } }
  `,
})
export class UsabilitySurvey {
  private readonly api = inject(ApiService);
  readonly documentNumber = input.required<string>();
  readonly applicantCode = input.required<string>();
  /** Momento en que se abrió el formulario de inscripción (para medir cuánto tomó). */
  readonly startedAt = input<number | null>(null);

  protected readonly statements = STATEMENTS;
  protected readonly scale = SCALE;
  protected readonly answers = signal<(number | null)[]>(Array(10).fill(null));
  protected readonly comment = signal('');
  protected readonly busy = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly answered = computed(() => this.answers().filter((a) => a !== null).length);
  protected readonly state = signal<'invite' | 'form' | 'thanks' | 'hidden'>('invite');

  private key = () => `sia.sus.${this.applicantCode()}`;

  ngOnInit(): void {
    if (read(this.key())) this.state.set('hidden');
  }

  protected pick(i: number, value: number): void {
    this.answers.update((a) => a.map((v, j) => (j === i ? value : v)));
  }

  protected text(e: Event): string {
    return (e.target as HTMLTextAreaElement).value;
  }

  protected later(): void {
    write(this.key(), 'later');
    this.state.set('hidden');
  }

  protected async send(): Promise<void> {
    if (this.answered() < 10) return;
    this.busy.set(true);
    this.error.set(null);
    const start = this.startedAt();
    const width = window.innerWidth;
    try {
      await firstValueFrom(this.api.usabilitySurvey({
        documentNumber: this.documentNumber(),
        applicantCode: this.applicantCode(),
        answers: this.answers() as number[],
        ...(this.comment().trim() ? { comment: this.comment().trim() } : {}),
        ...(start ? { durationSeconds: Math.min(86_400, Math.round((Date.now() - start) / 1000)) } : {}),
        device: width < 640 ? 'celular' : width < 1024 ? 'tableta' : 'computadora',
      }));
      write(this.key(), 'done');
      this.state.set('thanks');
    } catch (e) {
      if (apiErrorCode(e) === 'SURVEY_ALREADY_ANSWERED') {
        write(this.key(), 'done');
        this.state.set('thanks');
      } else {
        this.error.set(apiErrorMessage(e));
      }
    } finally {
      this.busy.set(false);
    }
  }
}
