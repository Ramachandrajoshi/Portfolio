'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { usePrefersReducedMotion } from '@/lib/preferences';
import { cx } from '@/lib/cx';

export interface StoryStep {
  id: string;
  label: string;
  title: string;
  body: ReactNode;
}

const NODE_Y = [30, 110, 190, 270, 350];

/**
 * Scroll-driven story of how a design moves from context to validated decision.
 * Server-rendered and fully readable without JavaScript. GSAP + ScrollTrigger are loaded
 * only when the section approaches the viewport (and never under reduced motion); they
 * scrub the decision path and highlight the active step. This is the only place GSAP is
 * used — UI transitions elsewhere use Motion/CSS (see ARCHITECTURE.md, ADR-010).
 */
export function ApproachStory({ steps }: { steps: StoryStep[] }) {
  const root = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [enhanced, setEnhanced] = useState(false);
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    const el = root.current;
    if (!el || reducedMotion) return;
    let revert: (() => void) | undefined;
    let cancelled = false;
    const observer = new IntersectionObserver(
      async ([entry]) => {
        if (!entry?.isIntersecting) return;
        observer.disconnect();
        const [{ gsap }, { ScrollTrigger }] = await Promise.all([import('gsap'), import('gsap/ScrollTrigger')]);
        if (cancelled) return;
        gsap.registerPlugin(ScrollTrigger);
        const ctx = gsap.context(() => {
          const path = el.querySelector<SVGPathElement>('[data-story-path]');
          if (path) {
            const length = path.getTotalLength();
            gsap.set(path, { strokeDasharray: length, strokeDashoffset: length });
            gsap.to(path, {
              strokeDashoffset: 0,
              ease: 'none',
              scrollTrigger: { trigger: el, start: 'top 65%', end: 'bottom 75%', scrub: 0.6 },
            });
          }
          el.querySelectorAll<HTMLElement>('[data-step]').forEach((stepEl, index) => {
            ScrollTrigger.create({
              trigger: stepEl,
              start: 'top 60%',
              end: 'bottom 60%',
              onToggle: (self) => self.isActive && setActive(index),
            });
            gsap.fromTo(
              stepEl,
              { opacity: 0.35, y: 28 },
              {
                opacity: 1,
                y: 0,
                ease: 'power2.out',
                scrollTrigger: { trigger: stepEl, start: 'top 90%', end: 'top 60%', scrub: 0.4 },
              },
            );
          });
        }, el);
        revert = () => ctx.revert();
        setEnhanced(true);
      },
      { rootMargin: '300px 0px' },
    );
    observer.observe(el);
    return () => {
      cancelled = true;
      observer.disconnect();
      revert?.();
    };
  }, [reducedMotion]);

  return (
    <div
      ref={root}
      className="grid gap-10 lg:grid-cols-[18rem_minmax(0,1fr)] lg:gap-16"
      data-story={enhanced ? 'enhanced' : 'static'}
    >
      <div className="hidden lg:block">
        <div className="sticky top-28">
          <svg viewBox="0 0 120 380" className="h-[22rem] w-auto" aria-hidden>
            <path
              d={`M60 ${NODE_Y[0]} L60 ${NODE_Y[4]}`}
              stroke="var(--color-border-strong)"
              strokeWidth="2"
              fill="none"
            />
            <path
              data-story-path
              d={`M60 ${NODE_Y[0]} L60 ${NODE_Y[4]}`}
              stroke="var(--color-accent)"
              strokeWidth="3"
              fill="none"
            />
            {steps.map((step, i) => {
              const on = !enhanced || i <= active;
              return (
                <g key={step.id}>
                  <circle
                    cx="60"
                    cy={NODE_Y[i]}
                    r={i === active && enhanced ? 13 : 9}
                    fill="var(--color-bg)"
                    stroke={on ? 'var(--color-accent)' : 'var(--color-border-strong)'}
                    strokeWidth="2.5"
                    style={{ transition: 'r var(--duration-base), stroke var(--duration-base)' }}
                  />
                  <text
                    x="60"
                    y={(NODE_Y[i] ?? 0) + 4}
                    textAnchor="middle"
                    className="fill-[var(--color-text)] font-mono text-[10px]"
                  >
                    {String(i + 1).padStart(2, '0')}
                  </text>
                  <text
                    x="82"
                    y={(NODE_Y[i] ?? 0) + 4}
                    className={cx(
                      'font-mono text-[10px] tracking-wider uppercase',
                      on ? 'fill-[var(--color-accent)]' : 'fill-[var(--color-text-subtle)]',
                    )}
                  >
                    {step.label}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>
      <ol className="space-y-8 lg:space-y-[18vh] lg:py-[6vh]">
        {steps.map((step, i) => (
          <li
            key={step.id}
            data-step={i}
            className={cx(
              'card p-6 transition-[border-color,box-shadow] duration-300 sm:p-8',
              enhanced && i === active && 'border-accent/70 shadow-glow',
            )}
          >
            <p className="eyebrow">
              {String(i + 1).padStart(2, '0')} · {step.label}
            </p>
            <h3 className="mt-2 font-display text-2xl font-semibold">{step.title}</h3>
            <div className="mt-3 space-y-3 text-muted">{step.body}</div>
          </li>
        ))}
      </ol>
    </div>
  );
}
