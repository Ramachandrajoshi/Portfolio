'use client';

import { useEffect, useState } from 'react';
import { cx } from '@/lib/cx';

export interface TocItem {
  title: string;
  url: string;
  items: TocItem[];
}

/**
 * Table of contents with scroll tracking. Server-rendered as plain anchor links (works
 * without JS); hydration adds an IntersectionObserver that marks the current section.
 */
export function TableOfContents({ items, title = 'On this page' }: { items: TocItem[]; title?: string }) {
  const [active, setActive] = useState<string | null>(null);
  const flat = items.flatMap((i) => [i, ...i.items]);

  useEffect(() => {
    const headings = flat
      .map((i) => document.getElementById(decodeURIComponent(i.url.slice(1))))
      .filter((el): el is HTMLElement => el !== null);
    if (!headings.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(`#${visible[0].target.id}`);
      },
      { rootMargin: '-80px 0px -65% 0px', threshold: 0 },
    );
    headings.forEach((h) => observer.observe(h));
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- headings are static per page
  }, []);

  if (!items.length) return null;
  return (
    <nav aria-label={title} className="text-sm">
      <p className="eyebrow">{title}</p>
      <ol className="mt-3 space-y-1 border-l border-border">
        {items.map((item) => (
          <li key={item.url}>
            <TocLink item={item} active={active} />
            {item.items.length ? (
              <ol className="space-y-1">
                {item.items.map((sub) => (
                  <li key={sub.url}>
                    <TocLink item={sub} active={active} nested />
                  </li>
                ))}
              </ol>
            ) : null}
          </li>
        ))}
      </ol>
    </nav>
  );
}

function TocLink({ item, active, nested = false }: { item: TocItem; active: string | null; nested?: boolean }) {
  const isActive = active === item.url;
  return (
    <a
      href={item.url}
      aria-current={isActive ? 'location' : undefined}
      className={cx(
        '-ml-px block border-l py-1 pr-2 leading-snug transition-colors',
        nested ? 'pl-6 text-[0.8rem]' : 'pl-3',
        isActive ? 'border-accent text-fg' : 'border-transparent text-muted hover:text-fg',
      )}
    >
      {item.title}
    </a>
  );
}
