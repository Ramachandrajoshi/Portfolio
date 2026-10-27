import { Badge } from '@/components/ui/badge';

const labels = {
  'production-derived': { text: 'Production-derived', tone: 'accent', help: 'Based on real work; sanitised and approved for publication.' },
  sanitized: { text: 'Sanitised', tone: 'secondary', help: 'Real problem shape with all identifying details removed.' },
  illustrative: { text: 'Illustrative', tone: 'tertiary', help: 'A reference design written for this portfolio, not a description of a specific production system.' },
  experimental: { text: 'Experimental', tone: 'highlight', help: 'Personal lab work; results are from experiments, not production.' },
  placeholder: { text: 'Placeholder', tone: 'danger', help: 'Template awaiting verified details. Not shown in production.' },
} as const;

export type ProvenanceValue = keyof typeof labels;

export function ProvenanceBadge({ value, withHelp = false }: { value: ProvenanceValue; withHelp?: boolean }) {
  const l = labels[value];
  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <Badge tone={l.tone} title={l.help}>
        {l.text}
      </Badge>
      {withHelp ? <span className="text-sm text-muted">{l.help}</span> : null}
    </span>
  );
}
