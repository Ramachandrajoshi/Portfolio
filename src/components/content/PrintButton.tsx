'use client';

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex h-10 items-center rounded-md border border-border-strong bg-surface px-4 text-sm hover:border-accent hover:text-accent"
    >
      Print / save as PDF
    </button>
  );
}
