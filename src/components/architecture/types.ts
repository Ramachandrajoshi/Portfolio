/** Serializable system model passed from server components to the explorer island. */
export type NodeKind =
  | 'client'
  | 'external'
  | 'gateway'
  | 'service'
  | 'worker'
  | 'broker'
  | 'database'
  | 'cache'
  | 'storage'
  | 'model'
  | 'monitoring'
  | 'edge';

export interface ExplorerNode {
  id: string;
  label: string;
  kind: NodeKind;
  group?: string;
  position: { x: number; y: number };
  technology: string;
  responsibility: string;
  rationale: string;
  interfaces: string[];
  failureModes: { mode: string; effect: string; mitigation: string }[];
  security: string[];
  adrs: string[];
}

export interface ExplorerEdge {
  id: string;
  source: string;
  target: string;
  label: string;
  protocol: string;
  mode: 'sync' | 'async' | 'stream' | 'batch';
}

export interface ExplorerFlow {
  id: string;
  title: string;
  description: string;
  steps: { edge: string; note: string }[];
}

export interface ExplorerModel {
  caseStudy: string;
  title: string;
  description: string;
  groups: { id: string; label: string; trust: 'public' | 'dmz' | 'internal' | 'restricted' | 'edge' }[];
  nodes: ExplorerNode[];
  edges: ExplorerEdge[];
  flows: ExplorerFlow[];
}

export interface AdrSummary {
  id: string;
  title: string;
  href: string;
}

export const kindMeta: Record<NodeKind, { label: string; glyph: string; color: string }> = {
  client: { label: 'Client', glyph: '◎', color: 'var(--color-text-muted)' },
  external: { label: 'External system', glyph: '⇄', color: 'var(--color-text-muted)' },
  gateway: { label: 'API gateway', glyph: '⛩', color: 'var(--color-secondary)' },
  service: { label: 'Application service', glyph: '▣', color: 'var(--color-accent)' },
  worker: { label: 'Worker', glyph: '⚙', color: 'var(--color-accent)' },
  broker: { label: 'Message broker', glyph: '⇶', color: 'var(--color-tertiary)' },
  database: { label: 'Database', glyph: '⛁', color: 'var(--color-secondary)' },
  cache: { label: 'Cache', glyph: 'ϟ', color: 'var(--color-highlight)' },
  storage: { label: 'Object storage', glyph: '▤', color: 'var(--color-secondary)' },
  model: { label: 'Model-serving endpoint', glyph: '✦', color: 'var(--color-tertiary)' },
  monitoring: { label: 'Monitoring', glyph: '◔', color: 'var(--color-highlight)' },
  edge: { label: 'Edge device / gateway', glyph: '⌁', color: 'var(--color-highlight)' },
};

export const modeLabel: Record<ExplorerEdge['mode'], string> = {
  sync: 'synchronous request/response',
  async: 'asynchronous message',
  stream: 'continuous stream',
  batch: 'scheduled batch',
};
