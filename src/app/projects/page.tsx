import Link from 'next/link';
import { PageHeader } from '@/components/layout/PageHeader';
import { ProjectFilter } from '@/components/projects/ProjectFilter';
import { projectCategoryLabel } from '@/components/projects/categories';
import { ProvenanceBadge } from '@/components/architecture/ProvenanceBadge';
import { Badge } from '@/components/ui/badge';
import { allProjects } from '@/content';
import { pageMetadata } from '@/lib/metadata';

export const metadata = pageMetadata({
  title: 'Projects',
  description: 'Selected engineering projects documented as case studies: problem, constraints, approach, architecture, decisions and lessons — with verified links only.',
  path: '/projects/',
  image: '/og/projects.png',
});

export default function ProjectsPage() {
  const categories = [...new Set(allProjects.map((p) => p.category))].map((id) => ({ id, label: projectCategoryLabel[id] }));
  return (
    <>
      <PageHeader
        crumbs={[{ name: 'Projects', path: '/projects/' }]}
        eyebrow="Engineering workshop"
        title="Selected projects"
        lead={<p>Each project follows the same format — problem, constraints, approach, architecture, decisions, challenges and lessons. Links are included only when they are public and verified.</p>}
      />
      <div className="container-page py-10">
        {categories.length > 1 ? <ProjectFilter categories={categories} listId="project-list" /> : null}
        <ul id="project-list" className="mt-8 grid gap-6 md:grid-cols-2">
          {allProjects.map((p) => (
            <li key={p.slug} data-category={p.category} className="card card-interactive relative flex flex-col p-6">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="secondary">{projectCategoryLabel[p.category]}</Badge>
                <ProvenanceBadge value={p.provenance} />
                {p.featured ? <Badge tone="highlight">Featured</Badge> : null}
              </div>
              <h2 className="mt-4 font-display text-xl font-semibold">
                <Link href={p.url} className="after:absolute after:inset-0 after:rounded-[inherit]">{p.title}</Link>
              </h2>
              <p className="mt-2 flex-1 text-sm text-muted">{p.summary}</p>
              <p className="mt-4 font-mono text-xs text-subtle">{p.technologies.slice(0, 6).join(' · ')}</p>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
