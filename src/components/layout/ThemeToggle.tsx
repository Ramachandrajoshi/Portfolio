'use client';

import { setTheme, useResolvedTheme } from '@/lib/preferences';
import { MoonIcon, SunIcon } from '@/components/ui/icons';
import { cx } from '@/lib/cx';

export function ThemeToggle({ className }: { className?: string }) {
  const theme = useResolvedTheme();
  const next = theme === 'dark' ? 'light' : 'dark';
  return (
    <button
      type="button"
      onClick={() => setTheme(next)}
      className={cx(
        'inline-flex size-10 items-center justify-center rounded-md text-muted transition-colors hover:bg-surface-2 hover:text-fg',
        className,
      )}
      aria-label={`Switch to ${next} theme`}
      title={`Switch to ${next} theme`}
      data-testid="theme-toggle"
    >
      {/* Both icons are rendered server-side; CSS shows the right one before hydration. */}
      <SunIcon className="hidden size-5 [[data-theme=dark]_&]:block" />
      <MoonIcon className="block size-5 [[data-theme=dark]_&]:hidden" />
    </button>
  );
}
