import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PageHeader } from '@/components/layout/PageHeader';
import { MDXContent } from '@/components/mdx/MDXContent';
import { ProvenanceBadge } from '@/components/architecture/ProvenanceBadge';
import { projectCategoryLabel } from '@/components/projects/categories';
import { Button } from '@/components/ui/button';
import { ExternalIcon, GitHubIcon } from '@/components/ui/icons';
import { allProjects, getCaseStudy, getProject } from '@/content';
import { pageMetadata } from '@/lib/metadata';

type Params = { slug: string };
export const dynamicParams = false;

export function generateStaticParams(): Params[] {
  return allProjects.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const project = getProject((await params).slug);
  if (!project) return {};
  return pageMetadata({
    title: project.title,
    description: project.summary,
    path: project.url,
    image: `/og/projects/${project.slug}.png`,
    noindex: project.provenance === 'placeholder',
  });
}

const statusLabel = { active: 'Active', complete: 'Complete', archived: 'Archived', concept: 'Concept' } as const;

export default async function ProjectPage({ params }: { params: Promise<Params> }) {
  const project = getProject((await params).slug);
  if (!project) notFound();
  const related = project.relatedCaseStudy ? getCaseStudy(project.relatedCaseStudy) : undefined;
  return (
    <>
      <PageHeader
        crumbs={[
          { name: 'Projects', path: '/projects/' },
          { name: project.title, path: project.url },
        ]}
        eyebrow={projectCategoryLabel[project.category]}
        title={project.title}
        lead={<p>{project.summary}</p>}
      >
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <ProvenanceBadge value={project.provenance} />
          <span className="text-sm text-muted">Status: {statusLabel[project.status]}</span>
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          {project.links.source ? (
            <Button asChild variant="secondary">
              <a href={project.links.source} target="_blank" rel="noopener noreferrer">
                <GitHubIcon /> Source code<span className="sr-only"> (opens in a new tab)</span>
              </a>
            </Button>
          ) : null}
          {project.links.demo ? (
            <Button asChild>
              <a href={project.links.demo} target="_blank" rel="noopener noreferrer">
                <ExternalIcon /> Live demo<span className="sr-only"> (opens in a new tab)</span>
              </a>
            </Button>
          ) : null}
        </div>
      </PageHeader>
      <div className="container-page grid gap-10 py-12 lg:grid-cols-[minmax(0,1fr)_16rem]">
        <article data-pagefind-body data-pagefind-meta="type:Project" className="min-w-0">
          <div className="prose max-w-none [&>:is(p,ul,ol,h2,h3,h4,blockquote,pre,hr)]:max-w-[var(--prose-width)]">
            <MDXContent code={project.body} />
          </div>
        </article>
        <aside className="space-y-6">
          <div className="card p-5">
            <p className="eyebrow">Technologies</p>
            <ul className="mt-3 flex flex-wrap gap-2">
              {project.technologies.map((t) => (
                <li key={t} className="rounded-md border border-border bg-surface-2 px-2 py-1 font-mono text-xs">
                  {t}
                </li>
              ))}
            </ul>
          </div>
          {related ? (
            <div className="card p-5">
              <p className="eyebrow">Related case study</p>
              <Link href={related.url} className="mt-2 block text-sm hover:text-accent">
                {related.title}
              </Link>
            </div>
          ) : null}
        </aside>
      </div>
    </>
  );
}
