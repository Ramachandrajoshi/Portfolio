'use client';

import { lazy, Suspense, useRef, useState } from 'react';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { useInViewOnce } from '@/lib/use-in-view';
import { usePrefersReducedMotion } from '@/lib/preferences';
import type { AdrSummary, ExplorerModel } from './types';

// React Flow (+ its CSS) is fetched only when the explorer approaches the viewport.
const SystemExplorer = lazy(() => import('./SystemExplorer'));

export function SystemExplorerIsland({ model, adrs }: { model: ExplorerModel; adrs: AdrSummary[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInViewOnce(ref, '400px');
  const reducedMotion = usePrefersReducedMotion();
  const [failed, setFailed] = useState(false);

  const fallback = (
    <div role="status" className="rounded-lg border border-border bg-surface p-6 text-sm text-muted">
      {failed
        ? 'The interactive explorer could not be loaded in this browser. Every component and connection is described in the catalogue below.'
        : 'Loading the interactive system explorer…'}
    </div>
  );

  return (
    <div ref={ref} className="min-h-[26rem] sm:min-h-[34rem]" data-explorer-state={failed ? 'failed' : inView ? 'loading' : 'idle'}>
      {inView ? (
        <ErrorBoundary fallback={fallback} onError={() => setFailed(true)}>
          <Suspense fallback={fallback}>
            <SystemExplorer model={model} adrs={adrs} reducedMotion={reducedMotion} />
          </Suspense>
        </ErrorBoundary>
      ) : (
        fallback
      )}
    </div>
  );
}
