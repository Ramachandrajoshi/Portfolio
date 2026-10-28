/**
 * Typed access layer over Velite's generated content. Pages import from here, never from
 * `#site/content` directly, so ordering, draft rules and lookups live in one place.
 * Server-only: this module must never be imported by a client component.
 */
import { adrs, articles, caseStudies, projects, systems } from '#site/content';
import type { Adr, Article, CaseStudy, Project, SystemModel } from '#site/content';

export type { Adr, Article, CaseStudy, Project, SystemModel };

const byDateDesc = <T extends { date: string }>(a: T, b: T) => b.date.localeCompare(a.date);

/** Drafts are already removed by velite.config.ts; this is defence in depth. */
export const allArticles: Article[] = articles.filter((a) => !a.draft).sort(byDateDesc);

export function getArticle(slug: string): Article | undefined {
  return allArticles.find((a) => a.slug === slug);
}

export function allTags(): { tag: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const a of allArticles) for (const t of a.tags) counts.set(t, (counts.get(t) ?? 0) + 1);
  return [...counts]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
}

/** Related = same series first, then by shared-tag count, then recency. */
export function relatedArticles(article: Article, limit = 3): Article[] {
  return allArticles
    .filter((a) => a.slug !== article.slug)
    .map((a) => ({
      a,
      score:
        (article.series && a.series === article.series ? 10 : 0) +
        a.tags.filter((t) => article.tags.includes(t)).length,
    }))
    .filter((x) => x.score > 0)
    .sort((x, y) => y.score - x.score || byDateDesc(x.a, y.a))
    .slice(0, limit)
    .map((x) => x.a);
}

/** Chronological neighbours: `previous` is older, `next` is newer. */
export function adjacentArticles(article: Article): { previous?: Article; next?: Article } {
  const i = allArticles.findIndex((a) => a.slug === article.slug);
  return { previous: allArticles[i + 1], next: allArticles[i - 1] };
}

export const allCaseStudies: CaseStudy[] = [...caseStudies].sort((a, b) => a.order - b.order);

export function getCaseStudy(slug: string): CaseStudy | undefined {
  return allCaseStudies.find((c) => c.slug === slug);
}

export function adrsFor(caseStudy: string): Adr[] {
  return adrs.filter((a) => a.caseStudy === caseStudy).sort((a, b) => a.id.localeCompare(b.id));
}

export function getAdr(id: string): Adr | undefined {
  return adrs.find((a) => a.id === id);
}

export function systemFor(caseStudy: string): SystemModel | undefined {
  return systems.find((s) => s.caseStudy === caseStudy);
}

const showPlaceholders = process.env.NODE_ENV !== 'production' || process.env.NEXT_PUBLIC_SHOW_PLACEHOLDERS === 'true';

/** Placeholder projects (templates awaiting the owner's facts) never ship to production. */
export const allProjects: Project[] = projects
  .filter((p) => showPlaceholders || p.provenance !== 'placeholder')
  .sort((a, b) => Number(b.featured) - Number(a.featured) || byDateDesc(a, b));

export function getProject(slug: string): Project | undefined {
  return allProjects.find((p) => p.slug === slug);
}
