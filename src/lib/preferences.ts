'use client';

import { useSyncExternalStore } from 'react';
import { EXPERIENCE_STORAGE_KEY, THEME_STORAGE_KEY, type ResolvedTheme } from './theme';

/**
 * Visitor preferences live on <html data-*> attributes (set pre-paint by the inline
 * script) and are mirrored to localStorage. A MutationObserver turns the attributes into
 * an external store so every component re-renders consistently.
 */
type Listener = () => void;
const listeners = new Set<Listener>();
let observer: MutationObserver | null = null;

function subscribe(listener: Listener) {
  listeners.add(listener);
  if (!observer && typeof window !== 'undefined') {
    observer = new MutationObserver(() => listeners.forEach((l) => l()));
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme', 'data-experience'],
    });
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && observer) {
      observer.disconnect();
      observer = null;
    }
  };
}

function safeSet(key: string, value: string | null) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    /* storage unavailable (private mode, blocked) — preference lasts for this page only */
  }
}

export function useResolvedTheme(): ResolvedTheme {
  return useSyncExternalStore(
    subscribe,
    () => (document.documentElement.dataset.theme === 'light' ? 'light' : 'dark'),
    () => 'dark',
  );
}

export function setTheme(theme: ResolvedTheme) {
  const root = document.documentElement;
  root.dataset.theme = theme;
  root.style.colorScheme = theme;
  safeSet(THEME_STORAGE_KEY, theme);
}

/** "classic" = the visitor opted out of the 3D city; everything else stays identical. */
export function useClassicMode(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => document.documentElement.dataset.experience === 'classic',
    () => false,
  );
}

export function setClassicMode(enabled: boolean) {
  const root = document.documentElement;
  if (enabled) root.dataset.experience = 'classic';
  else delete root.dataset.experience;
  safeSet(EXPERIENCE_STORAGE_KEY, enabled ? 'classic' : null);
}

export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
      mq.addEventListener('change', cb);
      return () => mq.removeEventListener('change', cb);
    },
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    () => false,
  );
}
