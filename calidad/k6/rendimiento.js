// AC01 Rendimiento (EQ-01): tiempo de respuesta de las pantallas públicas con carga moderada.
// Solo lectura: no crea inscripciones ni pagos.
// Uso: k6 run calidad/k6/rendimiento.js
//      k6 run -e BASE=https://tu-dominio/api/v1 -e USUARIOS=20 calidad/k6/rendimiento.js
import http from 'k6/http';
import { check, group, sleep } from 'k6';

const BASE = __ENV.BASE || 'http://127.0.0.1:3000/api/v1';
const USUARIOS = Number(__ENV.USUARIOS || 10);
const CALL = __ENV.CONVOCATORIA || '2027-I';

export const options = {
  scenarios: {
    lectura: { executor: 'constant-vus', vus: USUARIOS, duration: __ENV.DURACION || '1m' },
  },
  // Meta de EQ-01: el 95 % de las peticiones en 3 s o menos y menos del 1 % de errores.
  thresholds: {
    http_req_duration: ['p(95)<3000'],
    http_req_failed: ['rate<0.01'],
  },
};

const get = (nombre, ruta) => {
  const r = http.get(`${BASE}${ruta}`, { tags: { pantalla: nombre } });
  check(r, { [`${nombre}: responde 200`]: (res) => res.status === 200 });
};

export default function () {
  group('Portada', () => {
    get('convocatoria', '/calls/current');
    get('comunicados', '/announcements');
  });
  group('Programas', () => {
    get('programas', `/calls/${CALL}/options`);
    get('detalle de programa', `/calls/${CALL}/options/P34`);
  });
  group('Tasas', () => {
    get('modalidades', `/calls/${CALL}/submodalities`);
    get('simulador de tasa', `/calls/${CALL}/fee-quote?modality=ORD&schoolType=ESTATAL`);
  });
  sleep(1);
}

export function handleSummary(data) {
  const d = data.metrics.http_req_duration.values;
  const fallas = data.metrics.http_req_failed.values.rate;
  const texto = [
    `AC01 Rendimiento: ${new Date().toISOString()}`,
    `Dirección: ${BASE}, usuarios simultáneos: ${USUARIOS}`,
    `Peticiones: ${data.metrics.http_reqs.values.count}`,
    `Tiempo promedio: ${d.avg.toFixed(0)} ms, p90: ${d['p(90)'].toFixed(0)} ms, p95: ${d['p(95)'].toFixed(0)} ms, máximo: ${d.max.toFixed(0)} ms`,
    `Errores: ${(fallas * 100).toFixed(2)} %`,
    `Meta EQ-01 (p95 de 3000 ms o menos y menos de 1 % de errores): ${d['p(95)'] < 3000 && fallas < 0.01 ? 'CUMPLE' : 'NO CUMPLE'}`,
    '',
  ].join('\n');
  return { stdout: `\n${texto}`, 'calidad/resultados/k6-rendimiento.txt': texto };
}
