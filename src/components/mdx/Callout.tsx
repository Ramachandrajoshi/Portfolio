import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

const variants = {
  info: { label: 'Note', border: 'border-info', text: 'text-info', icon: 'i' },
  warning: { label: 'Warning', border: 'border-warning', text: 'text-warning', icon: '!' },
  important: { label: 'Important', border: 'border-tertiary', text: 'text-tertiary', icon: '★' },
  assumption: { label: 'Design assumption', border: 'border-highlight', text: 'text-highlight', icon: '≈' },
} as const;

export type CalloutType = keyof typeof variants;

/**
 * Semantic callout. Rendered as an <aside> with a visible text label so the meaning never
 * depends on colour alone. `assumption` marks numbers that are design inputs, not results.
 */
export function Callout({
  type = 'info',
  title,
  children,
}: {
  type?: CalloutType;
  title?: string;
  children: ReactNode;
}) {
  const v = variants[type];
  return (
    <aside
      className={cn('not-prose my-6 rounded-md border border-l-4 border-border bg-surface-2/60 px-4 py-3', v.border)}
      aria-label={title ?? v.label}
      data-callout={type}
    >
      <p className={cn('flex items-center gap-2 font-mono text-xs font-semibold tracking-wider uppercase', v.text)}>
        <span
          aria-hidden
          className="inline-flex size-5 items-center justify-center rounded-full border border-current text-[0.7rem]"
        >
          {v.icon}
        </span>
        {title ?? v.label}
      </p>
      <div className="mt-2 text-[0.97rem] leading-relaxed text-fg [&_a]:text-accent [&_a]:underline [&_code]:font-mono [&_code]:text-[0.88em] [&>*+*]:mt-2">
        {children}
      </div>
    </aside>
  );
}
