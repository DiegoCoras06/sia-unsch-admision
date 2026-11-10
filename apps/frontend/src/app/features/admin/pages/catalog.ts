import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminSession } from '../../../core/admin-session';
import { apiErrorMessage } from '../../../core/api.service';

interface Sub { code: string; name: string; legalBasis: string; usesBaseDocuments: boolean; evaluationCriteria: string | null; requirements: { requirementId: string; mandatory: boolean }[] }
interface Modality { code: string; name: string; categories: { code: string; name: string; submodality: string | null }[]; submodalities: Sub[] }
interface Requirement { id: string; code: string; name: string; description: string; article: string; acceptedFormats: string[]; isBase: boolean }
interface Program { id: string; name: string; scheduleNumber: number; facultyId: string; faculty: string; areaId: string; area: string; options: { code: string; displayName: string; durationYears: number }[] }
interface Catalog {
  callCode: string; modalities: Modality[]; requirements: Requirement[]; programs: Program[];
  faculties: { id: string; name: string; programs: number }[]; areas: { id: string; code: string; name: string; programs: number }[];
}

const FORMATS = ['PDF', 'JPG', 'PNG'];
const blankReq = (): Requirement => ({ id: '', code: '', name: '', description: '', article: '', acceptedFormats: ['PDF'], isBase: false });
const blankProgram = (): Program => ({ id: '', name: '', scheduleNumber: 1, facultyId: '', faculty: '', areaId: '', area: '', options: [] });

/** Spec 008: catálogo del concurso (RF-01.02, RF-01.04, RF-04.11, RF-06.01, RF-14.03). */
@Component({
  selector: 'app-admin-catalog',
  imports: [FormsModule],
  template: `
    <header class="adm-head">
      <div><h1>Catálogo del concurso</h1><p>Modalidades, requisitos y programas que ve el postulante. Cada cambio queda en la auditoría.</p></div>
      <div class="field"><label for="k-sel">Convocatoria</label>
        <select id="k-sel" class="select" [(ngModel)]="code" (ngModelChange)="load()">@for (c of calls(); track c.code) {<option [value]="c.code">{{ c.code }}</option>}</select></div>
    </header>
    <div class="adm-tabs" role="tablist">
      @for (t of tabs; track t.id) { <button type="button" role="tab" [class.is-on]="tab() === t.id" [attr.aria-selected]="tab() === t.id" (click)="tab.set(t.id)">{{ t.label }}</button> }
    </div>
    @if (msg()) { <p class="adm-msg" [class.err]="msgErr()" role="status">{{ msg() }}</p> }

    @if (data(); as d) {
      @switch (tab()) {
        @case ('modalidades') {
          @for (m of d.modalities; track m.code) {
            <section class="adm-panel">
              <form class="kt-line" (ngSubmit)="put('/admin/catalog/modalities/' + m.code, { name: m.name }, 'Modalidad guardada.')">
                <div class="field"><label [for]="'m-' + m.code">Modalidad {{ m.code }}</label><input [id]="'m-' + m.code" class="input" [name]="'m-' + m.code" [(ngModel)]="m.name"></div>
                <button class="btn btn--quiet" type="submit">Guardar</button>
              </form>
              <h3 class="kt-h3">Tipos de vacante</h3>
              <div class="kt-cats">
                @for (c of m.categories; track c.code) {
                  <form class="kt-line" (ngSubmit)="put('/admin/catalog/categories/' + c.code, { name: c.name }, 'Tipo de vacante guardado.')">
                    <div class="field"><label [for]="'c-' + c.code">{{ c.code }}</label><input [id]="'c-' + c.code" class="input" [name]="'c-' + c.code" [(ngModel)]="c.name"></div>
                    <button class="btn btn--quiet" type="submit">Guardar</button>
                  </form>
                }
              </div>
              @if (m.submodalities.length) {
                <h3 class="kt-h3">Submodalidades</h3>
                @for (s of m.submodalities; track s.code) {
                  <details class="kt-sub">
                    <summary><strong>{{ s.name }}</strong> <span class="adm-muted">{{ s.code }}, {{ s.requirements.length }} requisitos propios</span></summary>
                    <form class="adm-form" (ngSubmit)="saveSub(s)">
                      <div class="two">
                        <div class="field"><label [for]="'sn-' + s.code">Nombre</label><input [id]="'sn-' + s.code" class="input" [name]="'sn-' + s.code" [(ngModel)]="s.name"></div>
                        <div class="field"><label [for]="'sl-' + s.code">Base legal</label><input [id]="'sl-' + s.code" class="input" [name]="'sl-' + s.code" [(ngModel)]="s.legalBasis"></div>
                      </div>
                      <div class="field"><label [for]="'se-' + s.code">Criterios de evaluación del expediente</label>
                        <textarea [id]="'se-' + s.code" class="input" rows="4" [name]="'se-' + s.code" [(ngModel)]="s.evaluationCriteria" maxlength="2000"
                          placeholder="Ejemplo: se verifica que el certificado indique el puesto obtenido y esté firmado por el director."></textarea>
                        <p class="adm-muted">Se muestra al postulante en «Requisitos» y a la Comisión al evaluar.</p></div>
                      <label class="kt-check"><input type="checkbox" [name]="'sb-' + s.code" [(ngModel)]="s.usesBaseDocuments"> Pide también los documentos comunes</label>
                      <button class="btn" type="submit">Guardar submodalidad</button>
                    </form>
                  </details>
                }
              }
            </section>
          }
        }
        @case ('requisitos') {
          <section class="adm-panel"><h2>Documentos por submodalidad</h2>
            <div class="field kt-pick"><label for="r-sub">Submodalidad</label>
              <select id="r-sub" class="select" [(ngModel)]="subCode" (ngModelChange)="pickSub()">
                @for (s of subs(); track s.code) { <option [value]="s.code">{{ s.name }}</option> }
              </select></div>
            @if (subCode) {
              <div class="adm-table-wrap"><table class="adm-table">
                <thead><tr><th>Pide</th><th>Documento</th><th>Obligatorio</th></tr></thead>
                <tbody>@for (r of ownReqs(); track r.id) {
                  <tr><td><input type="checkbox" [checked]="picked()[r.id] !== undefined" (change)="toggle(r.id)" [attr.aria-label]="'Pedir ' + r.name"></td>
                    <td>{{ r.name }}<br><span class="adm-muted">{{ r.code }}, {{ r.article }}</span></td>
                    <td><input type="checkbox" [disabled]="picked()[r.id] === undefined" [checked]="picked()[r.id] === true" (change)="toggleMandatory(r.id)" [attr.aria-label]="r.name + ' obligatorio'"></td></tr>
                }</tbody>
              </table></div>
              <p class="adm-muted">Los documentos comunes (marcados «común») se piden a todas las submodalidades que los usan.</p>
              <button class="btn" type="button" (click)="saveLinks()">Guardar documentos de la submodalidad</button>
            }
          </section>
          <section class="adm-panel"><h2>Documentos de la convocatoria {{ d.callCode }}</h2>
            <div class="adm-table-wrap"><table class="adm-table">
              <thead><tr><th>Documento</th><th>Formatos</th><th></th></tr></thead>
              <tbody>@for (r of d.requirements; track r.id) {
                <tr><td>{{ r.name }}@if (r.isBase) { <span class="adm-tag">común</span> }<br><span class="adm-muted">{{ r.code }}, {{ r.article }}</span></td>
                  <td>{{ r.acceptedFormats.join(', ') }}</td>
                  <td><button class="btn btn--quiet" type="button" (click)="editReq(r)">Editar</button></td></tr>
              }</tbody>
            </table></div>
            <h3 class="kt-h3">{{ req.id ? 'Editar documento' : 'Nuevo documento' }}</h3>
            <form class="adm-form" (ngSubmit)="saveReq()">
              <div class="two">
                <div class="field"><label for="rq-code">Código</label><input id="rq-code" class="input" name="rq-code" [(ngModel)]="req.code" placeholder="CONSTANCIA_DEPORTISTA"></div>
                <div class="field"><label for="rq-art">Artículo</label><input id="rq-art" class="input" name="rq-art" [(ngModel)]="req.article" placeholder="Art. 27"></div>
              </div>
              <div class="field"><label for="rq-name">Nombre</label><input id="rq-name" class="input" name="rq-name" [(ngModel)]="req.name"></div>
              <div class="field"><label for="rq-desc">Qué debe contener</label><textarea id="rq-desc" class="input" rows="3" name="rq-desc" [(ngModel)]="req.description"></textarea></div>
              <fieldset class="kt-formats"><legend>Formatos aceptados</legend>
                @for (f of formats; track f) { <label class="kt-check"><input type="checkbox" [checked]="req.acceptedFormats.includes(f)" (change)="toggleFormat(f)"> {{ f }}</label> }
                <label class="kt-check"><input type="checkbox" name="rq-base" [(ngModel)]="req.isBase"> Documento común</label>
              </fieldset>
              <div class="adm-row"><button class="btn" type="submit">{{ req.id ? 'Guardar cambios' : 'Agregar documento' }}</button>
                @if (req.id) { <button class="btn btn--quiet" type="button" (click)="req = blankReq()">Cancelar</button> }</div>
            </form>
          </section>
        }
        @case ('facultades') {
          <section class="adm-panel"><h2>Facultades</h2>
            @for (f of d.faculties; track f.id) {
              <form class="kt-line" (ngSubmit)="post('/admin/catalog/faculties', { id: f.id, name: f.name }, 'Facultad guardada.')">
                <div class="field"><label [for]="'f-' + f.id">{{ f.programs }} programas</label><input [id]="'f-' + f.id" class="input" [name]="'f-' + f.id" [(ngModel)]="f.name"></div>
                <button class="btn btn--quiet" type="submit">Guardar</button>
              </form>
            }
            <form class="kt-line" (ngSubmit)="addFaculty()">
              <div class="field"><label for="f-new">Nueva facultad</label><input id="f-new" class="input" name="f-new" [(ngModel)]="newFaculty" placeholder="Facultad de …"></div>
              <button class="btn" type="submit">Agregar</button>
            </form>
          </section>
          <section class="adm-panel"><h2>Áreas académicas</h2>
            @for (a of d.areas; track a.id) {
              <form class="kt-line" (ngSubmit)="put('/admin/catalog/areas/' + a.code, { name: a.name }, 'Área guardada.')">
                <div class="field"><label [for]="'a-' + a.code">Área {{ a.code }}, {{ a.programs }} programas</label><input [id]="'a-' + a.code" class="input" [name]="'a-' + a.code" [(ngModel)]="a.name"></div>
                <button class="btn btn--quiet" type="submit">Guardar</button>
              </form>
            }
          </section>
        }
        @case ('programas') {
          <section class="adm-panel"><h2>Programas de estudio</h2>
            <div class="adm-table-wrap"><table class="adm-table">
              <thead><tr><th class="num">N.°</th><th>Programa</th><th>Facultad</th><th>Área</th><th>Opciones</th><th></th></tr></thead>
              <tbody>@for (p of d.programs; track p.id) {
                <tr><td class="num">{{ p.scheduleNumber }}</td><td>{{ p.name }}</td><td class="adm-muted">{{ p.faculty }}</td><td>{{ p.area }}</td>
                  <td class="adm-muted">@for (o of p.options; track o.code) { {{ o.code }} }</td>
                  <td><button class="btn btn--quiet" type="button" (click)="prog = { ...p }">Editar</button></td></tr>
              }</tbody>
            </table></div>
            <h3 class="kt-h3">{{ prog.id ? 'Editar programa' : 'Nuevo programa' }}</h3>
            <form class="adm-form" (ngSubmit)="saveProgram()">
              <div class="two">
                <div class="field"><label for="p-name">Nombre</label><input id="p-name" class="input" name="p-name" [(ngModel)]="prog.name"></div>
                <div class="field"><label for="p-num">N.° en el cronograma</label><input id="p-num" class="input" type="number" min="1" name="p-num" [(ngModel)]="prog.scheduleNumber"></div>
                <div class="field"><label for="p-fac">Facultad</label>
                  <select id="p-fac" class="select" name="p-fac" [(ngModel)]="prog.facultyId"><option value="">Elige…</option>@for (f of d.faculties; track f.id) { <option [value]="f.id">{{ f.name }}</option> }</select></div>
                <div class="field"><label for="p-area">Área</label>
                  <select id="p-area" class="select" name="p-area" [(ngModel)]="prog.areaId"><option value="">Elige…</option>@for (a of d.areas; track a.id) { <option [value]="a.id">{{ a.code }}, {{ a.name }}</option> }</select></div>
              </div>
              @if (!prog.id) { <p class="adm-muted">Un programa nuevo no recibe postulantes hasta que tenga una opción de postulación y vacantes en «Convocatoria».</p> }
              <div class="adm-row"><button class="btn" type="submit">{{ prog.id ? 'Guardar cambios' : 'Agregar programa' }}</button>
                @if (prog.id) { <button class="btn btn--quiet" type="button" (click)="prog = blankProgram()">Cancelar</button> }</div>
            </form>
          </section>
        }
      }
    }
  `,
  styles: `
    .kt-line { display: flex; gap: 0.75rem; align-items: end; margin-bottom: 0.75rem; }
    .kt-line .field { flex: 1; min-width: 0; }
    .kt-h3 { font-size: 0.9375rem; margin: 1.25rem 0 0.75rem; }
    .kt-cats { display: grid; grid-template-columns: repeat(auto-fill, minmax(22rem, 1fr)); gap: 0 1.5rem; }
    .kt-sub { border-top: 1px solid var(--adm-line, #e4e2dd); padding: 0.75rem 0; }
    .kt-sub summary { cursor: pointer; display: flex; gap: 0.75rem; flex-wrap: wrap; align-items: baseline; }
    .kt-sub .adm-form { margin-top: 1rem; }
    .kt-check { display: inline-flex; gap: 0.5rem; align-items: center; margin-right: 1.25rem; }
    .kt-formats { border: 0; padding: 0; margin: 0; }
    .kt-formats legend { font-weight: 600; margin-bottom: 0.4rem; }
    .kt-pick { max-width: 30rem; margin-bottom: 1rem; }
  `,
})
export class CatalogAdminPage implements OnInit {
  private readonly session = inject(AdminSession);
  protected readonly calls = signal<{ code: string }[]>([]);
  protected readonly data = signal<Catalog | null>(null);
  protected readonly tab = signal<'modalidades' | 'requisitos' | 'facultades' | 'programas'>('modalidades');
  protected readonly msg = signal<string | null>(null);
  protected readonly msgErr = signal(false);
  protected readonly tabs = [
    { id: 'modalidades' as const, label: 'Modalidades y criterios' }, { id: 'requisitos' as const, label: 'Requisitos' },
    { id: 'facultades' as const, label: 'Facultades y áreas' }, { id: 'programas' as const, label: 'Programas' },
  ];
  protected readonly formats = FORMATS;
  protected readonly blankReq = blankReq;
  protected readonly blankProgram = blankProgram;
  protected code = '2027-I';
  protected subCode = '';
  protected newFaculty = '';
  protected req = blankReq();
  protected prog = blankProgram();
  /** Documentos elegidos para la submodalidad: id → obligatorio. */
  protected readonly picked = signal<Record<string, boolean>>({});
  protected readonly subs = computed(() => this.data()?.modalities.flatMap((m) => m.submodalities) ?? []);
  protected readonly ownReqs = computed(() => this.data()?.requirements.filter((r) => !r.isBase) ?? []);

  async ngOnInit() {
    this.calls.set(await this.session.get('/admin/calls'));
    await this.load();
  }

  protected async load() {
    this.data.set(await this.session.get<Catalog>(`/admin/calls/${this.code}/catalog`));
    if (!this.subCode) this.subCode = this.subs()[0]?.code ?? '';
    this.pickSub();
  }

  protected pickSub() {
    const s = this.subs().find((x) => x.code === this.subCode);
    this.picked.set(Object.fromEntries((s?.requirements ?? []).map((r) => [r.requirementId, r.mandatory])));
  }
  protected toggle(id: string) {
    this.picked.update((p) => { const n = { ...p }; if (id in n) delete n[id]; else n[id] = true; return n; });
  }
  protected toggleMandatory(id: string) {
    this.picked.update((p) => ({ ...p, [id]: !p[id] }));
  }
  protected toggleFormat(f: string) {
    this.req.acceptedFormats = this.req.acceptedFormats.includes(f) ? this.req.acceptedFormats.filter((x) => x !== f) : [...this.req.acceptedFormats, f];
  }
  protected editReq(r: Requirement) {
    this.req = { ...r, acceptedFormats: [...r.acceptedFormats] };
  }

  protected saveSub(s: Sub) {
    return this.put(`/admin/catalog/submodalities/${s.code}`, { name: s.name, legalBasis: s.legalBasis, usesBaseDocuments: s.usesBaseDocuments, evaluationCriteria: s.evaluationCriteria ?? '' }, `Submodalidad «${s.name}» guardada.`);
  }
  protected saveLinks() {
    // El orden sigue la tabla de documentos.
    const items = this.ownReqs().filter((r) => r.id in this.picked()).map((r) => ({ requirementId: r.id, mandatory: this.picked()[r.id]! }));
    return this.put(`/admin/calls/${this.code}/submodalities/${this.subCode}/requirements`, { items }, `Documentos guardados: ${items.length}.`);
  }
  protected async saveReq() {
    const { id, ...body } = this.req;
    await this.post(`/admin/calls/${this.code}/requirements`, id ? { id, ...body } : body, id ? 'Documento actualizado.' : 'Documento agregado.');
    if (!this.msgErr()) this.req = blankReq();
  }
  protected async addFaculty() {
    await this.post('/admin/catalog/faculties', { name: this.newFaculty }, 'Facultad agregada.');
    if (!this.msgErr()) this.newFaculty = '';
  }
  protected async saveProgram() {
    const { id, name, facultyId, areaId, scheduleNumber } = this.prog;
    await this.post('/admin/catalog/programs', { ...(id ? { id } : {}), name, facultyId, areaId, scheduleNumber: Number(scheduleNumber) }, id ? 'Programa actualizado.' : 'Programa agregado.');
    if (!this.msgErr()) this.prog = blankProgram();
  }

  protected put(url: string, body: unknown, ok: string) {
    return this.act(async () => { await this.session.put(url, body); return ok; });
  }
  protected post(url: string, body: unknown, ok: string) {
    return this.act(async () => { await this.session.postAuth(url, body); return ok; });
  }

  private async act(fn: () => Promise<string>) {
    try {
      this.msg.set(await fn());
      this.msgErr.set(false);
    } catch (e) {
      this.msg.set(apiErrorMessage(e));
      this.msgErr.set(true);
    }
    await this.load();
  }
}
