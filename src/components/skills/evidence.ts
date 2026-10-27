import { allArticles, allCaseStudies, allProjects } from '@/content';
import { skillCategories, skills, type SkillCategoryId } from '@/data/skills';

export interface EvidenceLink {
  title: string;
  href: string;
  kind: 'Case study' | 'Article' | 'Project';
}

export interface SkillWithEvidence {
  name: string;
  category: SkillCategoryId;
  level: string | null;
  evidence: EvidenceLink[];
}

/** Matches each skill's aliases against tags/technologies of published content. */
export function skillsWithEvidence(): SkillWithEvidence[] {
  const sources = [
    ...allCaseStudies.map((c) => ({ title: c.title, href: c.url, kind: 'Case study' as const, terms: c.tags })),
    ...allArticles.map((a) => ({ title: a.title, href: a.url, kind: 'Article' as const, terms: a.tags })),
    ...allProjects
      .filter((p) => p.provenance !== 'placeholder')
      .map((p) => ({ title: p.title, href: p.url, kind: 'Project' as const, terms: p.technologies })),
  ].map((s) => ({ ...s, terms: s.terms.map((t) => t.toLowerCase()) }));

  return skills.map((skill) => {
    const aliases = skill.aliases.map((a) => a.toLowerCase());
    return {
      name: skill.name,
      category: skill.category,
      level: skill.level,
      evidence: sources
        .filter((s) => s.terms.some((t) => aliases.includes(t)))
        .map(({ title, href, kind }) => ({ title, href, kind })),
    };
  });
}

export { skillCategories };
