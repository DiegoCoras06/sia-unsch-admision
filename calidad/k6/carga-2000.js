// AC01 y AC03 (Sprint 2): carga progresiva de 50 a 2000 usuarios virtuales, solo lectura.
// Cada etapa sube los usuarios y los mantiene 1 minuto; el resumen muestra el tiempo y los errores de cada etapa.
// Las peticiones son las de la portada y la inscripción: convocatoria, programas, submodalidades y comunicados.
// No crea inscripciones ni pagos. La base solo recibe las consultas que no están en la caché del catálogo.
// Uso: k6 run calidad/k6/carga-2000.js
//      k6 run -e BASE=https://tu-dominio/api/v1 calidad/k6/carga-2000.js
//      k6 run -e MAXIMO=500 calidad/k6/carga-2000.js   (se detiene en la etapa de 500)
import http from 'k6/http';
import exec from 'k6/execution';
import { check, sleep } from 'k6';

const BASE = __ENV.BASE || 'http://127.0.0.1:3000/api/v1';
const CALL = __ENV.CONVOCATORIA || '2027-I';
const MAXIMO = Number(__ENV.MAXIMO || 2000);
const ETAPAS = [50, 100, 250, 500, 1000, 1500, 2000].filter((n) => n <= MAXIMO);
const SUBIDA = 30; // segundos para llegar a cada etapa
const MESETA = 60; // segundos que se mantiene cada etapa

export const options = {
  stages: [
    ...ETAPAS.flatMap((n) => [{ duration: `${SUBIDA}s`, target: n }, { duration: `${MESETA}s`, target: n }]),
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<3000'],
    http_req_failed: ['rate<0.01'],
    // Una métrica por etapa (solo la meseta), para ver dónde empieza a degradarse.
    ...Object.fromEntries(ETAPAS.flatMap((n) => [
      [`http_req_duration{etapa:${n}}`, ['p(95)<3000']],
      [`http_req_failed{etapa:${n}}`, ['rate<0.01']],
    ])),
  },
  summaryTrendStats: ['avg', 'med', 'p(95)', 'max'],
};

/** Etapa en meseta según el segundo de la prueba, o «subida» mientras los usuarios aumentan. */
function etapaActual() {
  const s = exec.instance.currentTestRunDuration / 1000;
  const i = Math.floor(s / (SUBIDA + MESETA));
  if (i >= ETAPAS.length) return 'bajada';
  return s - i * (SUBIDA + MESETA) >= SUBIDA ? String(ETAPAS[i]) : 'subida';
}

export default function () {
  const etapa = etapaActual();
  const rutas = ['/calls/current', `/calls/${CALL}/options`, `/calls/${CALL}/submodalities`, '/announcements'];
  const respuestas = http.batch(rutas.map((r) => ['GET', `${BASE}${r}`, null, { tags: { etapa }, timeout: '30s' }]));
  for (const r of respuestas) check(r, { 'responde 200': (res) => res.status === 200 });
  sleep(1);
}

export function handleSummary(data) {
  const fila = (n) => {
    const d = data.metrics[`http_req_duration{etapa:${n}}`]?.values;
    const f = data.metrics[`http_req_failed{etapa:${n}}`]?.values;
    if (!d || !f) return `| ${n} | sin datos | | | | |`;
    const cumple = d['p(95)'] < 3000 && f.rate < 0.01;
    return `| ${n} | ${d.avg.toFixed(0)} | ${d.med.toFixed(0)} | ${d['p(95)'].toFixed(0)} | ${(f.rate * 100).toFixed(2)} % | ${cumple ? 'Cumple' : 'No cumple'} |`;
  };
  const total = data.metrics.http_req_duration.values;
  const texto = [
    `Carga progresiva hasta ${ETAPAS[ETAPAS.length - 1]} usuarios: ${new Date().toISOString()}`,
    `Dirección: ${BASE}. Cada etapa: ${SUBIDA} s de subida y ${MESETA} s de meseta. Solo lectura.`,
    `Peticiones: ${data.metrics.http_reqs.values.count}, máximo de usuarios: ${data.metrics.vus_max.values.max}`,
    '',
    '| Usuarios | Promedio (ms) | Mediana (ms) | p95 (ms) | Errores | Meta: p95 3 s y menos de 1 % de errores |',
    '|---|---|---|---|---|---|',
    ...ETAPAS.map(fila),
    '',
    `Toda la prueba: promedio ${total.avg.toFixed(0)} ms, p95 ${total['p(95)'].toFixed(0)} ms, máximo ${total.max.toFixed(0)} ms, errores ${(data.metrics.http_req_failed.values.rate * 100).toFixed(2)} %`,
    '',
  ].join('\n');
  return { stdout: `\n${texto}`, [`calidad/resultados/${new Date().toISOString().slice(0, 10)}-k6-carga-${ETAPAS[ETAPAS.length - 1]}.txt`]: texto };
}
