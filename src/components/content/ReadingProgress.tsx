'use client';

import { useEffect, useRef } from 'react';

/** Thin progress bar for long-form pages. Decorative: hidden from assistive technology. */
export function ReadingProgress({ targetId = 'article-body' }: { targetId?: string }) {
  const bar = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const target = document.getElementById(targetId);
    if (!target || !bar.current) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const rect = target.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      const progress = total <= 0 ? 1 : Math.min(1, Math.max(0, -rect.top / total));
      bar.current?.style.setProperty('transform', `scaleX(${progress})`);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      cancelAnimationFrame(frame);
    };
  }, [targetId]);
  return (
    <div aria-hidden className="pointer-events-none fixed inset-x-0 top-0 z-50 h-0.5" data-print-hide>
      <div ref={bar} className="h-full origin-left scale-x-0 bg-gradient-to-r from-accent via-secondary to-tertiary" />
    </div>
  );
}
