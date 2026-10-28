/**
 * Validates the static export *as deployed*: a successful `next build` does not prove the
 * site works under a GitHub Pages project path. Fails (exit 1) on:
 *  - missing expected routes or generated files (feed, sitemap, robots, search index, 404)
 *  - broken internal links or asset references (href, src, srcset, og:image, preload)
 *  - URLs that escape the deployment base path
 *  - canonical / og:url / JSON-LD URLs that are not absolute URLs under NEXT_PUBLIC_SITE_URL
 *  - draft content leaking into any HTML page, the feed, the sitemap or the search index
 *  - pages missing a <title>, meta description, canonical link or a single <h1>
 */
import { existsSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { deployment, htmlFiles, OUT_DIR, routeOf, urlToFile, walk } from './lib/export';

const errors: string[] = [];
const warn: string[] = [];
const { siteUrl, basePath } = deployment;
const fail = (msg: string) => errors.push(msg);

if (!existsSync(OUT_DIR)) {
  console.error('✗ ./out does not exist — run the build first.');
  process.exit(1);
}

// ── 1. Expected routes and generated files ────────────────────────────────
const velite = (name: string) =>
  JSON.parse(readFileSync(join(process.cwd(), '.velite', `${name}.json`), 'utf8')) as Record<string, unknown>[];
const articles = velite('articles') as { slug: string; draft: boolean }[];
const caseStudies = velite('caseStudies') as { slug: string }[];
const draftSlugs = readDraftSlugs();

const expected = [
  '/',
  '/about/',
  '/architecture/',
  '/projects/',
  '/skills/',
  '/services/',
  '/testimonials/',
  '/articles/',
  '/contact/',
  '/resume/',
  '/search/',
  ...caseStudies.map((c) => `/architecture/${c.slug}/`),
  ...articles.filter((a) => !a.draft).map((a) => `/articles/${a.slug}/`),
];
for (const route of expected) {
  const file = join(OUT_DIR, route, 'index.html');
  if (!existsSync(file)) fail(`missing route ${route} (${relative(process.cwd(), file)})`);
}
for (const file of [
  '404.html',
  'feed.xml',
  'sitemap.xml',
  'robots.txt',
  'pagefind/pagefind.js',
  'og/default.png',
  'icon.svg',
]) {
  if (!existsSync(join(OUT_DIR, file))) fail(`missing generated file out/${file}`);
}

// ── 2. Per-page checks ───────────────────────────────────────────────────
const attr = /(?:href|src|content)="([^"]*)"/g;
const srcset = /srcset="([^"]*)"/g;
const checked = new Map<string, boolean>();
let linkCount = 0;

for (const html of htmlFiles()) {
  const route = routeOf(html);
  const source = readFileSync(html, 'utf8');
  const isRedirectOrNotFound = route === '/404.html' || route.startsWith('/_not-found') || route === '/404/';

  // Internal references (skip absolute external URLs and in-page anchors).
  const refs = new Set<string>();
  for (const m of source.matchAll(attr)) refs.add(m[1]!.replace(/&amp;/g, '&'));
  for (const m of source.matchAll(srcset)) for (const part of m[1]!.split(',')) refs.add(part.trim().split(/\s+/)[0]!);
  for (const ref of refs) {
    if (!ref || ref.startsWith('#') || ref.startsWith('data:') || ref.startsWith('mailto:') || ref.startsWith('tel:'))
      continue;
    let local = ref;
    if (ref.startsWith(siteUrl)) local = basePath + ref.slice(siteUrl.length);
    else if (/^https?:\/\//.test(ref) || ref.startsWith('//')) continue;
    if (!local.startsWith('/')) continue; // relative content values (e.g. meta content="width=device-width")
    const file = urlToFile(local);
    if (!file) continue;
    linkCount++;
    if (file.startsWith('__OUTSIDE_BASE_PATH__')) {
      fail(`${route}: "${ref}" is outside the base path "${basePath}"`);
      continue;
    }
    if (!checked.has(file)) checked.set(file, existsSync(file));
    if (!checked.get(file)) fail(`${route}: broken reference "${ref}"`);
  }

  if (isRedirectOrNotFound) continue;

  // SEO essentials.
  if (!/<title>[^<]+<\/title>/.test(source)) fail(`${route}: missing <title>`);
  if (!/<meta name="description" content="[^"]+"/.test(source)) fail(`${route}: missing meta description`);
  const canonical = /<link rel="canonical" href="([^"]+)"/.exec(source)?.[1];
  if (!canonical) fail(`${route}: missing canonical link`);
  else if (canonical !== `${siteUrl}${route}`)
    fail(`${route}: canonical "${canonical}" should be "${siteUrl}${route}"`);
  const ogUrl = /<meta property="og:url" content="([^"]+)"/.exec(source)?.[1];
  if (ogUrl && ogUrl !== `${siteUrl}${route}`) fail(`${route}: og:url "${ogUrl}" should be "${siteUrl}${route}"`);
  const h1s = source.match(/<h1[\s>]/g)?.length ?? 0;
  if (h1s !== 1) fail(`${route}: expected exactly one <h1>, found ${h1s}`);

  // Structured data: valid JSON, URLs absolute and under the site URL.
  for (const m of source.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    try {
      const json = JSON.stringify(JSON.parse(m[1]!));
      for (const u of json.matchAll(/"(?:url|item|@id|mainEntityOfPage|image)":"([^"]+)"/g)) {
        if (!u[1]!.startsWith('https://') && !u[1]!.startsWith('http://'))
          fail(`${route}: JSON-LD URL is not absolute: ${u[1]}`);
        else if (!u[1]!.startsWith(siteUrl) && !/github\.com|linkedin\.com|nspglobaltech\.com/.test(u[1]!))
          fail(`${route}: JSON-LD URL outside the site: ${u[1]}`);
      }
    } catch {
      fail(`${route}: JSON-LD is not valid JSON`);
    }
  }

  // Drafts must never appear anywhere.
  for (const slug of draftSlugs)
    if (source.includes(`/articles/${slug}/`)) fail(`${route}: links to draft article "${slug}"`);

  // Development-only placeholders must not ship.
  if (source.includes('data-placeholder')) fail(`${route}: contains a development placeholder marker`);
}

// ── 3. Feed, sitemap and search index ────────────────────────────────────
const feed = readFileSync(join(OUT_DIR, 'feed.xml'), 'utf8');
const sitemap = readFileSync(join(OUT_DIR, 'sitemap.xml'), 'utf8');
for (const slug of draftSlugs) {
  if (feed.includes(slug)) fail(`feed.xml includes draft "${slug}"`);
  if (sitemap.includes(slug)) fail(`sitemap.xml includes draft "${slug}"`);
  if (existsSync(join(OUT_DIR, 'articles', slug))) fail(`draft "${slug}" has a generated route`);
}
for (const loc of sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)) {
  const url = loc[1]!;
  if (!url.startsWith(siteUrl)) fail(`sitemap.xml: ${url} is not under ${siteUrl}`);
  else if (!existsSync(join(OUT_DIR, url.slice(siteUrl.length), 'index.html'))) fail(`sitemap.xml: ${url} has no page`);
}
const pagefindFiles = existsSync(join(OUT_DIR, 'pagefind')) ? walk(join(OUT_DIR, 'pagefind')) : [];
if (pagefindFiles.filter((f) => f.includes('fragment')).length === 0) fail('pagefind index contains no fragments');

if (!existsSync(join(OUT_DIR, '.nojekyll')))
  warn.push('out/.nojekyll missing (GitHub Actions Pages deployments do not need it, branch deployments do)');

// ── Report ───────────────────────────────────────────────────────────────
const pages = htmlFiles().length;
for (const w of warn) console.warn(`! ${w}`);
if (errors.length) {
  console.error(`\n✗ Static export check failed with ${errors.length} problem(s):\n`);
  for (const e of [...new Set(errors)]) console.error(`  • ${e}`);
  process.exit(1);
}
console.log(
  `✓ export: ${pages} pages, ${linkCount} internal references, base path "${basePath || '/'}", site ${siteUrl}`,
);

function readDraftSlugs(): string[] {
  // Drafts are removed from .velite by the pipeline, so read their slugs from the sources.
  const dir = join(process.cwd(), 'content', 'articles');
  return walk(dir, (f) => f.endsWith('.mdx'))
    .filter((f) => /^draft:\s*true\s*$/m.test(readFileSync(f, 'utf8').split('---')[1] ?? ''))
    .map((f) =>
      f
        .split(/[\\/]/)
        .pop()!
        .replace(/\.mdx$/, ''),
    );
}
