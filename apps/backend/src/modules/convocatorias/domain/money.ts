/** Montos en céntimos enteros: nunca se usa `float` para dinero (research R-05). */
export class Money {
  private constructor(readonly cents: number) {
    if (!Number.isInteger(cents) || cents < 0) throw new Error(`Monto inválido: ${cents}`);
  }

  static zero(): Money {
    return new Money(0);
  }

  /** Desde "250.00" o 250 (soles). */
  static of(value: string | number): Money {
    const text = typeof value === 'number' ? value.toFixed(2) : value.trim();
    if (!/^\d+(\.\d{1,2})?$/.test(text)) throw new Error(`Monto inválido: ${value}`);
    const [soles = '0', centimos = ''] = text.split('.');
    return new Money(Number(soles) * 100 + Number(centimos.padEnd(2, '0')));
  }

  add(other: Money): Money {
    return new Money(this.cents + other.cents);
  }

  /** "315.00" */
  toString(): string {
    return `${Math.floor(this.cents / 100)}.${String(this.cents % 100).padStart(2, '0')}`;
  }
}
