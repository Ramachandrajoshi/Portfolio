import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { codeToHtml } from 'shiki';
import { SandpackLauncher, type SandpackTemplateName } from './SandpackLauncher';

export interface SandpackProps {
  title: string;
  /** Plain-language description of what the example demonstrates. */
  description: string;
  template?: SandpackTemplateName;
  /**
   * Name of a directory under content/examples/ whose files form the sandbox (preferred:
   * real files keep indentation, editor support and can be linted/tested).
   */
  example?: string;
  /** Inline file map for tiny snippets, e.g. { '/index.ts': '…' }. */
  files?: Record<string, string>;
  /** File opened first in the editor (defaults to the first key). */
  activeFile?: string;
}

/**
 * Interactive code example with a static-first contract:
 *  1. The build renders the code as highlighted, readable HTML (works without JavaScript).
 *  2. Only when the reader presses "Run" is Sandpack (≈ hundreds of KB) downloaded.
 *  3. Execution happens in Sandpack's cross-origin iframe bundler — never in this origin.
 */
export async function Sandpack({
  title,
  description,
  template = 'vanilla-ts',
  example,
  files: inlineFiles,
  activeFile,
}: SandpackProps) {
  const files = example ? readExample(example) : (inlineFiles ?? {});
  const entries = Object.entries(files);
  if (entries.length === 0) throw new Error(`<Sandpack title="${title}"> needs at least one file.`);
  const primary = activeFile ?? entries[0]![0];
  const highlighted = await Promise.all(
    entries.map(async ([path, code]) => ({
      path,
      html: await codeToHtml(code.trim(), {
        lang: languageFor(path),
        themes: { light: 'github-light-high-contrast', dark: 'github-dark-high-contrast' },
        defaultColor: false,
      }),
    })),
  );
  return (
    <figure
      className="not-prose my-8 overflow-hidden rounded-lg border border-border bg-surface"
      data-component="sandpack"
    >
      <figcaption className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border bg-surface-2/70 px-4 py-3">
        <span>
          <span className="block font-display font-semibold">{title}</span>
          <span className="block text-sm text-muted">{description}</span>
        </span>
      </figcaption>
      <SandpackLauncher template={template} files={files} activeFile={primary} title={title}>
        <div className="divide-y divide-border">
          {highlighted.map((file) => (
            <div key={file.path}>
              <p className="bg-surface-2/40 px-4 py-1.5 font-mono text-xs text-muted">{file.path}</p>
              <div
                className="[&_pre]:m-0 [&_pre]:max-h-[28rem] [&_pre]:overflow-auto [&_pre]:rounded-none [&_pre]:border-0 [&_pre]:p-4 [&_pre]:font-mono [&_pre]:text-[0.85rem] [&_pre]:leading-relaxed"
                dangerouslySetInnerHTML={{ __html: file.html }}
              />
            </div>
          ))}
        </div>
      </SandpackLauncher>
    </figure>
  );
}

function languageFor(path: string): string {
  const ext = path.split('.').pop() ?? '';
  return (
    {
      ts: 'ts',
      tsx: 'tsx',
      js: 'js',
      jsx: 'jsx',
      json: 'json',
      css: 'css',
      html: 'html',
      cs: 'csharp',
      rs: 'rust',
      py: 'python',
      sql: 'sql',
    }[ext] ?? 'text'
  );
}

function readExample(name: string): Record<string, string> {
  const root = join(process.cwd(), 'content', 'examples', name);
  const files: Record<string, string> = {};
  const visit = (dir: string) => {
    for (const entry of readdirSync(dir).sort()) {
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) visit(full);
      else files[`/${relative(root, full).replace(/\\/g, '/')}`] = readFileSync(full, 'utf8');
    }
  };
  try {
    visit(root);
  } catch {
    throw new Error(`<Sandpack example="${name}"> — directory content/examples/${name} not found.`);
  }
  // Entry file first so the static preview shows it.
  return Object.fromEntries(
    Object.entries(files).sort(([a], [b]) => Number(b.startsWith('/index')) - Number(a.startsWith('/index'))),
  );
}
