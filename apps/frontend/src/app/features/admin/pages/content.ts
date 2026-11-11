import { Component, OnInit, inject, signal } from '@angular/core';
import { AdmConfirm } from '../confirm-dialog';
import { AdmToast } from '../toast';
import { FormsModule } from '@angular/forms';
import { AdminSession } from '../../../core/admin-session';
import { apiErrorMessage } from '../../../core/api.service';
import { shortDateTime } from '../../../core/format';

interface Ann { id?: string; type: 'COMUNICADO' | 'FE_ERRATAS' | 'RESULTADO'; title: string; bodyMd: string; affectsSection?: string | null; publishedAt?: string }
interface Block { key: string; bodyMd: string; updatedAt: string }
interface Flag { key: string; label: string; enabled: boolean; linkedStageCodes: string[] }

const BLOCK_NAMES: Record<string, string> = {
  mission: 'Misión institucional', steps_ord: 'Pasos - modalidad Ordinario', steps_exo: 'Pasos - modalidad Exonerados', exam_day: 'El día del examen',
};

/** Spec 008, Historias 6 y 8: comunicados y fe de erratas, textos del portal y funciones por etapa. */
interface Asset { key: string; label: string; fallback: string; custom: { url: string; alt: string; updatedAt: string } | null }
@Component({
  selector: 'app-admin-content',
  imports: [FormsModule, AdmToast],
  template: `
    <header class="adm-head"><div><h1>Contenido del portal</h1><p>Lo que publiques aquí aparece en el portal sin intervención técnica.</p></div></header>
    <div class="adm-tabs" role="tablist">
      <button type="button" role="tab" [class.is-on]="tab() === 'com'" (click)="tab.set('com')">Comunicados</button>
      <button type="button" role="tab" [class.is-on]="tab() === 'txt'" (click)="tab.set('txt')">Textos del portal</button>
      <button type="button" role="tab" [class.is-on]="tab() === 'img'" (click)="tab.set('img')">Imágenes</button>
      <button type="button" role="tab" [class.is-on]="tab() === 'fun'" (click)="tab.set('fun')">Funciones por etapa</button>
    </div>
    <app-adm-toast [text]="msg()" [error]="msgErr()" (closed)="msg.set(null)" />

    @switch (tab()) {
      @case ('com') {
        <div class="adm-grid">
          <form class="adm-panel adm-form" (ngSubmit)="saveAnn()">
            <h2>{{ form.id ? 'Editar comunicado' : 'Nuevo comunicado' }}</h2>
            <div class="two">
              <div class="field"><label for="a-type">Tipo</label>
                <select id="a-type" class="select" name="type" [(ngModel)]="form.type"><option value="COMUNICADO">Comunicado</option><option value="FE_ERRATAS">Fe de erratas</option><option value="RESULTADO">Resultados</option></select></div>
              @if (form.type === 'FE_ERRATAS') {
                <div class="field"><label for="a-sec">Sección que corrige</label>
                  <select id="a-sec" class="select" name="sec" [(ngModel)]="form.affectsSection"><option value="cronograma">Cronograma</option><option value="tasas">Tasas</option><option value="vacantes">Vacantes</option><option value="requisitos">Requisitos</option><option value="temario">Temario</option></select></div>
              }
            </div>
            <div class="field"><label for="a-title">Título</label><input id="a-title" class="input" name="title" [(ngModel)]="form.title" required></div>
            <div class="field"><label for="a-body">Texto (admite **negrita** y listas con «- »)</label><textarea id="a-body" class="input" name="body" [(ngModel)]="form.bodyMd" required></textarea></div>
            <div class="adm-row"><button class="btn" type="submit">{{ form.id ? 'Guardar cambios' : 'Publicar' }}</button>
              @if (form.id) { <button class="btn btn--quiet" type="button" (click)="newAnn()">Cancelar</button> }</div>
          </form>
          <section class="adm-panel"><h2>Publicados</h2>
            <div class="adm-table-wrap"><table class="adm-table"><tbody>
              @for (a of anns(); track a.id) {
                <tr><td><span class="adm-tag" [class.warn]="a.type === 'FE_ERRATAS'">{{ a.type === 'FE_ERRATAS' ? 'Fe de erratas' : a.type === 'RESULTADO' ? 'Resultados' : 'Comunicado' }}</span>
                  <br><strong>{{ a.title }}</strong><br><span class="adm-muted">{{ when(a.publishedAt!) }}</span></td>
                  <td><button type="button" class="adm-link" (click)="edit(a)">Editar</button><br><button type="button" class="adm-link" (click)="remove(a)">Retirar</button></td></tr>
              } @empty { <tr class="adm-none"><td>Sin comunicados.</td></tr> }
            </tbody></table></div>
          </section>
        </div>
      }
      @case ('txt') {
        @for (b of blocks(); track b.key) {
          <form class="adm-panel adm-form" (ngSubmit)="saveBlock(b)">
            <h2>{{ blockName(b.key) }}</h2>
            <textarea class="input" [name]="'b-' + b.key" [(ngModel)]="b.bodyMd" [attr.aria-label]="blockName(b.key)"></textarea>
            <div class="adm-row"><button class="btn" type="submit">Guardar</button><span class="adm-muted">Actualizado {{ when(b.updatedAt) }}</span></div>
          </form>
        }
      }
      @case ('img') {
        <section class="adm-panel"><h2>Imágenes de la portada</h2>
          <p>Reemplaza una foto por otra JPG, PNG o WebP de hasta 3 MB. La original queda guardada y puedes volver a ella.</p>
          <div class="ct-imgs">
            @for (a of assets(); track a.key) {
              <article class="ct-img">
                <img [src]="a.custom?.url ?? '/' + a.fallback" alt="" loading="lazy">
                <div class="ct-img__body">
                  <strong>{{ a.label }}</strong>
                  <span class="adm-muted">{{ a.custom ? 'Reemplazada el ' + when(a.custom.updatedAt) : 'Imagen original' }}</span>
                  <label class="field"><span>Descripción para lectores de pantalla</span>
                    <input class="input" [value]="altDraft[a.key] ?? a.custom?.alt ?? ''" (input)="altDraft[a.key] = $any($event.target).value" placeholder="Qué se ve en la foto"></label>
                  <div class="adm-row">
                    <label class="btn btn--quiet ct-file">Subir imagen<input type="file" accept="image/jpeg,image/png,image/webp" (change)="upload(a.key, $any($event.target))"></label>
                    @if (a.custom) { <button class="btn btn--quiet" type="button" (click)="resetAsset(a.key)">Volver a la original</button> }
                  </div>
                </div>
              </article>
            }
          </div>
        </section>
      }
      @case ('fun') {
        <section class="adm-panel"><h2>Funciones del portal</h2>
          <p>Una función se muestra si está activa y alguna de sus etapas está en curso. Desactívala para ocultarla aunque la fecha esté vigente.</p>
          <div class="adm-table-wrap"><table class="adm-table">
            <thead><tr><th>Función</th><th>Etapas que la habilitan</th><th>Activa</th></tr></thead>
            <tbody>@for (f of flags(); track f.key) {
              <tr><td><strong>{{ f.label }}</strong></td><td class="adm-muted">{{ f.linkedStageCodes.join(', ') }}</td>
                <td><label class="adm-check"><input type="checkbox" [checked]="f.enabled" (change)="toggle(f, $any($event.target).checked)"> {{ f.enabled ? 'Sí' : 'No' }}</label></td></tr>
            }</tbody>
          </table></div>
        </section>
      }
    }
  `,
  styles: `
    .ct-imgs { display: grid; grid-template-columns: repeat(auto-fill, minmax(19rem, 1fr)); gap: 1.25rem; }
    .ct-img { border: 1px solid var(--adm-line, #e4e2dd); border-radius: 12px; overflow: hidden; display: grid; }
    .ct-img img { width: 100%; aspect-ratio: 16 / 10; object-fit: cover; background: #f3f2ef; }
    .ct-img__body { padding: 1rem; display: grid; gap: 0.6rem; }
    .ct-img .field { display: grid; gap: 0.3rem; font-size: 0.875rem; }
    .ct-file { position: relative; overflow: hidden; cursor: pointer; }
    .ct-file input { position: absolute; inset: 0; opacity: 0; cursor: pointer; }
    .ct-file:focus-within { outline: 2px solid currentColor; outline-offset: 2px; }
  `,
})
export class ContentAdminPage implements OnInit {
  private readonly session = inject(AdminSession);
  private readonly ask = inject(AdmConfirm);
  protected readonly tab = signal<'com' | 'txt' | 'img' | 'fun'>('com');
  protected readonly assets = signal<Asset[]>([]);
  protected altDraft: Record<string, string> = {};
  protected readonly anns = signal<Ann[]>([]);
  protected readonly blocks = signal<Block[]>([]);
  protected readonly flags = signal<Flag[]>([]);
  protected readonly msg = signal<string | null>(null);
  protected readonly msgErr = signal(false);
  protected form: Ann = { type: 'COMUNICADO', title: '', bodyMd: '' };
  protected readonly when = shortDateTime;
  protected blockName = (k: string) => BLOCK_NAMES[k] ?? k;

  ngOnInit() { void this.reload(); }

  private async reload() {
    const [a, b, f, img] = await Promise.all([
      this.session.get<Ann[]>('/admin/announcements'), this.session.get<Block[]>('/admin/content-blocks'), this.session.get<Flag[]>('/admin/features'),
      this.session.get<Asset[]>('/admin/site-assets'),
    ]);
    this.assets.set(img);
    this.anns.set(a);
    this.blocks.set(b);
    this.flags.set(f);
  }

  protected newAnn() { this.form = { type: 'COMUNICADO', title: '', bodyMd: '' }; }
  protected edit(a: Ann) { this.form = { ...a }; }

  protected saveAnn() {
    const { publishedAt: _p, ...body } = this.form;
    return this.act(async () => {
      await this.session.postAuth('/admin/announcements', { ...body, affectsSection: body.affectsSection || undefined, callCode: '2027-I' });
      this.newAnn();
      return 'Comunicado publicado en el portal.';
    });
  }

  protected async remove(a: Ann) {
    if (!(await this.ask.confirm(`El comunicado «${a.title}» dejará de verse en el portal.`, { title: '¿Retirar el comunicado?', action: 'Retirar', danger: true }))) return;
    return this.act(async () => { await this.session.delete(`/admin/announcements/${a.id}`); return 'Comunicado retirado.'; });
  }

  protected saveBlock(b: Block) {
    return this.act(async () => { await this.session.put(`/admin/content-blocks/${b.key}`, { bodyMd: b.bodyMd }); return `«${this.blockName(b.key)}» guardado.`; });
  }

  protected upload(key: string, input: HTMLInputElement) {
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) { this.msg.set('La imagen pesa más de 3 MB.'); this.msgErr.set(true); return; }
    return this.act(async () => {
      const image = await new Promise<string>((ok, ko) => { const r = new FileReader(); r.onload = () => ok(String(r.result)); r.onerror = ko; r.readAsDataURL(file); });
      await this.session.put(`/admin/site-assets/${key}`, { image, alt: (this.altDraft[key] ?? this.assets().find((a) => a.key === key)?.custom?.alt ?? '').trim() });
      delete this.altDraft[key];
      return 'Imagen reemplazada en el portal.';
    });
  }

  protected async resetAsset(key: string) {
    if (!(await this.ask.confirm('Se quitará la imagen que subiste y el portal volverá a mostrar la original.', { title: '¿Volver a la imagen original?', action: 'Restaurar' }))) return;
    return this.act(async () => { await this.session.delete(`/admin/site-assets/${key}`); return 'Se restauró la imagen original.'; });
  }

  protected toggle(f: Flag, enabled: boolean) {
    return this.act(async () => { await this.session.put(`/admin/features/${f.key}`, { enabled }); return `${f.label}: ${enabled ? 'activada' : 'desactivada'}.`; });
  }

  private async act(fn: () => Promise<string>) {
    try {
      this.msg.set(await fn());
      this.msgErr.set(false);
    } catch (e) {
      this.msg.set(apiErrorMessage(e));
      this.msgErr.set(true);
    }
    await this.reload();
  }
}
