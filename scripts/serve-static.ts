/**
 * Minimal static file server that reproduces GitHub Pages semantics for ./out:
 *  - the export is mounted under the deployment base path (from NEXT_PUBLIC_SITE_URL),
 *  - "/dir/" serves "/dir/index.html", "/dir" redirects to "/dir/",
 *  - unknown paths return out/404.html with status 404,
 *  - nothing is served outside the base path (catches links that forgot it).
 *
 * Usage: NEXT_PUBLIC_SITE_URL=http://localhost:4173/portfolio tsx scripts/serve-static.ts [port]
 */
import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize } from 'node:path';
import { deployment, OUT_DIR } from './lib/export';

const port = Number(process.argv[2] ?? process.env.PORT ?? 4173);
const { basePath } = deployment;

const types: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.woff2': 'font/woff2',
  '.wasm': 'application/wasm',
  '.pf_meta': 'application/octet-stream',
  '.pf_index': 'application/octet-stream',
  '.pf_fragment': 'application/octet-stream',
  '.ico': 'image/x-icon',
};

function send(res: import('node:http').ServerResponse, file: string, status = 200) {
  res.writeHead(status, {
    'content-type': types[extname(file)] ?? 'application/octet-stream',
    'cache-control': file.includes('/_next/static/') ? 'public, max-age=31536000, immutable' : 'no-cache',
  });
  createReadStream(file).pipe(res);
}

createServer((req, res) => {
  const url = new URL(req.url ?? '/', 'http://localhost');
  let path = decodeURIComponent(url.pathname);
  const notFound = () => send(res, join(OUT_DIR, '404.html'), 404);

  if (basePath) {
    if (path === '/' ) {
      res.writeHead(302, { location: `${basePath}/` });
      return res.end();
    }
    if (path !== basePath && !path.startsWith(`${basePath}/`)) return notFound();
    path = path.slice(basePath.length) || '/';
  }
  const file = normalize(join(OUT_DIR, path));
  if (!file.startsWith(OUT_DIR)) return notFound();

  if (existsSync(file) && statSync(file).isDirectory()) {
    if (!path.endsWith('/')) {
      res.writeHead(301, { location: `${basePath}${path}/${url.search}` });
      return res.end();
    }
    const index = join(file, 'index.html');
    return existsSync(index) ? send(res, index) : notFound();
  }
  if (existsSync(file)) return send(res, file);
  if (existsSync(`${file}.html`)) return send(res, `${file}.html`);
  return notFound();
}).listen(port, () => {
  console.log(`Serving ./out at http://localhost:${port}${basePath}/`);
});
