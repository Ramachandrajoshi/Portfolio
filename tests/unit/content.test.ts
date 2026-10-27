/**
 * Validates the generated content (.velite — run `pnpm content` first) and the architecture
 * data model beyond what the schemas express: completeness of case studies, ADR coverage,
 * system-model integrity, and the content-integrity rules.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';

type Json = Record<string, unknown>;
const dir = join(process.cwd(), '.velite');
const load = (name: string) => JSON.parse(readFileSync(join(dir, `${name}.json`), 'utf8')) as Json[];

let articles: Json[];
let caseStudies: Json[];
let adrs: Json[];
let systems: Json[];
let projects: Json[];

beforeAll(() => {
  if (!existsSync(join(dir, 'articles.json')))
    throw new Error('Run `pnpm content` before the unit tests (needs .velite/).');
  articles = load('articles');
  caseStudies = load('caseStudies');
  adrs = load('adrs');
  systems = load('systems');
  projects = load('projects');
});

const REQUIRED_SECTIONS = [
  'Context',
  'Requirements and constraints',
  'Functional and non-functional requirements',
  'Quality attributes',
  'Architecture and system boundaries',
  'views',
  'design decisions',
  'Alternatives considered',
  'Trade-offs',
  'Security',
  'Failure modes',
  'Scalability',
  'Observability',
  'Testing and validation',
  'Outcomes and lessons',
];

describe('articles', () => {
  it('never include drafts', () => {
    expect(articles.some((a) => a.draft === true)).toBe(false);
    expect(articles.map((a) => a.slug)).not.toContain('rust-notes-draft');
  });

  it('have unique, kebab-case slugs and URLs that match', () => {
    const slugs = articles.map((a) => a.slug as string);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const a of articles) {
      expect(a.slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
      expect(a.url).toBe(`/articles/${a.slug}/`);
    }
  });

  it('carry reading time, a table of contents and compiled MDX', () => {
    for (const a of articles) {
      expect((a.metadata as { readingTime: number }).readingTime).toBeGreaterThan(0);
      expect(Array.isArray(a.toc)).toBe(true);
      expect(typeof a.body).toBe('string');
    }
  });

  it('the component reference demonstrates every MDX component', () => {
    const ref = articles.find((a) => a.slug === 'mdx-component-reference');
    expect(ref).toBeDefined();
    const source = readFileSync(join(process.cwd(), 'content/articles/mdx-component-reference.mdx'), 'utf8');
    for (const component of [
      'ArchitectureDiagram',
      'Mermaid',
      'D2',
      'Sandpack',
      'ADR',
      'Tradeoffs',
      'Callout',
      'Tabs',
      'Timeline',
    ]) {
      expect(source, component).toContain(`<${component}`);
    }
  });
});

describe('architecture case studies', () => {
  it('exist and are labelled with provenance', () => {
    expect(caseStudies.length).toBeGreaterThanOrEqual(3);
    for (const c of caseStudies)
      expect(['production-derived', 'sanitized', 'illustrative', 'experimental']).toContain(c.provenance);
  });

  it('complete case studies contain all fifteen mandatory sections, in order', () => {
    for (const c of caseStudies.filter((x) => x.status === 'complete')) {
      const headings = (c.toc as { title: string }[]).map((t) => t.title);
      let cursor = 0;
      for (const section of REQUIRED_SECTIONS) {
        const index = headings.findIndex((h, i) => i >= cursor && h.toLowerCase().includes(section.toLowerCase()));
        expect(index, `${c.slug} is missing section "${section}"`).toBeGreaterThanOrEqual(0);
        cursor = index + 1;
      }
    }
  });

  it('each has at least two ADRs, a system model and a container diagram', () => {
    for (const c of caseStudies) {
      expect(adrs.filter((a) => a.caseStudy === c.slug).length, c.slug as string).toBeGreaterThanOrEqual(2);
      expect(
        systems.some((s) => s.caseStudy === c.slug),
        `${c.slug} system.yaml`,
      ).toBe(true);
      expect(
        (c.diagrams as { level: string }[]).some((d) => d.level === 'container'),
        `${c.slug} container view`,
      ).toBe(true);
    }
  });

  it('never presents numbers as measured without saying so', () => {
    for (const c of caseStudies) {
      for (const qa of c.qualityAttributes as { basis: string }[])
        expect(['requirement', 'design-assumption', 'measured', 'target']).toContain(qa.basis);
      // A "measured" basis is only allowed for production-derived or experimental material.
      if (['illustrative', 'sanitized'].includes(c.provenance as string)) {
        expect(
          (c.qualityAttributes as { basis: string }[]).some((qa) => qa.basis === 'measured'),
          `${c.slug}`,
        ).toBe(false);
      }
    }
  });

  it('every diagram referenced by a case study was compiled', () => {
    const manifest = JSON.parse(
      readFileSync(join(process.cwd(), 'public/generated/diagrams/manifest.json'), 'utf8'),
    ) as Json;
    for (const c of caseStudies)
      for (const d of c.diagrams as { src: string }[]) expect(manifest[d.src], d.src).toBeDefined();
  });
});

describe('system explorer models', () => {
  it('have connected graphs: every node participates in at least one edge', () => {
    for (const s of systems) {
      const nodes = s.nodes as { id: string }[];
      const edges = s.edges as { source: string; target: string }[];
      for (const n of nodes)
        expect(
          edges.some((e) => e.source === n.id || e.target === n.id),
          `${s.caseStudy}:${n.id}`,
        ).toBe(true);
    }
  });

  it('flows reference real edges in causal order (each step starts where a previous one touched)', () => {
    for (const s of systems) {
      const edges = new Map((s.edges as { id: string; source: string; target: string }[]).map((e) => [e.id, e]));
      for (const flow of s.flows as { id: string; steps: { edge: string }[] }[]) {
        const touched = new Set<string>();
        flow.steps.forEach((step, i) => {
          const e = edges.get(step.edge)!;
          expect(e, `${flow.id} step ${i}`).toBeDefined();
          if (i > 0)
            expect(
              touched.has(e.source) || touched.has(e.target),
              `${s.caseStudy}/${flow.id} step ${i + 1} is disconnected`,
            ).toBe(true);
          touched.add(e.source);
          touched.add(e.target);
        });
      }
    }
  });

  it('node positions do not overlap', () => {
    for (const s of systems) {
      const nodes = s.nodes as { id: string; position: { x: number; y: number } }[];
      for (const a of nodes)
        for (const b of nodes)
          if (a !== b)
            expect(
              Math.abs(a.position.x - b.position.x) >= 190 || Math.abs(a.position.y - b.position.y) >= 60,
              `${s.caseStudy}: ${a.id}/${b.id}`,
            ).toBe(true);
    }
  });

  it('ADR ids are referenced consistently', () => {
    const ids = new Set(adrs.map((a) => a.id));
    for (const s of systems)
      for (const n of s.nodes as { adrs: string[] }[]) for (const id of n.adrs) expect(ids.has(id), id).toBe(true);
  });
});

describe('projects', () => {
  it('only link to https URLs', () => {
    for (const p of projects)
      for (const url of Object.values(p.links as Json)) expect(String(url)).toMatch(/^https:\/\//);
  });

  it('placeholder projects carry no links', () => {
    for (const p of projects.filter((x) => x.provenance === 'placeholder'))
      expect(Object.keys(p.links as Json)).toHaveLength(0);
  });
});
