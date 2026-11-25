import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer, request } from 'node:http';
import { extname, join, normalize } from 'node:path';

const port = Number(process.env.PORT ?? 4400);
const api = new URL(process.env.API_URL ?? 'http://127.0.0.1:3000');
const root = normalize(join(import.meta.dirname, '../../apps/frontend/dist/frontend/browser'));
const types = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webmanifest': 'application/manifest+json',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
};

createServer((req, res) => {
  if (req.url?.startsWith('/api/')) {
    const upstream = request(new URL(req.url, api), { method: req.method, headers: req.headers }, (reply) => {
      res.writeHead(reply.statusCode ?? 502, reply.headers);
      reply.pipe(res);
    });
    upstream.on('error', () => {
      res.writeHead(502).end('API no disponible');
    });
    req.pipe(upstream);
    return;
  }

  const pathname = decodeURIComponent(new URL(req.url ?? '/', 'http://localhost').pathname);
  const candidate = normalize(join(root, pathname));
  const safeFile = candidate.startsWith(root) && existsSync(candidate) && statSync(candidate).isFile()
    ? candidate
    : join(root, 'index.html');
  res.setHeader('Content-Type', types[extname(safeFile)] ?? 'application/octet-stream');
  res.setHeader('Cache-Control', 'no-store');
  createReadStream(safeFile).pipe(res);
}).listen(port, '127.0.0.1', () => {
  console.log(`Build productivo disponible en http://127.0.0.1:${port}`);
});
