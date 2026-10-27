import Link from 'next/link';
import { profile } from '@/data/profile';
import { ArrowRightIcon } from '@/components/ui/icons';
import { HeroPoster } from './HeroPoster';
import { HeroStage } from './HeroStage';

const actions = [
  { href: '/architecture/', label: 'Architecture', primary: true },
  { href: '/projects/', label: 'Projects' },
  { href: '/articles/', label: 'Articles' },
  { href: '/resume/', label: 'Résumé' },
  { href: '/contact/', label: 'Contact' },
];

/** Home hero: all text and actions are server-rendered HTML; the city is an enhancement. */
export function Hero() {
  return (
    <HeroStage poster={<HeroPoster />}>
      <p className="eyebrow">Ram&apos;s Digital Metropolis</p>
      <h1 className="mt-4 font-display text-[length:var(--text-5xl)] leading-[1.02] font-semibold">{profile.name}</h1>
      <p className="mt-3 font-display text-2xl text-accent">{profile.title}</p>
      <p className="mt-5 text-lg leading-relaxed text-muted">{profile.positioning}</p>
      <p className="mt-6 text-sm text-muted">
        Explore the city — every district is a part of my work — or go straight to:
      </p>
      <nav aria-label="Primary actions" className="mt-3">
        <ul className="flex flex-wrap gap-2">
          {actions.map((a) => (
            <li key={a.href}>
              <Link
                href={a.href}
                className={
                  a.primary
                    ? 'inline-flex h-10 items-center gap-2 rounded-md bg-accent px-4 text-sm font-medium text-accent-contrast shadow-sm hover:bg-accent-strong hover:shadow-glow'
                    : 'inline-flex h-10 items-center rounded-md border border-border-strong bg-surface/70 px-4 text-sm backdrop-blur hover:border-accent hover:text-accent'
                }
              >
                {a.label}
                {a.primary ? <ArrowRightIcon className="size-4" /> : null}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </HeroStage>
  );
}
