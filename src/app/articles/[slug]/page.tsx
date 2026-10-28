import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PageHeader } from '@/components/layout/PageHeader';
import { MDXContent } from '@/components/mdx/MDXContent';
import { TableOfContents } from '@/components/content/TableOfContents';
import { ReadingProgress } from '@/components/content/ReadingProgress';
import { ShareLinks } from '@/components/content/ShareLinks';
import { ArticleCard } from '@/components/content/ArticleCard';
import { ProvenanceBadge } from '@/components/architecture/ProvenanceBadge';
import { JsonLd } from '@/components/seo/JsonLd';
import { adjacentArticles, allArticles, getArticle, relatedArticles } from '@/content';
import { pageMetadata } from '@/lib/metadata';
import { articleSchema } from '@/lib/structured-data';
import { asset } from '@/lib/urls';
import { formatDate } from '@/lib/utils';

type Params = { slug: string };
export const dynamicParams = false;

export function generateStaticParams(): Params[] {
  return allArticles.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const article = getArticle((await params).slug);
  if (!article) return {};
  return pageMetadata({
    title: article.title,
    description: article.description,
    path: article.url,
    image: `/og/articles/${article.slug}.png`,
    type: 'article',
    publishedTime: article.date,
    modifiedTime: article.updated,
    tags: article.tags,
  });
}

export default async function ArticlePage({ params }: { params: Promise<Params> }) {
  const article = getArticle((await params).slug);
  if (!article) notFound();
  const related = relatedArticles(article);
  const { previous, next } = adjacentArticles(article);
  const seriesParts = article.series
    ? allArticles
        .filter((a) => a.series === article.series)
        .sort((a, b) => (a.seriesOrder ?? 0) - (b.seriesOrder ?? 0) || a.date.localeCompare(b.date))
    : [];

  return (
    <>
      <ReadingProgress />
      <PageHeader
        crumbs={[
          { name: 'Articles', path: '/articles/' },
          { name: article.title, path: article.url },
        ]}
        eyebrow={article.series ? `Series · ${article.series}` : 'Article'}
        title={article.title}
        lead={<p>{article.description}</p>}
      >
        <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted">
          <time dateTime={article.date}>{formatDate(article.date)}</time>
          {article.updated ? (
            <span>
              Updated <time dateTime={article.updated}>{formatDate(article.updated)}</time>
            </span>
          ) : null}
          <span>{article.metadata.readingTime} min read</span>
          <span>{article.metadata.wordCount.toLocaleString('en-GB')} words</span>
          <ProvenanceBadge value={article.provenance} />
        </div>
        <ul className="mt-4 flex flex-wrap gap-2" aria-label="Tags">
          {article.tags.map((t) => (
            <li key={t}>
              <Link
                href={`/articles/tags/${t}/`}
                className="inline-flex min-h-6 items-center rounded px-1.5 font-mono text-xs text-accent hover:bg-accent/10 hover:underline"
              >
                #{t}
              </Link>
            </li>
          ))}
        </ul>
      </PageHeader>

      <div className="container-page grid gap-10 py-12 lg:grid-cols-[minmax(0,1fr)_15rem]">
        <article id="article-body" data-pagefind-body data-pagefind-meta="type:Article" className="min-w-0">
          {article.cover ? (
            <img
              src={asset(article.cover)}
              alt={article.coverAlt ?? ''}
              className="mb-10 w-full rounded-xl border border-border"
              width={1200}
              height={630}
            />
          ) : null}
          {seriesParts.length > 1 ? (
            <nav
              aria-label={`Series: ${article.series}`}
              className="not-prose mb-10 rounded-lg border border-tertiary/40 bg-tertiary/5 p-4 text-sm"
            >
              <p className="eyebrow !text-tertiary">Series · {article.series}</p>
              <ol className="mt-2 list-decimal space-y-1 pl-5">
                {seriesParts.map((part) => (
                  <li key={part.slug}>
                    {part.slug === article.slug ? (
                      <span aria-current="page" className="font-medium">
                        {part.title}
                      </span>
                    ) : (
                      <Link href={part.url} className="link">
                        {part.title}
                      </Link>
                    )}
                  </li>
                ))}
              </ol>
            </nav>
          ) : null}
          <div className="prose max-w-none [&>:is(p,ul,ol,h2,h3,h4,blockquote,pre,hr)]:max-w-[var(--prose-width)]">
            <MDXContent code={article.body} />
          </div>
          <footer className="mt-14 space-y-8 border-t border-border pt-6" data-pagefind-ignore>
            <ShareLinks title={article.title} path={article.url} />
            {previous || next ? (
              <nav aria-label="Previous and next articles" className="grid gap-4 sm:grid-cols-2">
                {previous ? (
                  <Link href={previous.url} rel="prev" className="card card-interactive block p-4">
                    <span className="text-xs text-muted">← Previous (older)</span>
                    <span className="mt-1 block font-medium">{previous.title}</span>
                  </Link>
                ) : (
                  <span />
                )}
                {next ? (
                  <Link href={next.url} rel="next" className="card card-interactive block p-4 text-right">
                    <span className="text-xs text-muted">Next (newer) →</span>
                    <span className="mt-1 block font-medium">{next.title}</span>
                  </Link>
                ) : null}
              </nav>
            ) : null}
          </footer>
        </article>
        <aside className="hidden lg:block" data-print-hide>
          <div className="sticky top-24 max-h-[calc(100dvh-7rem)] overflow-y-auto">
            <TableOfContents items={article.toc} />
          </div>
        </aside>
      </div>

      {related.length ? (
        <section className="container-page pb-4" aria-labelledby="related-heading" data-pagefind-ignore>
          <h2 id="related-heading" className="font-display text-2xl font-semibold">
            Related articles
          </h2>
          <ul className="mt-6 grid gap-6 md:grid-cols-3">
            {related.map((a) => (
              <li key={a.slug}>
                <ArticleCard article={a} headingLevel="h3" />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <JsonLd
        data={articleSchema({
          title: article.title,
          description: article.description,
          path: article.url,
          date: article.date,
          updated: article.updated,
          tags: article.tags,
          image: `/og/articles/${article.slug}.png`,
        })}
      />
    </>
  );
}
