import Link from 'next/link';
import type { Article } from '@/content';
import { formatDate } from '@/lib/utils';
import { ProvenanceBadge } from '@/components/architecture/ProvenanceBadge';

export function ArticleCard({ article, headingLevel = 'h2' }: { article: Article; headingLevel?: 'h2' | 'h3' }) {
  const H = headingLevel;
  return (
    <article className="card card-interactive relative flex h-full flex-col p-6">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
        <time dateTime={article.date}>{formatDate(article.date)}</time>
        <span aria-hidden>·</span>
        <span>{article.metadata.readingTime} min read</span>
        {article.series ? (
          <>
            <span aria-hidden>·</span>
            <span className="text-tertiary">Series: {article.series}</span>
          </>
        ) : null}
      </div>
      <H className="mt-3 font-display text-xl font-semibold leading-snug">
        <Link href={article.url} className="after:absolute after:inset-0 after:rounded-[inherit]">
          {article.title}
        </Link>
      </H>
      <p className="mt-2 flex-1 text-sm text-muted">{article.description}</p>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <ProvenanceBadge value={article.provenance} />
        {article.tags.slice(0, 3).map((t) => (
          <span key={t} className="font-mono text-[0.7rem] text-subtle">
            #{t}
          </span>
        ))}
      </div>
    </article>
  );
}
