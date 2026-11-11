import { Component, ElementRef, OnInit, computed, inject, input, output, signal, viewChild } from '@angular/core';
import type { PaymentSessionDto, PaymentStatusDto, SignedPaymentMessageDto } from '@sia/contracts';
import { firstValueFrom } from 'rxjs';
import { ApiService, apiErrorMessage } from '../../core/api.service';
import { dateTime, soles } from '../../core/format';

/** Respuesta del SDK de Izipay al terminar (research R-04). */
interface IzipayResponse { code?: string; transactionId?: string; payloadHttp?: string; signature?: string; messageUser?: string }
interface IzipayCheckout { LoadForm(o: { authorization: string; keyRSA: string; callbackResponse: (r: IzipayResponse) => void }): void }
type IzipayCtor = new (o: { config: Record<string, unknown> }) => IzipayCheckout;

/** Culqi Checkout (ADR-019): solo se usa con Yape; el token va al servidor, que crea el cargo. */
interface CulqiInstance {
  token?: { id: string };
  error?: { user_message?: string; merchant_message?: string };
  culqi: () => void;
  open(): void;
  close(): void;
}
type CulqiCtor = new (publicKey: string, config: Record<string, unknown>) => CulqiInstance;
const CULQI_SCRIPT = 'https://js.culqi.com/checkout-js';

/** Formulario incrustado de Izipay micuentaweb (Krypton V4). */
interface KrSubmit { rawClientAnswer: string; hash: string; hashKey: string; clientAnswer?: { orderStatus?: string } }
interface KrClient {
  setFormConfig(c: Record<string, unknown>): Promise<unknown>;
  renderElements(selector: string): Promise<unknown>;
  onSubmit(cb: (e: KrSubmit) => boolean): Promise<unknown>;
  onError(cb: (e: { errorMessage?: string; detailedErrorMessage?: string }) => void): Promise<unknown>;
  removeForms?(): Promise<unknown>;
}

const scripts = new Map<string, Promise<void>>();
/** Carga el SDK de Izipay una sola vez, solo cuando el postulante decide pagar. */
function loadScript(src: string, attrs: Record<string, string> = {}): Promise<void> {
  let p = scripts.get(src);
  if (!p) {
    p = new Promise<void>((resolve, reject) => {
      const s = document.createElement('script');
      s.src = src;
      s.async = true;
      for (const [k, v] of Object.entries(attrs)) s.setAttribute(k, v);
      s.onload = () => resolve();
      s.onerror = () => {
        scripts.delete(src);
        reject(new Error('No se pudo cargar el formulario de Izipay. Revisa tu conexión.'));
      };
      document.head.appendChild(s);
    });
    scripts.set(src, p);
  }
  return p;
}

/**
 * Spec 005 H1–H2 (ADR-016): pagar la orden en línea con el formulario certificado de Izipay
 * (o el simulado en local), ver la constancia de pago y el historial de intentos.
 */
@Component({
  selector: 'app-online-payment',
  template: `
    <section class="pay" aria-labelledby="pay-title">
      @let st = status();
      @if (st?.order?.status === 'PAGADA' && st?.order?.receipt; as rc) {
        <div class="pay__ok" role="status">
          <h3 id="pay-title">Pago confirmado</h3>
          <dl>
            <div><dt>Monto</dt><dd>{{ money(st!.order.amount) }}</dd></div>
            <div><dt>Fecha</dt><dd>{{ when(st!.order.paidAt!) }}</dd></div>
            <div><dt>N.° de operación</dt><dd>{{ rc.operationNumber ?? '-' }}</dd></div>
            <div><dt>Autorización</dt><dd>{{ rc.authorizationCode ?? '-' }}</dd></div>
            <div><dt>Medio</dt><dd>{{ method(rc.payMethod) }}@if (rc.cardMasked) {, {{ rc.cardMasked }}}</dd></div>
            <div><dt>Pedido</dt><dd>{{ st!.order.orderNumber }}</dd></div>
          </dl>
          <p class="note">Constancia de pago del proceso de admisión. No es un comprobante electrónico SUNAT.</p>
        </div>
      } @else {
        <div class="pay__cta">
          <div>
            <h3 id="pay-title">Paga en línea</h3>
            <p>Con tarjeta de débito o crédito (Izipay)@if (st?.yape) { o con <strong>Yape</strong> (Culqi)}. Tu inscripción queda <strong>Apta</strong> en cuanto se confirma el pago.</p>
            @if (env() === 'sandbox') { <p class="tag">Ambiente de pruebas Izipay - no se realizan cobros reales</p> }
            @if (env() === 'simulated') { <p class="tag">Pasarela simulada - no se realizan cobros</p> }
          </div>
          <button type="button" class="btn btn--gold no-print" (click)="start()" [disabled]="busy()">
            {{ busy() ? 'Abriendo…' : 'Pagar ' + money(amount()) }}
          </button>
        </div>

        <dialog class="ck no-print" #checkout aria-labelledby="ck-title" (close)="closeCheckout()" (cancel)="closeCheckout()">
          <header class="ck__head">
            <svg class="ck__basket" viewBox="0 0 48 40" width="44" height="36" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round" d="M4 15h40l-4 21H8L4 15Zm8 0 8-11m16 11-8-11M15 21v9m6-9v9m6-9v9m6-9v9"/></svg>
            <div class="ck__order">
              <h2 id="ck-title" class="ck__title">Número de pedido</h2>
              <p class="ck__num">{{ order() }}</p>
            </div>
            <button type="button" class="ck__x" (click)="closeCheckout()" aria-label="Cerrar el pago">
              <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><circle cx="12" cy="12" r="10.5" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="m8 8 8 8m0-8-8 8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>
            </button>
          </header>

          <div class="ck__body">
            <div class="ck__methods" role="radiogroup" aria-label="Medio de pago">
              <button type="button" class="ck__method" [class.is-on]="payWith() === 'card'" role="radio" [attr.aria-checked]="payWith() === 'card'" (click)="chooseCard()">
                <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true"><rect x="2.5" y="5" width="19" height="14" rx="2" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M2.5 9.5h19M6 15h4" stroke="currentColor" stroke-width="1.6"/></svg>
                <span>Tarjeta</span>
                @if (payWith() === 'card') { <svg class="ck__check" viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><circle cx="12" cy="12" r="11" fill="currentColor"/><path d="m7 12.5 3.2 3L17 9" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg> }
              </button>
              @if (st?.yape) {
                <button type="button" class="ck__method ck__method--yape" [class.is-on]="payWith() === 'yape'" role="radio" [attr.aria-checked]="payWith() === 'yape'" (click)="payWith.set('yape')">
                  <span class="ck__yape-mark" aria-hidden="true">yape</span>
                  <span>Yape</span>
                  @if (payWith() === 'yape') { <svg class="ck__check" viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><circle cx="12" cy="12" r="11" fill="currentColor"/><path d="m7 12.5 3.2 3L17 9" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg> }
                </button>
              }
            </div>
            <p class="ck__methods-note">
              @if (payWith() === 'card') { Débito o crédito: Visa, Mastercard, American Express y Diners Club. }
              @else { Paga desde tu app Yape, hasta S/ {{ st?.yape?.maxAmount }} por pago. Lo procesa Culqi. }
            </p>

            <p class="ck__tip">
              <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M12 2.5 4 5.5v6c0 4.9 3.4 8.9 8 10 4.6-1.1 8-5.1 8-10v-6l-8-3Z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><path d="m8.5 12 2.4 2.4L15.5 9.8" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>
              Recuerda activar tus compras por internet
            </p>

            <dl class="ck__who">
              <div><dt>Comercio</dt><dd>Universidad Nacional de San Cristóbal de Huamanga</dd></div>
              <div><dt>Concepto</dt><dd>Derecho de inscripción, código {{ applicantCode() }}</dd></div>
            </dl>

            @if (payWith() === 'yape') {
              <div class="ck__yape">
                <ol>
                  <li>Ten a la mano el <strong>celular de tu cuenta Yape</strong>.</li>
                  <li>En tu app Yape toca <strong>«Aprobar compras»</strong> y copia el código de 6 dígitos: vale 2 minutos.</li>
                  <li>Pulsa el botón de abajo y escribe ambos datos en la ventana de Culqi.</li>
                </ol>
                <button type="button" class="ck__yape-btn" (click)="payWithYape()" [disabled]="busy()" [attr.aria-busy]="busy()">{{ busy() ? 'Procesando…' : 'Pagar ' + money(amount()) + ' con Yape' }}</button>
                @if (yapeEnv() === 'sandbox') { <p class="ck__sandbox">Ambiente de pruebas de Culqi: usa el celular 900 000 001 y cualquier código de 6 dígitos.</p> }
              </div>
            }
            @if (cardDown() && payWith() === 'card') {
              <div class="ck__down" role="status">
                <p>{{ cardDown() }}</p>
                <button type="button" class="btn btn--quiet" (click)="retryCard()" [disabled]="busy()" [attr.aria-busy]="busy()">{{ busy() ? 'Reintentando…' : 'Reintentar con tarjeta' }}</button>
              </div>
            }
            <div id="kr-form" class="ck__form" [hidden]="payWith() !== 'card' || !!cardDown()">
              <div class="kr-embedded" kr-placeholder-pan="Número de tarjeta" kr-placeholder-expiry="Caducidad" kr-placeholder-security-code="CVV">
                <div class="kr-pan"></div>
                <div class="ck__pair">
                  <div class="kr-expiry"></div>
                  <div class="kr-security-code"></div>
                </div>
                <div class="kr-form-error"></div>
                <button class="kr-payment-button"></button>
              </div>
            </div>
            @if (env() === 'sandbox' && payWith() === 'card' && !cardDown()) { <p class="ck__sandbox">Ambiente de pruebas: no se realizan cobros reales.</p> }
          </div>

          <footer class="ck__foot">
            @if (payWith() === 'card') {
              <span>Tus datos de tarjeta van directo a Izipay; la UNSCH no los ve.</span>
              <span class="ck__brand" aria-label="Powered by izipay">POWERED BY <b><i>izi</i>pay</b></span>
            } @else {
              <span>Tu celular y tu código van directo a Culqi; la UNSCH no los ve.</span>
              <span class="ck__brand" aria-label="Pagos con Culqi">PAGOS CON <b class="ck__culqi">Culqi</b></span>
            }
          </footer>
        </dialog>

        @if (mock(); as m) {
          <div class="pay__mock no-print" role="dialog" aria-label="Pasarela simulada">
            <p><strong>Pasarela simulada:</strong> pedido {{ m.orderNumber }}, {{ money(m.amount) }}</p>
            <p class="note">Simula la respuesta firmada del formulario de pago. El servidor la verifica igual que la de Izipay.</p>
            <div class="row">
              <button type="button" class="btn" (click)="finishMock(true)" [disabled]="busy()">Aprobar pago</button>
              <button type="button" class="btn btn--quiet" (click)="finishMock(false)" [disabled]="busy()">Rechazar pago</button>
            </div>
          </div>
        }
      }

      @if (message(); as msg) { <p class="alert" [class.alert--error]="msgKind() === 'error'" [class.alert--info]="msgKind() === 'info'" [class.alert--ok]="msgKind() === 'ok'" role="alert">{{ msg }}</p> }

      @if (st?.attempts?.length) {
        <details class="pay__history">
          <summary>Historial de pagos en línea ({{ st!.attempts.length }})</summary>
          <ul>
            @for (a of st!.attempts; track a.transactionId) {
              <li><span>{{ when(a.createdAt) }}, pedido {{ a.orderNumber }}</span><strong>{{ a.label }}</strong>@if (a.message) {<small>{{ a.message }}</small>}</li>
            }
          </ul>
        </details>
      }
    </section>
  `,
  styles: `
    .pay { display: grid; gap: 1rem; }
    .pay__cta { display: flex; gap: 1.5rem; align-items: center; justify-content: space-between; background: var(--accent); color: var(--accent-ink); padding: 1.5rem; }
    .pay__cta h3 { font-size: 1.5rem; color: var(--gold); }
    .pay__cta p { max-width: 46ch; }
    .tag { display: inline-block; margin-top: 0.5rem; padding: 0.2rem 0.6rem; background: rgba(255, 255, 255, 0.14); font-size: var(--size-note); font-weight: 700; }
    .btn--gold { white-space: nowrap; }
    /* Ventana de pago al estilo del checkout de Izipay (fondo blanco, verde azulado de la marca). */
    .ck { --izi: #00807b; --izi-press: #006a66; --line: #d5d9de; width: min(36rem, calc(100vw - 1.5rem)); max-height: calc(100dvh - 1.5rem);
      padding: 0; border: 0; border-radius: 12px; background: #fff; color: #1f2933; box-shadow: 0 24px 64px rgb(0 0 0 / 0.35); overflow: auto; }
    .ck::backdrop { background: rgb(17 17 17 / 0.62); }
    .ck__head { display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: 1rem; margin: 0 2.25rem; padding: 1.75rem 0 1.25rem; border-bottom: 1px solid var(--line); }
    .ck__basket { color: #1d5fa8; }
    .ck__order { text-align: right; }
    .ck__title { font-size: 1rem; font-weight: 500; letter-spacing: 0; color: #2b3440; }
    .ck__num { margin: 0; font-size: 1.25rem; font-weight: 700; font-variant-numeric: tabular-nums; max-width: none; }
    .ck__x { align-self: start; display: grid; place-items: center; width: 2.75rem; height: 2.75rem; margin: -0.6rem -0.9rem 0 0; color: #2b3440; background: none; border: 0; border-radius: 50%; cursor: pointer; }
    .ck__x:hover { background: #f1f3f5; }
    .ck__body { display: grid; gap: 1.1rem; padding: 1.25rem 2.25rem 1.5rem; }
    .ck__methods { display: grid; grid-template-columns: minmax(0, 9rem) 1fr; align-items: center; gap: 1rem; }
    .ck__methods { grid-template-columns: repeat(2, minmax(0, 9rem)); }
    .ck__method { position: relative; display: grid; gap: 0.6rem; justify-items: start; padding: 1rem; font: inherit; text-align: left; cursor: pointer;
      background: #fff; border: 1.5px solid var(--line); border-radius: 6px; color: #4a5562; font-weight: 700; }
    .ck__method.is-on { border-color: var(--izi); color: var(--izi); box-shadow: 0 2px 6px rgb(0 0 0 / 0.08); }
    .ck__method--yape.is-on { border-color: #742284; color: #742284; }
    .ck__method--yape .ck__check { color: #742284; }
    .ck__yape-mark { display: inline-grid; place-items: center; height: 24px; padding: 0 0.4rem; border-radius: 6px; background: #742284; color: #fff; font-size: 0.8125rem; font-weight: 800; font-style: italic; }
    .ck__yape { display: grid; gap: 1rem; }
    .ck__yape ol { margin: 0; padding-left: 1.2rem; display: grid; gap: 0.45rem; font-size: 0.9375rem; }
    .ck__yape-btn { width: 100%; min-height: 3.4rem; border: 0; border-radius: 4px; background: #742284; color: #fff; font: inherit; font-size: 1.125rem; font-weight: 700; cursor: pointer; }
    .ck__yape-btn:hover { background: #5d1b6a; }
    .ck__yape-btn[disabled] { opacity: 0.7; cursor: progress; }
    .ck__culqi { color: #00a19b; }
    .ck__method span { color: #1f2933; }
    .ck__check { position: absolute; top: 0.6rem; right: 0.6rem; color: var(--izi); }
    .ck__methods-note { margin: -0.35rem 0 0; font-size: 0.9375rem; color: #4a5562; }
    .ck__tip { display: flex; align-items: center; justify-content: center; gap: 0.75rem; margin: 0; max-width: none; padding: 0.95rem 1rem; background: #f4f6fa; border-radius: 4px; font-size: 0.9375rem; }
    .ck__who { margin: 0; display: grid; gap: 0.35rem; font-size: 0.9375rem; }
    .ck__who div { display: grid; grid-template-columns: 6.5rem 1fr; gap: 0.5rem; }
    .ck__who dt { color: #4a5562; }
    .ck__who dd { margin: 0; font-weight: 600; }
    .ck__sandbox { margin: 0; font-size: 0.875rem; color: #8a5a00; font-weight: 600; }
    .ck__down { display: grid; gap: 0.75rem; padding: 1rem; border-radius: 10px; background: #fbf1d9; color: #6b4a00; font-weight: 500; }
    .ck__down p { margin: 0; }
    .ck__foot { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 0.5rem 1rem; padding: 1rem 2.25rem 1.25rem; border-top: 1px solid var(--line); font-size: 0.8125rem; color: #4a5562; }
    .ck__brand { letter-spacing: 0.08em; font-size: 0.75rem; font-weight: 600; }
    .ck__brand b { font-size: 1rem; letter-spacing: 0; color: #00807b; }
    .ck__brand i { font-style: normal; color: #e0353b; }
    /* Campos de Izipay (Krypton): se insertan en la página, por eso los estilos atraviesan el componente. */
    .ck__form { min-height: 12rem; }
    :host ::ng-deep .ck .kr-embedded { width: 100% !important; display: grid !important; gap: 1rem; }
    :host ::ng-deep .ck .ck__pair { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    :host ::ng-deep .ck .kr-embedded .kr-pan, :host ::ng-deep .ck .kr-embedded .kr-expiry, :host ::ng-deep .ck .kr-embedded .kr-security-code {
      width: 100% !important; margin: 0 !important; }
    :host ::ng-deep .ck .kr-embedded .kr-field-wrapper, :host ::ng-deep .ck .kr-embedded .kr-field-element {
      min-height: 3.1rem; border: 1px solid #7d8590 !important; border-radius: 4px !important; background: #fff !important; }
    :host ::ng-deep .ck .kr-embedded .kr-field.kr-focus .kr-field-wrapper, :host ::ng-deep .ck .kr-embedded .kr-focus .kr-field-element {
      border-color: var(--izi) !important; box-shadow: 0 0 0 2px rgb(0 128 123 / 0.35); }
    :host ::ng-deep .ck .kr-embedded .kr-payment-button {
      width: 100% !important; min-height: 3.4rem; margin: 0.4rem 0 0 !important; border: 0 !important; border-radius: 4px !important;
      background: var(--izi) !important; color: #fff !important; font: inherit !important; font-size: 1.25rem !important; font-weight: 700 !important; text-transform: none !important; cursor: pointer; }
    :host ::ng-deep .ck .kr-embedded .kr-payment-button:hover { background: var(--izi-press) !important; }
    :host ::ng-deep .ck .kr-embedded .kr-payment-button *, :host ::ng-deep .ck .kr-embedded button.kr-payment-button span {
      color: #fff !important; font-family: inherit !important; font-size: 1.25rem !important; font-weight: 700 !important; text-transform: none !important; letter-spacing: 0 !important; }
    @media (max-width: 520px) {
      .ck__head { margin: 0 1.25rem; padding-top: 1.25rem; }
      .ck__body { padding: 1rem 1.25rem 1.25rem; }
      .ck__foot { padding: 0.9rem 1.25rem 1rem; }
      .ck__methods { grid-template-columns: 1fr; }
      .ck__who div { grid-template-columns: 1fr; gap: 0; }
    }
    .pay__mock { border: 2px dashed var(--accent); padding: 1.25rem; display: grid; gap: 0.5rem; background: #fff; }
    .row { display: flex; gap: 0.5rem; flex-wrap: wrap; }
    .pay__ok { background: #e3f1e8; color: #164d2a; padding: 1.5rem; display: grid; gap: 1rem; }
    .pay__ok h3 { font-size: 1.5rem; }
    .pay__ok dl { margin: 0; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 0.75rem 1.5rem; }
    .pay__ok dt { font-size: var(--size-note); font-weight: 600; opacity: 0.8; }
    .pay__ok dd { margin: 0; font-weight: 700; }
    .pay__history summary { cursor: pointer; font-weight: 700; }
    .pay__history ul { list-style: none; padding: 0; margin: 0.75rem 0 0; display: grid; gap: 0.5rem; }
    .pay__history li { display: grid; grid-template-columns: 1fr auto; gap: 0 1rem; }
    .pay__history small { grid-column: 1 / -1; color: var(--ink-soft); }
    .note { font-size: var(--size-note); }
    @media (max-width: 640px) {
      .pay__cta { flex-direction: column; align-items: stretch; }
      .pay__ok dl { grid-template-columns: 1fr 1fr; }
    }
  `,
})
export class OnlinePayment implements OnInit {
  private readonly api = inject(ApiService);
  readonly documentNumber = input.required<string>();
  readonly applicantCode = input.required<string>();
  readonly amount = input.required<string>();
  /** Se emite cuando el pago queda confirmado (la página recarga el estado de la inscripción). */
  readonly paid = output<void>();

  protected readonly status = signal<PaymentStatusDto | null>(null);
  protected readonly env = signal<PaymentSessionDto['environment'] | null>(null);
  protected readonly mock = signal<PaymentSessionDto | null>(null);
  /** Ventana de pago de micuentaweb abierta. */
  protected readonly krypton = signal(false);
  protected readonly order = signal('');
  /** Medio elegido en la ventana: tarjeta (Izipay) o Yape (Culqi, ADR-019). */
  protected readonly payWith = signal<'card' | 'yape'>('card');
  /** La pasarela de tarjeta no respondió: la ventana se abre igual con Yape (Culqi es independiente, ADR-019). */
  protected readonly cardDown = signal<string | null>(null);
  protected readonly yapeEnv = computed(() => this.status()?.yape?.environment ?? null);
  private readonly checkout = viewChild<ElementRef<HTMLDialogElement>>('checkout');
  protected readonly busy = signal(false);
  protected readonly message = signal<string | null>(null);
  protected readonly msgKind = signal<'error' | 'info' | 'ok'>('info');
  protected readonly money = soles;
  protected readonly when = dateTime;

  ngOnInit(): void {
    void this.refresh();
  }

  protected method(m: string | null): string {
    return ({ CARD: 'Tarjeta', QR: 'QR', YAPE_CODE: 'Yape', PAGO_PUSH: 'Plin', APPLE_PAY: 'Apple Pay' } as Record<string, string>)[m ?? ''] ?? (m ?? 'En línea');
  }

  protected async start(): Promise<void> {
    this.message.set(null);
    this.busy.set(true);
    try {
      const s = await firstValueFrom(this.api.paymentSession(this.documentNumber(), this.applicantCode()));
      this.env.set(s.environment);
      if (!s.checkout) {
        this.mock.set(s);
        return;
      }
      const { scriptUrl, config, authorization, keyRSA } = s.checkout;
      if (config['kind'] === 'krypton') {
        await this.openKrypton(s, scriptUrl, String(config['theme']), authorization, keyRSA);
        return;
      }
      await loadScript(scriptUrl);
      const Izipay = (window as unknown as { Izipay?: IzipayCtor }).Izipay;
      if (!Izipay) throw new Error('El formulario de Izipay no está disponible.');
      new Izipay({ config }).LoadForm({ authorization, keyRSA, callbackResponse: (r) => void this.onIzipay(s, r) });
    } catch (e) {
      if ((e as { status?: number }).status === 502 && this.status()?.yape) this.openWithoutCard(e);
      else this.fail(e);
    } finally {
      this.busy.set(false);
    }
  }

  protected chooseCard(): void {
    this.payWith.set('card');
    if (!this.krypton()) void this.start();
  }

  /** Abre la ventana con Yape elegido y explica que la tarjeta no está disponible por ahora. */
  private openWithoutCard(_e: unknown): void {
    this.cardDown.set('El pago con tarjeta (Izipay) no está disponible en este momento. Paga con Yape o inténtalo con tarjeta más tarde.');
    this.order.set('Se asigna al pagar');
    this.payWith.set('yape');
    this.krypton.set(true);
    this.checkout()?.nativeElement.showModal();
  }

  protected async retryCard(): Promise<void> {
    this.closeCheckout();
    await this.start();
  }

  /**
   * Yape (ADR-019): abre el intento, cierra esta ventana (Culqi abre la suya encima) y envía el token al servidor,
   * que crea el cargo y confirma el pago con la respuesta de Culqi.
   */
  protected async payWithYape(): Promise<void> {
    this.message.set(null);
    this.busy.set(true);
    try {
      const s = await firstValueFrom(this.api.yapeSession(this.documentNumber(), this.applicantCode()));
      await loadScript(CULQI_SCRIPT);
      const Ctor = (window as unknown as { CulqiCheckout?: CulqiCtor }).CulqiCheckout;
      if (!Ctor) throw new Error('No se pudo abrir Yape. Revisa tu conexión e inténtalo de nuevo.');
      const culqi = new Ctor(s.publicKey, {
        settings: { title: 'Admisión UNSCH 2027-I', currency: 'PEN', amount: s.amountCents },
        options: {
          lang: 'auto', installments: false, modal: true,
          paymentMethods: { tarjeta: false, yape: true, billetera: false, bancaMovil: false, agente: false, cuotealo: false },
          paymentMethodsSort: ['yape'],
        },
        appearance: {
          theme: 'default', menuType: 'sidebar', buttonCardPayText: 'Pagar',
          defaultStyle: { bannerColor: '#7a1c22', buttonBackground: '#742284', menuColor: '#742284', linksColor: '#7a1c22', buttonTextColor: '#ffffff', priceColor: '#7a1c22' },
        },
      });
      culqi.culqi = () => {
        if (culqi.token) {
          const token = culqi.token.id;
          culqi.close();
          void this.chargeYape(s.transactionId, token);
        } else if (culqi.error) {
          this.show(culqi.error.user_message || 'Culqi no pudo procesar el pago con Yape. Inténtalo de nuevo.', 'error');
        }
      };
      this.closeCheckout();
      culqi.open();
    } catch (e) {
      this.fail(e);
    } finally {
      this.busy.set(false);
    }
  }

  private async chargeYape(transactionId: string, token: string): Promise<void> {
    this.busy.set(true);
    this.show('Confirmando tu pago con Yape…', 'info');
    try {
      const res = await firstValueFrom(this.api.yapeCharge(this.documentNumber(), this.applicantCode(), transactionId, token));
      if (res.status === 'AUTORIZADO') this.show('¡Pago con Yape confirmado! Tu inscripción quedó Apta.', 'ok');
      else this.show(`${res.label}. ${res.message ?? ''} Puedes intentarlo de nuevo.`.trim(), 'error');
      await this.refresh();
      if (res.orderStatus === 'PAGADA') this.paid.emit();
    } catch (e) {
      this.fail(e);
    } finally {
      this.busy.set(false);
    }
  }

  protected async finishMock(approve: boolean): Promise<void> {
    const s = this.mock();
    if (!s) return;
    this.busy.set(true);
    try {
      const signed = await firstValueFrom(this.api.paymentMockComplete(s.transactionId, approve));
      this.mock.set(null);
      await this.confirm(signed);
    } catch (e) {
      this.fail(e);
    } finally {
      this.busy.set(false);
    }
  }

  /** micuentaweb: carga el cliente Krypton con la clave pública y dibuja el formulario con el formToken. */
  private async openKrypton(s: PaymentSessionDto, scriptUrl: string, theme: string, formToken: string, publicKey: string): Promise<void> {
    if (!document.querySelector(`link[href="${theme}-reset.min.css"]`)) {
      const css = document.createElement('link');
      css.rel = 'stylesheet';
      css.href = `${theme}-reset.min.css`;
      document.head.appendChild(css);
    }
    await loadScript(scriptUrl, { 'kr-public-key': publicKey, 'kr-language': 'es-ES' });
    await loadScript(`${theme}.js`);
    const KR = (window as unknown as { KR?: KrClient }).KR;
    if (!KR) throw new Error('El formulario de Izipay no está disponible.');
    this.order.set(s.orderNumber);
    this.payWith.set('card');
    this.krypton.set(true);
    this.checkout()?.nativeElement.showModal();
    await KR.setFormConfig({
      formToken, 'kr-language': 'es-ES',
      'kr-placeholder-pan': 'Número de tarjeta', 'kr-placeholder-expiry': 'Caducidad', 'kr-placeholder-security-code': 'CVV',
    });
    await KR.onError((e) => this.show(e.detailedErrorMessage || e.errorMessage || 'Izipay no pudo procesar el pago. Inténtalo de nuevo.', 'error'));
    await KR.onSubmit((e) => {
      void this.confirm({ transactionId: s.transactionId, payloadHttp: e.rawClientAnswer, signature: e.hash, code: e.hashKey }).then(() => this.closeCheckout());
      return false; // la web se queda en la página; el servidor verifica la firma.
    });
    // Con el formulario ya en la página, Krypton lo dibuja al recibir el formToken; solo se pide si aún no existe.
    if (!document.querySelector('#kr-form iframe')) await KR.renderElements('#kr-form');
  }

  /** Cierra la ventana de pago (botón ×, tecla Esc o pago terminado). */
  protected closeCheckout(): void {
    const d = this.checkout()?.nativeElement;
    if (d?.open) d.close();
    this.krypton.set(false);
    this.cardDown.set(null);
  }

  private async onIzipay(s: PaymentSessionDto, r: IzipayResponse): Promise<void> {
    if (!r.payloadHttp || !r.signature) {
      // Ventana cerrada o error de comunicación: el servidor consultará a Izipay al revisar el estado.
      this.show(r.messageUser || 'No se completó el pago. Si se debitó, aparecerá confirmado en unos minutos.', 'info');
      await this.refresh();
      return;
    }
    await this.confirm({ code: r.code, transactionId: r.transactionId ?? s.transactionId, payloadHttp: r.payloadHttp, signature: r.signature });
  }

  private async confirm(message: SignedPaymentMessageDto): Promise<void> {
    try {
      const res = await firstValueFrom(this.api.paymentConfirm(message));
      if (res.status === 'AUTORIZADO') this.show('¡Pago confirmado! Tu inscripción quedó Apta.', 'ok');
      else if (res.status === 'RECHAZADO') this.show(`${res.label}. ${res.message ?? ''} Puedes intentarlo de nuevo.`.trim(), 'error');
      else this.show(`${res.label}. ${res.message ?? ''}`.trim(), 'info');
      await this.refresh();
      if (res.orderStatus === 'PAGADA') this.paid.emit();
    } catch (e) {
      this.fail(e);
    }
  }

  private async refresh(): Promise<void> {
    try {
      const st = await firstValueFrom(this.api.paymentStatus(this.documentNumber(), this.applicantCode()));
      this.status.set(st);
      this.env.set(st.environment);
    } catch {
      // El estado es complementario: si falla, el botón de pago sigue disponible.
    }
  }

  private show(text: string, kind: 'error' | 'info' | 'ok'): void {
    this.message.set(text);
    this.msgKind.set(kind);
  }

  private fail(e: unknown): void {
    this.show(e instanceof Error && !(e as { status?: number }).status ? e.message : apiErrorMessage(e), 'error');
  }
}
