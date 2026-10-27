'use client';

import { Children, isValidElement, useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { cx } from '@/lib/cx';

/**
 * WAI-ARIA tabs (automatic activation): roving tabindex, ←/→ to move, Home/End to jump.
 * Every panel is server-rendered (inactive ones `hidden`), so content is in the HTML for
 * search engines and Pagefind. ~1 KB instead of a tabs dependency on every article.
 */
export function Tabs({ labels, children, title }: { labels: string[]; children: ReactNode; title?: string }) {
  const panels = Children.toArray(children).filter(isValidElement);
  if (panels.length !== labels.length) {
    throw new Error(`<Tabs> received ${labels.length} labels but ${panels.length} <TabPanel> children.`);
  }
  const [active, setActive] = useState(0);
  const id = useId();
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const last = labels.length - 1;
    const next =
      event.key === 'ArrowRight'
        ? active === last
          ? 0
          : active + 1
        : event.key === 'ArrowLeft'
          ? active === 0
            ? last
            : active - 1
          : event.key === 'Home'
            ? 0
            : event.key === 'End'
              ? last
              : null;
    if (next === null) return;
    event.preventDefault();
    setActive(next);
    tabRefs.current[next]?.focus();
  };

  return (
    <div className="my-8 rounded-lg border border-border bg-surface" data-component="tabs">
      <div
        role="tablist"
        aria-label={title ?? 'Tabbed content'}
        className="flex gap-1 overflow-x-auto border-b border-border px-2 pt-2"
        onKeyDown={onKeyDown}
      >
        {labels.map((label, i) => (
          <button
            key={label}
            ref={(el) => {
              tabRefs.current[i] = el;
            }}
            id={`${id}-tab-${i}`}
            role="tab"
            type="button"
            aria-selected={i === active}
            aria-controls={`${id}-panel-${i}`}
            tabIndex={i === active ? 0 : -1}
            onClick={() => setActive(i)}
            className={cx(
              '-mb-px rounded-t-md border-b-2 px-3.5 py-2 text-sm font-medium whitespace-nowrap transition-colors',
              i === active ? 'border-accent text-fg' : 'border-transparent text-muted hover:text-fg',
            )}
          >
            {label}
          </button>
        ))}
      </div>
      {panels.map((panel, i) => (
        <div
          key={i}
          id={`${id}-panel-${i}`}
          role="tabpanel"
          aria-labelledby={`${id}-tab-${i}`}
          hidden={i !== active}
          tabIndex={0}
          className="p-4 sm:p-5 [&>*+*]:mt-4 [&>:first-child]:mt-0"
        >
          {panel}
        </div>
      ))}
    </div>
  );
}

export function TabPanel({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
