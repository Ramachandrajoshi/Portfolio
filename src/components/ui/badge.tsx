import type { ComponentProps } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

export const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 font-mono text-[0.7rem] font-medium uppercase tracking-wider',
  {
    variants: {
      tone: {
        neutral: 'border-border bg-surface-2 text-muted',
        accent: 'border-accent/40 bg-accent/10 text-accent',
        secondary: 'border-secondary/40 bg-secondary/10 text-secondary',
        tertiary: 'border-tertiary/40 bg-tertiary/10 text-tertiary',
        highlight: 'border-highlight/40 bg-highlight/10 text-highlight',
        danger: 'border-danger/40 bg-danger/10 text-danger',
      },
    },
    defaultVariants: { tone: 'neutral' },
  },
);

export function Badge({ className, tone, ...props }: ComponentProps<'span'> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}
