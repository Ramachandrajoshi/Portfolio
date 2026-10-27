/**
 * Diagrams-as-code compiler (see ARCHITECTURE.md, ADR-004).
 *
 *   content/**\/*.d2   → D2 (WASM build, no runtime server, no binary install)
 *   content/**\/*.mmd  → Mermaid (rendered in headless Chromium with Mermaid's own renderer)
 *
 * Each source produces <id>.light.svg and <id>.dark.svg in public/generated/diagrams/ plus
 * an entry in manifest.json (dimensions for layout-shift-free rendering, content hash for
 * incremental rebuilds). Invalid source fails the build with the file and the parser error.
 * Output is git-ignored and fully reproducible from the sources.
 */
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, relative } from 'node:path';
import { walk } from './lib/export';

const ROOT = process.cwd();
const CONTENT = join(ROOT, 'content');
const OUT = join(ROOT, 'public', 'generated', 'diagrams');
const MANIFEST = join(OUT, 'manifest.json');
const RENDERER_VERSION = '3'; // bump to invalidate every cached diagram

export interface DiagramManifestEntry {
  id: string;
  source: string;
  engine: 'd2' | 'mermaid';
  hash: string;
  width: number;
  height: number;
}

type Theme = 'light' | 'dark';

/* Palette mirrors src/styles/tokens.css. */
const D2_THEME: Record<Theme, Record<string, string>> = {
  light: {
    N1: '#0b1220', N2: '#45526b', N3: '#5d6a82', N4: '#a9b6cb', N5: '#d3dbe8', N6: '#eef2f8', N7: '#ffffff',
    B1: '#0e7490', B2: '#0e7490', B3: '#67b8cc', B4: '#e0f2f7', B5: '#eef8fb', B6: '#f7fbfd',
    AA2: '#6d28d9', AA4: '#ede9fe', AA5: '#f5f3ff', AB4: '#fef3c7', AB5: '#fffbeb',
  },
  dark: {
    N1: '#e7ecf5', N2: '#a3b0c6', N3: '#8593ab', N4: '#33415f', N5: '#1f2b44', N6: '#121b2e', N7: '#070b16',
    B1: '#22d3ee', B2: '#22d3ee', B3: '#1b7f93', B4: '#0f2235', B5: '#0d1a2b', B6: '#0b1424',
    AA2: '#a78bfa', AA4: '#221a3d', AA5: '#1a1530', AB4: '#3a2a0c', AB5: '#2a1f0a',
  },
};

function d2Prelude(theme: Theme) {
  const overrides = Object.entries(D2_THEME[theme])
    .map(([k, v]) => `      ${k}: "${v}"`)
    .join('\n');
  return `vars: {\n  d2-config: {\n    theme-id: 0\n    layout-engine: elk\n    theme-overrides: {\n${overrides}\n    }\n  }\n}\n`;
}

const MERMAID_THEME: Record<Theme, Record<string, string>> = {
  light: {
    background: '#ffffff', primaryColor: '#e0f2f7', primaryBorderColor: '#0e7490', primaryTextColor: '#0b1220',
    secondaryColor: '#ede9fe', tertiaryColor: '#f7fbfd', lineColor: '#45526b', textColor: '#0b1220',
    noteBkgColor: '#fef3c7', noteTextColor: '#0b1220', noteBorderColor: '#b45309',
    actorBkg: '#e0f2f7', actorBorder: '#0e7490', actorTextColor: '#0b1220', signalColor: '#45526b', signalTextColor: '#0b1220',
    labelBoxBkgColor: '#eef2f8', labelBoxBorderColor: '#a9b6cb', loopTextColor: '#0b1220', activationBkgColor: '#eef8fb',
    fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif',
  },
  dark: {
    background: '#070b16', primaryColor: '#0f2235', primaryBorderColor: '#22d3ee', primaryTextColor: '#e7ecf5',
    secondaryColor: '#221a3d', tertiaryColor: '#0b1424', lineColor: '#a3b0c6', textColor: '#e7ecf5',
    noteBkgColor: '#3a2a0c', noteTextColor: '#e7ecf5', noteBorderColor: '#f5b544',
    actorBkg: '#0f2235', actorBorder: '#22d3ee', actorTextColor: '#e7ecf5', signalColor: '#a3b0c6', signalTextColor: '#e7ecf5',
    labelBoxBkgColor: '#121b2e', labelBoxBorderColor: '#33415f', loopTextColor: '#e7ecf5', activationBkgColor: '#0d1a2b',
    fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif',
  },
};

function sizeOf(svg: string): { width: number; height: number } {
  const vb = /viewBox="([\d.\s-]+)"/.exec(svg);
  if (!vb) throw new Error('rendered SVG has no viewBox');
  const [, , w, h] = vb[1]!.trim().split(/\s+/).map(Number);
  return { width: Math.round(w!), height: Math.round(h!) };
}

function write(id: string, theme: Theme, svg: string) {
  const file = join(OUT, `${id}.${theme}.svg`);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, svg.startsWith('<?xml') ? svg : `<?xml version="1.0" encoding="utf-8"?>\n${svg}`);
}

async function main() {
  const sources = walk(CONTENT, (f) => f.endsWith('.d2') || f.endsWith('.mmd')).sort();
  const previous: Record<string, DiagramManifestEntry> = existsSync(MANIFEST)
    ? JSON.parse(readFileSync(MANIFEST, 'utf8'))
    : {};
  const manifest: Record<string, DiagramManifestEntry> = {};
  const errors: string[] = [];
  const pendingMermaid: { id: string; source: string; code: string; hash: string }[] = [];

  let d2: import('@terrastruct/d2').D2 | null = null;
  let built = 0;

  for (const file of sources) {
    const source = relative(ROOT, file).replace(/\\/g, '/');
    const id = relative(CONTENT, file).replace(/\\/g, '/').replace(/\.(d2|mmd)$/, '');
    const code = readFileSync(file, 'utf8');
    const hash = createHash('sha256').update(RENDERER_VERSION).update(code).digest('hex').slice(0, 16);
    const cached = previous[id];
    if (
      cached?.hash === hash &&
      existsSync(join(OUT, `${id}.light.svg`)) &&
      existsSync(join(OUT, `${id}.dark.svg`))
    ) {
      manifest[id] = cached;
      continue;
    }
    if (file.endsWith('.mmd')) {
      pendingMermaid.push({ id, source, code, hash });
      continue;
    }
    try {
      if (!d2) {
        const { D2 } = await import('@terrastruct/d2');
        d2 = new D2();
      }
      let size = { width: 0, height: 0 };
      for (const theme of ['light', 'dark'] as const) {
        const result = await d2.compile(d2Prelude(theme) + code, { options: { layout: 'elk' } });
        const svg = await d2.render(result.diagram, {
          ...result.renderOptions,
          pad: 24,
          center: true,
          noXMLTag: true,
          salt: `${id}-${theme}`,
        });
        write(id, theme, svg);
        size = sizeOf(svg);
      }
      manifest[id] = { id, source, engine: 'd2', hash, ...size };
      built++;
    } catch (error) {
      errors.push(`${source}: ${formatD2Error(error)}`);
    }
  }

  if (pendingMermaid.length) {
    const { chromium } = await import('@playwright/test');
    const browser = await chromium.launch();
    try {
      const page = await browser.newPage();
      await page.setContent('<!doctype html><html><body></body></html>');
      const require = createRequire(import.meta.url);
      await page.addScriptTag({ path: require.resolve('mermaid/dist/mermaid.min.js') });
      for (const item of pendingMermaid) {
        try {
          let size = { width: 0, height: 0 };
          for (const theme of ['light', 'dark'] as const) {
            const svg = await page.evaluate(
              async ({ code, theme, vars, id }) => {
                const mermaid = (window as unknown as { mermaid: typeof import('mermaid').default }).mermaid;
                mermaid.initialize({
                  startOnLoad: false,
                  securityLevel: 'strict',
                  theme: 'base',
                  themeVariables: vars,
                  // SVG text labels (not <foreignObject>) so the file renders correctly in <img>.
                  htmlLabels: false,
                  flowchart: { htmlLabels: false, curve: 'basis' },
                  sequence: { mirrorActors: false },
                });
                await mermaid.parse(code);
                const { svg } = await mermaid.render(`m-${id.replace(/[^a-z0-9]/gi, '-')}-${theme}`, code);
                return svg;
              },
              { code: item.code, theme, vars: MERMAID_THEME[theme], id: item.id },
            );
            const normalized = svg
              .replace(/<br>/g, '<br/>')
              .replace(/style="max-width: [\d.]+px;"/, '');
            write(item.id, theme, normalized);
            size = sizeOf(normalized);
          }
          manifest[item.id] = { id: item.id, source: item.source, engine: 'mermaid', hash: item.hash, ...size };
          built++;
        } catch (error) {
          errors.push(`${item.source}: ${error instanceof Error ? error.message.split('\n').slice(0, 4).join(' ') : String(error)}`);
        }
      }
    } finally {
      await browser.close();
    }
  }

  if (errors.length) {
    console.error(`\n✗ ${errors.length} diagram(s) failed to compile:\n`);
    for (const e of errors) console.error(`  • ${e}`);
    process.exit(1);
  }
  mkdirSync(OUT, { recursive: true });
  writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2));
  console.log(`✓ diagrams: ${Object.keys(manifest).length} total, ${built} rebuilt, ${Object.keys(manifest).length - built} cached`);
}

function formatD2Error(error: unknown): string {
  const text = error instanceof Error ? error.message : String(error);
  try {
    const parsed = JSON.parse(text.replace(/^Error:\s*/, '')) as { errmsg: string }[];
    return parsed.map((e) => e.errmsg).join('; ');
  } catch {
    return text;
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
