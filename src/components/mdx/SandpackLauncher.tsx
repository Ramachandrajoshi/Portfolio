'use client';

import { lazy, Suspense, useState, type ReactNode } from 'react';
import { useResolvedTheme } from '@/lib/preferences';

export type SandpackTemplateName = 'vanilla-ts' | 'vanilla' | 'react-ts' | 'node';

// Sandpack is only fetched after an explicit request — it never touches the initial bundle.
const SandpackRuntime = lazy(() => import('./SandpackRuntime'));

export function SandpackLauncher({
  children,
  template,
  files,
  activeFile,
  title,
}: {
  children: ReactNode;
  template: SandpackTemplateName;
  files: Record<string, string>;
  activeFile: string;
  title: string;
}) {
  const [running, setRunning] = useState(false);
  const theme = useResolvedTheme();
  if (!running) {
    return (
      <div>
        {children}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3">
          <p className="text-xs text-muted">
            Runs in an isolated, cross-origin sandbox provided by CodeSandbox. Nothing executes until you ask.
          </p>
          <button
            type="button"
            onClick={() => setRunning(true)}
            className="inline-flex h-9 items-center gap-2 rounded-md bg-accent px-3.5 text-sm font-medium text-accent-contrast hover:bg-accent-strong"
            aria-label={`Run interactive example: ${title}`}
          >
            ▶ Run interactive example
          </button>
        </div>
      </div>
    );
  }
  return (
    <Suspense
      fallback={
        <div role="status" className="px-4 py-10 text-center text-sm text-muted">
          Loading the interactive sandbox…
        </div>
      }
    >
      <SandpackRuntime template={template} files={files} activeFile={activeFile} theme={theme} />
    </Suspense>
  );
}
