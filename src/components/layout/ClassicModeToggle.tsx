'use client';

import { setClassicMode, useClassicMode } from '@/lib/preferences';
import { CubeIcon, ListIcon } from '@/components/ui/icons';
import { cx } from '@/lib/cx';

/**
 * "Classic portfolio" switch. When pressed, the 3D city is never initialised; the home
 * page shows the static poster and conventional navigation. Persisted per visitor.
 */
export function ClassicModeToggle({ className, showLabel = false }: { className?: string; showLabel?: boolean }) {
  const classic = useClassicMode();
  return (
    <button
      type="button"
      aria-pressed={classic}
      onClick={() => setClassicMode(!classic)}
      className={cx(
        'inline-flex h-10 items-center gap-2 rounded-md px-2.5 text-sm text-muted transition-colors hover:bg-surface-2 hover:text-fg aria-pressed:text-accent',
        className,
      )}
      title={classic ? 'Classic mode is on — the 3D city is disabled' : 'Switch to classic mode (disable the 3D city)'}
      data-testid="classic-toggle"
    >
      {classic ? <ListIcon className="size-5" /> : <CubeIcon className="size-5" />}
      <span className={showLabel ? '' : 'sr-only'}>Classic mode</span>
    </button>
  );
}
