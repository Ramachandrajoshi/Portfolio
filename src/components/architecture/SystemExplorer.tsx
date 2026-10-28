'use client';

import '@xyflow/react/dist/base.css';
import {
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
  Handle,
  Position,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  type Edge,
  type EdgeProps,
  type Node,
  type NodeProps,
} from '@xyflow/react';
import Link from 'next/link';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { cx } from '@/lib/cx';
import {
  kindMeta,
  modeLabel,
  type AdrSummary,
  type ExplorerEdge,
  type ExplorerModel,
  type ExplorerNode,
} from './types';

type NodeData = { node: ExplorerNode; state: 'idle' | 'selected' | 'related' | 'dimmed' };
type EdgeData = {
  edge: ExplorerEdge;
  state: 'idle' | 'active' | 'related' | 'dimmed';
  animate: boolean;
  packet: boolean;
};
type SystemNode = Node<NodeData, 'system'>;
type SystemEdge = Edge<EdgeData, 'flow'>;

const NODE_WIDTH = 188;

const SystemNodeView = memo(function SystemNodeView({ data }: NodeProps<SystemNode>) {
  const meta = kindMeta[data.node.kind];
  return (
    <div
      className={cx(
        'rounded-lg border bg-surface px-3 py-2.5 text-left shadow-sm transition-[opacity,border-color,box-shadow] duration-200',
        data.state === 'selected' && 'border-accent shadow-glow',
        data.state === 'related' && 'border-accent/60',
        data.state === 'idle' && 'border-border-strong',
        data.state === 'dimmed' && 'border-border opacity-35',
      )}
      style={{ width: NODE_WIDTH }}
    >
      <Handle type="target" position={Position.Left} className="!size-1.5 !border-0 !bg-border-strong" />
      <div className="flex items-start gap-2">
        <span aria-hidden className="mt-0.5 text-base leading-none" style={{ color: meta.color }}>
          {meta.glyph}
        </span>
        <span className="min-w-0">
          <span className="block text-[0.8rem] leading-tight font-semibold text-fg">{data.node.label}</span>
          <span className="mt-0.5 block truncate font-mono text-[0.62rem] text-muted">{data.node.technology}</span>
        </span>
      </div>
      <Handle type="source" position={Position.Right} className="!size-1.5 !border-0 !bg-border-strong" />
    </div>
  );
});

function FlowEdgeView({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  markerEnd,
}: EdgeProps<SystemEdge>) {
  const [path, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    borderRadius: 14,
  });
  const state = data?.state ?? 'idle';
  const color =
    state === 'active'
      ? 'var(--color-highlight)'
      : state === 'related'
        ? 'var(--color-accent)'
        : 'var(--color-border-strong)';
  const dashed = data?.edge.mode !== 'sync';
  return (
    <>
      <BaseEdge
        id={id}
        path={path}
        markerEnd={markerEnd}
        style={{
          stroke: color,
          strokeWidth: state === 'active' ? 2.6 : state === 'related' ? 2 : 1.4,
          strokeDasharray: dashed ? '6 5' : undefined,
          opacity: state === 'dimmed' ? 0.25 : 1,
          animation: dashed && data?.animate ? 'rf-dash 1.1s linear infinite' : undefined,
        }}
      />
      {data?.packet ? (
        <circle r={5} fill="var(--color-highlight)" style={{ filter: 'drop-shadow(0 0 6px var(--color-highlight))' }}>
          <animateMotion dur="1.2s" repeatCount="indefinite" path={path} />
        </circle>
      ) : null}
      {state === 'active' || state === 'related' ? (
        <EdgeLabelRenderer>
          <div
            className="nodrag nopan pointer-events-none absolute rounded border border-border bg-bg-elevated/95 px-1.5 py-0.5 font-mono text-[0.6rem] text-fg shadow-sm"
            style={{ transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)` }}
          >
            {data?.edge.label}
          </div>
        </EdgeLabelRenderer>
      ) : null}
    </>
  );
}

const nodeTypes = { system: SystemNodeView };
const edgeTypes = { flow: FlowEdgeView };

export interface SystemExplorerProps {
  model: ExplorerModel;
  adrs: AdrSummary[];
  reducedMotion: boolean;
}

export default function SystemExplorer(props: SystemExplorerProps) {
  return (
    <ReactFlowProvider>
      <Explorer {...props} />
    </ReactFlowProvider>
  );
}

function Explorer({ model, adrs, reducedMotion }: SystemExplorerProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [flowId, setFlowId] = useState<string>(model.flows[0]?.id ?? '');
  const [step, setStep] = useState<number | null>(null);
  const [playing, setPlaying] = useState(false);
  const { fitView, zoomIn, zoomOut } = useReactFlow();
  const containerRef = useRef<HTMLDivElement>(null);

  const flow = model.flows.find((f) => f.id === flowId);
  const activeEdgeId = flow && step !== null ? flow.steps[step]?.edge : undefined;
  const flowEdgeIds = useMemo(
    () => new Set(step !== null && flow ? flow.steps.slice(0, step + 1).map((s) => s.edge) : []),
    [flow, step],
  );

  // Playback: advance one step every 2.2 s; reduced motion keeps manual stepping only.
  useEffect(() => {
    if (!playing || !flow) return;
    const timer = window.setTimeout(
      () => {
        setStep((s) => {
          const next = (s ?? -1) + 1;
          if (next >= flow.steps.length) {
            setPlaying(false);
            return s;
          }
          return next;
        });
      },
      step === null ? 50 : 2200,
    );
    return () => window.clearTimeout(timer);
  }, [playing, step, flow]);

  const neighbours = useMemo(() => {
    if (!selected) return null;
    const ids = new Set<string>([selected]);
    for (const e of model.edges) {
      if (e.source === selected) ids.add(e.target);
      if (e.target === selected) ids.add(e.source);
    }
    return ids;
  }, [selected, model.edges]);

  const activeEdge = model.edges.find((e) => e.id === activeEdgeId);

  const nodes: SystemNode[] = useMemo(
    () =>
      model.nodes.map((node) => {
        let state: NodeData['state'] = 'idle';
        if (activeEdge) state = node.id === activeEdge.source || node.id === activeEdge.target ? 'selected' : 'dimmed';
        else if (selected) state = node.id === selected ? 'selected' : neighbours?.has(node.id) ? 'related' : 'dimmed';
        return {
          id: node.id,
          type: 'system',
          position: node.position,
          data: { node, state },
          ariaLabel: `${node.label}, ${kindMeta[node.kind].label}. ${node.technology}. Press Enter for details.`,
        };
      }),
    [model.nodes, selected, neighbours, activeEdge],
  );

  const edges: SystemEdge[] = useMemo(
    () =>
      model.edges.map((edge) => {
        let state: EdgeData['state'] = 'idle';
        if (step !== null)
          state = edge.id === activeEdgeId ? 'active' : flowEdgeIds.has(edge.id) ? 'related' : 'dimmed';
        else if (selected) state = edge.source === selected || edge.target === selected ? 'related' : 'dimmed';
        return {
          id: edge.id,
          source: edge.source,
          target: edge.target,
          type: 'flow',
          data: {
            edge,
            state,
            animate: !reducedMotion && state !== 'dimmed',
            packet: !reducedMotion && edge.id === activeEdgeId,
          },
          ariaLabel: `${edge.label}: ${edge.protocol}, ${modeLabel[edge.mode]}`,
        };
      }),
    [model.edges, selected, step, activeEdgeId, flowEdgeIds, reducedMotion],
  );

  const reset = useCallback(() => {
    setSelected(null);
    setStep(null);
    setPlaying(false);
    void fitView({ padding: 0.15, duration: reducedMotion ? 0 : 400 });
  }, [fitView, reducedMotion]);

  const selectedNode = model.nodes.find((n) => n.id === selected);

  return (
    <div className="grid gap-4 @5xl:grid-cols-[minmax(0,1fr)_20rem]" data-testid="system-explorer">
      <div className="min-w-0 space-y-3">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2" role="toolbar" aria-label="Diagram controls">
          <ToolButton onClick={() => void zoomIn({ duration: reducedMotion ? 0 : 200 })} label="Zoom in">
            ＋
          </ToolButton>
          <ToolButton onClick={() => void zoomOut({ duration: reducedMotion ? 0 : 200 })} label="Zoom out">
            －
          </ToolButton>
          <ToolButton
            onClick={() => void fitView({ padding: 0.15, duration: reducedMotion ? 0 : 400 })}
            label="Fit to view"
          >
            ⤢ Fit
          </ToolButton>
          <ToolButton onClick={reset} label="Reset selection and view">
            ↺ Reset
          </ToolButton>
          {model.flows.length ? (
            <span className="ml-auto flex flex-wrap items-center gap-2">
              <label className="sr-only" htmlFor={`flow-${model.caseStudy}`}>
                Scenario
              </label>
              <select
                id={`flow-${model.caseStudy}`}
                value={flowId}
                onChange={(e) => {
                  setFlowId(e.target.value);
                  setStep(null);
                  setPlaying(false);
                }}
                className="h-8 max-w-[14rem] rounded-md border border-border-strong bg-surface px-2 text-xs"
              >
                {model.flows.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.title}
                  </option>
                ))}
              </select>
              <ToolButton
                onClick={() => setStep((s) => (s === null || s === 0 ? null : s - 1))}
                label="Previous step"
                disabled={step === null}
              >
                ◀
              </ToolButton>
              <ToolButton
                onClick={() => {
                  if (step !== null && flow && step >= flow.steps.length - 1) setStep(0);
                  setSelected(null);
                  setPlaying((p) => !p);
                }}
                label={playing ? 'Pause flow' : 'Play flow'}
                pressed={playing}
              >
                {playing ? '❚❚ Pause' : '▶ Play flow'}
              </ToolButton>
              <ToolButton
                onClick={() => {
                  setPlaying(false);
                  setSelected(null);
                  setStep((s) => Math.min((s ?? -1) + 1, (flow?.steps.length ?? 1) - 1));
                }}
                label="Next step"
                disabled={!!flow && step === flow.steps.length - 1}
              >
                ▶▏
              </ToolButton>
            </span>
          ) : null}
        </div>

        <div
          ref={containerRef}
          onKeyDown={(event) => {
            // Keyboard selection: Enter/Space on a focused node opens its details.
            if (event.key !== 'Enter' && event.key !== ' ') return;
            const el = (event.target as HTMLElement).closest<HTMLElement>('.react-flow__node');
            const id = el?.dataset.id;
            if (!id) return;
            event.preventDefault();
            setStep(null);
            setPlaying(false);
            setSelected((current) => (current === id ? null : id));
          }}
          className="relative h-[26rem] overflow-hidden rounded-lg border border-border bg-bg sm:h-[34rem]"
          style={{
            backgroundImage: 'radial-gradient(var(--color-grid) 1px, transparent 1px)',
            backgroundSize: '20px 20px',
          }}
        >
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            fitView
            fitViewOptions={{ padding: 0.15 }}
            minZoom={0.3}
            maxZoom={2}
            nodesDraggable={false}
            nodesConnectable={false}
            elementsSelectable
            nodesFocusable
            edgesFocusable={false}
            zoomOnScroll={false}
            preventScrolling={false}
            panOnScroll={false}
            onNodeClick={(_, node) => {
              setStep(null);
              setPlaying(false);
              setSelected((current) => (current === node.id ? null : node.id));
            }}
            onPaneClick={() => setSelected(null)}
            proOptions={{ hideAttribution: true }}
            aria-label={`Interactive diagram: ${model.title}`}
          />
          {flow && step !== null ? (
            <div className="pointer-events-none absolute inset-x-3 bottom-3 rounded-md border border-highlight/50 bg-bg-elevated/95 px-3 py-2 text-sm shadow-md">
              <span className="font-mono text-xs text-highlight">
                Step {step + 1}/{flow.steps.length}
              </span>{' '}
              {flow.steps[step]?.note}
            </div>
          ) : null}
        </div>
        {/* Announce flow progress to assistive technology. */}
        <p className="sr-only" aria-live="polite">
          {flow && step !== null ? `Step ${step + 1} of ${flow.steps.length}: ${flow.steps[step]?.note}` : ''}
        </p>
        <p className="text-xs text-muted">
          Tip: use <kbd className="font-mono">Tab</kbd> to move between components and{' '}
          <kbd className="font-mono">Enter</kbd> to inspect one, or pick from the component list. Dashed lines are
          asynchronous; the amber pulse shows causality during playback.
        </p>
      </div>

      <aside className="min-w-0 space-y-3" aria-label="Component details">
        <label htmlFor={`component-${model.caseStudy}`} className="eyebrow block">
          Component
        </label>
        <select
          id={`component-${model.caseStudy}`}
          value={selected ?? ''}
          onChange={(e) => {
            setStep(null);
            setPlaying(false);
            setSelected(e.target.value || null);
          }}
          className="h-10 w-full rounded-md border border-border-strong bg-surface px-2 text-sm"
          data-testid="component-select"
        >
          <option value="">Select a component…</option>
          {model.nodes.map((n) => (
            <option key={n.id} value={n.id}>
              {n.label}
            </option>
          ))}
        </select>
        <div
          className="max-h-[34rem] overflow-y-auto rounded-lg border border-border bg-surface p-4 @5xl:max-h-[34rem]"
          aria-live="polite"
        >
          {selectedNode ? (
            <NodeDetails node={selectedNode} adrs={adrs} model={model} />
          ) : (
            <div className="text-sm text-muted">
              <p className="font-medium text-fg">{model.title}</p>
              <p className="mt-2">{model.description}</p>
              <p className="mt-3">
                Select a component to see its responsibility, technology choice, interfaces, failure modes and the
                decisions behind it.
              </p>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}

function NodeDetails({ node, adrs, model }: { node: ExplorerNode; adrs: AdrSummary[]; model: ExplorerModel }) {
  const meta = kindMeta[node.kind];
  const deps = model.edges
    .filter((e) => e.source === node.id)
    .map((e) => model.nodes.find((n) => n.id === e.target)?.label);
  const dependents = model.edges
    .filter((e) => e.target === node.id)
    .map((e) => model.nodes.find((n) => n.id === e.source)?.label);
  return (
    <div className="space-y-4 text-sm" data-testid="node-details">
      <div>
        <p className="font-mono text-[0.68rem] tracking-wider uppercase" style={{ color: meta.color }}>
          {meta.glyph} {meta.label}
        </p>
        <h4 className="mt-1 font-display text-lg font-semibold">{node.label}</h4>
        <p className="font-mono text-xs text-muted">{node.technology}</p>
      </div>
      <Detail term="Responsibility">{node.responsibility}</Detail>
      <Detail term="Why this design">{node.rationale}</Detail>
      <Detail term="Interfaces">
        <ul className="list-disc space-y-0.5 pl-4">
          {node.interfaces.map((i) => (
            <li key={i}>{i}</li>
          ))}
        </ul>
      </Detail>
      {deps.length || dependents.length ? (
        <Detail term="Dependencies">
          {deps.length ? <p>Calls: {deps.join(', ')}</p> : null}
          {dependents.length ? <p>Called by: {dependents.join(', ')}</p> : null}
        </Detail>
      ) : null}
      <Detail term="Failure modes">
        <ul className="space-y-2">
          {node.failureModes.map((f) => (
            <li key={f.mode}>
              <span className="font-medium text-fg">{f.mode}</span> — {f.effect}
              <span className="block text-xs">↳ {f.mitigation}</span>
            </li>
          ))}
        </ul>
      </Detail>
      <Detail term="Security">
        <ul className="list-disc space-y-0.5 pl-4">
          {node.security.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
      </Detail>
      {node.adrs.length ? (
        <Detail term="Relevant ADRs">
          <ul className="space-y-1">
            {node.adrs.map((id) => {
              const a = adrs.find((x) => x.id === id);
              return (
                <li key={id}>
                  {a ? (
                    <Link href={a.href} className="link">
                      {id}: {a.title}
                    </Link>
                  ) : (
                    id
                  )}
                </li>
              );
            })}
          </ul>
        </Detail>
      ) : null}
    </div>
  );
}

function Detail({ term, children }: { term: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="font-mono text-[0.68rem] tracking-wider text-accent uppercase">{term}</p>
      <div className="mt-1 text-muted">{children}</div>
    </div>
  );
}

function ToolButton({
  onClick,
  label,
  children,
  disabled,
  pressed,
}: {
  onClick: () => void;
  label: string;
  children: React.ReactNode;
  disabled?: boolean;
  pressed?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      disabled={disabled}
      aria-pressed={pressed}
      className="inline-flex h-8 min-w-8 items-center justify-center gap-1 rounded-md border border-border-strong bg-surface px-2 text-xs text-fg hover:border-accent hover:text-accent disabled:opacity-40 aria-pressed:border-highlight aria-pressed:text-highlight"
    >
      {children}
    </button>
  );
}
