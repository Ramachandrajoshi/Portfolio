import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';
import { Breadcrumbs, type Crumb } from './Breadcrumbs';

export function PageHeader({
  eyebrow,
  title,
  lead,
  crumbs,
  children,
}: {
  eyebrow?: string;
  title: string;
  lead?: ReactNode;
  crumbs: Crumb[];
  children?: ReactNode;
}) {
  return (
    <div className="relative overflow-hidden border-b border-border">
      <div
        className="grid-backdrop pointer-events-none absolute inset-0 [mask-image:linear-gradient(to_bottom,black,transparent)]"
        aria-hidden
      />
      <div className="container-page relative py-10 sm:py-14">
        <Breadcrumbs items={crumbs} />
        {eyebrow ? <p className="eyebrow mt-8">{eyebrow}</p> : null}
        <h1
          className={cn(
            'mt-3 max-w-4xl font-display font-semibold',
            title.length > 48 ? 'text-[length:var(--text-4xl)]' : 'text-[length:var(--text-5xl)]',
          )}
        >
          {title}
        </h1>
        {lead ? <div className="mt-5 max-w-3xl text-lg text-muted">{lead}</div> : null}
        {children}
      </div>
    </div>
  );
}
