import { Component, OnInit, inject, input, output, signal } from '@angular/core';
import type { PaymentSessionDto, PaymentStatusDto } from '@sia/contracts';
import { firstValueFrom } from 'rxjs';
import { ApiService, apiErrorMessage } from '../../core/api.service';
import { dateTime, soles } from '../../core/format';

/** Culqi Checkout (ADR-024): su ventana cobra con tarjeta o Yape y entrega un token; el cargo lo hace el servidor. */
interface CulqiInstance {
  token?: { id: string };
  error?: { user_message?: string; merchant_message?: string };
  culqi: () => void;
  open(): void;
  close(): void;
}
type CulqiCtor = new (publicKey: string, config: Record<string, unknown>) => CulqiInstance;
const CULQI_SCRIPT = 'https://js.culqi.com/checkout-js';

/** Tokens de la pasarela simulada (solo en desarrollo; el servidor los rechaza con Culqi real). */
const MOCK = { card: 'mock_tarjeta_aprobada', yape: 'mock_yape_aprobado', rejected: 'mock_rechazado' } as const;

let culqiScript: Promise<void> | null = null;
/** Carga Culqi Checkout una sola vez, solo cuando el postulante decide pagar. */
function loadCulqi(): Promise<void> {
  culqiScript ??= new Promise<void>((resolve, reject) => {
    const s = document.createElement('script');
    s.src = CULQI_SCRIPT;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => {
      culqiScript = null;
      reject(new Error('No se pudo abrir el formulario de pago. Revisa tu conexión e inténtalo de nuevo.'));
    };
    document.head.appendChild(s);
  });
  return culqiScript;
}

/**
 * Spec 005 H1–H2 (ADR-024): pagar la orden en línea con Culqi Checkout (tarjeta o Yape),
 * ver la constancia de pago y el historial de intentos. En local, la pasarela simulada.
 */
@Component({
  selector: 'app-online-payment',
  template: `
    <section class="pay" aria-labelledby="pay-title">
      @let st = status();
      @if (st?.order?.status === 'PAGADA' && st?.order?.receipt; as rc) {
        <div class="pay__ok" role="status">
          <h3 id="pay-title"><span class="pay__badge"><svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg></span>Pago confirmado</h3>
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
            <p class="pay__secure"><svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false"><rect x="5" y="10.5" width="14" height="10" rx="2.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>Pago seguro con Culqi</p>
            <h3 id="pay-title">Paga en línea</h3>
            <p>Con tarjeta de débito o crédito o con <strong>Yape</strong>, en el formulario seguro de Culqi. Tu inscripción queda <strong>Apta</strong> en cuanto se confirma el pago.</p>
            <ul class="pay__methods" aria-label="Medios de pago">
              <li>Visa</li><li>Mastercard</li><li>American Express</li><li>Diners Club</li><li>Yape</li>
            </ul>
            @if (env() === 'sandbox') { <p class="tag">Ambiente de pruebas de Culqi: no se realizan cobros reales</p> }
            @if (env() === 'simulated') { <p class="tag">Pasarela simulada: no se realizan cobros</p> }
          </div>
          <div class="pay__act">
            <p class="pay__amount"><span>Total a pagar</span><strong>{{ money(amount()) }}</strong></p>
            <button type="button" class="btn btn--gold no-print" (click)="start()" [disabled]="busy()" [attr.aria-busy]="busy()">
              {{ busy() ? 'Abriendo…' : 'Pagar ahora' }}
            </button>
          </div>
        </div>

        @if (env() === 'sandbox') {
          <details class="pay__test no-print">
            <summary>Datos de prueba de Culqi</summary>
            <p>Tarjeta Visa <strong>4111 1111 1111 1111</strong>, vencimiento futuro (por ejemplo 09/30) y CVV <strong>123</strong>. Yape: celular <strong>900 000 001</strong> y cualquier código de 6 dígitos.</p>
          </details>
        }

        @if (mock(); as m) {
          <div class="pay__mock no-print" role="dialog" aria-label="Pasarela simulada">
            <p><strong>Pasarela simulada:</strong> pedido {{ m.orderNumber }}, {{ money(m.amount) }}</p>
            <p class="note">Simula la respuesta de Culqi: el servidor cobra igual que con la pasarela real.</p>
            <div class="row">
              <button type="button" class="btn" (click)="finishMock('card')" [disabled]="busy()">Pagar con tarjeta</button>
              @if (m.yape) { <button type="button" class="btn" (click)="finishMock('yape')" [disabled]="busy()">Pagar con Yape</button> }
              <button type="button" class="btn btn--quiet" (click)="finishMock('rejected')" [disabled]="busy()">Rechazar pago</button>
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
    .pay { display: grid; gap: 1rem; container-type: inline-size; }
    /* Tarjeta guinda con luz dorada: a la izquierda qué se paga y con qué; a la derecha, el monto y el botón. */
    .pay__cta { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 1.5rem 2rem; align-items: center; padding: clamp(1.25rem, 3vw, 1.75rem);
      border-radius: 22px; color: var(--accent-ink);
      background: radial-gradient(28rem 16rem at 100% 0%, rgb(217 180 74 / 0.28), transparent 70%), radial-gradient(20rem 14rem at 0% 100%, rgb(255 255 255 / 0.1), transparent 70%),
        linear-gradient(160deg, #8f262e 0%, var(--accent) 55%, #5e1419 100%);
      box-shadow: 0 26px 50px -28px rgb(94 20 25 / 0.95), inset 0 1px 0 rgb(255 255 255 / 0.18); }
    .pay__cta h3 { font-size: 1.5rem; color: #fff; margin-top: 0.4rem; }
    .pay__cta p { max-width: 46ch; }
    .pay__secure { display: inline-flex; align-items: center; gap: 0.4rem; margin: 0; padding: 0.3rem 0.75rem; border-radius: 999px; font-size: var(--size-note); font-weight: 700;
      color: var(--gold); background: rgb(0 0 0 / 0.18); border: 1px solid rgb(217 180 74 / 0.45); }
    .pay__act { display: grid; gap: 0.75rem; justify-items: stretch; min-width: 15rem; padding: 1.1rem 1.25rem; border-radius: 16px;
      background: rgb(255 255 255 / 0.08); border: 1px solid rgb(255 255 255 / 0.22); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
      box-shadow: inset 0 1px 0 rgb(255 255 255 / 0.18); }
    .pay__amount { display: grid; gap: 0.15rem; margin: 0; }
    .pay__amount span { font-size: var(--size-note); font-weight: 600; opacity: 0.9; }
    .pay__amount strong { font-size: clamp(2.25rem, 4vw, 2.75rem); font-weight: 800; line-height: 1; letter-spacing: -0.03em; color: var(--gold); font-variant-numeric: tabular-nums; }
    .tag { display: inline-block; margin-top: 0.75rem; padding: 0.3rem 0.75rem; border-radius: 10px; background: rgb(255 255 255 / 0.14); font-size: var(--size-note); font-weight: 700; }
    .btn--gold { white-space: nowrap; min-height: 3.25rem; border-radius: 12px; font-size: 1.0625rem; }
    .btn--gold:not([disabled]) { background: linear-gradient(180deg, #e8c86c, #c9a23a); border-color: #b38f2c;
      box-shadow: 0 14px 26px -14px rgb(0 0 0 / 0.7), inset 0 1px 0 rgb(255 255 255 / 0.45); }
    .btn--gold:not([disabled]):hover { filter: brightness(1.05); }
    .pay__mock { border: 2px dashed var(--accent); border-radius: 16px; padding: 1.25rem; display: grid; gap: 0.5rem; background: #fff; }
    .pay__mock .btn { border-radius: 12px; }
    .pay__methods { display: flex; flex-wrap: wrap; gap: 0.4rem; margin-top: 0.75rem; padding: 0; list-style: none; }
    .pay__methods li { padding: 0.3rem 0.75rem; border-radius: 999px; background: rgb(255 255 255 / 0.95); color: var(--ink); font-size: var(--size-note); font-weight: 700;
      box-shadow: 0 6px 12px -8px rgb(0 0 0 / 0.6); }
    .pay__methods li:last-child { background: #742284; color: #fff; }
    .row { display: flex; gap: 0.5rem; flex-wrap: wrap; }
    .pay__ok { padding: clamp(1.25rem, 3vw, 1.75rem); display: grid; gap: 1rem; border-radius: 22px; color: #164d2a;
      background: linear-gradient(180deg, #effaf2 0%, #e1f1e6 100%); box-shadow: 0 0 0 1px #c5e3cf, 0 22px 44px -30px rgb(22 77 42 / 0.6), inset 0 1px 0 #fff; }
    .pay__ok h3 { display: flex; align-items: center; gap: 0.75rem; font-size: 1.5rem; }
    .pay__badge { display: grid; place-items: center; width: 2.5rem; height: 2.5rem; flex: none; border-radius: 50%; background: #1f7a3f; color: #fff;
      box-shadow: 0 0 0 4px rgb(31 122 63 / 0.18), 0 8px 16px -8px rgb(22 77 42 / 0.7); }
    .pay__ok dl > div { padding: 0.65rem 0.8rem; border-radius: 12px; background: rgb(255 255 255 / 0.7); }
    .pay__history { padding: 0.9rem 1.1rem; border-radius: 16px; background: var(--ground); box-shadow: 0 0 0 1px var(--stone-deep); }
    .pay__ok dl { margin: 0; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 0.75rem 1.5rem; }
    .pay__ok dt { font-size: var(--size-note); font-weight: 600; opacity: 0.8; }
    .pay__ok dd { margin: 0; font-weight: 700; }
    .pay__history summary { cursor: pointer; font-weight: 700; }
    .pay__history ul { list-style: none; padding: 0; margin: 0.75rem 0 0; display: grid; gap: 0.5rem; }
    .pay__history li { display: grid; grid-template-columns: 1fr auto; gap: 0 1rem; }
    .pay__history small { grid-column: 1 / -1; color: var(--ink-soft); }
    .note { font-size: var(--size-note); }
    @media (max-width: 640px) {
      .pay__cta { grid-template-columns: minmax(0, 1fr); }
      .pay__act { min-width: 0; }
      .pay__ok dl { grid-template-columns: 1fr 1fr; }
    }
    .pay__test { font-size: var(--size-note); padding: 0.75rem 1rem; border-radius: 12px; background: var(--stone); }
    .pay__test summary { cursor: pointer; font-weight: 700; }
    .pay__test p { margin: 0.5rem 0 0; }
    /* Según el ancho de la propia tarjeta: en una columna angosta, el monto y el botón pasan debajo. */
    @container (max-width: 40rem) { .pay__cta { grid-template-columns: minmax(0, 1fr); } .pay__act { min-width: 0; } }
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
  protected readonly busy = signal(false);
  protected readonly message = signal<string | null>(null);
  protected readonly msgKind = signal<'error' | 'info' | 'ok'>('info');
  protected readonly money = soles;
  protected readonly when = dateTime;

  ngOnInit(): void {
    void this.refresh();
  }

  protected method(m: string | null): string {
    return ({ CARD: 'Tarjeta', YAPE: 'Yape' } as Record<string, string>)[m ?? ''] ?? (m ?? 'En línea');
  }

  /** Abre el intento y la ventana de Culqi con tarjeta y Yape (o el recuadro simulado en local). */
  protected async start(): Promise<void> {
    this.message.set(null);
    this.busy.set(true);
    try {
      const s = await firstValueFrom(this.api.paymentSession(this.documentNumber(), this.applicantCode()));
      this.env.set(s.environment);
      if (s.environment === 'simulated') {
        this.mock.set(s);
        return;
      }
      await loadCulqi();
      const Ctor = (window as unknown as { CulqiCheckout?: CulqiCtor }).CulqiCheckout;
      if (!Ctor) throw new Error('No se pudo abrir el formulario de pago. Revisa tu conexión e inténtalo de nuevo.');
      const culqi = new Ctor(s.publicKey, {
        settings: { title: 'Admisión UNSCH 2027-I', currency: 'PEN', amount: s.amountCents },
        options: {
          lang: 'auto', installments: false, modal: true,
          paymentMethods: { tarjeta: true, yape: s.yape, billetera: false, bancaMovil: false, agente: false, cuotealo: false },
          paymentMethodsSort: s.yape ? ['tarjeta', 'yape'] : ['tarjeta'],
        },
        appearance: {
          theme: 'default', menuType: 'sidebar', buttonCardPayText: 'Pagar',
          defaultStyle: { bannerColor: '#7a1c22', buttonBackground: '#7a1c22', menuColor: '#7a1c22', linksColor: '#7a1c22', buttonTextColor: '#ffffff', priceColor: '#7a1c22' },
        },
      });
      culqi.culqi = () => {
        if (culqi.token) {
          const token = culqi.token.id;
          culqi.close();
          void this.charge(s.transactionId, token);
        } else if (culqi.error) {
          this.show(culqi.error.user_message || 'Culqi no pudo procesar el pago. Inténtalo de nuevo.', 'error');
        }
      };
      culqi.open();
    } catch (e) {
      this.fail(e);
    } finally {
      this.busy.set(false);
    }
  }

  protected async finishMock(kind: keyof typeof MOCK): Promise<void> {
    const s = this.mock();
    if (!s) return;
    this.mock.set(null);
    await this.charge(s.transactionId, MOCK[kind]);
  }

  /** El servidor cobra el token en Culqi; su respuesta es el resultado del pago. */
  private async charge(transactionId: string, token: string): Promise<void> {
    this.busy.set(true);
    this.show('Confirmando tu pago…', 'info');
    try {
      const res = await firstValueFrom(this.api.paymentCharge(this.documentNumber(), this.applicantCode(), transactionId, token));
      if (res.status === 'AUTORIZADO') this.show('¡Pago confirmado! Tu inscripción quedó Apta.', 'ok');
      else if (res.status === 'RECHAZADO') this.show(`${res.label}. ${res.message ?? ''} Puedes intentarlo de nuevo.`.trim(), 'error');
      else this.show(`${res.label}. ${res.message ?? ''}`.trim(), 'info');
      await this.refresh();
      if (res.orderStatus === 'PAGADA') this.paid.emit();
    } catch (e) {
      this.fail(e);
    } finally {
      this.busy.set(false);
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
