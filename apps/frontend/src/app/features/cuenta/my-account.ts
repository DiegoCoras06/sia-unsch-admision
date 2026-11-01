import { Component, inject, signal, type OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import type { ActivityDto, InscriptionSummaryDto } from '@sia/contracts';
import { AccountSession } from '../../core/account-session';
import { apiErrorMessage } from '../../core/api.service';
import { dateTime } from '../../core/format';
import { InscriptionReceipt } from '../inscripcion/inscription-receipt';

type ContactForm = { email: string; phone: string; addressLine: string; guardianName: string };

/**
 * Spec 002, Historias 4 y 5: mi cuenta - inscripciones del mismo DNI, datos editables y actividad (RF-02.07, RF-02.08).
 * Resumen: a la izquierda lo que importa (las inscripciones y su trámite); a la derecha, datos y actividad.
 */
@Component({
  selector: 'app-my-account',
  imports: [FormsModule, RouterLink, InscriptionReceipt],
  styleUrl: './account.scss',
  template: `
    <section class="acc">
      @if (account.profile(); as p) {
        <div class="frame me">
          <header class="me__head">
            <div>
              <h1>Hola, {{ title(p.firstNames) }}</h1>
              <p class="me__id">
                <span>{{ p.documentType }} {{ masked(p.documentNumber) }}</span>
                <span class="me__badge" [class.is-ok]="p.identityStatus === 'VERIFIED'">
                  {{ p.identityStatus === 'VERIFIED' ? 'Identidad verificada' : 'Identidad pendiente' }}@if (p.identitySimulated) { (simulada) }
                </span>
              </p>
            </div>
            <div class="me__session">
              <button type="button" class="btn btn--quiet" (click)="logout(false)">Cerrar sesión</button>
              <button type="button" class="me__all" (click)="logout(true)">Cerrar sesión en todos mis dispositivos</button>
            </div>
          </header>

          <div class="me__grid">
            <section class="me__main" aria-labelledby="ma-ins">
              <h2 id="ma-ins">Mis inscripciones</h2>
              @for (s of inscriptions(); track s.applicantCode) {
                <app-inscription-receipt [summary]="s" [documentNumber]="p.documentNumber" (updated)="reload()" />
              } @empty {
                <div class="me__empty">
                  <p><strong>Aún no tienes inscripciones con tu DNI.</strong></p>
                  <p>La inscripción al Concurso de Admisión 2027-I toma unos 10 minutos.</p>
                  <a routerLink="/inscripcion" class="btn">Inscribirme</a>
                </div>
              }
            </section>

            <aside class="me__side">
              <form class="me__card" (ngSubmit)="save()">
                <h2>Mis datos de contacto</h2>
                <p class="acc__hint">Aquí te llegan el código de verificación y los avisos del proceso. Tus nombres y tu DNI solo se corrigen con una solicitud en la Dirección de Admisión (Art. 17.6).</p>
                <div class="field"><label for="ma-mail">Correo</label><input id="ma-mail" class="input" type="email" name="mail" [(ngModel)]="form.email" autocomplete="email"></div>
                <div class="field"><label for="ma-cel">Celular</label><input id="ma-cel" class="input" name="cel" [(ngModel)]="form.phone" maxlength="9" inputmode="numeric" autocomplete="tel"></div>
                <div class="field"><label for="ma-dir">Dirección</label><input id="ma-dir" class="input" name="dir" [(ngModel)]="form.addressLine" autocomplete="street-address"></div>
                <div class="field"><label for="ma-apo">Apoderado <span class="opt">(si eres menor de edad)</span></label><input id="ma-apo" class="input" name="apo" [(ngModel)]="form.guardianName"></div>
                <button class="btn me__save" type="submit" [disabled]="busy() || !dirty()">{{ busy() ? 'Guardando…' : dirty() ? 'Guardar cambios' : 'Sin cambios' }}</button>
                @if (msg()) { <p [class]="msgErr() ? 'alert alert--error' : 'acc__ok me__ok'" role="status">{{ msg() }}</p> }
              </form>

              <section class="me__card" aria-labelledby="ma-act">
                <h2 id="ma-act">Actividad reciente</h2>
                @if (activity().length) {
                  <ol class="feed">
                    @for (a of activity(); track $index) {
                      <li><span class="feed__what">{{ a.description }}</span><time class="feed__when" [attr.datetime]="a.occurredAt">{{ when(a.occurredAt) }}</time></li>
                    }
                  </ol>
                } @else {
                  <p class="acc__hint">Sin actividad registrada.</p>
                }
              </section>
            </aside>
          </div>
        </div>
      } @else {
        <div class="frame"><p role="status">Cargando tu cuenta…</p></div>
      }
    </section>
  `,
  styles: `
    .me { display: grid; gap: 2rem; }
    .me__head { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: end; gap: 1rem 2rem; }
    .me__head h1 { font-size: clamp(2.25rem, 5vw, 3.5rem); letter-spacing: -0.035em; line-height: 1; }
    .me__id { margin: 0.75rem 0 0; display: flex; flex-wrap: wrap; align-items: center; gap: 0.5rem 0.75rem; color: var(--ink-soft); font-variant-numeric: tabular-nums; }
    .me__badge { display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.2rem 0.6rem; border-radius: var(--radius); background: #fbf1d9; color: var(--warn); font-size: var(--size-note); font-weight: 600; }
    .me__badge::before { content: ''; width: 0.5rem; height: 0.5rem; border-radius: 50%; background: currentColor; }
    .me__badge.is-ok { background: #e3f1e8; color: var(--ok); }
    .me__session { display: flex; flex-wrap: wrap; align-items: center; gap: 0.5rem 1rem; }
    .me__all { min-height: 2.75rem; padding: 0; font: inherit; font-size: var(--size-note); color: var(--ink-soft); background: none; border: 0;
      text-decoration: underline; text-underline-offset: 0.25em; cursor: pointer; }
    .me__all:hover { color: var(--ink); }

    .me__grid { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 22rem); gap: clamp(1.5rem, 3vw, 2.5rem); align-items: start; }
    .me__main { display: grid; gap: 1rem; min-width: 0; }
    .me__main h2, .me__card h2 { font-size: 1.375rem; letter-spacing: -0.02em; }
    .me__empty { display: grid; gap: 0.6rem; justify-items: start; padding: 1.75rem; border-radius: var(--radius-lg); background: var(--ground); }
    .me__empty p { margin: 0; }
    .me__side { display: grid; gap: 1.25rem; position: sticky; top: 6.5rem; }
    .me__card { display: grid; gap: 0.9rem; padding: 1.5rem; border-radius: var(--radius-lg); background: var(--ground); border: 1px solid var(--stone-deep); }
    .me__card .field label { font-weight: 600; }
    .opt { font-weight: 400; color: var(--ink-soft); }
    .me__save { width: 100%; }
    .me__ok { border-radius: var(--radius); margin: 0; }

    /* Actividad: línea de tiempo con puntos, la más reciente arriba. */
    .feed { list-style: none; margin: 0; padding: 0; display: grid; }
    .feed li { position: relative; display: grid; gap: 0.1rem; padding: 0 0 1rem 1.25rem; }
    .feed li::before { content: ''; position: absolute; left: 0; top: 0.45em; width: 0.5rem; height: 0.5rem; border-radius: 50%; background: var(--accent); }
    .feed li::after { content: ''; position: absolute; left: 0.2rem; top: 1.2em; bottom: 0.1rem; width: 1px; background: var(--stone-deep); }
    .feed li:last-child { padding-bottom: 0; }
    .feed li:last-child::after { display: none; }
    .feed__what { font-weight: 600; }
    .feed__when { font-size: var(--size-note); color: var(--ink-soft); font-variant-numeric: tabular-nums; }

    @media (max-width: 960px) {
      .me__grid { grid-template-columns: minmax(0, 1fr); }
      .me__side { position: static; }
    }
  `,
})
export class MyAccountPage implements OnInit {
  protected readonly account = inject(AccountSession);
  private readonly router = inject(Router);
  protected readonly inscriptions = signal<InscriptionSummaryDto[]>([]);
  protected readonly activity = signal<ActivityDto[]>([]);
  protected readonly busy = signal(false);
  protected readonly msg = signal<string | null>(null);
  protected readonly msgErr = signal(false);
  protected form: ContactForm = { email: '', phone: '', addressLine: '', guardianName: '' };
  private saved: ContactForm = { ...this.form };
  protected readonly when = dateTime;
  protected title = (s: string) => s.split(' ')[0]!.charAt(0) + s.split(' ')[0]!.slice(1).toLowerCase();
  /** El documento se muestra parcialmente (como en la constancia): basta para reconocerlo. */
  protected masked = (doc: string) => (doc.length > 4 ? `${doc.slice(0, 4)}${'•'.repeat(doc.length - 6)}${doc.slice(-2)}` : doc);

  /** Hay cambios sin guardar: el botón solo se activa entonces. */
  protected dirty(): boolean {
    return (Object.keys(this.form) as (keyof ContactForm)[]).some((k) => this.form[k].trim() && this.form[k].trim() !== this.saved[k]);
  }

  async ngOnInit() {
    if (!(await this.account.restore())) {
      await this.router.navigateByUrl('/ingresar');
      return;
    }
    const p = this.account.profile()!;
    this.form = { email: p.email, phone: p.phone, addressLine: p.addressLine ?? '', guardianName: p.guardianName ?? '' };
    this.saved = { ...this.form };
    await this.reload();
  }

  protected async reload() {
    const [i, a] = await Promise.all([this.account.inscriptions(), this.account.activity()]);
    this.inscriptions.set(i);
    this.activity.set(a.slice(0, 10));
  }

  protected async save() {
    const changed = Object.fromEntries(
      Object.entries(this.form).filter(([k, v]) => v.trim() && v.trim() !== this.saved[k as keyof ContactForm]),
    );
    if (!Object.keys(changed).length) {
      this.msg.set('No hay cambios.');
      this.msgErr.set(false);
      return;
    }
    this.busy.set(true);
    try {
      const r = await this.account.updateProfile(changed);
      this.saved = { ...this.form };
      this.msg.set(r.pendingEmailVerification ? 'Guardado. Confirma tu nuevo correo con el código que te enviamos.' : 'Datos actualizados.');
      this.msgErr.set(false);
      this.activity.set((await this.account.activity()).slice(0, 10));
    } catch (e) {
      this.msg.set(apiErrorMessage(e));
      this.msgErr.set(true);
    } finally {
      this.busy.set(false);
    }
  }

  protected async logout(all: boolean) {
    await this.account.logout(all);
    await this.router.navigateByUrl('/');
  }
}
