import { z } from 'zod';
import { validationError } from './errors.js';

z.config(z.locales.es());

/** Valida con Zod y lanza 400 con el detalle por campo (Constitución VIII). */
export function parse<S extends z.ZodType>(schema: S, input: unknown): z.infer<S> {
  const result = schema.safeParse(input);
  if (result.success) return result.data;
  const details = result.error.issues.map((issue) => ({
    field: issue.path.join('.') || '(cuerpo)',
    issue: issue.message,
  }));
  throw validationError(details[0] ? `${details[0].field}: ${details[0].issue}` : 'Datos inválidos.', details);
}
