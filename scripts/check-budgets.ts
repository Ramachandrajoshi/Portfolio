/**
 * Enforces the initial-route JavaScript budget against the real static export.
 *
 * For each HTML page, every <script src> the browser fetches on load is collected and its
 * gzip size summed. Lazily imported chunks (3D city, React Flow, Sandpack, GSAP) are not
 * referenced from the HTML and are therefore excluded by construction; their own budgets
 * are enforced by size-limit (.size-limit.cjs).
 *
 * Budgets are requirements: if this fails, reduce the bundle — do not raise the number.
 */
import { readFileSync, existsSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { htmlFiles, routeOf, urlToFile } from './lib/export';

const INITIAL_JS_BUDGET_KB = 150;

const cache = new Map<string, number>();
function gzSize(file: string): number {
  if (!cache.has(file)) cache.set(file, gzipSync(readFileSync(file), { level: 9 }).length);
  return cache.get(file)!;
}

let failed = false;
const rows: { route: string; kb: number; scripts: number }[] = [];
for (const html of htmlFiles()) {
  const route = routeOf(html);
  if (route.startsWith('/_not-found') || route === '/404.html') continue;
  const source = readFileSync(html, 'utf8');
  // nomodule scripts (legacy polyfills) are never fetched by modern browsers.
  const srcs = new Set(
    [...source.matchAll(/<script([^>]*)>/g)]
      .map((m) => m[1]!)
      .filter((attrs) => !/\bnomodule\b/i.test(attrs))
      .map((attrs) => /\ssrc="([^"]+)"/.exec(attrs)?.[1])
      .filter((src): src is string => Boolean(src)),
  );
  let total = 0;
  for (const src of srcs) {
    const file = urlToFile(src);
    if (!file || !existsSync(file)) {
      console.error(`✗ ${route}: script ${src} does not exist in the export`);
      failed = true;
      continue;
    }
    total += gzSize(file);
  }
  rows.push({ route, kb: total / 1024, scripts: srcs.size });
}

rows.sort((a, b) => b.kb - a.kb);
const width = Math.max(...rows.map((r) => r.route.length));
console.log(`Initial JavaScript per route (gzip, budget ${INITIAL_JS_BUDGET_KB} KB)\n`);
for (const r of rows) {
  const over = r.kb > INITIAL_JS_BUDGET_KB;
  if (over) failed = true;
  console.log(`${over ? '✗' : '✓'} ${r.route.padEnd(width)}  ${r.kb.toFixed(1).padStart(6)} KB  (${r.scripts} scripts)`);
}
if (failed) {
  console.error('\nBudget check failed.');
  process.exit(1);
}
console.log(`\nAll ${rows.length} routes within budget.`);
