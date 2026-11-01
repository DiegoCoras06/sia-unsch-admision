import { describe, expect, it } from 'vitest';
import { quoteFee, type FeeCriteria, type FeeInfo, type FeeRule, type SurchargeRule } from '../../../src/modules/convocatorias/domain/fee-calculator.js';
import { Money } from '../../../src/modules/convocatorias/domain/money.js';
import type { Stage } from '../../../src/modules/convocatorias/domain/stage.js';
import * as seed from '../../../prisma/seed/call-2027-I.js';

// Se usan los MISMOS datos de la semilla: la prueba valida la calculadora y la transcripción de la Tabla N.° 3.
const fees = new Map<string, FeeInfo>(seed.fees.map((f) => [f.code, { code: f.code, concept: f.concept, amount: Money.of(f.amount), legalNote: f.legal }]));
const rules: FeeRule[] = seed.feeRules.map((r) => ({
  fee: fees.get(r.fee)!, modalityCode: r.modality, submodalityCode: r.sub ?? null, schoolType: r.school ?? null,
  militaryCondition: r.military ?? null, familyLink: r.family ?? null, priority: r.priority,
}));
const surcharges: SurchargeRule[] = seed.surchargeRules.map((s) => ({ fee: fees.get(s.fee)!, appliesToScope: s.scope, priority: s.priority }));
const stages: Stage[] = seed.stages.map((s, i) => ({ ...s, startsAt: new Date(s.startsAt), endsAt: new Date(s.endsAt), highlight: s.highlight ?? false, sortOrder: i + 1 }));

const REGULAR = new Date('2026-10-25T10:00:00-05:00');
const ORD_EXTEMP = new Date('2026-11-08T10:00:00-05:00');
const EXO_EXTEMP = new Date('2026-11-02T10:00:00-05:00');
const CEPRE_REGULAR = new Date('2026-11-11T10:00:00-05:00');
const CEPRE_EXTEMP = new Date('2026-11-13T10:00:00-05:00');

const base: FeeCriteria = { modality: 'ORD', militaryCondition: 'NONE', familyLink: false };
const quote = (c: Partial<FeeCriteria>, at = REGULAR) => quoteFee({ ...base, ...c }, rules, surcharges, stages, at);

describe('Simulador de tasas - Tabla N.° 3 completa (SC-002 de 001)', () => {
  const cases: [string, Partial<FeeCriteria>, string, Date?][] = [
    ['1.1 Ordinario estatal', { schoolType: 'ESTATAL' }, '250.00'],
    ['1.1 Ordinario particular', { schoolType: 'PARTICULAR' }, '300.00'],
    ['1.2 Servicio militar estatal', { schoolType: 'ESTATAL', militaryCondition: 'ACTIVE' }, '125.00'],
    ['1.2 Servicio militar particular', { schoolType: 'PARTICULAR', militaryCondition: 'ACTIVE' }, '150.00'],
    ['1.3 Licenciado estatal', { schoolType: 'ESTATAL', militaryCondition: 'DISCHARGED' }, '187.50'],
    ['1.3 Licenciado particular', { schoolType: 'PARTICULAR', militaryCondition: 'DISCHARGED' }, '225.00'],
    ['2.1 Primer/segundo puesto estatal', { modality: 'EXO', submodality: 'EXO-PSP', schoolType: 'ESTATAL' }, '250.00'],
    ['2.1 Primer/segundo puesto particular', { modality: 'EXO', submodality: 'EXO-PSP', schoolType: 'PARTICULAR' }, '300.00'],
    ['2.1 COAR estatal', { modality: 'EXO', submodality: 'EXO-COAR', schoolType: 'ESTATAL' }, '250.00'],
    ['2.2 Adjudicados CEPRE', { modality: 'CEPRE' }, '335.00', CEPRE_REGULAR],
    ['2.3 Deportistas', { modality: 'EXO', submodality: 'EXO-DEP' }, '300.00'],
    ['2.4 Víctimas', { modality: 'EXO', submodality: 'EXO-VIC' }, '30.00'],
    ['2.6 Discapacidad', { modality: 'EXO', submodality: 'EXO-DIS' }, '250.00'],
    ['2.7 Pueblos indígenas', { modality: 'EXO', submodality: 'EXO-PIN' }, '250.00'],
    ['2.8 Graduados', { modality: 'EXO', submodality: 'EXO-GRA' }, '485.00'],
    ['2.9 Traslado interno', { modality: 'EXO', submodality: 'EXO-TRI' }, '250.00'],
    ['2.10 Traslado externo nacional', { modality: 'EXO', submodality: 'EXO-TEN' }, '380.00'],
    ['2.11 Traslado externo internacional', { modality: 'EXO', submodality: 'EXO-TEI' }, '425.00'],
    ['3 Vínculo familiar (ordinario)', { schoolType: 'PARTICULAR', familyLink: true }, '30.00'],
    ['3 Vínculo familiar (exonerado)', { modality: 'EXO', submodality: 'EXO-GRA', familyLink: true }, '30.00'],
    ['4 Recargo extemporáneo ordinario', { schoolType: 'ESTATAL' }, '315.00', ORD_EXTEMP],
    ['4 Recargo extemporáneo exonerado', { modality: 'EXO', submodality: 'EXO-TEN' }, '445.00', EXO_EXTEMP],
    ['6.3 Recargo CEPRE extemporáneo (S/ 50, aclaración 25/10/2026)', { modality: 'CEPRE' }, '385.00', CEPRE_EXTEMP],
  ];

  it.each(cases)('%s → S/ %s', (_name, criteria, expected, at) => {
    expect(quote(criteria, at).total.toString()).toBe(expected);
  });

  it('H3-E2: el licenciado muestra la nota legal del 25 % de descuento', () => {
    expect(quote({ schoolType: 'PARTICULAR', militaryCondition: 'DISCHARGED' }).lines[0]!.legalNote).toBe('25 % de descuento - Art. 61, Ley 29248');
  });

  it('H3-E5: el vínculo familiar advierte que es por única vez', () => {
    expect(quote({ familyLink: true, schoolType: 'ESTATAL' }).warnings.join(' ')).toContain('única vez');
  });

  it('en periodo regular no hay recargo', () => {
    expect(quote({ schoolType: 'ESTATAL' }).lines).toHaveLength(1);
  });

  it('exonerados sin submodalidad → 422 SUBMODALITY_REQUIRED', () => {
    expect(() => quote({ modality: 'EXO' })).toThrowError(expect.objectContaining({ code: 'SUBMODALITY_REQUIRED', status: 422 }));
  });

  it('ordinario sin tipo de colegio → 422 SCHOOL_TYPE_REQUIRED', () => {
    expect(() => quote({})).toThrowError(expect.objectContaining({ code: 'SCHOOL_TYPE_REQUIRED' }));
  });
});

describe('Money', () => {
  it('suma en céntimos sin errores de coma flotante', () => {
    expect(Money.of('187.50').add(Money.of('65.00')).toString()).toBe('252.50');
    expect(Money.of('0.10').add(Money.of('0.20')).toString()).toBe('0.30');
  });
});
