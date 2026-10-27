import { Tabs, TabPanel } from '@/components/mdx/Tabs';
import { Diagram } from '@/components/mdx/Diagram';
import type { CaseStudy } from '@/content';

const levelLabel = {
  context: 'Context (L1)',
  container: 'Container (L2)',
  component: 'Component (L3)',
  deployment: 'Deployment',
  sequence: 'Sequence',
} as const;

/** The case study's code-sourced C4 views, as keyboard-accessible tabs. */
export function C4Views({ diagrams }: { diagrams: CaseStudy['diagrams'] }) {
  if (!diagrams.length) return null;
  return (
    <Tabs labels={diagrams.map((d) => levelLabel[d.level])} title="C4 architecture views">
      {diagrams.map((d) => (
        <TabPanel key={d.src}>
          <Diagram src={d.src} title={d.title} description={d.description} className="my-0" />
        </TabPanel>
      ))}
    </Tabs>
  );
}
