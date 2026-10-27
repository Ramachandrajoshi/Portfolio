import Link from 'next/link';
import { PageHeader } from '@/components/layout/PageHeader';
import { ProvenanceBadge } from '@/components/architecture/ProvenanceBadge';
import { Badge } from '@/components/ui/badge';
import { ArrowRightIcon } from '@/components/ui/icons';
import { adrsFor, allCaseStudies } from '@/content';
import { pageMetadata } from '@/lib/metadata';

export const metadata = pageMetadata({
  title: 'Architecture case studies',
  description:
    'Sanitised and illustrative architecture case studies: context, constraints, decisions, alternatives, trade-offs, failure modes and validation — with ADRs and interactive system explorers.',
  path: '/architecture/',
  image: '/og/architecture.png',
});

const statusLabel = { complete: 'Complete', 'in-progress': 'In progress', template: 'Template' } as const;

export default function ArchitectureIndexPage() {
  return (
    <>
      <PageHeader
        crumbs={[{ name: 'Architecture', path: '/architecture/' }]}
        eyebrow="Architecture district"
        title="How I design systems"
        lead={
          <p>
            Each case study starts from context and constraints, makes its quality attributes measurable, records
            decisions as ADRs, and is honest about what it gives up. Numbers are labelled as requirements, targets or
            design assumptions — never presented as results without evidence.
          </p>
        }
      />
      <div className="container-page py-12">
        <ol className="grid gap-6 md:grid-cols-2">
          {allCaseStudies.map((cs, i) => (
            <li key={cs.slug} className="card card-interactive relative flex flex-col p-6">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs text-subtle">Case {String.fromCharCode(65 + i)}</span>
                <ProvenanceBadge value={cs.provenance} />
                {cs.status !== 'complete' ? <Badge tone="highlight">{statusLabel[cs.status]}</Badge> : null}
              </div>
              <h2 className="mt-4 font-display text-2xl font-semibold">
                <Link href={cs.url} className="after:absolute after:inset-0 after:rounded-[inherit]">
                  {cs.title}
                </Link>
              </h2>
              <p className="mt-1 text-sm text-accent">{cs.domain}</p>
              <p className="mt-3 text-muted">{cs.summary}</p>
              <p className="mt-4 border-l-2 border-tertiary pl-3 text-sm text-muted italic">{cs.problem}</p>
              <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-6 text-sm text-muted">
                <span>
                  {adrsFor(cs.slug).length} ADRs · {cs.qualityAttributes.length} quality scenarios ·{' '}
                  {cs.metadata.readingTime} min read
                </span>
                <span className="inline-flex items-center gap-1 text-accent">
                  Read case study <ArrowRightIcon />
                </span>
              </div>
            </li>
          ))}
        </ol>
        <section
          className="mt-16 grid gap-8 rounded-xl border border-border bg-surface-2/50 p-6 md:grid-cols-3 md:p-8"
          aria-labelledby="method"
        >
          <h2 id="method" className="font-display text-xl font-semibold md:col-span-3">
            The structure every case study follows
          </h2>
          {[
            [
              'Understand',
              'Context and business problem · requirements and constraints · functional and non-functional requirements · measurable quality attributes.',
            ],
            [
              'Decide',
              'System boundaries · C4 context/container/component views · design decisions as ADRs · alternatives · explicit trade-offs.',
            ],
            [
              'Prove',
              'Security and trust boundaries · failure modes and recovery · capacity reasoning · observability · test and validation strategy · lessons.',
            ],
          ].map(([title, body]) => (
            <div key={title}>
              <p className="eyebrow">{title}</p>
              <p className="mt-2 text-sm text-muted">{body}</p>
            </div>
          ))}
        </section>
      </div>
    </>
  );
}
