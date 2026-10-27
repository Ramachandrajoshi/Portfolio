import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { asset } from '@/lib/urls';
import { cn } from '@/lib/utils';

interface ManifestEntry {
  id: string;
  source: string;
  engine: 'd2' | 'mermaid';
  width: number;
  height: number;
}

let manifestCache: Record<string, ManifestEntry> | null = null;
function manifest(): Record<string, ManifestEntry> {
  if (!manifestCache) {
    const file = join(process.cwd(), 'public', 'generated', 'diagrams', 'manifest.json');
    if (!existsSync(file)) throw new Error('Diagram manifest missing — run `pnpm diagrams` before building.');
    manifestCache = JSON.parse(readFileSync(file, 'utf8')) as Record<string, ManifestEntry>;
  }
  return manifestCache;
}

export interface DiagramProps {
  /** Source id: path under content/ without extension, e.g. "architecture/x/diagrams/container". */
  src: string;
  /** Short accessible name (used as alt text). */
  title: string;
  /** Text alternative describing what the diagram shows — required for accessibility. */
  description: string;
  className?: string;
  /** Show the diagram-as-code source in a disclosure. */
  showSource?: boolean;
}

/**
 * Build-time rendered diagram (D2 or Mermaid). No runtime renderer ships to the browser:
 * two static SVGs (light/dark) are referenced and only the visible one is downloaded.
 * Fails the build if the id is unknown.
 */
export function Diagram({ src, title, description, className, showSource = true }: DiagramProps) {
  const entry = manifest()[src];
  if (!entry) throw new Error(`Unknown diagram "${src}". Expected content/${src}.d2 or .mmd`);
  const code = showSource ? readFileSync(join(process.cwd(), entry.source), 'utf8') : null;
  const descId = `diagram-desc-${src.replace(/[^a-z0-9]/gi, '-')}`;
  const common = {
    width: entry.width,
    height: entry.height,
    loading: 'lazy' as const,
    decoding: 'async' as const,
    'aria-describedby': descId,
    className: 'mx-auto h-auto w-full max-w-full',
    style: { maxWidth: `${Math.max(entry.width, 320)}px` },
  };
  return (
    <figure className={cn('not-prose my-8', className)} data-component="diagram" data-engine={entry.engine}>
      <div className="overflow-x-auto rounded-lg border border-border bg-surface p-3 sm:p-5">
        <img src={asset(`/generated/diagrams/${src}.light.svg`)} alt={title} {...common} className={cn(common.className, 'only-light')} />
        <img src={asset(`/generated/diagrams/${src}.dark.svg`)} alt={title} {...common} className={cn(common.className, 'only-dark')} />
      </div>
      <figcaption className="mt-3 text-sm text-muted">
        <span className="font-semibold text-fg">{title}.</span> <span id={descId}>{description}</span>
      </figcaption>
      {code ? (
        <details className="mt-2 text-sm">
          <summary className="cursor-pointer text-muted hover:text-fg">
            View diagram source ({entry.engine === 'd2' ? 'D2' : 'Mermaid'} · <code className="font-mono text-xs">{entry.source}</code>)
          </summary>
          <pre className="mt-2 max-h-96 overflow-auto rounded-md border border-border bg-surface-2 p-3 font-mono text-xs leading-relaxed">
            <code>{code}</code>
          </pre>
        </details>
      ) : null}
    </figure>
  );
}

/** `<Mermaid src="…" />` and `<D2 src="…" />` assert the engine so a mislabelled source fails loudly. */
export function Mermaid(props: DiagramProps) {
  assertEngine(props.src, 'mermaid');
  return <Diagram {...props} />;
}
export function D2(props: DiagramProps) {
  assertEngine(props.src, 'd2');
  return <Diagram {...props} />;
}
function assertEngine(src: string, engine: ManifestEntry['engine']) {
  const entry = manifest()[src];
  if (entry && entry.engine !== engine) throw new Error(`Diagram "${src}" is ${entry.engine}, not ${engine}.`);
}
