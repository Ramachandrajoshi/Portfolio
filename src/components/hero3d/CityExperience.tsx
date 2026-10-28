'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { PerformanceMonitor } from '@react-three/drei/core/PerformanceMonitor';
import { useEnterAnimation } from '@/lib/motion';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import { blueprintPalette, nightPalette } from '@/design/palette';
import { createInput, type InputController } from './input';
import { AirTraffic, Boundary, Buildings, Ground, Particles, StreetLights } from './scene/City';
import { CameraRig, type CameraState } from './scene/CameraRig';
import { Character } from './scene/Character';
import { Sky } from './scene/Environment';
import { Landmarks } from './scene/Landmarks';
import { TouchControls } from './TouchControls';
import {
  buildColliders,
  generateCity,
  generateSkyline,
  LANDMARKS,
  nearestLandmark,
  SPAWN,
  stepCharacter,
  type CharacterState,
  type LandmarkId,
} from './world';

export interface CityExperienceProps {
  theme: 'light' | 'dark';
  reducedMotion: boolean;
  /** Called once the first frame has rendered. */
  onReady: () => void;
  /** Called when WebGL fails after initialisation (e.g. context lost). */
  onFailure: (reason: string) => void;
  /** Whether the hero is on screen; rendering pauses when it is not. */
  visible: boolean;
  /** Reports whether the visitor is currently controlling the character. */
  onActiveChange: (active: boolean) => void;
}

function Simulation({
  character,
  camera,
  input,
  colliders,
  onNearest,
}: {
  character: RefObject<CharacterState>;
  camera: RefObject<CameraState>;
  input: RefObject<InputController | null>;
  colliders: ReturnType<typeof buildColliders>;
  onNearest: (id: LandmarkId | null) => void;
}) {
  const last = useRef<LandmarkId | null>(null);
  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05); // avoid tunnelling after a long frame
    const ctl = input.current;
    const cam = camera.current;
    if (!ctl || !cam || cam.intro < 1) return;
    const s = ctl.state;
    character.current = stepCharacter(
      character.current!,
      { forward: s.forward, right: s.right, run: s.run, jump: s.jump },
      cam.yaw,
      dt,
      colliders,
    );
    const { landmark, inRange } = nearestLandmark(character.current.x, character.current.z);
    const id = inRange ? landmark.id : null;
    if (id !== last.current) {
      last.current = id;
      onNearest(id);
    }
  }, -2);
  return null;
}

export default function CityExperience({
  theme,
  reducedMotion,
  onReady,
  onFailure,
  visible,
  onActiveChange,
}: CityExperienceProps) {
  const palette = theme === 'dark' ? nightPalette : blueprintPalette;
  const animate = !reducedMotion;
  const buildings = useMemo(() => generateCity(), []);
  const skyline = useMemo(() => generateSkyline(), []);
  const colliders = useMemo(() => buildColliders(buildings), [buildings]);

  const wrapper = useRef<HTMLDivElement>(null);
  const input = useRef<InputController | null>(null);
  const character = useRef<CharacterState>({ ...SPAWN });
  const camera = useRef<CameraState>({ yaw: 0, pitch: 0.36, intro: reducedMotion ? 1 : 0 });

  const [nearest, setNearest] = useState<LandmarkId | null>(null);
  const [panel, setPanel] = useState<LandmarkId | null>(null);
  const [introDone, setIntroDone] = useState(reducedMotion);
  const [active, setActive] = useState(false);
  const [showHelp, setShowHelp] = useState(true);
  const [dpr, setDpr] = useState(1.5);
  const panelRef = useRef<HTMLDivElement>(null);
  const nearestRef = useRef<LandmarkId | null>(null);
  useEffect(() => {
    nearestRef.current = nearest;
  }, [nearest]);

  const openPanel = useCallback((id: LandmarkId, focus = false) => {
    setPanel(id);
    if (focus) requestAnimationFrame(() => panelRef.current?.querySelector<HTMLElement>('a, button')?.focus());
  }, []);

  const skipIntro = useCallback(() => {
    camera.current.intro = 1;
    setIntroDone(true);
  }, []);

  useEffect(() => {
    const el = wrapper.current;
    if (!el) return;
    const ctl = createInput(el, {
      onInteract: () => {
        if (camera.current.intro < 1) return skipIntro();
        if (nearestRef.current) openPanel(nearestRef.current, true);
      },
      onEscape: () => {
        setPanel((current) => {
          if (current) {
            requestAnimationFrame(() => el.focus());
            return null;
          }
          el.blur();
          return null;
        });
      },
      onActivity: () => {
        if (camera.current.intro < 1) skipIntro();
      },
    });
    input.current = ctl;
    return () => {
      ctl.dispose();
      input.current = null;
    };
  }, [openPanel, skipIntro]);

  // Intro completion is tracked in the render loop; mirror it into React state cheaply.
  useEffect(() => {
    if (introDone) return;
    const id = window.setInterval(() => {
      if (camera.current.intro >= 1) {
        setIntroDone(true);
        window.clearInterval(id);
      }
    }, 200);
    return () => window.clearInterval(id);
  }, [introDone]);

  const flyTo = (id: LandmarkId) => {
    const l = LANDMARKS.find((x) => x.id === id)!;
    const heading = Math.atan2(-(l.x - l.approach.x), -(l.z - l.approach.z));
    character.current = { ...SPAWN, x: l.approach.x, z: l.approach.z, heading };
    camera.current.yaw = heading;
    // Low camera for tall landmarks so the whole structure is framed.
    camera.current.pitch = id === 'architecture' ? 0.22 : 0.3;
    camera.current.intro = 1;
    setIntroDone(true);
    openPanel(id, true);
  };

  const panelLandmark = LANDMARKS.find((l) => l.id === panel);
  const promptRef = useRef<HTMLDivElement>(null);
  useEnterAnimation(panelRef, panel);
  useEnterAnimation(promptRef, !panel && introDone ? nearest : null);
  const nearestLandmarkData = LANDMARKS.find((l) => l.id === nearest);

  return (
    <div
      ref={wrapper}
      tabIndex={0}
      role="region"
      aria-roledescription="3D explorable city"
      aria-label="Ram's Digital Metropolis. Use W A S D or arrow keys to move, Shift to run, Space to jump, E to interact with a landmark, Escape to close or leave. A list of districts is available in this region."
      className="group/city absolute inset-0 outline-none"
      onFocus={() => {
        setActive(true);
        onActiveChange(true);
      }}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
          setActive(false);
          onActiveChange(false);
        }
      }}
      onPointerDown={(e) => {
        if (!(e.target as HTMLElement).closest('[data-hud]')) wrapper.current?.focus({ preventScroll: true });
      }}
      data-testid="city-experience"
    >
      <Canvas
        dpr={[1, dpr]}
        gl={{ antialias: true, powerPreference: 'high-performance', alpha: false, stencil: false }}
        camera={{ fov: 55, near: 0.1, far: 700, position: [70, 95, 130] }}
        frameloop={visible ? 'always' : 'never'}
        onCreated={({ gl }) => {
          gl.domElement.addEventListener('webglcontextlost', (event) => {
            event.preventDefault();
            onFailure('The graphics context was lost.');
          });
          requestAnimationFrame(() => onReady());
        }}
        aria-hidden
        className="!absolute inset-0 touch-none"
      >
        <PerformanceMonitor onDecline={() => setDpr(1)} onIncline={() => setDpr(1.75)} flipflops={3} />
        <color attach="background" args={[palette.sky]} />
        <fog attach="fog" args={[palette.fog, palette.fogNear, palette.fogFar]} />
        <hemisphereLight args={[palette.hemiSky, palette.hemiGround, 1.6]} />
        <directionalLight position={[40, 80, 25]} intensity={palette.sunIntensity} color={palette.sun} />
        <Sky palette={palette} night={theme === 'dark'} />
        <Ground palette={palette} animate={animate} />
        <Buildings buildings={buildings} palette={palette} animate={animate} />
        <Buildings buildings={skyline} palette={palette} animate={false} />
        <StreetLights palette={palette} />
        <Boundary palette={palette} />
        <Particles palette={palette} animate={animate} />
        <AirTraffic palette={palette} animate={animate} />
        <Landmarks palette={palette} animate={animate} activeId={panel ?? nearest} onSelect={(id) => openPanel(id)} />
        <Character state={character} palette={palette} reducedMotion={reducedMotion} />
        <Simulation character={character} camera={camera} input={input} colliders={colliders} onNearest={setNearest} />
        <CameraRig
          character={character}
          camera={camera}
          buildings={buildings}
          look={() => input.current?.consumeLook() ?? { yaw: 0, pitch: 0 }}
          forwardOnly={() =>
            Math.abs(input.current?.state.right ?? 0) < 0.2 && (input.current?.state.forward ?? 0) > 0.5
          }
          reducedMotion={reducedMotion}
        />
      </Canvas>

      {/* ── HUD (HTML over the canvas) ───────────────────────────── */}
      {!introDone ? (
        <button
          type="button"
          data-hud
          onClick={skipIntro}
          className="absolute bottom-6 left-1/2 z-20 -translate-x-1/2 rounded-md border border-border-strong bg-bg-elevated/85 px-3 py-1.5 text-sm backdrop-blur hover:border-accent"
        >
          Skip intro
        </button>
      ) : null}

      <nav
        data-hud
        aria-label="City districts"
        className="absolute top-3 right-3 z-20 hidden max-w-[15rem] rounded-lg border border-border bg-bg-elevated/80 p-2 text-sm backdrop-blur sm:block"
      >
        <p className="px-2 pb-1 font-mono text-[0.65rem] tracking-wider text-muted uppercase">Fly to a district</p>
        <ul>
          {LANDMARKS.map((l) => (
            <li key={l.id}>
              <button
                type="button"
                onClick={() => flyTo(l.id)}
                className="flex w-full items-center gap-2 rounded px-2 py-1 text-left hover:bg-surface-2 aria-[current=true]:text-accent"
                aria-current={panel === l.id}
              >
                <span aria-hidden className="size-2 shrink-0 rounded-full" style={{ background: l.color }} />
                {l.district}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {nearestLandmarkData && !panel && introDone ? (
        <div
          data-hud
          ref={promptRef}
          className="pointer-events-none absolute inset-x-0 bottom-24 z-20 flex justify-center sm:bottom-10"
          aria-live="polite"
        >
          <p
            className="pointer-events-auto rounded-full border bg-bg-elevated/90 px-4 py-2 text-sm shadow-lg backdrop-blur"
            style={{ borderColor: nearestLandmarkData.color }}
          >
            <kbd className="mr-2 rounded border border-border-strong px-1.5 font-mono text-xs">E</kbd>
            Enter <strong>{nearestLandmarkData.district}</strong>
            <button
              type="button"
              className="ml-3 text-accent underline sm:hidden"
              onClick={() => openPanel(nearestLandmarkData.id, true)}
            >
              Open
            </button>
          </p>
        </div>
      ) : null}

      {panelLandmark ? (
        <div
          ref={panelRef}
          data-hud
          role="dialog"
          aria-modal="false"
          aria-labelledby="landmark-title"
          className="absolute inset-x-3 bottom-3 z-30 mx-auto max-w-lg rounded-xl border bg-bg-elevated/95 p-5 shadow-lg backdrop-blur sm:bottom-8"
          style={{ borderColor: panelLandmark.color }}
          data-testid="landmark-panel"
        >
          <p className="font-mono text-xs tracking-wider uppercase" style={{ color: panelLandmark.color }}>
            {panelLandmark.district}
          </p>
          <h2 id="landmark-title" className="mt-1 font-display text-xl font-semibold">
            {panelLandmark.name}
          </h2>
          <p className="mt-2 text-sm text-muted">{panelLandmark.intro}</p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Link
              href={panelLandmark.href}
              className="inline-flex h-10 items-center rounded-md bg-accent px-4 text-sm font-medium text-accent-contrast hover:bg-accent-strong"
            >
              {panelLandmark.cta} →
            </Link>
            <button
              type="button"
              onClick={() => {
                setPanel(null);
                wrapper.current?.focus({ preventScroll: true });
              }}
              className="inline-flex h-10 items-center rounded-md border border-border-strong px-3 text-sm hover:border-accent"
            >
              Close <span className="ml-1 hidden font-mono text-xs text-muted sm:inline">Esc</span>
            </button>
          </div>
        </div>
      ) : null}

      <div data-hud className="absolute right-3 bottom-3 z-20 hidden text-xs sm:block">
        {showHelp ? (
          <div className="rounded-lg border border-border bg-bg-elevated/80 p-3 backdrop-blur">
            <div className="flex items-center justify-between gap-6">
              <p className="font-mono text-[0.65rem] tracking-wider text-muted uppercase">
                {active ? 'Controls' : 'Click the city to take control'}
              </p>
              <button
                type="button"
                onClick={() => setShowHelp(false)}
                className="text-muted hover:text-fg"
                aria-label="Hide controls help"
              >
                ×
              </button>
            </div>
            <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-muted">
              <dt>
                <kbd className="font-mono text-fg">WASD / ←↑↓→</kbd>
              </dt>
              <dd>Move</dd>
              <dt>
                <kbd className="font-mono text-fg">Shift</kbd>
              </dt>
              <dd>Run</dd>
              <dt>
                <kbd className="font-mono text-fg">Space</kbd>
              </dt>
              <dd>Jump</dd>
              <dt>
                <kbd className="font-mono text-fg">Drag</kbd>
              </dt>
              <dd>Orbit camera</dd>
              <dt>
                <kbd className="font-mono text-fg">E</kbd> / click
              </dt>
              <dd>Interact</dd>
              <dt>
                <kbd className="font-mono text-fg">Esc</kbd>
              </dt>
              <dd>Close · release controls</dd>
            </dl>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowHelp(true)}
            className="rounded-md border border-border bg-bg-elevated/80 px-2.5 py-1 text-muted backdrop-blur hover:text-fg"
          >
            Controls
          </button>
        )}
      </div>

      <TouchControls
        input={input}
        onInteract={() => nearestRef.current && openPanel(nearestRef.current, true)}
        canInteract={!!nearest}
      />
    </div>
  );
}
