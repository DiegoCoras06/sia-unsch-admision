// Verificación automática de los atributos de calidad (AC04 a AC10).
// Uso: node calidad/verificar.mjs
// Corre npm audit, todas las pruebas del backend (base temporal de pruebas, nunca RDS) y la revisión de tipos,
// agrupa los resultados por atributo y escribe el reporte en calidad/resultados/AAAA-MM-DD.md.
import { spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const backend = path.join(root, 'apps/backend');
const hoy = new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Lima' });
const hora = new Date().toLocaleTimeString('es-PE', { timeZone: 'America/Lima', hour: '2-digit', minute: '2-digit' });

/** Qué archivos de prueba respaldan cada atributo (un archivo puede respaldar varios). */
const ATRIBUTOS = [
  { id: 'AC04', nombre: 'Seguridad', escenario: 'EQ-04', pruebas: ['integration/admin', 'integration/sessions', 'integration/staff-recovery', 'integration/accounts', 'integration/assistant', 'unit/seguridad/', 'unit/usuarios/account-rules'] },
  { id: 'AC05', nombre: 'Mantenibilidad', escenario: 'EQ-05', pruebas: ['unit/arquitectura/'] },
  { id: 'AC06', nombre: 'Integridad', escenario: 'EQ-06', pruebas: ['integration/inscriptions', 'integration/payments', 'integration/treasury', 'integration/account-inscriptions', 'unit/convocatorias/fee-calculator', 'unit/resultados/', 'unit/examenes/'] },
  { id: 'AC07', nombre: 'Usabilidad', escenario: 'EQ-07', pruebas: ['integration/usability-survey', 'unit/inscripciones/sus'] },
  { id: 'AC08', nombre: 'Interoperabilidad', escenario: 'EQ-08', pruebas: ['integration/pago-culqi', 'unit/pagos/', 'unit/usuarios/apiperu', 'unit/email/', 'unit/storage/'] },
  { id: 'AC09', nombre: 'Confiabilidad', escenario: 'EQ-09', pruebas: ['unit/shared/db-unreachable', 'integration/event-queue', 'integration/notifications'] },
  { id: 'AC10', nombre: 'Auditabilidad', escenario: 'EQ-10', pruebas: ['integration/admin', 'integration/results', 'integration/notifications', 'integration/staff-recovery'] },
];

const run = (cmd, cwd = root) => spawnSync(cmd, { cwd, shell: true, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
const paso = (texto) => process.stdout.write(`\n▸ ${texto}\n`);

// 1. Dependencias (AC04)
paso('npm audit (dependencias)');
const audit = run('npm audit --json');
let vulnerabilidades = null;
try {
  vulnerabilidades = JSON.parse(audit.stdout).metadata.vulnerabilities;
} catch {
  vulnerabilidades = null;
}
const totalVuln = vulnerabilidades ? vulnerabilidades.total : null;
console.log(vulnerabilidades ? `  ${totalVuln} vulnerabilidades (altas: ${vulnerabilidades.high}, críticas: ${vulnerabilidades.critical})` : '  No se pudo leer el resultado de npm audit.');

// 2. Pruebas del backend (todas, agrupadas por atributo)
paso('Pruebas del backend (Vitest, base temporal de pruebas)');
const salida = path.join(os.tmpdir(), `sia-calidad-${process.pid}.json`);
const vitest = run(`npx vitest run --reporter=json --outputFile="${salida}"`, backend);
let resultados = [];
try {
  resultados = JSON.parse(readFileSync(salida, 'utf8')).testResults.map((r) => {
    const rel = path.relative(path.join(backend, 'tests'), r.name).split(path.sep).join('/');
    const casos = r.assertionResults ?? [];
    return {
      archivo: rel,
      aprobadas: casos.filter((c) => c.status === 'passed').length,
      fallidas: casos.filter((c) => c.status === 'failed').map((c) => c.fullName ?? c.title),
    };
  });
  rmSync(salida, { force: true });
} catch {
  console.log('  No se pudo leer el resultado de Vitest.');
  console.log((vitest.stdout || '').slice(-2000), (vitest.stderr || '').slice(-2000));
}
const totalAprobadas = resultados.reduce((n, r) => n + r.aprobadas, 0);
const totalFallidas = resultados.reduce((n, r) => n + r.fallidas.length, 0);
console.log(`  ${resultados.length} archivos, ${totalAprobadas} pruebas aprobadas, ${totalFallidas} fallidas`);

// 3. Revisión de tipos (AC05)
paso('Revisión de tipos del backend y del portal');
const tiposBack = run('npx tsc --noEmit -p apps/backend/tsconfig.json');
const tiposFront = run('npx tsc --noEmit -p apps/frontend/tsconfig.app.json');
const tiposOk = tiposBack.status === 0 && tiposFront.status === 0;
console.log(`  backend: ${tiposBack.status === 0 ? 'sin errores' : 'con errores'}, portal: ${tiposFront.status === 0 ? 'sin errores' : 'con errores'}`);

// 4. Resultado por atributo
const porAtributo = ATRIBUTOS.map((a) => {
  const archivos = resultados.filter((r) => a.pruebas.some((p) => r.archivo.startsWith(p)));
  const aprobadas = archivos.reduce((n, r) => n + r.aprobadas, 0);
  const fallidas = archivos.flatMap((r) => r.fallidas.map((f) => `${r.archivo}: ${f}`));
  const extras = [];
  if (a.id === 'AC04') extras.push(totalVuln === 0 ? 'npm audit sin vulnerabilidades' : `npm audit: ${totalVuln ?? '?'} vulnerabilidades`);
  if (a.id === 'AC05') extras.push(tiposOk ? 'tipos sin errores' : 'errores de tipos');
  const ok = archivos.length > 0 && fallidas.length === 0 && (a.id !== 'AC04' || totalVuln === 0) && (a.id !== 'AC05' || tiposOk);
  return { ...a, archivos, aprobadas, fallidas, extras, ok };
});

const fila = (a) => `| ${a.id} ${a.nombre} | ${a.escenario} | ${a.ok ? '✅ Pruebas aprobadas' : '❌ Revisar'} | ${a.aprobadas} aprobadas${a.fallidas.length ? `, ${a.fallidas.length} fallidas` : ''} en ${a.archivos.length} ${a.archivos.length === 1 ? 'archivo' : 'archivos'}${a.extras.length ? `; ${a.extras.join('; ')}` : ''} |`;

const reporte = `# Verificación de atributos de calidad: ${hoy}

Generado con \`node calidad/verificar.mjs\` el ${hoy} a las ${hora} (hora de Lima).
Las pruebas usan una base PostgreSQL temporal que se crea y se borra en cada ejecución; no tocan RDS.
«Pruebas aprobadas» indica que pasaron las pruebas automáticas del atributo; las manuales de \`calidad/README.md\` (sección 4) completan cada escenario.

## Resumen

| Atributo | Escenario | Resultado | Detalle |
|---|---|---|---|
| AC01 Rendimiento | EQ-01 | ⏳ Manual | Prueba de carga con k6 (\`calidad/k6/rendimiento.js\`) |
| AC02 Disponibilidad | EQ-02 | ⏳ Después del despliegue | UptimeRobot sobre \`/api/v1/health\` |
| AC03 Escalabilidad | EQ-03 | ⏳ Después del despliegue | k6 escalonado (\`calidad/k6/escalabilidad.js\`) |
${porAtributo.map(fila).join('\n')}

**Totales:** ${resultados.length} archivos de prueba, ${totalAprobadas} pruebas aprobadas, ${totalFallidas} fallidas.
Dependencias: ${totalVuln === null ? 'sin datos' : `${totalVuln} vulnerabilidades`}. Tipos: ${tiposOk ? 'sin errores' : 'con errores'}.

## Pruebas por atributo

${porAtributo.map((a) => `### ${a.id} ${a.nombre}

${a.archivos.map((r) => `- \`tests/${r.archivo}\`: ${r.aprobadas} aprobadas${r.fallidas.length ? `, ${r.fallidas.length} fallidas` : ''}`).join('\n') || '- Sin pruebas encontradas'}
${a.fallidas.length ? `\nFallidas:\n${a.fallidas.map((f) => `- ${f}`).join('\n')}\n` : ''}`).join('\n')}
## Pruebas manuales pendientes

Ver la sección 4 de \`calidad/README.md\`: k6 (AC01 y AC03), axe y Lighthouse por página y encuesta SUS (AC07),
comandos con servicios reales (AC08) y restauración de respaldo (AC09).
`;

mkdirSync(path.join(root, 'calidad/resultados'), { recursive: true });
const destino = path.join(root, 'calidad/resultados', `${hoy}.md`);
writeFileSync(destino, reporte, 'utf8');

console.log('\nResultado por atributo:');
for (const a of porAtributo) console.log(`  ${a.ok ? '✅' : '❌'} ${a.id} ${a.nombre}: ${a.aprobadas} pruebas${a.fallidas.length ? `, ${a.fallidas.length} fallidas` : ''}`);
console.log(`\nReporte: ${path.relative(root, destino)}`);
process.exitCode = porAtributo.every((a) => a.ok) ? 0 : 1;
