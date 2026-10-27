import { SHOW_PLACEHOLDERS } from '@/lib/placeholders';

/**
 * Marks a fact the owner has not supplied yet. Visible in development (and previews with
 * NEXT_PUBLIC_SHOW_PLACEHOLDERS=true); renders nothing in production so no placeholder
 * text is ever published.
 */
export function Placeholder({ children }: { children: React.ReactNode }) {
  if (!SHOW_PLACEHOLDERS) return null;
  return (
    <span className="inline-flex items-center gap-1.5 rounded border border-dashed border-highlight/60 bg-highlight/10 px-1.5 py-0.5 font-mono text-[0.72rem] text-highlight" data-placeholder>
      <span aria-hidden>✎</span> To be supplied: {children}
    </span>
  );
}
