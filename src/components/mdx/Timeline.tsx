import type { ReactNode } from 'react';

export interface TimelineItem {
  /** Short label: a date, phase or step number. */
  label: string;
  title: string;
  description?: ReactNode;
  status?: 'done' | 'current' | 'planned';
}

const statusText = { done: 'Completed', current: 'In progress', planned: 'Planned' } as const;

/** Accessible timeline: an ordered list, with status conveyed in text (not colour alone). */
export function Timeline({ items, title }: { items: TimelineItem[]; title?: string }) {
  return (
    <figure className="not-prose my-8">
      {title ? <figcaption className="mb-4 font-display text-lg font-semibold">{title}</figcaption> : null}
      <ol className="relative space-y-6 border-l border-border-strong pl-6">
        {items.map((item, i) => (
          <li key={`${item.label}-${i}`} className="relative">
            <span
              aria-hidden
              className={
                'absolute -left-[1.94rem] top-1.5 size-3 rounded-full border-2 ' +
                (item.status === 'planned'
                  ? 'border-border-strong bg-bg'
                  : item.status === 'current'
                    ? 'border-highlight bg-highlight/40'
                    : 'border-accent bg-accent/40')
              }
            />
            <p className="font-mono text-xs uppercase tracking-wider text-accent">{item.label}</p>
            <p className="mt-0.5 font-semibold">
              {item.title}
              {item.status ? <span className="ml-2 text-xs font-normal text-muted">({statusText[item.status]})</span> : null}
            </p>
            {item.description ? <div className="mt-1 text-[0.95rem] text-muted">{item.description}</div> : null}
          </li>
        ))}
      </ol>
    </figure>
  );
}
