/**
 * Velite — the single build-time content pipeline (see ARCHITECTURE.md, ADR-003).
 *
 * Every collection is validated with Zod (Velite's `s` extends Zod). Invalid frontmatter,
 * a duplicate slug, a dangling ADR/system reference or a broken MDX file fails the build.
 * Output is written to .velite/ and imported through the `#site/content` alias.
 */
import rehypeShiki from '@shikijs/rehype';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import rehypeSlug from 'rehype-slug';
import { defineCollection, defineConfig, s } from 'velite';
import { resolveDeployment } from './src/lib/deployment';

const { basePath } = resolveDeployment(process.env.NEXT_PUBLIC_SITE_URL);
/** Drafts are excluded from every build unless explicitly previewed locally. */
const includeDrafts = process.env.SHOW_DRAFTS === 'true';

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const TAG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * Strict ISO date. Velite's s.isodate() alone throws a RangeError on unparseable input (Zod 3
 * refinements are non-fatal, so its transform still runs); validating the format first turns
 * that crash into a readable validation error pointing at the file and field.
 */
const isoDate = () =>
  s
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}(T[\d:.]+(Z|[+-]\d{2}:\d{2})?)?$/, 'dates must be ISO 8601, e.g. 2026-10-27')
    .refine((v) => !Number.isNaN(Date.parse(v)), 'not a real calendar date')
    .pipe(s.isodate());

const provenance = s.enum(['production-derived', 'sanitized', 'illustrative', 'experimental', 'placeholder']);

/** Slug = file name (articles, projects) or directory name (index.mdx case studies). */
const slugFromPath = (path: string) => {
  const parts = path.split('/');
  const last = parts.at(-1)!;
  return last === 'index' ? parts.at(-2)! : last;
};

const mdxBody = s.mdx();

const articles = defineCollection({
  name: 'Article',
  pattern: 'articles/*.mdx',
  schema: s
    .object({
      title: s.string().min(8).max(110),
      description: s.string().min(50).max(200),
      date: isoDate(),
      updated: isoDate().optional(),
      tags: s.array(s.string().regex(TAG, 'tags must be kebab-case')).min(1).max(8),
      series: s.string().min(3).optional(),
      seriesOrder: s.number().int().positive().optional(),
      /** Optional cover image path under /public (pre-optimised AVIF/WebP/SVG). */
      cover: s
        .string()
        .regex(/^\/.+\.(avif|webp|png|jpe?g|svg)$/)
        .optional(),
      coverAlt: s.string().optional(),
      draft: s.boolean().default(false),
      provenance: provenance.default('illustrative'),
      path: s.path(),
      metadata: s.metadata(),
      excerpt: s.excerpt({ length: 220 }),
      toc: s.toc({ maxDepth: 3 }),
      body: mdxBody,
    })
    .superRefine((data, ctx) => {
      if (data.cover && !data.coverAlt) {
        ctx.addIssue({ code: 'custom', message: '`coverAlt` is required when `cover` is set', path: ['coverAlt'] });
      }
      if (data.seriesOrder && !data.series) {
        ctx.addIssue({ code: 'custom', message: '`seriesOrder` requires `series`', path: ['seriesOrder'] });
      }
    })
    .transform((data) => {
      const slug = slugFromPath(data.path);
      return { ...data, slug, url: `/articles/${slug}/` };
    })
    .refine((data) => SLUG.test(data.slug), { message: 'article file names must be kebab-case slugs' }),
});

const caseStudies = defineCollection({
  name: 'CaseStudy',
  pattern: 'architecture/*/index.mdx',
  schema: s
    .object({
      title: s.string().min(8).max(110),
      summary: s.string().min(60).max(260),
      domain: s.string(),
      order: s.number().int(),
      provenance,
      /** "complete" = all 15 mandatory sections written; "template" = scaffold awaiting content. */
      status: s.enum(['complete', 'in-progress', 'template']),
      date: isoDate(),
      updated: isoDate().optional(),
      tags: s.array(s.string().regex(TAG)).min(1),
      /** One-line problem statement shown on the index card. */
      problem: s.string().min(40),
      qualityAttributes: s
        .array(
          s.object({
            attribute: s.string(),
            scenario: s.string(),
            /** Measurable acceptance criterion. */
            measure: s.string(),
            /** Where the number comes from — never presented as a measured result. */
            basis: s.enum(['requirement', 'design-assumption', 'measured', 'target']),
          }),
        )
        .min(3),
      diagrams: s
        .array(
          s.object({
            level: s.enum(['context', 'container', 'component', 'deployment', 'sequence']),
            src: s.string(),
            title: s.string(),
            description: s.string().min(40),
          }),
        )
        .default([]),
      path: s.path(),
      metadata: s.metadata(),
      toc: s.toc({ maxDepth: 2 }),
      body: mdxBody,
    })
    .transform((data) => {
      const slug = slugFromPath(data.path);
      return { ...data, slug, url: `/architecture/${slug}/` };
    }),
});

const adrs = defineCollection({
  name: 'Adr',
  pattern: 'architecture/*/adrs/*.yaml',
  schema: s.object({
    id: s
      .string()
      .regex(/^[A-Z]{2,4}-ADR-\d{3}$/, 'ADR ids look like MT-ADR-001')
      .pipe(s.unique('adr')),
    title: s.string().min(8),
    status: s.enum(['proposed', 'accepted', 'superseded', 'deprecated', 'rejected']),
    date: isoDate(),
    caseStudy: s.string().regex(SLUG),
    supersededBy: s.string().optional(),
    context: s.string().min(40),
    decision: s.string().min(20),
    alternatives: s.array(s.object({ option: s.string(), summary: s.string(), rejectedBecause: s.string() })).min(1),
    consequences: s.object({ positive: s.array(s.string()).min(1), negative: s.array(s.string()).min(1) }),
    risks: s.array(s.string()).default([]),
    followUps: s.array(s.string()).default([]),
  }),
});

const nodeKind = s.enum([
  'client',
  'external',
  'gateway',
  'service',
  'worker',
  'broker',
  'database',
  'cache',
  'storage',
  'model',
  'monitoring',
  'edge',
]);

const systems = defineCollection({
  name: 'SystemModel',
  pattern: 'architecture/*/system.yaml',
  schema: s
    .object({
      caseStudy: s.string().regex(SLUG),
      title: s.string(),
      description: s.string().min(40),
      groups: s
        .array(
          s.object({
            id: s.string(),
            label: s.string(),
            trust: s.enum(['public', 'dmz', 'internal', 'restricted', 'edge']),
          }),
        )
        .default([]),
      nodes: s
        .array(
          s.object({
            id: s.string().regex(/^[a-z0-9-]+$/),
            label: s.string(),
            kind: nodeKind,
            group: s.string().optional(),
            position: s.object({ x: s.number(), y: s.number() }),
            technology: s.string(),
            responsibility: s.string().min(20),
            rationale: s.string().min(20),
            interfaces: s.array(s.string()).min(1),
            failureModes: s.array(s.object({ mode: s.string(), effect: s.string(), mitigation: s.string() })).min(1),
            security: s.array(s.string()).min(1),
            adrs: s.array(s.string()).default([]),
          }),
        )
        .min(2),
      edges: s
        .array(
          s.object({
            id: s.string(),
            source: s.string(),
            target: s.string(),
            label: s.string(),
            protocol: s.string(),
            mode: s.enum(['sync', 'async', 'stream', 'batch']),
          }),
        )
        .min(1),
      flows: s
        .array(
          s.object({
            id: s.string(),
            title: s.string(),
            description: s.string(),
            steps: s.array(s.object({ edge: s.string(), note: s.string() })).min(1),
          }),
        )
        .default([]),
    })
    .superRefine((model, ctx) => {
      // Referential integrity: every edge, flow step and group must point at something real.
      const nodeIds = new Set(model.nodes.map((n) => n.id));
      const edgeIds = new Set(model.edges.map((e) => e.id));
      const groupIds = new Set(model.groups.map((g) => g.id));
      model.nodes.forEach((n, i) => {
        if (n.group && !groupIds.has(n.group))
          ctx.addIssue({ code: 'custom', path: ['nodes', i, 'group'], message: `unknown group "${n.group}"` });
      });
      model.edges.forEach((e, i) => {
        for (const end of ['source', 'target'] as const)
          if (!nodeIds.has(e[end]))
            ctx.addIssue({ code: 'custom', path: ['edges', i, end], message: `unknown node "${e[end]}"` });
      });
      model.flows.forEach((f, i) =>
        f.steps.forEach((step, j) => {
          if (!edgeIds.has(step.edge))
            ctx.addIssue({ code: 'custom', path: ['flows', i, 'steps', j], message: `unknown edge "${step.edge}"` });
        }),
      );
      if (nodeIds.size !== model.nodes.length)
        ctx.addIssue({ code: 'custom', path: ['nodes'], message: 'duplicate node id' });
      if (edgeIds.size !== model.edges.length)
        ctx.addIssue({ code: 'custom', path: ['edges'], message: 'duplicate edge id' });
    }),
});

const projects = defineCollection({
  name: 'Project',
  pattern: 'projects/*.mdx',
  schema: s
    .object({
      title: s.string().min(4),
      summary: s.string().min(40).max(240),
      category: s.enum(['architecture', 'ai-inference', 'iot', 'backend', 'developer-tooling', 'web']),
      technologies: s.array(s.string()).min(1),
      provenance,
      status: s.enum(['active', 'complete', 'archived', 'concept']),
      date: isoDate(),
      featured: s.boolean().default(false),
      /** Verified public links only. Omit rather than guess. */
      links: s.object({ source: s.string().url().optional(), demo: s.string().url().optional() }).default({}),
      relatedCaseStudy: s.string().optional(),
      path: s.path(),
      body: mdxBody,
    })
    .transform((data) => {
      const slug = slugFromPath(data.path);
      return { ...data, slug, url: `/projects/${slug}/` };
    }),
});

export const collections = { articles, caseStudies, adrs, systems, projects };

export const mdxOptions = {
  gfm: true,
  removeComments: true,
  // Diagram `src` props are ids, not files: assets are handled by scripts/build-diagrams.ts.
  copyLinkedFiles: false,
  rehypePlugins: [
    rehypeSlug,
    [
      rehypeAutolinkHeadings,
      {
        behavior: 'append',
        properties: { className: ['heading-anchor'], ariaHidden: true, tabIndex: -1 },
        content: { type: 'text', value: '#' },
      },
    ],
    [
      rehypeShiki,
      {
        themes: { light: 'github-light-high-contrast', dark: 'github-dark-high-contrast' },
        defaultColor: false,
        addLanguageClass: true,
      },
    ],
  ],
} satisfies Parameters<typeof defineConfig>[0]['mdx'];

type Collections = Record<string, unknown[]> & {
  articles: { slug: string; draft: boolean }[];
  caseStudies?: { slug: string }[];
  adrs?: { id: string; caseStudy: string }[];
  systems?: { caseStudy: string; nodes: { id: string; adrs: string[] }[] }[];
  projects?: { slug: string; relatedCaseStudy?: string }[];
};

/** Draft removal + cross-collection integrity. Returning false fails the build. */
export function prepareContent(collections: Collections): false | void {
  collections.caseStudies ??= [];
  collections.adrs ??= [];
  collections.systems ??= [];
  collections.projects ??= [];
  if (!includeDrafts) {
    collections.articles = collections.articles.filter((a) => !a.draft);
  }
  // Cross-collection integrity checks — return false to fail the build.
  const caseStudySlugs = new Set(collections.caseStudies!.map((c) => c.slug));
  const adrIds = new Set(collections.adrs!.map((a) => a.id));
  const problems: string[] = [];
  for (const adr of collections.adrs!)
    if (!caseStudySlugs.has(adr.caseStudy))
      problems.push(`ADR ${adr.id} references unknown case study "${adr.caseStudy}"`);
  for (const system of collections.systems!) {
    if (!caseStudySlugs.has(system.caseStudy))
      problems.push(`system.yaml references unknown case study "${system.caseStudy}"`);
    for (const node of system.nodes)
      for (const id of node.adrs)
        if (!adrIds.has(id)) problems.push(`${system.caseStudy}: node "${node.id}" references unknown ${id}`);
  }
  for (const project of collections.projects!)
    if (project.relatedCaseStudy && !caseStudySlugs.has(project.relatedCaseStudy))
      problems.push(`project ${project.slug} references unknown case study "${project.relatedCaseStudy}"`);
  const slugs = collections.articles.map((a) => a.slug);
  const dup = slugs.find((slug, i) => slugs.indexOf(slug) !== i);
  if (dup) problems.push(`duplicate article slug "${dup}"`);
  if (problems.length) {
    for (const p of problems) console.error(`✗ content: ${p}`);
    return false;
  }
}

export default defineConfig({
  root: 'content',
  output: {
    data: '.velite',
    assets: 'public/static',
    base: `${basePath}/static/` as `/${string}/`,
    name: '[name]-[hash:6].[ext]',
    clean: true,
  },
  strict: true,
  collections: { articles, caseStudies, adrs, systems, projects },
  mdx: mdxOptions,
  prepare: (data) => prepareContent(data as unknown as Collections),
});
