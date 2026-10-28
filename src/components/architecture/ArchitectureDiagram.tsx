import { adrsFor, systemFor } from '@/content';
import { SystemExplorerIsland } from './SystemExplorerIsland';
import { SystemCatalogue } from './SystemCatalogue';
import type { AdrSummary, ExplorerModel } from './types';

/**
 * `<ArchitectureDiagram system="<case-study-slug>" />` — interactive React Flow explorer
 * backed by content/architecture/<slug>/system.yaml, with the server-rendered component
 * catalogue as its always-present text alternative and no-JS fallback.
 */
export function ArchitectureDiagram({ system, title }: { system: string; title?: string }) {
  const model = systemFor(system);
  if (!model)
    throw new Error(`<ArchitectureDiagram system="${system}"> — no content/architecture/${system}/system.yaml`);
  const adrs: AdrSummary[] = adrsFor(system).map((a) => ({
    id: a.id,
    title: a.title,
    href: `/architecture/${a.caseStudy}/#${a.id.toLowerCase()}`,
  }));
  const explorerModel: ExplorerModel = {
    caseStudy: model.caseStudy,
    title: title ?? model.title,
    description: model.description,
    groups: model.groups,
    nodes: model.nodes,
    edges: model.edges,
    flows: model.flows,
  };
  return (
    <section
      className="not-prose @container my-10 space-y-4"
      aria-label={`System explorer: ${explorerModel.title}`}
      data-component="architecture-diagram"
    >
      <SystemExplorerIsland model={explorerModel} adrs={adrs} />
      <SystemCatalogue model={explorerModel} adrs={adrs} />
    </section>
  );
}
