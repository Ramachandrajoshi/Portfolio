import type { Adr } from '@/content';
import { getAdr } from '@/content';
import { cn, formatDate } from '@/lib/utils';

const statusTone: Record<Adr['status'], string> = {
  proposed: 'text-highlight border-highlight/40',
  accepted: 'text-success border-success/40',
  superseded: 'text-muted border-border-strong',
  deprecated: 'text-muted border-border-strong',
  rejected: 'text-danger border-danger/40',
};

type ADRProps = (Partial<Adr> & { id: string }) & { headingLevel?: 'h3' | 'h4'; compact?: boolean };

/**
 * Architecture Decision Record card. Use `<ADR id="MT-ADR-001" />` to render a recorded
 * decision from content/architecture/*\/adrs, or pass every field inline (articles).
 */
export function ADR({ headingLevel = 'h3', compact = false, ...props }: ADRProps) {
  const record = { ...(getAdr(props.id) ?? {}), ...props } as Adr;
  if (!record.title || !record.decision) {
    throw new Error(`ADR "${props.id}" not found and not fully specified inline.`);
  }
  const H = headingLevel;
  return (
    <article
      className="not-prose card my-8 overflow-hidden"
      aria-labelledby={`adr-${record.id}`}
      id={record.id.toLowerCase()}
      data-component="adr"
    >
      <header className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-border bg-surface-2/70 px-5 py-3">
        <span className="font-mono text-xs text-accent">{record.id}</span>
        <span
          className={cn(
            'rounded-full border px-2 py-0.5 font-mono text-[0.68rem] tracking-wider uppercase',
            statusTone[record.status ?? 'proposed'],
          )}
        >
          Status: {record.status}
        </span>
        {record.date ? <span className="text-xs text-muted">{formatDate(record.date)}</span> : null}
      </header>
      <div className="space-y-5 px-5 py-5 text-[0.95rem] leading-relaxed">
        <H id={`adr-${record.id}`} className="font-display text-lg font-semibold">
          {record.title}
        </H>
        <Section label="Context">{record.context}</Section>
        <Section label="Decision">
          <span className="font-medium text-fg">{record.decision}</span>
        </Section>
        {!compact && record.alternatives?.length ? (
          <div>
            <p className="eyebrow">Alternatives considered</p>
            <ul className="mt-2 space-y-2">
              {record.alternatives.map((alt) => (
                <li key={alt.option} className="rounded-md border border-border bg-bg/40 px-3 py-2">
                  <span className="font-semibold">{alt.option}</span> — {alt.summary}
                  <span className="mt-1 block text-sm text-muted">
                    <span className="font-medium text-fg">Not chosen because:</span> {alt.rejectedBecause}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        {record.consequences ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <List label="Positive consequences" items={record.consequences.positive} marker="+" tone="text-success" />
            <List label="Negative consequences" items={record.consequences.negative} marker="−" tone="text-danger" />
          </div>
        ) : null}
        {!compact && (record.risks?.length || record.followUps?.length) ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {record.risks?.length ? <List label="Risks" items={record.risks} marker="!" tone="text-warning" /> : null}
            {record.followUps?.length ? (
              <List label="Follow-up actions" items={record.followUps} marker="→" tone="text-accent" />
            ) : null}
          </div>
        ) : null}
      </div>
    </article>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="eyebrow">{label}</p>
      <p className="mt-1.5 text-muted">{children}</p>
    </div>
  );
}

function List({ label, items, marker, tone }: { label: string; items: string[]; marker: string; tone: string }) {
  return (
    <div>
      <p className="eyebrow">{label}</p>
      <ul className="mt-2 space-y-1.5">
        {items.map((item) => (
          <li key={item} className="flex gap-2">
            <span aria-hidden className={cn('font-mono font-bold', tone)}>
              {marker}
            </span>
            <span className="text-muted">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
