import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PageHeader } from '@/components/layout/PageHeader';
import { MDXContent } from '@/components/mdx/MDXContent';
import { TableOfContents } from '@/components/content/TableOfContents';
import { ReadingProgress } from '@/components/content/ReadingProgress';
import { ProvenanceBadge } from '@/components/architecture/ProvenanceBadge';
import { QualityAttributesTable } from '@/components/architecture/QualityAttributesTable';
import { C4Views } from '@/components/architecture/C4Views';
import { Badge } from '@/components/ui/badge';
import { JsonLd } from '@/components/seo/JsonLd';
import { adrsFor, allCaseStudies, getCaseStudy } from '@/content';
import { pageMetadata } from '@/lib/metadata';
import { articleSchema } from '@/lib/structured-data';
import { formatDate } from '@/lib/utils';

type Params = { slug: string };

export const dynamicParams = false;

export function generateStaticParams(): Params[] {
  return allCaseStudies.map((cs) => ({ slug: cs.slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const cs = getCaseStudy((await params).slug);
  if (!cs) return {};
  return pageMetadata({
    title: cs.title,
    description: cs.summary,
    path: cs.url,
    image: `/og/architecture/${cs.slug}.png`,
    type: 'article',
    publishedTime: cs.date,
    modifiedTime: cs.updated,
    tags: cs.tags,
  });
}

export default async function CaseStudyPage({ params }: { params: Promise<Params> }) {
  const cs = getCaseStudy((await params).slug);
  if (!cs) notFound();
  const adrs = adrsFor(cs.slug);
  const index = allCaseStudies.findIndex((c) => c.slug === cs.slug);
  const next = allCaseStudies[index + 1];

  return (
    <>
      <ReadingProgress />
      <PageHeader
        crumbs={[
          { name: 'Architecture', path: '/architecture/' },
          { name: cs.title, path: cs.url },
        ]}
        eyebrow={cs.domain}
        title={cs.title}
        lead={<p>{cs.summary}</p>}
      >
        <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted">
          <ProvenanceBadge value={cs.provenance} withHelp />
        </div>
        <dl className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted">
          <div className="flex gap-1.5">
            <dt>Published</dt>
            <dd className="text-fg">
              <time dateTime={cs.date}>{formatDate(cs.date)}</time>
            </dd>
          </div>
          <div className="flex gap-1.5">
            <dt>Reading time</dt>
            <dd className="text-fg">{cs.metadata.readingTime} min</dd>
          </div>
          <div className="flex gap-1.5">
            <dt>Decisions</dt>
            <dd className="text-fg">{adrs.length} ADRs</dd>
          </div>
        </dl>
      </PageHeader>

      <div className="container-page grid gap-10 py-12 lg:grid-cols-[minmax(0,1fr)_15rem]">
        <article id="article-body" data-pagefind-body data-pagefind-meta="type:Case study" className="min-w-0">
          <div className="prose max-w-none [&>:is(p,ul,ol,h2,h3,h4,blockquote,pre,hr)]:max-w-[var(--prose-width)]">
            <MDXContent
              code={cs.body}
              components={{
                QualityAttributes: () => <QualityAttributesTable items={cs.qualityAttributes} />,
                C4Views: () => <C4Views diagrams={cs.diagrams} />,
              }}
            />
          </div>
          <footer className="mt-16 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-6">
            <div className="flex flex-wrap gap-2">
              {cs.tags.map((t) => (
                <Badge key={t}>{t}</Badge>
              ))}
            </div>
            {next ? (
              <Link href={next.url} className="link text-sm">
                Next case study: {next.title} →
              </Link>
            ) : (
              <Link href="/architecture/" className="link text-sm">
                All case studies →
              </Link>
            )}
          </footer>
        </article>
        <aside className="hidden lg:block" data-print-hide>
          <div className="sticky top-24 max-h-[calc(100dvh-7rem)] overflow-y-auto">
            <TableOfContents items={cs.toc} />
          </div>
        </aside>
      </div>
      <JsonLd
        data={articleSchema({
          title: cs.title,
          description: cs.summary,
          path: cs.url,
          date: cs.date,
          updated: cs.updated,
          tags: cs.tags,
          image: `/og/architecture/${cs.slug}.png`,
        })}
      />
    </>
  );
}
