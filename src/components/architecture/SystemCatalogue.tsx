import Link from 'next/link';
import { kindMeta, modeLabel, type AdrSummary, type ExplorerModel } from './types';

/**
 * Server-rendered text alternative to the interactive explorer: every fact the graph shows
 * is available here as structured HTML. Serves no-JS visitors, screen-reader users, mobile
 * readers who prefer a list, search indexing, and the failure path if React Flow cannot load.
 */
export function SystemCatalogue({
  model,
  adrs,
  open = false,
}: {
  model: ExplorerModel;
  adrs: AdrSummary[];
  open?: boolean;
}) {
  const nodeLabel = (id: string) => model.nodes.find((n) => n.id === id)?.label ?? id;
  const adr = (id: string) => adrs.find((a) => a.id === id);
  return (
    <details className="group rounded-lg border border-border bg-surface" open={open} data-testid="system-catalogue">
      <summary className="cursor-pointer list-none px-4 py-3 font-medium marker:hidden hover:text-accent">
        <span aria-hidden className="mr-2 inline-block transition-transform group-open:rotate-90">
          ▸
        </span>
        Component catalogue — text description of all {model.nodes.length} components and {model.edges.length}{' '}
        connections
      </summary>
      <div className="space-y-8 border-t border-border px-4 py-5">
        <ul className="grid gap-4 md:grid-cols-2">
          {model.nodes.map((node) => (
            <li
              key={node.id}
              className="rounded-md border border-border bg-bg/40 p-4 text-sm"
              id={`component-${model.caseStudy}-${node.id}`}
            >
              <h4 className="font-display text-base font-semibold">
                {node.label}{' '}
                <span className="font-mono text-xs font-normal text-muted">({kindMeta[node.kind].label})</span>
              </h4>
              <dl className="mt-2 space-y-2">
                <Row term="Technology">{node.technology}</Row>
                <Row term="Responsibility">{node.responsibility}</Row>
                <Row term="Why">{node.rationale}</Row>
                <Row term="Interfaces">{node.interfaces.join('; ')}</Row>
                <Row term="Failure modes">
                  <ul className="list-disc space-y-1 pl-4">
                    {node.failureModes.map((f) => (
                      <li key={f.mode}>
                        <strong className="font-medium text-fg">{f.mode}:</strong> {f.effect} <em>Mitigation:</em>{' '}
                        {f.mitigation}
                      </li>
                    ))}
                  </ul>
                </Row>
                <Row term="Security">{node.security.join('; ')}</Row>
                {node.adrs.length ? (
                  <Row term="Decisions">
                    {node.adrs.map((id, i) => {
                      const a = adr(id);
                      return (
                        <span key={id}>
                          {i > 0 ? ', ' : ''}
                          {a ? (
                            <Link className="link" href={a.href}>
                              {id}: {a.title}
                            </Link>
                          ) : (
                            id
                          )}
                        </span>
                      );
                    })}
                  </Row>
                ) : null}
              </dl>
            </li>
          ))}
        </ul>
        <div>
          <h4 className="font-display text-base font-semibold">Connections</h4>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted">
            {model.edges.map((e) => (
              <li key={e.id}>
                <span className="text-fg">{nodeLabel(e.source)}</span> →{' '}
                <span className="text-fg">{nodeLabel(e.target)}</span>: {e.label} ({e.protocol}, {modeLabel[e.mode]})
              </li>
            ))}
          </ul>
        </div>
        {model.flows.map((flow) => (
          <div key={flow.id}>
            <h4 className="font-display text-base font-semibold">Flow: {flow.title}</h4>
            <p className="mt-1 text-sm text-muted">{flow.description}</p>
            <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-muted">
              {flow.steps.map((step, i) => {
                const edge = model.edges.find((e) => e.id === step.edge)!;
                return (
                  <li key={i}>
                    <span className="text-fg">
                      {nodeLabel(edge.source)} → {nodeLabel(edge.target)}
                    </span>
                    : {step.note}
                  </li>
                );
              })}
            </ol>
          </div>
        ))}
      </div>
    </details>
  );
}

function Row({ term, children }: { term: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="font-mono text-[0.7rem] tracking-wider text-accent uppercase">{term}</dt>
      <dd className="mt-0.5 text-muted">{children}</dd>
    </div>
  );
}
