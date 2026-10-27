/**
 * Enforces JavaScript budgets against the real static export.
 *
 * 1. Initial-route budget — enforced per HTML page (below).
 * 2. Lazy-chunk budgets — each heavy, on-demand feature is identified in the emitted chunks
 *    by a stable marker string that survives minification, and its chunks are summed.
 *
 * For each HTML page, every <script src> the browser fetches on load is collected and its
 * gzip size summed (level 6 — what typical static hosts, including GitHub Pages, serve). Lazily imported chunks (3D city, React Flow, Sandpack, GSAP) are not
 * referenced from the HTML and are therefore excluded by construction; their own budgets
 * are enforced by size-limit (.size-limit.cjs).
 *
 * Budgets are requirements: if this fails, reduce the bundle — do not raise the number.
 */
import { readFileSync, existsSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { join } from 'node:path';
import { htmlFiles, OUT_DIR, routeOf, urlToFile, walk } from './lib/export';

const INITIAL_JS_BUDGET_KB = 150;

/** Lazy features: marker strings are runtime identifiers/strings that minifiers keep. */
const LAZY_BUDGETS: { name: string; markers: string[]; limitKB: number }[] = [
  { name: '3D city (three + R3F + scene)', markers: ['WebGLRenderer', 'city-experience'], limitKB: 300 },
  { name: 'System explorer (React Flow)', markers: ['react-flow__pane'], limitKB: 90 },
  { name: 'Scroll story (GSAP + ScrollTrigger)', markers: ['ScrollTrigger'], limitKB: 60 },
  { name: 'Code sandbox (Sandpack)', markers: ['SandpackProvider', 'sandpack-'], limitKB: 400 },
];

const cache = new Map<string, number>();
function gzSize(file: string): number {
  if (!cache.has(file)) cache.set(file, gzipSync(readFileSync(file), { level: 6 }).length);
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

// ── Lazy chunks ────────────────────────────────────────────────────────────
const chunkDir = join(OUT_DIR, '_next', 'static', 'chunks');
const chunks = walk(chunkDir, (f) => f.endsWith('.js')).map((file) => ({ file, source: readFileSync(file, 'utf8') }));
const initialFiles = new Set<string>();
for (const html of htmlFiles()) {
  for (const m of readFileSync(html, 'utf8').matchAll(/<script[^>]+src="([^"]+)"/g)) {
    const f = urlToFile(m[1]!);
    if (f) initialFiles.add(f);
  }
}
const lazyRows = LAZY_BUDGETS.map((budget) => {
  const matched = chunks.filter((c) => !initialFiles.has(c.file) && budget.markers.some((m) => c.source.includes(m)));
  const kb = matched.reduce((sum, c) => sum + gzSize(c.file), 0) / 1024;
  return { ...budget, kb, count: matched.length };
});

rows.sort((a, b) => b.kb - a.kb);
const width = Math.max(...rows.map((r) => r.route.length));
console.log(`Initial JavaScript per route (gzip, budget ${INITIAL_JS_BUDGET_KB} KB)\n`);
for (const r of rows) {
  const over = r.kb > INITIAL_JS_BUDGET_KB;
  if (over) failed = true;
  console.log(`${over ? '✗' : '✓'} ${r.route.padEnd(width)}  ${r.kb.toFixed(1).padStart(6)} KB  (${r.scripts} scripts)`);
}
console.log('\nLazy-loaded features (gzip, loaded on demand only)\n');
for (const r of lazyRows) {
  const over = r.kb > r.limitKB;
  const missing = r.count === 0;
  if (over) failed = true;
  console.log(`${over ? '✗' : missing ? '!' : '✓'} ${r.name.padEnd(40)} ${r.kb.toFixed(1).padStart(6)} KB / ${r.limitKB} KB  (${r.count} chunks)${missing ? '  — not found in build' : ''}`);
}

if (failed) {
  console.error('\nBudget check failed.');
  process.exit(1);
}
console.log(`\nAll ${rows.length} routes within budget.`);
