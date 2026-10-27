/** Shared helpers for scripts that inspect the static export in ./out. */
import { readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { resolveDeployment } from '../../src/lib/deployment';

export const OUT_DIR = join(process.cwd(), 'out');
export const deployment = resolveDeployment(process.env.NEXT_PUBLIC_SITE_URL);

export function walk(dir: string, filter: (file: string) => boolean = () => true): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) files.push(...walk(full, filter));
    else if (filter(full)) files.push(full);
  }
  return files;
}

/** "/portfolio/about/" → "out/about/index.html"; returns null for external URLs. */
export function urlToFile(url: string): string | null {
  if (/^[a-z]+:/i.test(url) || url.startsWith('//')) return null;
  let path = url.split('#')[0]!.split('?')[0]!;
  if (!path.startsWith('/')) return null;
  const { basePath } = deployment;
  if (basePath) {
    if (path !== basePath && !path.startsWith(`${basePath}/`)) return `__OUTSIDE_BASE_PATH__${path}`;
    path = path.slice(basePath.length) || '/';
  }
  path = decodeURIComponent(path);
  if (path.endsWith('/')) return join(OUT_DIR, path, 'index.html');
  return join(OUT_DIR, path);
}

export function htmlFiles(): string[] {
  return walk(OUT_DIR, (f) => f.endsWith('.html'));
}

export function routeOf(file: string): string {
  const rel = relative(OUT_DIR, file).replace(/\\/g, '/');
  if (rel === 'index.html') return '/';
  if (rel.endsWith('/index.html')) return `/${rel.slice(0, -'index.html'.length)}`;
  return `/${rel}`;
}
