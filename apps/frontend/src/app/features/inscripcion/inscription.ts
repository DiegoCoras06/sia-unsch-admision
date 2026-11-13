import { Component, DestroyRef, ElementRef, computed, effect, inject, signal, viewChild } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import type { ConsentDto, FeeQuoteDto, InscriptionOptionsDto, InscriptionSummaryDto, OptionSummaryDto } from '@sia/contracts';
import { startWith } from 'rxjs';
import { AccountSession } from '../../core/account-session';
import { ApiService, apiErrorCode, apiErrorDetails, apiErrorMessage } from '../../core/api.service';
import { CallStore } from '../../core/call.store';
import { AREA_NAMES, longDate, soles } from '../../core/format';
import { UbigeoSelect } from '../../shared/ubigeo-select';
import { InscriptionReceipt } from './inscription-receipt';
import { UsabilitySurvey } from './usability-survey';
import { PhotoCapture } from './photo-capture';

/** Borrador local de la inscripción (RF-03.06): solo en este navegador, nunca en el servidor sin cuenta. */
interface Draft { savedAt: string; values: Record<string, unknown> }
const DRAFT_KEY = 'sia-borrador-inscripcion';
function readDraft(): Draft | null {
  try {
    const d = JSON.parse(localStorage.getItem(DRAFT_KEY) ?? 'null') as Draft | null;
    // Un borrador de más de 7 días se descarta (datos personales en un equipo que puede ser compartido).
    return d && Date.now() - new Date(d.savedAt).getTime() < 7 * 86_400_000 ? d : null;
  } catch {
    return null;
  }
}
function clearDraft(): void {
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch {
    // Ver readDraft.
  }
}

/** Etiquetas de los campos para el resumen de errores. */
const LABELS: Record<string, string> = {
  documentNumber: 'Número de documento', paternalSurname: 'Apellido paterno', maternalSurname: 'Apellido materno', firstNames: 'Nombres',
  sex: 'Sexo', maritalStatus: 'Estado civil', birthUbigeo: 'Lugar de nacimiento', birthDate: 'Fecha de nacimiento', address: 'Dirección actual',
  residenceUbigeo: 'Lugar de residencia', economicDependency: 'Dependencia económica', mobile: 'Celular', email: 'Correo electrónico',
  photo: 'Fotografía', schoolUbigeo: 'Lugar del colegio', schoolName: 'Nombre del colegio', schoolType: 'Gestión del colegio',
  graduationYear: 'Año en que culminó', inFourthOrBelow: '¿Cursa 4.º o inferior?', preparation: 'Tipo de preparación', attempts: 'Veces que postula',
  modality: 'Modalidad', quotaCategory: 'Tipo', area: 'Área', optionCode: 'Programa de estudio', declarationAccepted: 'Declaración jurada', consentAccepted: 'Tratamiento de datos personales',
};

/**
 * Pasos de la inscripción (crítica de Impeccable, 29/10/2026): el formulario oficial de unos 30 campos se reparte
 * en cinco pasos con validación por paso y una revisión final antes de la declaración jurada (irreversible).
 */
const STEPS = [
  { title: 'Tus datos', fields: ['modality', 'documentNumber', 'paternalSurname', 'maternalSurname', 'firstNames', 'sex', 'birthDate', 'birthUbigeo', 'maritalStatus', 'economicDependency'] },
  { title: 'Domicilio y contacto', fields: ['address', 'residenceUbigeo', 'phone', 'mobile', 'email'] },
  { title: 'Fotografía', fields: ['photo'] },
  { title: 'Colegio', fields: ['schoolUbigeo', 'schoolName', 'schoolType', 'graduationYear', 'inFourthOrBelow', 'preparation', 'attempts'] },
  { title: 'Postulación', fields: ['quotaCategory', 'militaryCondition', 'campus', 'area', 'optionCode', 'familyLink'] },
  { title: 'Revisión', fields: ['declarationAccepted', 'consentAccepted'] },
] as const;

/** Qué hacer cuando falta cada dato (en lugar de un «obligatorio» igual para todos). */
const REQUIRED_MSG: Record<string, string> = {
  documentNumber: 'Escribe tu número de DNI (8 dígitos) o de carné de extranjería.',
  paternalSurname: 'Escribe tu apellido paterno como figura en tu documento.',
  maternalSurname: 'Escribe tu apellido materno como figura en tu documento.',
  firstNames: 'Escribe tus nombres como figuran en tu documento.',
  sex: 'Elige masculino o femenino.',
  birthDate: 'Indica tu fecha de nacimiento.',
  birthUbigeo: 'Elige el departamento, la provincia y el distrito donde naciste.',
  maritalStatus: 'Elige tu estado civil.',
  economicDependency: 'Elige de quién dependes económicamente.',
  address: 'Escribe tu dirección actual: calle o jirón, número y barrio.',
  residenceUbigeo: 'Elige el departamento, la provincia y el distrito donde vives.',
  mobile: 'Escribe tu celular: 9 dígitos que empiezan con 9.',
  email: 'Escribe tu correo: ahí te llega tu código de postulante.',
  photo: 'Sube o toma tu fotografía.',
  schoolUbigeo: 'Elige dónde está tu colegio.',
  schoolName: 'Escribe el nombre de tu colegio.',
  schoolType: 'Elige si tu colegio es estatal o particular.',
  graduationYear: 'Escribe el año en que terminaste o terminarás la secundaria.',
  inFourthOrBelow: 'Indica si cursas 4.º de secundaria o un grado inferior.',
  preparation: 'Elige cómo te preparaste.',
  attempts: 'Indica cuántas veces postulas, contando esta.',
  modality: 'Elige tu modalidad.',
  quotaCategory: 'Elige el tipo de postulante.',
  campus: 'Elige la sede.',
  optionCode: 'Elige el programa de estudio.',
};

/** Minúsculas y sin tildes, para buscar «ingenieria» o «Ingeniería» por igual. */
const DIACRITICS = /\p{Diacritic}/gu;
const fold = (t: string) => t.normalize('NFD').replace(DIACRITICS, '').toLowerCase().trim();

/** Subgrupos del paso 1: con muchos datos pendientes, el resumen se muestra por subgrupo. */
const SUBGROUPS: { title: string; fields: string[] }[] = [
  { title: 'Modalidad', fields: ['modality'] },
  { title: 'Identidad', fields: ['documentNumber', 'paternalSurname', 'maternalSurname', 'firstNames', 'sex', 'birthDate', 'birthUbigeo', 'maritalStatus', 'economicDependency'] },
  { title: 'Dónde vives', fields: ['address', 'residenceUbigeo'] },
  { title: 'Cómo te contactamos', fields: ['phone', 'mobile', 'email'] },
];
/** Hasta este número de pendientes se listan uno por uno. */
const SHORT_LIST = 4;

/** Elemento al que lleva cada enlace del resumen de errores. */
const FIELD_TARGET: Record<string, string> = {
  documentNumber: '#f-doc', paternalSurname: '#f-ap', maternalSurname: '#f-am', firstNames: '#f-nom', sex: '[formcontrolname="sex"]',
  maritalStatus: '#f-civil', birthUbigeo: '#nac-dep', address: '#f-dir', residenceUbigeo: '#res-dep', birthDate: '#f-fnac',
  economicDependency: '#f-dep', phone: '#f-tel', mobile: '#f-cel', email: '#f-mail', photo: '#foto-file', schoolUbigeo: '#col-dep',
  schoolName: '#f-col', schoolType: '[formcontrolname="schoolType"]', graduationYear: '#f-anio', inFourthOrBelow: '#f-cuarto',
  preparation: '#f-prep', attempts: '#f-veces', modality: '#f-mod', quotaCategory: '#f-tipo', campus: '#f-sede', optionCode: '#f-prog',
  declarationAccepted: '[formcontrolname="declarationAccepted"]', consentAccepted: '[formcontrolname="consentAccepted"]',
};

/** Spec 003 (iteración 1, ADR-015): formulario público de inscripción, como el oficial, por pasos y con resumen en vivo. */
@Component({
  selector: 'app-inscription',
  imports: [ReactiveFormsModule, RouterLink, UbigeoSelect, PhotoCapture, InscriptionReceipt, UsabilitySurvey],
  templateUrl: './inscription.html',
  styleUrl: './inscription.scss',
})
export class InscriptionPage {
  private readonly api = inject(ApiService);
  private readonly fb = inject(FormBuilder).nonNullable;

  protected readonly options = signal<InscriptionOptionsDto | null>(null);
  /** RF-13.09: texto vigente de tratamiento de datos; se guarda la versión aceptada con la inscripción. */
  protected readonly consent = signal<ConsentDto | null>(null);
  protected readonly programs = signal<OptionSummaryDto[]>([]);
  protected readonly quote = signal<FeeQuoteDto | null>(null);
  protected readonly lookupState = signal<'idle' | 'loading' | 'found' | 'manual' | 'unavailable' | 'registered'>('idle');
  protected readonly simulated = signal(false);
  protected readonly submitting = signal(false);
  protected readonly submitted = signal(false);
  protected readonly serverError = signal<string | null>(null);
  protected readonly serverFieldErrors = signal<Record<string, string>>({});
  protected readonly result = signal<InscriptionSummaryDto | null>(null);
  /** Para la encuesta SUS: cuánto tomó inscribirse (desde que se abrió el formulario). */
  protected readonly startedAt = Date.now();
  /** Spec 004, Historia 6: programa y ciclo adjudicados por el CEPRE (o por qué no puede elegir esa modalidad). */
  protected readonly cepreAward = signal<{ optionCode: string; program: string; cycle: string } | null>(null);
  protected readonly cepreError = signal<string | null>(null);
  protected readonly demoDnis = ['99900020', '99900021', '99900022', '99900023', '99900042'];
  protected readonly money = soles;
  protected readonly areaNames = AREA_NAMES;
  protected readonly entries = Object.entries;
  protected readonly thisYear = new Date().getFullYear();

  // ── Pasos ────────────────────────────────────────────────────────────
  protected readonly steps = STEPS;
  protected readonly step = signal(0);
  protected readonly stepError = signal<string | null>(null);
  /** Campos pendientes del paso, con el elemento al que lleva cada enlace del resumen. */
  protected readonly stepMissing = signal<{ label: string; target: string }[]>([]);
  private readonly errorBox = viewChild<ElementRef<HTMLElement>>('errorBox');
  protected readonly isLast = computed(() => this.step() === STEPS.length - 1);
  private readonly stepHeading = viewChild<ElementRef<HTMLElement>>('stepHeading');

  protected readonly form = this.fb.group({
    documentType: this.fb.control<'DNI' | 'CE'>('DNI'),
    documentNumber: ['', Validators.required],
    paternalSurname: ['', Validators.required],
    maternalSurname: ['', Validators.required],
    firstNames: ['', Validators.required],
    sex: ['', Validators.required],
    maritalStatus: ['', Validators.required],
    birthUbigeo: ['', Validators.required],
    birthDate: ['', Validators.required],
    address: ['', [Validators.required, Validators.minLength(5)]],
    residenceUbigeo: ['', Validators.required],
    economicDependency: ['', Validators.required],
    phone: ['', Validators.pattern(/^\d{6,9}$/)],
    mobile: ['', [Validators.required, Validators.pattern(/^9\d{8}$/)]],
    email: ['', [Validators.required, Validators.email]],
    photo: ['', Validators.required],
    schoolUbigeo: ['', Validators.required],
    schoolName: ['', [Validators.required, Validators.minLength(3)]],
    schoolType: ['', Validators.required],
    graduationYear: ['', [Validators.required, Validators.pattern(/^\d{4}$/)]],
    inFourthOrBelow: ['', Validators.required],
    preparation: ['', Validators.required],
    attempts: ['1', [Validators.required, Validators.pattern(/^([1-9]|1\d|20)$/)]],
    modality: this.fb.control<'ORD' | 'EXO' | 'CEPRE' | ''>('ORD', Validators.required),
    quotaCategory: ['ORD', Validators.required],
    campus: ['HUAMANGA', Validators.required],
    area: [''],
    optionCode: ['', Validators.required],
    militaryCondition: this.fb.control<'NONE' | 'ACTIVE' | 'DISCHARGED'>('NONE'),
    familyLink: [false],
    declarationAccepted: [false, Validators.requiredTrue],
    consentAccepted: [false, Validators.requiredTrue],
  });

  // Valores del formulario como señales para el resumen en vivo.
  private readonly v = toSignal(this.form.valueChanges.pipe(startWith(this.form.getRawValue())), { initialValue: this.form.getRawValue() });
  protected readonly modality = computed(() => this.options()?.modalities.find((m) => m.code === this.v().modality) ?? null);
  private readonly callStore = inject(CallStore);
  /** Plazo de la modalidad elegida, según el cronograma en curso (y el aviso de validación para exonerados). */
  protected readonly modalityNote = computed(() => {
    const m = this.modality();
    if (!m) return '';
    const stage = this.callStore.current().find((s) => s.code === `${m.code}_REGULAR` || s.code === `${m.code}_EXTEMP`);
    const when = stage ? `Inscripción abierta hasta el ${longDate(stage.endsAt)}${stage.code.endsWith('_EXTEMP') ? ', con recargo por extemporánea' : ''}.` : '';
    const extra = m.code === 'EXO' ? ' Antes de pagar, un evaluador revisa tu expediente en línea.' : m.code === 'CEPRE' ? ' Solo para adjudicados del CEPRE-UNSCH.' : '';
    return (when + extra).trim();
  });
  protected readonly category = computed(() => this.modality()?.categories.find((c) => c.code === this.v().quotaCategory) ?? null);
  /** Texto del buscador de programa (no es parte del formulario ni del borrador). */
  protected readonly programQuery = signal('');
  protected readonly visiblePrograms = computed(() => {
    const q = fold(this.programQuery());
    return this.programs().filter((p) =>
      (!this.v().area || p.area === this.v().area) && (p.categoryVacancies ?? 0) > 0
      // El programa ya elegido sigue en la lista aunque no coincida con la búsqueda.
      && (!q || fold(p.displayName).includes(q) || p.internalCode === this.v().optionCode));
  });
  protected readonly selectedProgram = computed(() => this.programs().find((p) => p.internalCode === this.v().optionCode) ?? null);
  protected readonly fullName = computed(() => [this.v().firstNames, this.v().paternalSurname, this.v().maternalSurname].filter(Boolean).join(' '));
  protected readonly namesLocked = computed(() => this.lookupState() === 'found');
  protected readonly label = (group: 'maritalStatus' | 'economicDependency' | 'preparation' | 'campuses', key: string) =>
    (this.options()?.[group] as Record<string, string> | undefined)?.[key] ?? key;

  constructor() {
    this.api.inscriptionOptions().subscribe((o) => this.options.set(o));
    void inject(AccountSession).consent().then((c) => this.consent.set(c)).catch(() => undefined);

    // Al elegir modalidad: primer tipo disponible y reinicio del programa.
    this.form.controls.modality.valueChanges.subscribe((m) => {
      const first = this.options()?.modalities.find((x) => x.code === m)?.categories[0]?.code ?? '';
      this.form.patchValue({ quotaCategory: first, optionCode: '' });
      if (m !== 'ORD') this.form.controls.militaryCondition.setValue('NONE');
    });
    this.form.controls.area.valueChanges.subscribe(() => this.form.controls.optionCode.setValue(''));

    // Adjudicados CEPRE: con el DNI completo se precargan el programa y el ciclo de la lista oficial.
    const checkCepre = () => {
      const { modality, documentNumber } = this.form.getRawValue();
      this.cepreAward.set(null);
      this.cepreError.set(null);
      if (modality !== 'CEPRE' || !/^\d{8}$/.test(documentNumber)) return;
      this.api.cepreAwardee(documentNumber).subscribe({
        next: (a) => {
          this.cepreAward.set(a);
          this.form.patchValue({ quotaCategory: a.quotaCategory, area: a.area as never });
          this.form.controls.optionCode.setValue(a.optionCode);
        },
        error: (e) => this.cepreError.set((e as { status?: number }).status === 404
          ? 'Tu DNI no figura en la lista de adjudicados del CEPRE-UNSCH. Elige otra modalidad o consulta en la Dirección de Admisión.'
          : 'No pudimos consultar la lista de adjudicados. Inténtalo de nuevo en unos minutos.'),
      });
    };
    this.form.controls.modality.valueChanges.subscribe(checkCepre);
    this.form.controls.documentNumber.valueChanges.subscribe(checkCepre);

    // Programas con vacantes en el tipo elegido.
    effect(() => {
      const call = this.options()?.callCode;
      const cat = this.v().quotaCategory;
      if (!call || !cat) return;
      this.api.options(call, { category: cat }).subscribe((r) => this.programs.set(r.data));
    });

    // Tasa en vivo, calculada por la API.
    effect(() => {
      const call = this.options()?.callCode;
      const cat = this.category();
      const v = this.v();
      if (!call || !cat || !v.modality) return;
      const needsSchool = v.modality === 'ORD' || cat.submodality === 'EXO-PSP' || cat.submodality === 'EXO-COAR';
      if (needsSchool && !v.schoolType) {
        this.quote.set(null);
        return;
      }
      this.api
        .feeQuote(call, {
          modality: v.modality,
          submodality: v.modality === 'EXO' ? (cat.submodality ?? undefined) : undefined,
          schoolType: v.schoolType || undefined,
          militaryCondition: v.modality === 'ORD' ? v.militaryCondition : 'NONE',
          familyLink: !!v.familyLink,
        })
        .subscribe({ next: (q) => this.quote.set(q), error: () => this.quote.set(null) });
    });

    // Autocompletar con el DNI (8 dígitos).
    let lookupTimer: ReturnType<typeof setTimeout> | undefined;
    inject(DestroyRef).onDestroy(() => clearTimeout(lookupTimer));
    this.form.controls.documentNumber.valueChanges.subscribe((raw) => {
      clearTimeout(lookupTimer);
      const doc = raw.trim();
      if (this.form.controls.documentType.value !== 'DNI' || !/^\d{8}$/.test(doc)) {
        if (this.lookupState() === 'found') this.clearNames();
        this.lookupState.set('idle');
        return;
      }
      lookupTimer = setTimeout(() => this.lookup(doc), 250);
    });
    this.form.controls.documentType.valueChanges.subscribe(() => {
      this.clearNames();
      this.lookupState.set(this.form.controls.documentType.value === 'CE' ? 'manual' : 'idle');
    });

    // Borrador en este dispositivo (RF-03.06): se guarda solo, sin la foto ni la declaración jurada.
    this.draft.set(readDraft());
    let draftTimer: ReturnType<typeof setTimeout> | undefined;
    inject(DestroyRef).onDestroy(() => clearTimeout(draftTimer));
    this.form.valueChanges.subscribe(() => {
      if (this.draft()) return; // no se pisa un borrador anterior hasta que el postulante decida
      clearTimeout(draftTimer);
      draftTimer = setTimeout(() => this.saveDraft(), 1500);
    });
  }

  // ── Borrador ─────────────────────────────────────────────────────────
  protected readonly draft = signal<Draft | null>(null);
  protected readonly draftSavedAt = signal<string | null>(null);

  /** «Equipo compartido»: se borró el borrador y no se vuelve a guardar en esta visita. */
  protected readonly draftOff = signal(false);

  private saveDraft(): void {
    if (this.draftOff()) return;
    const { photo: _p, declarationAccepted: _d, consentAccepted: _c, ...values } = this.form.getRawValue();
    if (!Object.values(values).some((x) => x !== '' && x !== 'DNI' && x !== 'ORD' && x !== 'HUAMANGA' && x !== 'NONE' && x !== false)) return;
    const savedAt = new Date().toISOString();
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ savedAt, values }));
      this.draftSavedAt.set(savedAt);
    } catch {
      // Sin almacenamiento (modo privado): la inscripción funciona igual, sin borrador.
    }
  }

  /** Recupera el borrador: primero la modalidad y el tipo (que reinician el programa), luego el resto. */
  protected resumeDraft(): void {
    const d = this.draft();
    if (!d) return;
    const v = d.values as Record<string, unknown>;
    this.draft.set(null);
    this.form.patchValue({ modality: v['modality'] as 'ORD' | 'EXO' | 'CEPRE' });
    this.form.patchValue(v as never);
    this.draftSavedAt.set(d.savedAt);
    this.step.set(Math.max(0, this.firstStepWithErrors()));
  }

  protected discardDraft(): void {
    this.draft.set(null);
    clearDraft();
  }

  /** Borra los datos guardados en este equipo y deja de guardarlos (cabinas y equipos compartidos). */
  protected forgetDevice(): void {
    this.draftOff.set(true);
    this.draftSavedAt.set(null);
    clearDraft();
  }

  protected readonly when = (iso: string) => new Date(iso).toLocaleString('es-PE', { timeZone: 'America/Lima', dateStyle: 'medium', timeStyle: 'short' });

  private lookup(dni: string): void {
    this.lookupState.set('loading');
    this.api.identityLookup('DNI', dni).subscribe({
      next: (r) => {
        this.simulated.set(r.simulated);
        if (r.alreadyRegistered) {
          this.lookupState.set('registered');
          return;
        }
        if (r.found) {
          this.form.patchValue({ paternalSurname: r.paternalSurname ?? '', maternalSurname: r.maternalSurname ?? '', firstNames: r.firstNames ?? '' });
          if (r.birthDate) this.form.controls.birthDate.setValue(r.birthDate);
          this.lookupState.set('found');
        } else {
          this.lookupState.set(r.unavailable ? 'unavailable' : 'manual');
        }
      },
      error: (e) => {
        this.lookupState.set('manual');
        this.serverError.set(apiErrorMessage(e));
      },
    });
  }

  private clearNames(): void {
    this.form.patchValue({ paternalSurname: '', maternalSurname: '', firstNames: '' });
  }

  /** Mensaje de error de un campo (local o devuelto por la API). */
  protected err(name: string): string | null {
    const server = this.serverFieldErrors()[name];
    if (server) return server;
    const c = this.form.get(name);
    if (!c || !c.invalid || !(c.touched || this.submitted())) return null;
    if (c.errors?.['required']) return REQUIRED_MSG[name] ?? 'Este dato es obligatorio.';
    if (c.errors?.['email']) return 'Escribe un correo válido.';
    if (c.errors?.['pattern'] && name === 'mobile') return 'Debe tener 9 dígitos y empezar con 9.';
    if (c.errors?.['pattern'] && name === 'graduationYear') return 'Escribe el año con 4 dígitos.';
    if (c.errors?.['pattern']) return 'Formato inválido.';
    if (c.errors?.['minlength']) return name === 'address' ? 'Escribe la dirección completa (al menos 5 caracteres).' : 'Es demasiado corto.';
    return 'Revisa este dato.';
  }

  protected readonly invalidFields = computed(() => {
    this.v();
    this.submitted();
    return Object.keys(this.form.controls).filter((k) => this.form.get(k)?.invalid).map((k) => LABELS[k] ?? k);
  });

  /** Campos del paso con datos pendientes, con su nombre para el mensaje. */
  private pending(step: number): string[] {
    return STEPS[step]!.fields.filter((f) => this.form.get(f)?.invalid).map((f) => LABELS[f] ?? f);
  }

  private missingIn(step: number) {
    const target = (f: string) => FIELD_TARGET[f] ?? `[formcontrolname="${f}"]`;
    const missing: string[] = STEPS[step]!.fields.filter((f) => this.form.get(f)?.invalid);
    if (step > 1 || missing.length <= SHORT_LIST) return missing.map((f) => ({ label: LABELS[f] ?? f, target: target(f) }));
    // Muchos pendientes: una línea por subgrupo que lleva a su primer dato pendiente.
    return SUBGROUPS.map((g) => ({ g, left: missing.filter((f) => g.fields.includes(f)) }))
      .filter(({ left }) => left.length)
      .map(({ g, left }) => ({ label: `${g.title}: ${left.map((f) => (LABELS[f] ?? f).toLowerCase()).join(', ')}`, target: target(left[0]!) }));
  }

  /** Resumen visible: el foco va a él para que el lector de pantalla lo lea y desde ahí se salta a cada campo. */
  private showMissing(step: number): void {
    const count = this.pending(step).length;
    this.stepMissing.set(this.missingIn(step));
    this.stepError.set(count === 1 ? 'Falta completar 1 dato:' : `Falta completar ${count} datos:`);
    setTimeout(() => {
      const box = this.errorBox()?.nativeElement;
      box?.scrollIntoView({ block: 'start' });
      box?.focus({ preventScroll: true });
    }, 0);
  }

  /** El enlace apunta al campo cuando tiene id (sirve sin script y al copiar el enlace). */
  protected href(target: string): string {
    return target.startsWith('#') ? target : '#';
  }

  /** Ayuda en el celular: la barra fija abre el asistente (el botón flotante se oculta en esta página). */
  protected openAssistant(): void {
    window.dispatchEvent(new CustomEvent('sia-asistente'));
  }

  protected focusField(ev: Event, target: string): void {
    ev.preventDefault();
    const el = document.querySelector<HTMLElement>(target);
    el?.scrollIntoView({ block: 'center' });
    el?.focus({ preventScroll: true });
  }

  private firstStepWithErrors(): number {
    return STEPS.findIndex((_, i) => this.pending(i).length > 0);
  }

  /** «Siguiente»: valida solo los datos de este paso y lleva al primero que falta. */
  protected next(): void {
    const i = this.step();
    for (const f of STEPS[i]!.fields) this.form.get(f)?.markAsTouched();
    if (i === 0 && this.lookupState() === 'registered') {
      this.stepMissing.set([]);
      this.stepError.set('Este documento ya tiene una inscripción. Consúltala en «Ya me inscribí».');
      return;
    }
    if (this.pending(i).length) {
      this.showMissing(i);
      return;
    }
    this.goTo(i + 1);
  }

  protected back(): void {
    if (this.step() > 0) this.goTo(this.step() - 1);
  }

  /** Ir a un paso: hacia atrás siempre; hacia adelante solo si los anteriores están completos. */
  protected goTo(target: number): void {
    if (target > this.step() && STEPS.slice(0, target).some((_, i) => this.pending(i).length > 0)) return;
    this.stepError.set(null);
    this.stepMissing.set([]);
    this.step.set(target);
    queueMicrotask(() => {
      const h = this.stepHeading()?.nativeElement;
      h?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      h?.focus({ preventScroll: true });
    });
  }

  protected canOpen(target: number): boolean {
    return target <= this.step() || !STEPS.slice(0, target).some((_, i) => this.pending(i).length > 0);
  }

  protected submit(): void {
    if (!this.isLast()) {
      this.next();
      return;
    }
    this.submitted.set(true);
    this.serverError.set(null);
    this.serverFieldErrors.set({});
    this.form.markAllAsTouched();
    if (this.lookupState() === 'registered') {
      this.serverError.set('Este DNI ya tiene una inscripción. Consúltala en «Mi inscripción».');
      return;
    }
    if (this.form.invalid) {
      const first = this.firstStepWithErrors();
      if (first >= 0 && first !== this.step()) {
        this.goTo(first);
        this.showMissing(first);
        return;
      }
      this.serverError.set(`Falta completar: ${this.invalidFields().join(', ')}.`);
      setTimeout(() => document.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus(), 0);
      return;
    }
    const v = this.form.getRawValue();
    this.submitting.set(true);
    this.api
      .register({
        documentType: v.documentType,
        documentNumber: v.documentNumber.trim(),
        paternalSurname: v.paternalSurname,
        maternalSurname: v.maternalSurname,
        firstNames: v.firstNames,
        sex: v.sex as 'M' | 'F',
        maritalStatus: v.maritalStatus,
        birthUbigeo: v.birthUbigeo,
        birthDate: v.birthDate,
        address: v.address,
        residenceUbigeo: v.residenceUbigeo,
        economicDependency: v.economicDependency,
        phone: v.phone || undefined,
        mobile: v.mobile,
        email: v.email.trim(),
        photo: v.photo,
        schoolUbigeo: v.schoolUbigeo,
        schoolName: v.schoolName,
        schoolType: v.schoolType as 'ESTATAL' | 'PARTICULAR',
        graduationYear: Number(v.graduationYear),
        inFourthOrBelow: v.inFourthOrBelow === 'SI',
        preparation: v.preparation,
        attempts: Number(v.attempts),
        modality: v.modality as 'ORD' | 'EXO' | 'CEPRE',
        quotaCategory: v.quotaCategory,
        campus: v.campus,
        optionCode: v.optionCode,
        militaryCondition: v.militaryCondition,
        familyLink: v.familyLink,
        declarationAccepted: v.declarationAccepted,
        consentVersion: this.consent()?.version ?? '',
      })
      .subscribe({
        next: (r) => {
          this.result.set(r);
          clearDraft();
          this.submitting.set(false);
          scrollTo({ top: 0, behavior: 'smooth' });
        },
        error: (e) => {
          this.submitting.set(false);
          this.serverError.set(apiErrorMessage(e));
          this.serverFieldErrors.set(Object.fromEntries(apiErrorDetails(e).map((d) => [d.field, d.issue])));
          if (apiErrorCode(e) === 'ALREADY_REGISTERED') this.lookupState.set('registered');
        },
      });
  }

  protected useDemo(dni: string): void {
    this.form.patchValue({ documentType: 'DNI' });
    this.form.controls.documentNumber.setValue(dni);
  }

  protected copyBirthToResidence(): void {
    this.form.controls.residenceUbigeo.setValue(this.form.controls.birthUbigeo.value);
  }
}
