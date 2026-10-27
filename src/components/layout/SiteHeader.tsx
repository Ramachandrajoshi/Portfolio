import Link from 'next/link';
import { allNav, primaryNav } from '@/data/navigation';
import { profile } from '@/data/profile';
import { NavLinks } from './NavLinks';
import { ThemeToggle } from './ThemeToggle';
import { ClassicModeToggle } from './ClassicModeToggle';
import { MobileNav } from './MobileNav';
import { SearchIcon } from '@/components/ui/icons';

export function SiteHeader() {
  return (
    <header
      data-site-header
      className="sticky top-0 z-40 border-b border-border/70 bg-bg/80 backdrop-blur-md supports-[backdrop-filter]:bg-bg/65"
    >
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Link href="/" className="group flex items-center gap-2.5 rounded-md">
          <LogoMark />
          <span className="flex flex-col leading-none">
            <span className="font-display text-[0.9rem] font-semibold tracking-tight whitespace-nowrap sm:text-[0.95rem]">
              {profile.name}
            </span>
            <span className="mt-0.5 font-mono text-[0.6rem] tracking-[0.14em] whitespace-nowrap text-muted uppercase sm:text-[0.65rem]">
              {profile.title}
            </span>
          </span>
          <span className="sr-only"> — home</span>
        </Link>
        <nav aria-label="Primary" className="hidden lg:block">
          <NavLinks items={primaryNav} />
        </nav>
        <div className="flex items-center gap-0.5">
          <Link
            href="/search/"
            className="inline-flex size-10 items-center justify-center rounded-md text-muted hover:bg-surface-2 hover:text-fg"
            aria-label="Search the site"
          >
            <SearchIcon className="size-5" />
          </Link>
          <ClassicModeToggle className="hidden sm:inline-flex" />
          <ThemeToggle />
          <MobileNav items={allNav} />
        </div>
      </div>
    </header>
  );
}

function LogoMark() {
  return (
    <svg viewBox="0 0 32 32" className="size-8 shrink-0" aria-hidden>
      <rect
        x="1"
        y="1"
        width="30"
        height="30"
        rx="8"
        fill="var(--color-surface-2)"
        stroke="var(--color-border-strong)"
      />
      <path
        d="M8 23V13l4-3v13M14 23V8l4 2v13M20 23v-8l4-2v10"
        fill="none"
        stroke="var(--color-accent)"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="M6 23h20" stroke="var(--color-tertiary)" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
