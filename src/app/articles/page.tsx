import Link from 'next/link';
import { PageHeader } from '@/components/layout/PageHeader';
import { ArticleCard } from '@/components/content/ArticleCard';
import { TagList } from '@/components/content/TagList';
import { SearchIcon, RssIcon } from '@/components/ui/icons';
import { allArticles, allTags } from '@/content';
import { pageMetadata } from '@/lib/metadata';
import { asset } from '@/lib/urls';

export const metadata = pageMetadata({
  title: 'Articles',
  description: 'Technical writing on system design, LLM inference, event-driven architecture and industrial IoT — with diagrams, decision records and runnable examples.',
  path: '/articles/',
  image: '/og/articles.png',
});

export default function ArticlesPage() {
  return (
    <>
      <PageHeader
        crumbs={[{ name: 'Articles', path: '/articles/' }]}
        eyebrow="The library"
        title="Technical writing"
        lead={<p>Long-form notes on designing, sizing and operating systems. Examples are labelled illustrative until reviewed against real measurements.</p>}
      >
        <div className="mt-6 flex flex-wrap gap-3">
          <form action={asset('/search/')} method="get" role="search" className="flex">
            <label htmlFor="article-search" className="sr-only">
              Search articles
            </label>
            <input
              id="article-search"
              name="q"
              type="search"
              placeholder="Search articles…"
              className="h-10 w-64 rounded-l-md border border-border-strong bg-surface px-3 text-sm placeholder:text-subtle"
            />
            <button type="submit" className="inline-flex h-10 items-center rounded-r-md border border-l-0 border-border-strong bg-surface-2 px-3 text-muted hover:text-fg" aria-label="Search">
              <SearchIcon className="size-4" />
            </button>
          </form>
          <a href={asset('/feed.xml')} className="inline-flex h-10 items-center gap-2 rounded-md border border-border px-3 text-sm text-muted hover:border-accent hover:text-accent">
            <RssIcon className="size-4" /> RSS
          </a>
        </div>
      </PageHeader>
      <div className="container-page py-10">
        <TagList tags={allTags()} />
        <ul className="mt-8 grid gap-6 md:grid-cols-2">
          {allArticles.map((a) => (
            <li key={a.slug}>
              <ArticleCard article={a} />
            </li>
          ))}
        </ul>
        {allArticles.length === 0 ? (
          <p className="text-muted">
            No articles published yet. <Link href="/architecture/" className="link">Read the case studies</Link> instead.
          </p>
        ) : null}
      </div>
    </>
  );
}
