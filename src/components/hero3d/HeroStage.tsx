'use client';

import { lazy, Suspense, useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from 'react';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { setClassicMode, useClassicMode, usePrefersReducedMotion, useResolvedTheme } from '@/lib/preferences';
import { cx } from '@/lib/cx';

// The entire 3D runtime (three, R3F, scene) lives behind this dynamic import: it is never
// part of the initial route bundle and never loaded on other routes.
const CityExperience = lazy(() => import('./CityExperience'));

type Phase = 'poster' | 'loading' | 'ready' | 'failed';

/** WebGL capability probe — cheap, synchronous, cached. */
let webglSupport: boolean | null = null;
function detectWebGL(): boolean {
  if (webglSupport !== null) return webglSupport;
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') ?? canvas.getContext('webgl');
    webglSupport = !!gl;
    (gl as WebGLRenderingContext | null)?.getExtension('WEBGL_lose_context')?.loseContext();
  } catch {
    webglSupport = false;
  }
  return webglSupport;
}

/** Data-saver users and very constrained devices must opt in to the 3D download. */
function prefersLightweight(): boolean {
  const nav = navigator as Navigator & { connection?: { saveData?: boolean }; deviceMemory?: number };
  return Boolean(nav.connection?.saveData) || (nav.deviceMemory !== undefined && nav.deviceMemory < 2);
}

const noopSubscribe = () => () => {};

/**
 * Orchestrates the hero: static poster first (instant, LCP-safe), then — only when the hero
 * is visible, the browser is idle, WebGL works and the visitor hasn't opted out — the lazy
 * 3D city. Any failure falls back to the poster; content and navigation never depend on it.
 */
export function HeroStage({ poster, children }: { poster: ReactNode; children: ReactNode }) {
  const section = useRef<HTMLElement>(null);
  const classic = useClassicMode();
  const reducedMotion = usePrefersReducedMotion();
  const theme = useResolvedTheme();
  const webgl = useSyncExternalStore(noopSubscribe, detectWebGL, () => true);
  const [phase, setPhase] = useState<Phase>('poster');
  const [failure, setFailure] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [cityActive, setCityActive] = useState(false);
  const [introHidden, setIntroHidden] = useState(false);

  // Visibility drives both lazy activation and pausing the render loop off-screen.
  useEffect(() => {
    const el = section.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => setVisible(!!entry?.isIntersecting), { threshold: 0.15 });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const canAutoStart = webgl && !classic && !reducedMotion && !dismissed;
  useEffect(() => {
    if (phase !== 'poster' || !visible || !canAutoStart || prefersLightweight()) return;
    // Start after the page is interactive so the 3D download never competes with first paint.
    const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number; cancelIdleCallback?: (id: number) => void };
    if (w.requestIdleCallback) {
      const id = w.requestIdleCallback(() => setPhase('loading'), { timeout: 2500 });
      return () => w.cancelIdleCallback?.(id);
    }
    const id = window.setTimeout(() => setPhase('loading'), 1200);
    return () => window.clearTimeout(id);
  }, [phase, visible, canAutoStart]);

  // Switching to classic mode tears the scene down immediately.
  useEffect(() => {
    if (classic && (phase === 'loading' || phase === 'ready')) {
      const id = requestAnimationFrame(() => setPhase('poster'));
      return () => cancelAnimationFrame(id);
    }
  }, [classic, phase]);

  const start = () => {
    if (classic) setClassicMode(false);
    setFailure(null);
    setDismissed(false);
    setPhase('loading');
  };
  const stop = () => {
    setDismissed(true);
    setCityActive(false);
    setPhase('poster');
  };
  const fail = (reason: string) => {
    setFailure(reason);
    setPhase('failed');
  };

  const running = phase === 'loading' || phase === 'ready';
  const collapsed = (cityActive || introHidden) && phase === 'ready';

  return (
    <section
      ref={section}
      aria-label="Introduction"
      className="relative isolate h-[calc(100svh-4rem)] max-h-[64rem] min-h-[38rem] overflow-hidden border-b border-border"
      data-hero-phase={phase}
    >
      <div className="absolute inset-0 -z-20">{poster}</div>
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-r from-bg via-bg/80 to-transparent lg:via-bg/55" />

      {running ? (
        // No z-index here: the HUD inside must stack above the text scrim and overlay.
        <div className={cx('absolute inset-0 transition-opacity duration-700', phase === 'ready' ? 'opacity-100' : 'opacity-0')}>
          <ErrorBoundary fallback={null} onError={(e) => fail(e.message || 'The 3D scene could not start.')}>
            <Suspense fallback={null}>
              <CityExperience
                theme={theme}
                reducedMotion={reducedMotion}
                visible={visible}
                onReady={() => setPhase('ready')}
                onFailure={fail}
                onActiveChange={setCityActive}
              />
            </Suspense>
          </ErrorBoundary>
        </div>
      ) : null}

      {/* Scrim keeps text readable over the live scene. */}
      {phase === 'ready' && !collapsed ? (
        <div aria-hidden className="pointer-events-none absolute inset-y-0 left-0 z-[5] w-full bg-gradient-to-r from-bg/90 via-bg/60 to-transparent lg:w-3/5" />
      ) : null}

      <div
        className={cx(
          'pointer-events-none relative z-10 flex h-full items-center transition-[opacity,transform] duration-500',
          collapsed && 'pointer-events-none -translate-x-6 opacity-0',
        )}
      >
        <div className="container-page">
          <div className="max-w-xl [&_a]:pointer-events-auto [&_button]:pointer-events-auto">
            {children}
            <div className="mt-8 flex flex-wrap items-center gap-3 text-sm" data-testid="hero-3d-status">
              {phase === 'poster' && webgl ? (
                <button
                  type="button"
                  onClick={start}
                  className="inline-flex h-10 items-center gap-2 rounded-md border border-accent/60 bg-accent/10 px-4 font-medium text-accent hover:bg-accent/20"
                  data-testid="enter-city"
                >
                  <span aria-hidden>◈</span> {classic ? 'Enable the 3D city' : 'Enter the 3D city'}
                </button>
              ) : null}
              {phase === 'poster' && webgl && (reducedMotion || classic) ? (
                <span className="text-muted">
                  {classic ? 'Classic mode is on — the 3D city is not loaded.' : 'Reduced motion is on, so the 3D city waits for you.'}
                </span>
              ) : null}
              {phase === 'poster' && !webgl ? (
                <span className="text-muted" data-testid="webgl-unsupported">
                  Your browser can&apos;t display the 3D city. Everything in it is reachable through the links above.
                </span>
              ) : null}
              {phase === 'loading' ? (
                <span role="status" className="inline-flex items-center gap-2 text-muted">
                  <span aria-hidden className="size-2 animate-pulse rounded-full bg-accent" /> Building the city…
                </span>
              ) : null}
              {phase === 'ready' ? (
                <>
                  <span className="text-muted">Click the city, then use WASD to explore.</span>
                  <button type="button" onClick={() => setIntroHidden(true)} className="text-accent underline-offset-4 hover:underline">
                    Hide intro
                  </button>
                  <button type="button" onClick={stop} className="text-muted underline-offset-4 hover:text-fg hover:underline" data-testid="exit-city">
                    Exit 3D
                  </button>
                </>
              ) : null}
              {phase === 'failed' ? (
                <span role="status" className="text-muted" data-testid="webgl-failed">
                  The 3D city couldn&apos;t start ({failure}). Everything is still available through the links above.{' '}
                  <button type="button" onClick={start} className="text-accent underline">Try again</button>
                </span>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {collapsed ? (
        <button
          type="button"
          onClick={() => {
            setIntroHidden(false);
            setCityActive(false);
          }}
          className="absolute left-3 top-3 z-20 rounded-md border border-border bg-bg-elevated/85 px-3 py-1.5 text-sm backdrop-blur hover:border-accent"
        >
          Show intro
        </button>
      ) : null}
    </section>
  );
}
