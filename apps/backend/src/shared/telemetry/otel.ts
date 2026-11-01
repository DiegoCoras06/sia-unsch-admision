/**
 * OpenTelemetry opcional (ADR-013). Solo se activa si OTEL_EXPORTER_OTLP_ENDPOINT está definida;
 * en local, por defecto, la observabilidad es la consola (ADR-014).
 * Las dependencias de OpenTelemetry se agregarán junto con la pila de despliegue (T182).
 */
export async function startTelemetry(endpoint: string | undefined, log: (msg: string) => void): Promise<void> {
  if (!endpoint) return;
  log(`OTLP configurado en ${endpoint}, pero el SDK de OpenTelemetry aún no está instalado (se agrega en el despliegue).`);
}
