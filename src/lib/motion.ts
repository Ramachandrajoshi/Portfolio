'use client';

import { animate } from 'motion/mini';
import { useEffect, type RefObject } from 'react';

/**
 * UI animation policy (ARCHITECTURE.md, ADR-010): Motion is the interface-animation
 * library, used through `motion/mini` — its WAAPI-based `animate()` costs a few KB, so it
 * can run inside the strict initial-route and 3D bundle budgets. GSAP is reserved for the
 * single scroll-storytelling sequence. Every animation is skipped under reduced motion.
 */
export const easing = { standard: [0.2, 0, 0, 1] as const, emphasized: [0.3, 0, 0, 1.2] as const };

const prefersReducedMotion = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Fade/slide an element in. No-op under reduced motion. */
export function enter(el: Element | null | undefined, from: 'below' | 'right' = 'below', duration = 0.28) {
  if (!el || prefersReducedMotion()) return;
  const transform = from === 'right' ? ['translateX(24px)', 'translateX(0)'] : ['translateY(16px) scale(0.985)', 'translateY(0) scale(1)'];
  void animate(el, { opacity: [0, 1], transform }, { duration, ease: easing.standard as unknown as [number, number, number, number] });
}

/** Runs the enter animation whenever `key` changes and the element is mounted. */
export function useEnterAnimation(ref: RefObject<Element | null>, key: unknown, from: 'below' | 'right' = 'below') {
  useEffect(() => {
    if (key !== null && key !== undefined && key !== false) enter(ref.current, from);
  }, [ref, key, from]);
}
