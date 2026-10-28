import Link from 'next/link';
import { cn } from '@/lib/utils';

export function TagList({ tags, active }: { tags: { tag: string; count: number }[]; active?: string }) {
  return (
    <nav aria-label="Filter articles by tag">
      <ul className="flex flex-wrap gap-2">
        <li>
          <Link
            href="/articles/"
            aria-current={active ? undefined : 'page'}
            className={cn(
              'inline-flex rounded-full border px-3 py-1 text-sm',
              active
                ? 'border-border text-muted hover:border-accent hover:text-accent'
                : 'border-accent bg-accent/10 text-accent',
            )}
          >
            All
          </Link>
        </li>
        {tags.map(({ tag, count }) => (
          <li key={tag}>
            <Link
              href={`/articles/tags/${tag}/`}
              aria-current={active === tag ? 'page' : undefined}
              className={cn(
                'inline-flex rounded-full border px-3 py-1 text-sm',
                active === tag
                  ? 'border-accent bg-accent/10 text-accent'
                  : 'border-border text-muted hover:border-accent hover:text-accent',
              )}
            >
              #{tag} <span className="ml-1.5 text-subtle">{count}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
