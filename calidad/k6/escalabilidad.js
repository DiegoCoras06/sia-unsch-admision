// AC03 Escalabilidad (EQ-03): ¿el tiempo de respuesta se mantiene al subir de 10 a 100 usuarios?
// Solo lectura. Recomendado después del despliegue en AWS (API y base en la misma región).
// Uso: k6 run calidad/k6/escalabilidad.js
//      k6 run -e BASE=https://tu-dominio/api/v1 calidad/k6/escalabilidad.js
import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE = __ENV.BASE || 'http://127.0.0.1:3000/api/v1';
const CALL = __ENV.CONVOCATORIA || '2027-I';

export const options = {
  stages: [
    { duration: '30s', target: 10 },
    { duration: '1m', target: 10 },
    { duration: '30s', target: 50 },
    { duration: '1m', target: 50 },
    { duration: '30s', target: 100 },
    { duration: '1m', target: 100 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<3000'],
    http_req_failed: ['rate<0.01'],
  },
};

export default function () {
  const rutas = ['/calls/current', `/calls/${CALL}/options`, `/calls/${CALL}/submodalities`, '/announcements'];
  const respuestas = http.batch(rutas.map((r) => ['GET', `${BASE}${r}`]));
  for (const r of respuestas) check(r, { 'responde 200': (res) => res.status === 200 });
  sleep(1);
}

export function handleSummary(data) {
  const d = data.metrics.http_req_duration.values;
  const fallas = data.metrics.http_req_failed.values.rate;
  const texto = [
    `AC03 Escalabilidad: ${new Date().toISOString()}`,
    `Dirección: ${BASE}, etapas de 10, 50 y 100 usuarios`,
    `Peticiones: ${data.metrics.http_reqs.values.count}, máximo de usuarios: ${data.metrics.vus_max.values.max}`,
    `Tiempo promedio: ${d.avg.toFixed(0)} ms, p95: ${d['p(95)'].toFixed(0)} ms, máximo: ${d.max.toFixed(0)} ms`,
    `Errores: ${(fallas * 100).toFixed(2)} %`,
    `Meta (p95 de 3000 ms o menos con 100 usuarios y menos de 1 % de errores): ${d['p(95)'] < 3000 && fallas < 0.01 ? 'CUMPLE' : 'NO CUMPLE'}`,
    '',
  ].join('\n');
  return { stdout: `\n${texto}`, [`calidad/resultados/${new Date().toISOString().slice(0, 10)}-k6-escalabilidad.txt`]: texto };
}
