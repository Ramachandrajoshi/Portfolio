'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

/**
 * Progressive category filter: the full project list is server-rendered (and stays fully
 * visible without JavaScript); this island only toggles `hidden` on items by category.
 */
export function ProjectFilter({ categories, listId }: { categories: { id: string; label: string }[]; listId: string }) {
  const [active, setActive] = useState('all');
  useEffect(() => {
    const items = document.querySelectorAll<HTMLElement>(`#${listId} > [data-category]`);
    items.forEach((el) => {
      el.hidden = active !== 'all' && el.dataset.category !== active;
    });
  }, [active, listId]);
  const options = [{ id: 'all', label: 'All' }, ...categories];
  return (
    <div role="group" aria-label="Filter projects by category" className="flex flex-wrap gap-2">
      {options.map((c) => (
        <button
          key={c.id}
          type="button"
          aria-pressed={active === c.id}
          onClick={() => setActive(c.id)}
          className={cn(
            'rounded-full border px-3 py-1 text-sm',
            active === c.id ? 'border-accent bg-accent/10 text-accent' : 'border-border text-muted hover:border-accent hover:text-accent',
          )}
        >
          {c.label}
        </button>
      ))}
    </div>
  );
}
