'use client';

import { useState } from 'react';

export function CopyLinkButton({ url }: { url: string }) {
  const [state, setState] = useState<'idle' | 'copied' | 'failed'>('idle');
  return (
    <>
      <button
        type="button"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(url);
            setState('copied');
          } catch {
            setState('failed');
          }
          window.setTimeout(() => setState('idle'), 2500);
        }}
        className="rounded-md border border-border px-2.5 py-1 text-sm text-muted hover:border-accent hover:text-accent"
      >
        {state === 'copied' ? 'Link copied' : state === 'failed' ? 'Copy failed' : 'Copy link'}
      </button>
      <span className="sr-only" aria-live="polite">
        {state === 'copied' ? 'Link copied to clipboard' : state === 'failed' ? 'Could not copy the link' : ''}
      </span>
    </>
  );
}
