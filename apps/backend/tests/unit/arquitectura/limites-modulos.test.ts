// AC05 Mantenibilidad (EQ-05): reglas de dependencia del monolito modular, comprobadas en cada ejecución de pruebas.
// Si alguien rompe un límite, esta prueba falla y dice qué archivo lo hizo.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, normalize, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const SRC = join(dirname(fileURLToPath(import.meta.url)), '../../../src');
const MODULES = join(SRC, 'modules');

function filesIn(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) return filesIn(full);
    return name.endsWith('.ts') ? [full] : [];
  });
}

const posix = (p: string) => p.split(sep).join('/');
const imports = (file: string) => [...readFileSync(file, 'utf-8').matchAll(/from '([^']+)'/g)].map((m) => m[1]!);

/** Cada archivo de un módulo con su módulo, su capa y lo que importa. */
const files = readdirSync(MODULES).flatMap((mod) =>
  filesIn(join(MODULES, mod)).map((file) => {
    const rel = posix(relative(join(MODULES, mod), file));
    return { file: posix(relative(SRC, file)), mod, layer: rel.includes('/') ? rel.split('/')[0]! : 'index', abs: file };
  }),
);

describe('límites entre los 12 módulos', () => {
  it('hay 12 módulos', () => {
    expect(readdirSync(MODULES).filter((m) => statSync(join(MODULES, m)).isDirectory())).toHaveLength(12);
  });

  it('un módulo usa a otro solo por su fachada (index.ts)', () => {
    const violations = files.flatMap(({ file, mod, abs }) =>
      imports(abs)
        .filter((imp) => imp.startsWith('.'))
        .map((imp) => posix(relative(MODULES, normalize(join(dirname(abs), imp)))))
        .filter((target) => !target.startsWith('..'))
        .filter((target) => {
          const [other, ...rest] = target.split('/');
          return other !== mod && !(rest.length === 1 && /^index(\.js)?$/.test(rest[0]!));
        })
        .map((target) => `${file} -> modules/${target}`),
    );
    expect(violations).toEqual([]);
  });

  it('el dominio no depende de Prisma, Express ni de la infraestructura', () => {
    const violations = files
      .filter((f) => f.layer === 'domain')
      .flatMap(({ file, abs }) =>
        imports(abs)
          .filter((imp) => /prisma|express|\/infrastructure\/|\/presentation\//.test(imp))
          .map((imp) => `${file} -> ${imp}`),
      );
    expect(violations).toEqual([]);
  });

  // Servicios que ya guardan por un repositorio: no pueden volver a usar el cliente de base de datos (Db).
  it.each(['inscripciones/application/inscription-service.ts', 'pagos/application/payment-service.ts'])('%s usa su repositorio, no Prisma', (file) => {
    const source = readFileSync(join(MODULES, file), 'utf-8');
    expect(source).not.toMatch(/import type \{[^}]*Db[^}]*\} from/);
    expect(source).not.toMatch(/this\.d\.db/);
  });

  it('la capa de aplicación no conoce HTTP (Express)', () => {
    const violations = files
      .filter((f) => f.layer === 'application')
      .flatMap(({ file, abs }) => imports(abs).filter((imp) => imp === 'express').map((imp) => `${file} -> ${imp}`));
    expect(violations).toEqual([]);
  });
});
