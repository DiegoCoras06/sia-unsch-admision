import path from 'node:path';
import { defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint';

const normalized = (value) => value.replaceAll('\\', '/');

const architecture = {
  meta: {
    type: 'problem',
    docs: { description: 'Protege las capas y fachadas del monolito modular (ADR-001/002).' },
    schema: [],
    messages: {
      crossModule: 'Un modulo solo puede consumir la fachada index.ts de otro modulo.',
      inward: 'La capa {{layer}} no puede depender de {{source}}.',
    },
  },
  create(context) {
    const filename = normalized(context.filename);
    const current = filename.match(/\/src\/modules\/([^/]+)\/(domain|application|infrastructure|presentation)\//);
    if (!current) return {};
    const [, moduleName, layer] = current;

    return {
      ImportDeclaration(node) {
        const source = String(node.source.value);
        const forbidden =
          layer === 'domain'
            ? /prisma|express|\/infrastructure\/|\/presentation\//
            : layer === 'application'
              ? /prisma|generated\/prisma|express|\/infrastructure\/|\/presentation\//
              : null;
        if (forbidden?.test(source)) {
          context.report({ node, messageId: 'inward', data: { layer, source } });
        }

        if (!source.startsWith('.')) return;
        const target = normalized(path.resolve(path.dirname(filename), source));
        const other = target.match(/\/src\/modules\/([^/]+)\/(.*)$/);
        if (!other || other[1] === moduleName) return;
        if (!/^index(?:\.js|\.ts)?$/.test(other[2])) context.report({ node, messageId: 'crossModule' });
      },
    };
  },
};

export default defineConfig([
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/coverage/**',
      '**/.pgdata/**',
      '**/generated/**',
      'graphify-out/**',
    ],
  },
  {
    files: ['**/*.{js,mjs,cjs}'],
    rules: { 'no-debugger': 'error' },
  },
  {
    files: ['**/*.ts'],
    languageOptions: { parser: tseslint.parser },
    plugins: { '@typescript-eslint': tseslint.plugin },
    linterOptions: { reportUnusedDisableDirectives: 'off' },
    rules: { 'no-debugger': 'error' },
  },
  {
    files: ['apps/backend/src/modules/**/*.ts'],
    plugins: { architecture: { rules: { boundaries: architecture } } },
    rules: { 'architecture/boundaries': 'error' },
  },
]);
