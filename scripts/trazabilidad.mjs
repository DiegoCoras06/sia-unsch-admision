// Genera docs/trazabilidad-requisitos.md: los 143 RF de la guía maestra (14 módulos) → spec y FR que los cubren → estado.
// Uso: node scripts/trazabilidad.mjs   (volver a ejecutar al cerrar cada paso y actualizar ESTADO)
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';

const guide = readFileSync('docs/fuentes/guia-maestra-arquitectura-implementacion-unsch.md', 'utf8').split(/\r?\n/);

// Estado real del código. Sin entrada = ⏳ especificado, pendiente de implementar.
const ESTADO = {
  'RF-11.01': ['✅', 'Correos de código de verificación y de cuenta creada'],
  'RF-03.10': ['✅', 'Estado de la inscripción y descarga de la ficha en «Imprimir documentos» y «Mi cuenta»'],
  'RF-03.09': ['✅', 'Ficha PDF con foto, código y QR firmado; verificación pública sin DNI completo'],
  'RF-03.08': ['✅', 'La inscripción queda Apta solo con el pago confirmado por el servidor'],
  'RF-03.06': ['✅', 'Borrador automático en el dispositivo (sin foto); «Continuar donde me quedé»'],
  'RF-02.07': ['✅', '«Mi cuenta»: correo, celular, dirección y apoderado'],
  'RF-02.06': ['✅', 'Código de 6 dígitos por correo al crear la cuenta y al cambiar de correo'],
  'RF-02.05': ['✅', 'Ingresar, cerrar sesión (también en todos los dispositivos) y recuperar la contraseña por correo'],
  'RF-02.04': ['✅', 'Cuenta opcional con contraseña segura (argon2, mínimo 10 caracteres, lista de comunes)'],
  'RF-02.01': ['✅', 'Inscripción y cuenta opcional con DNI, correo y celular'],
  'RF-14.10': ['🟡', 'Política de respaldo y procedimiento de restauración en el panel; las copias reales dependen del despliegue en AWS'],
  'RF-14.09': ['✅', 'Fallas de integración listadas con reintento controlado'],
  'RF-14.07': ['🟡', 'Proveedor de correo visible en el panel; se configura en el servidor'],
  'RF-14.05': ['🟡', 'Llaves de Culqi solo en el servidor y enmascaradas en el panel; SSM Parameter Store en el despliegue'],
  'RF-14.04': ['🟡', 'Parámetros de RENIEC visibles y enmascarados en el panel; se configuran en el servidor'],
  'RF-14.02': ['✅', 'Tasas editables por convocatoria, con confirmación si es 0'],
  'RF-14.01': ['✅', 'Textos, comunicados e imágenes de la portada editables en el panel (con descripción y vuelta a la original)'],
  'RF-13.10': ['✅', 'Plazos de retención editables; depuración diaria de conversaciones y anonimización de inscripciones de convocatorias anteriores (con sus archivos)'],
  'RF-13.08': ['✅', 'Suspender, cambiar roles o restablecer cierra todas las sesiones'],
  'RF-13.07': ['✅', 'Permiso por ruta; cada acceso denegado queda auditado'],
  'RF-13.06': ['✅', 'Segundo factor TOTP obligatorio para el personal'],
  'RF-13.05': ['✅', 'Consulta de auditoría por usuario, acción, recurso y fechas'],
  'RF-13.03': ['✅', 'Activar, suspender y desactivar con cierre de sesiones'],
  'RF-13.02': ['✅', '8 roles con permisos verificados en el servidor'],
  'RF-13.01': ['✅', 'Crear y administrar usuarios internos'],
  'RF-12.10': ['✅', 'Consultas, respuestas con IA, derivaciones, tokens y costo del asistente'],
  'RF-12.09': ['✅', 'Filtros por modalidad, programa y fechas'],
  'RF-12.08': ['✅', 'Exportación a Excel y PDF con los filtros aplicados'],
  'RF-12.03': ['✅', 'Recaudación, órdenes pendientes, intentos rechazados, vencidos y duplicados'],
  'RF-12.02': ['✅', 'Por modalidad y programa'],
  'RF-12.01': ['✅', 'Panel con inscritos, aptos, recaudación y pendientes'],
  'RF-10.12': ['✅', 'Base de conocimientos editable en el panel; el asistente la usa al instante'],
  'RF-01.08': ['✅', 'Comunicados y fe de erratas publicados desde el panel'],
  'RF-01.05': ['✅', 'Vacantes editables por programa y categoría, con resolución si está publicada'],
  'RF-01.04': ['✅', 'Facultades, áreas y programas editables en «Catálogo del concurso», con auditoría'],
  'RF-01.03': ['✅', 'Fechas de cada etapa editables, validadas y auditadas'],
  'RF-01.02': ['✅', 'Modalidades, submodalidades y tipos de vacante editables en «Catálogo del concurso», con auditoría'],
  'RF-01.01': ['✅', 'Crear (copiando una convocatoria), modificar y administrar desde el panel'],
  'RF-01.06': ['✅', 'Portal: convocatoria, reglamento y requisitos como PDF, temario y cronograma'],
  'RF-01.07': ['✅', 'La inscripción se abre y cierra según la etapa (STAGE_CLOSED)'],
  'RF-02.02': ['✅', 'Consulta de DNI con apiperu.dev (token solo en el servidor): autocompleta nombres y apellidos; si no responde, el postulante los escribe'],
  'RF-02.03': ['✅', 'Una inscripción por DNI y convocatoria; registro de inhabilitados'],
  'RF-02.08': ['✅', 'Código de postulante con dígito Luhn y auditoría de actividades'],
  'RF-03.01': ['✅', 'Formulario con modalidad Ordinario'],
  'RF-03.02': ['✅', 'Formulario oficial: información básica, académica y de postulante'],
  'RF-03.03': ['✅', 'Selección de programa con vacantes en vivo'],
  'RF-03.04': ['✅', 'Valida etapa, inhabilitados, vacantes, ubigeo, fechas y 4.º grado en el servidor'],
  'RF-03.05': ['✅', 'Foto 240 × 320 y documentos adicionales (DNI, estudios, servicio militar, vínculo UNSCH) en «Imprimir documentos»; visibles en el panel'],
  'RF-03.07': ['✅', 'Tasa calculada en el servidor según la Tabla 3'],
  'RF-04.01': ['✅', 'Modalidad Exonerados y submodalidad (categoría) en el formulario de inscripción'],
  'RF-04.02': ['✅', 'Requisitos de la submodalidad listados en el expediente, con artículo y formatos'],
  'RF-04.03': ['✅', 'Datos complementarios por submodalidad (p. ej. puesto, ámbito, logro deportivo)'],
  'RF-04.04': ['✅', 'Carga de cada documento sustentatorio en línea (PDF, JPG o PNG)'],
  'RF-04.05': ['✅', 'Firma del archivo, 5 MB, PDF íntegro y sin cifrar, imagen completa y SHA-256'],
  'RF-04.06': ['✅', 'Bandeja del evaluador en el panel (permiso expedientes.evaluar)'],
  'RF-04.07': ['✅', 'Autorizar, observar o rechazar con motivo; auditado'],
  'RF-04.08': ['✅', 'Subsanación en 72 horas; vencido el plazo pasa a «No subsanado»'],
  'RF-04.09': ['✅', 'El pago queda bloqueado hasta autorizar el expediente (DOSSIER_NOT_AUTHORIZED)'],
  'RF-04.10': ['✅', 'Autorizado y pagado: la inscripción pasa a Apta y se habilita la ficha con QR'],
  'RF-04.11': ['✅', 'Criterios de evaluación por submodalidad editables; se muestran en «Requisitos» y a la Comisión en el expediente'],
  'RF-04.12': ['✅', 'Evaluación especial programada desde el panel y visible para el postulante'],
  'RF-06.01': ['✅', 'Documentos por submodalidad (obligatorios u opcionales) editables en el panel'],
  'RF-06.02': ['✅', 'Visualizar y descargar cada documento desde el panel (descarga auditada)'],
  'RF-06.03': ['✅', 'Reparto equitativo entre evaluadores activos y reasignación manual'],
  'RF-06.04': ['✅', 'Observación por documento con nota obligatoria'],
  'RF-06.05': ['✅', 'Correo al enviar y al dictaminar, con los documentos observados y el plazo'],
  'RF-06.06': ['✅', 'Versiones de cada documento (la anterior queda «Reemplazado») e historial del expediente'],
  'RF-06.07': ['✅', 'Dictamen de autorización o rechazo con justificación'],
  'RF-06.08': ['✅', 'Autorizar exige todos los documentos obligatorios conformes'],
  'RF-12.04': ['✅', 'Expedientes por estado en el panel y exportación a Excel/PDF'],
  'RF-07.01': ['✅', 'Exámenes por convocatoria y modalidad (Exonerados y Ordinario sembrados del cronograma)'],
  'RF-07.02': ['✅', 'Fecha, apertura y cierre del ingreso, duración y lugar editables en el panel'],
  'RF-07.03': ['✅', 'Estructura por áreas y reparto de las preguntas de conocimientos por curso del temario (la suma se valida)'],
  'RF-07.04': ['✅', 'Puntos por pregunta, factor por área, máximo y mínimo configurables (RN-31 a RN-34)'],
  'RF-07.05': ['✅', 'Relación de aptos (pago confirmado y expediente autorizado) en el panel y en PDF'],
  'RF-07.06': ['✅', 'Sesiones diferenciadas por modalidad; una modalidad no puede estar en dos exámenes'],
  'RF-07.07': ['✅', 'Rechaza aulas compartidas por exámenes con horarios que se cruzan (SCHEDULE_CONFLICT)'],
  'RF-07.08': ['✅', 'Indicaciones, lo que se lleva, lo prohibido y horario de ingreso en «Buscar aula» y en la ficha'],
  'RF-07.09': ['✅', 'Reprogramación con motivo obligatorio y correo a cada postulante con aula publicada'],
  'RF-08.01': ['✅', 'Sedes, pabellones, pisos y aulas en el panel (semilla ilustrativa de la Ciudad Universitaria)'],
  'RF-08.02': ['✅', 'Capacidad máxima por aula; no baja de los asientos ya asignados'],
  'RF-08.03': ['✅', 'Distribución automática: adecuaciones en aulas accesibles, luego por área y orden alfabético; todo o nada si falta capacidad'],
  'RF-08.04': ['✅', 'Restricciones únicas en la base: un asiento por postulante y examen, y por aula y número'],
  'RF-08.05': ['✅', '«Buscar aula» con DNI + código, límite de intentos y respuesta genérica; visible desde 24 h antes'],
  'RF-08.06': ['✅', 'Ficha de examen en PDF con puerta, pabellón, piso, aula, asiento, horario y QR firmado'],
  'RF-08.07': ['✅', 'Lista de asistencia por aula en PDF con foto, código y firma'],
  'RF-08.08': ['✅', 'Ingreso por QR con foto, fuera de hora, ausentes e incidencias; modo sin conexión con cola local y envío con la hora de lectura'],
  'RF-08.09': ['✅', 'Cambio de aula con motivo, historial de versiones y correo al postulante'],
  'RF-12.05': ['✅', 'Ocupación por aula en la distribución y por examen en el panel de indicadores'],
  'RF-12.06': ['✅', 'Presentes y ausentes por examen y por aula en el panel y exportación a Excel/PDF'],
  'RF-05.11': ['✅', 'Conciliación con el reporte de Culqi, banco o Tesorería: conciliado, diferencias de monto o estado, solo en reporte o en sistema; resolución auditada'],
  'RF-05.12': ['✅', 'Anulación o devolución solo por error de cobro (RN-08), con resolución y aprobación de otra persona; el dinero lo mueve Tesorería'],
  'RF-09.01': ['✅', 'Importación del CSV de la lectora óptica desde el panel'],
  'RF-09.02': ['✅', 'Validación completa antes de procesar: inexistentes, duplicados, ausentes con nota, fuera de rango y presentes sin registro'],
  'RF-09.03': ['✅', 'Puntaje con puntos y factor configurables por examen, sin descuento por error (RN-31 a RN-34)'],
  'RF-09.04': ['✅', 'Orden de mérito por programa y categoría (modalidad o submodalidad)'],
  'RF-09.05': ['✅', 'Admitido con mínimo 450 y vacante, empatados del último puesto admitidos, sin traslado entre programas y con vacantes de exonerados al ordinario'],
  'RF-09.06': ['✅', 'Borrador → aprobación de la Comisión (otra persona) → publicación'],
  'RF-09.07': ['✅', 'Visibles desde la fecha y hora aprobadas; aviso por correo al publicarse'],
  'RF-09.08': ['✅', '«Ver puntaje» con DNI + código: puntaje, desglose, puesto y condición'],
  'RF-09.09': ['✅', 'Excel y PDF de resultados por condición y de cobertura de vacantes'],
  'RF-09.10': ['✅', 'Entrega de documentos y recibo de la constancia (S/ 15.00 o con recargo); constancia de ingreso con QR verificable'],
  'RF-09.11': ['✅', 'Versiones: una rectificación exige motivo, reemplaza la publicada y queda en auditoría'],
  'RF-09.12': ['✅', 'Solicitud de revisión por error material como caso de atención (resultados inimpugnables, RN-57)'],
  'RF-11.02': ['✅', 'Correos de orden generada y pago confirmado, registrados en M11'],
  'RF-11.03': ['✅', 'Correos al pasar a Apta, en cada dictamen, en cambios de aula y al anular la inscripción (con el motivo)'],
  'RF-11.04': ['✅', 'Correo con los documentos observados y el plazo de subsanación'],
  'RF-11.05': ['✅', 'Recordatorio de pago 2 días antes del cierre y recordatorio la víspera del examen, sin duplicados y con preferencia'],
  'RF-11.06': ['✅', 'Aviso único por postulante cuando se publica su aula'],
  'RF-11.07': ['✅', 'Aviso de resultados disponibles, sin puntaje en el correo'],
  'RF-11.08': ['✅', 'Comunicados por modalidad, programa y estado con enviados, en cola y fallidos'],
  'RF-11.09': ['🟡', 'Registro de cada correo con estado e intentos (hasta 3, sin duplicar); el estado «rebotado» llega con Amazon SES (Paso 11)'],
  'RF-12.07': ['✅', 'Resultados por condición e ingresantes en el panel; Excel y PDF de resultados y cobertura'],
  'RF-05.01': ['✅', 'Simulador y cálculo de tasa en el servidor'],
  'RF-05.02': ['✅', 'Orden única por inscripción, con número de pedido por intento'],
  'RF-05.03': ['✅', 'Culqi integrado (ADR-024): tarjeta y Yape en el mismo formulario; pasarela simulada para desarrollo y pruebas'],
  'RF-05.04': ['✅', 'Formulario de Culqi Checkout; la tarjeta nunca pasa por el servidor, que solo recibe un token'],
  'RF-05.05': ['✅', 'El servidor cobra el token en Culqi y su respuesta, servidor a servidor, confirma el pago; no depende del navegador'],
  'RF-05.06': ['✅', 'Solo el cargo creado por el servidor con la llave secreta confirma el pago; monto y moneda se verifican contra la orden'],
  'RF-05.07': ['✅', 'Intento con transacción, operación, autorización, medio, monto, fecha y estado'],
  'RF-05.08': ['✅', 'Constancia de pago en «Imprimir documentos» (no es comprobante SUNAT)'],
  'RF-05.09': ['✅', 'Un intento se cobra una sola vez, intentos vencidos y pagos duplicados marcados'],
  'RF-05.10': ['✅', 'Historial de intentos con DNI + código'],
  'RF-10.01': ['🟡', 'Integrado con OpenRouter (ADR-017, probado con proveedor guionado); falta la clave para usar la IA en vivo; mientras, modo básico'],
  'RF-10.02': ['✅', 'Responde convocatoria, modalidades, requisitos, tasas, cronograma y examen'],
  'RF-10.03': ['✅', 'Solo con herramientas sobre datos oficiales y base de conocimientos con fuente'],
  'RF-10.04': ['✅', 'Estado de la inscripción con pase firmado (DNI + código)'],
  'RF-10.05': ['✅', 'Estado del pago desde M05'],
  'RF-10.06': ['✅', 'Informa la fotografía y el estado del expediente con sus observaciones'],
  'RF-10.07': ['✅', 'Informa el aula, el asiento y la puerta cuando están publicados'],
  'RF-10.08': ['✅', 'Informa el puntaje, el puesto y la condición cuando se publican los resultados'],
  'RF-10.09': ['✅', 'Incidencias frecuentes de inscripción y pagos en la base de conocimientos'],
  'RF-10.10': ['✅', 'Derivación a un caso de atención con la conversación'],
  'RF-10.11': ['✅', 'Conversaciones enmascaradas con retención de 90 días'],
  'RF-10.13': ['✅', 'Clave solo en el servidor'],
  'RF-10.14': ['✅', 'Datos personales solo con pase; el DNI nunca va a la IA'],
  'RF-10.15': ['✅', 'Límite por IP, presupuesto diario y registro de tokens, costo y errores'],
  'RF-10.16': ['✅', 'Sin herramienta no hay dato: responde que no tiene información verificada'],
  'RF-14.06': ['✅', 'OPENROUTER_API_KEY y OPENROUTER_MODEL en el servidor'],
  'RF-13.04': ['✅', 'Auditoría solo-inserción protegida con trigger'],
  'RF-13.09': ['✅', 'Consentimiento versionado al crear cuenta y al inscribirse (versión y huella del texto)'],
  'RF-14.03': ['✅', 'Documentos exigidos de la convocatoria editables (nombre, contenido, artículo y formatos)'],
  'RF-14.08': ['✅', 'Funciones activadas según la etapa del proceso'],
};

// RF → [{spec, fr}] a partir de las líneas «- **FR-xxx**: … *(RF-aa.bb a RF-aa.cc, …)*» de cada spec.
const cover = {};
for (const dir of readdirSync('specs').filter((d) => /^\d{3}-/.test(d)).sort()) {
  for (const line of readFileSync(`specs/${dir}/requirements.md`, 'utf8').split(/\r?\n/)) {
    const fr = line.match(/\*\*(FR-\d{3})\*\*/)?.[1];
    if (!fr) continue;
    const codes = new Set();
    for (const [, a, b] of line.matchAll(/RF-(\d{2}\.\d{2})(?:\s+a\s+RF-(\d{2}\.\d{2}))?/g)) {
      const [m, from] = a.split('.');
      const to = b ? Number(b.split('.')[1]) : Number(from);
      for (let i = Number(from); i <= to; i++) codes.add(`RF-${m}.${String(i).padStart(2, '0')}`);
    }
    for (const c of codes) (cover[c] ??= []).push({ dir, fr });
  }
}

const modules = [];
for (const line of guide) {
  const mod = line.match(/^Módulo (\d{2})\. (.+)$/);
  if (mod) modules.push({ id: mod[1], name: mod[2].trim(), goal: '', rfs: [] });
  const goal = line.match(/^Objetivo: (.+)$/);
  if (goal && modules.length && !modules.at(-1).goal) modules.at(-1).goal = goal[1].trim();
  const rf = line.match(/^(RF-\d{2}\.\d{2})\t(.+)$/);
  if (rf && modules.length) modules.at(-1).rfs.push({ code: rf[1], text: rf[2].trim() });
}

const total = { '✅': 0, '🟡': 0, '⏳': 0 };
const sections = modules.map((m) => {
  const count = { '✅': 0, '🟡': 0, '⏳': 0 };
  const rows = m.rfs.map(({ code, text }) => {
    const [icon, note] = ESTADO[code] ?? ['⏳', ''];
    count[icon]++;
    total[icon]++;
    const refs = (cover[code] ?? []).map(({ dir, fr }) => `[${dir.slice(0, 3)}](../specs/${dir}/requirements.md) ${fr}`).join(', ') || '**sin spec**';
    return `| ${code} | ${text} | ${refs} | ${icon} ${note} |`;
  });
  return { m, count, body: [
    `## M${m.id}. ${m.name}`, '', `**Objetivo:** ${m.goal}`, '',
    '| Código | Requerimiento funcional | Spec · FR | Estado |', '|---|---|---|---|', ...rows, '',
  ].join('\n') };
});

const n = Object.values(total).reduce((a, b) => a + b, 0);
const out = [
  '# Trazabilidad de requerimientos funcionales',
  '',
  `Los **${n} requerimientos** de los **${modules.length} módulos** (fuente: [guía maestra](fuentes/guia-maestra-arquitectura-implementacion-unsch.md)) enlazados con la spec y el requisito FR que los cubre, y su estado en el código.`,
  'Esta matriz conserva la numeración del catálogo original. El sistema trabaja con 12 módulos: la equivalencia está en el [diseño interno](03-diseño-de-software/diseño-interno-modulos.md).',
  '',
  'Generado con `node scripts/trazabilidad.mjs`; el estado se actualiza al cerrar cada paso.',
  '',
  '✅ implementado y probado · 🟡 parcial (lo que falta está anotado) · ⏳ especificado, pendiente de implementar',
  '',
  '## Resumen por módulo',
  '',
  '| Módulo | RF | ✅ | 🟡 | ⏳ | Specs |',
  '|---|--:|--:|--:|--:|---|',
  ...sections.map(({ m, count }) => {
    const specs = [...new Set(m.rfs.flatMap(({ code }) => (cover[code] ?? []).map((c) => c.dir.slice(0, 3))))].sort().join(', ');
    return `| M${m.id}. ${m.name} | ${m.rfs.length} | ${count['✅']} | ${count['🟡']} | ${count['⏳']} | ${specs} |`;
  }),
  `| **Total** | **${n}** | **${total['✅']}** | **${total['🟡']}** | **${total['⏳']}** | |`,
  '',
  ...sections.map((s) => s.body),
].join('\n');

writeFileSync('docs/trazabilidad-requisitos.md', out + '\n');
const missing = modules.flatMap((m) => m.rfs).filter(({ code }) => !cover[code]).map((r) => r.code);
console.log(`${modules.length} módulos, ${n} RF · ✅ ${total['✅']} · 🟡 ${total['🟡']} · ⏳ ${total['⏳']} · sin spec: ${missing.length ? missing.join(', ') : 'ninguno'}`);
