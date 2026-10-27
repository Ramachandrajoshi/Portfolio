/**
 * The MDX component library available in every article, case study and project.
 * Documented with examples in content/articles/mdx-component-reference.mdx.
 */
import Link from 'next/link';
import type { ComponentProps } from 'react';
import { ADR } from '@/components/architecture/ADRCard';
import { ArchitectureDiagram } from '@/components/architecture/ArchitectureDiagram';
import { Tradeoffs } from '@/components/architecture/Tradeoffs';
import { Callout } from './Callout';
import { D2, Diagram, Mermaid } from './Diagram';
import { Sandpack } from './Sandpack';
import { TabPanel, Tabs } from './Tabs';
import { Timeline } from './Timeline';
import { isExternal } from '@/lib/urls';

function Anchor({ href = '', children, ...props }: ComponentProps<'a'>) {
  if (href.startsWith('/')) return <Link href={href} {...props}>{children}</Link>;
  if (isExternal(href))
    return (
      <a href={href} rel="noopener noreferrer" target="_blank" {...props}>
        {children}
        <span className="sr-only"> (opens in a new tab)</span>
      </a>
    );
  return <a href={href} {...props}>{children}</a>;
}

function Table(props: ComponentProps<'table'>) {
  return (
    <div className="my-6 overflow-x-auto" tabIndex={0} role="region" aria-label="Scrollable table">
      <table {...props} />
    </div>
  );
}

export const mdxComponents = {
  a: Anchor,
  table: Table,
  ADR,
  ArchitectureDiagram,
  Callout,
  D2,
  Diagram,
  Mermaid,
  Sandpack,
  Tabs,
  TabPanel,
  Timeline,
  Tradeoffs,
};
