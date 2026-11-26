// Arranque de rendimiento sin caché de contenidos. Conserva solo single-flight para no duplicar una consulta en curso.
process.env['CATALOG_CACHE_TTL_MS'] = '0';
process.env['CONTENT_CACHE_TTL_MS'] = '0';
// Evita que el costo de imprimir cientos de miles de líneas altere la medición.
process.env['LOG_LEVEL'] = process.env['PERFORMANCE_LOG_LEVEL'] ?? 'warn';
await import('../src/server.js');
