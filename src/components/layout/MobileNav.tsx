'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';
import type { NavItem } from '@/data/navigation';
import { CloseIcon, MenuIcon } from '@/components/ui/icons';
import { ThemeToggle } from './ThemeToggle';
import { ClassicModeToggle } from './ClassicModeToggle';
import { isActive } from './NavLinks';
import { enter } from '@/lib/motion';

/**
 * Slide-over menu built on the native modal <dialog>: the browser provides the top layer,
 * inert background, focus containment, Escape-to-close and focus restoration — roughly
 * 26 KB (gzip) less than a JS dialog primitive on every page. See ARCHITECTURE.md (ADR-009).
 */
export function MobileNav({ items }: { items: NavItem[] }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const pathname = usePathname() ?? '/';

  // Close after client-side navigation.
  useEffect(() => {
    dialogRef.current?.close();
  }, [pathname]);

  const open = () => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    dialog.showModal();
    enter(dialog, 'right', 0.24);
    document.documentElement.style.overflow = 'hidden';
  };

  return (
    <>
      <button
        type="button"
        onClick={open}
        className="inline-flex size-10 items-center justify-center rounded-md text-muted hover:bg-surface-2 hover:text-fg lg:hidden"
        aria-label="Open navigation menu"
        aria-haspopup="dialog"
        data-testid="mobile-menu-trigger"
      >
        <MenuIcon className="size-5" />
      </button>
      <dialog
        ref={dialogRef}
        aria-labelledby="mobile-nav-title"
        onClose={() => (document.documentElement.style.overflow = '')}
        // Click on the backdrop (the dialog element itself, outside the panel) closes it.
        onClick={(e) => {
          if (e.target === e.currentTarget) e.currentTarget.close();
        }}
        className="m-0 ml-auto h-dvh max-h-none w-[min(22rem,88vw)] max-w-none border-l border-border bg-bg-elevated p-0 text-fg shadow-lg backdrop:bg-bg/70 backdrop:backdrop-blur-sm"
        data-testid="mobile-menu"
      >
        <div className="flex h-full flex-col p-5">
          <div className="flex items-center justify-between">
            <h2 id="mobile-nav-title" className="font-display text-lg">
              Navigate the city
            </h2>
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              className="inline-flex size-10 items-center justify-center rounded-md text-muted hover:bg-surface-2 hover:text-fg"
              aria-label="Close navigation menu"
            >
              <CloseIcon className="size-5" />
            </button>
          </div>
          <nav aria-label="Mobile" className="mt-6 flex-1 overflow-y-auto">
            <ul className="space-y-1">
              {items.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => dialogRef.current?.close()}
                    aria-current={isActive(pathname, item.href) ? 'page' : undefined}
                    className="block rounded-md px-3 py-2.5 hover:bg-surface-2 aria-[current=page]:bg-surface-2 aria-[current=page]:text-accent"
                  >
                    <span className="block font-medium">{item.label}</span>
                    <span className="block text-sm text-muted">{item.description}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
            <ClassicModeToggle showLabel />
            <ThemeToggle />
          </div>
        </div>
      </dialog>
    </>
  );
}
