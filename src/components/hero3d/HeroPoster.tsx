import { generateCity, LANDMARKS } from './world';

/**
 * Static, server-rendered isometric poster of the *same* procedural city the 3D scene
 * renders (same seed, same layout). It is the LCP-safe first paint, the reduced-motion
 * and classic-mode view, and the fallback when WebGL is unavailable. Pure SVG themed
 * through CSS custom properties — no JavaScript, no image request.
 */
const COS = Math.cos(Math.PI / 6);
const SIN = Math.sin(Math.PI / 6);
const S = 4.2; // world units → px
const iso = (x: number, y: number, z: number) => [(x - z) * COS * S, ((x + z) * SIN - y) * S] as const;
const pt = ([a, b]: readonly [number, number]) => `${a.toFixed(1)},${b.toFixed(1)}`;

interface Box {
  x: number;
  z: number;
  hx: number;
  hz: number;
  h: number;
  kind: 'building' | 'landmark';
  color?: string;
}

function faces(b: Box) {
  const x0 = b.x - b.hx;
  const x1 = b.x + b.hx;
  const z0 = b.z - b.hz;
  const z1 = b.z + b.hz;
  return {
    top: [iso(x0, b.h, z0), iso(x1, b.h, z0), iso(x1, b.h, z1), iso(x0, b.h, z1)].map(pt).join(' '),
    // Visible side faces in this projection: +z (left) and +x (right).
    left: [iso(x0, 0, z1), iso(x1, 0, z1), iso(x1, b.h, z1), iso(x0, b.h, z1)].map(pt).join(' '),
    right: [iso(x1, 0, z0), iso(x1, 0, z1), iso(x1, b.h, z1), iso(x1, b.h, z0)].map(pt).join(' '),
  };
}

const landmarkHeights: Record<string, number> = { architecture: 41, ai: 9, iot: 16, projects: 5, profile: 9 };

export function HeroPoster() {
  const boxes: Box[] = [
    ...generateCity().map((b) => ({ x: b.x, z: b.z, hx: b.hx, hz: b.hz, h: b.height, kind: 'building' as const })),
    ...LANDMARKS.map((l) => ({
      x: l.x,
      z: l.z,
      hx: l.halfX * 0.8,
      hz: l.halfZ * 0.8,
      h: landmarkHeights[l.id] ?? 8,
      kind: 'landmark' as const,
      color: l.color,
    })),
  ].sort((a, b) => a.x + a.z - (b.x + b.z)); // painter's algorithm: back to front

  const [minX] = iso(-75, 0, 75);
  const [maxX] = iso(75, 0, -75);
  const [, minY] = iso(-75, 60, -75);
  const [, maxY] = iso(75, 0, 75);
  const pad = 20;
  const viewBox = `${(minX - pad).toFixed(0)} ${(minY - pad).toFixed(0)} ${(maxX - minX + pad * 2).toFixed(0)} ${(maxY - minY + pad * 2).toFixed(0)}`;
  const ground = [iso(-72, 0, -72), iso(72, 0, -72), iso(72, 0, 72), iso(-72, 0, 72)].map(pt).join(' ');
  const roads = [-70, -50, -30, -10, 10, 30, 50, 70];

  return (
    <svg
      viewBox={viewBox}
      preserveAspectRatio="xMidYMid slice"
      className="h-full w-full"
      aria-hidden
      focusable="false"
      data-testid="hero-poster"
    >
      <defs>
        <linearGradient id="poster-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--poster-sky-top)" />
          <stop offset="1" stopColor="var(--poster-sky-bottom)" />
        </linearGradient>
        <pattern id="poster-windows" width="6" height="7" patternUnits="userSpaceOnUse">
          <rect width="6" height="7" fill="var(--poster-side)" />
          <rect x="1.5" y="2" width="2.4" height="2.6" fill="var(--poster-window)" opacity="0.85" />
        </pattern>
        <pattern id="poster-windows-dim" width="6" height="7" patternUnits="userSpaceOnUse">
          <rect width="6" height="7" fill="var(--poster-side-dark)" />
          <rect x="1.5" y="2" width="2.4" height="2.6" fill="var(--poster-window-alt)" opacity="0.55" />
        </pattern>
      </defs>
      <rect
        x={minX - 400}
        y={minY - 400}
        width={maxX - minX + 800}
        height={maxY - minY + 800}
        fill="url(#poster-sky)"
      />
      <polygon points={ground} fill="var(--poster-ground)" />
      <g stroke="var(--poster-line)" strokeWidth="0.8" opacity="0.55">
        {roads.map((r) => (
          <g key={r}>
            <line x1={iso(r, 0, -72)[0]} y1={iso(r, 0, -72)[1]} x2={iso(r, 0, 72)[0]} y2={iso(r, 0, 72)[1]} />
            <line x1={iso(-72, 0, r)[0]} y1={iso(-72, 0, r)[1]} x2={iso(72, 0, r)[0]} y2={iso(72, 0, r)[1]} />
          </g>
        ))}
      </g>
      {boxes.map((b, i) => {
        const f = faces(b);
        if (b.kind === 'landmark') {
          return (
            <g key={`l${i}`}>
              <polygon points={f.left} fill="var(--poster-side-dark)" stroke={b.color} strokeWidth="1.2" />
              <polygon points={f.right} fill="var(--poster-side)" stroke={b.color} strokeWidth="1.2" />
              <polygon points={f.top} fill={b.color} opacity="0.9" />
              <circle
                cx={iso(b.x, 0, b.z)[0]}
                cy={iso(b.x, 0, b.z)[1]}
                r={b.hx * S * 2.2}
                fill={b.color}
                opacity="0.12"
              />
            </g>
          );
        }
        return (
          <g key={`b${i}`}>
            <polygon points={f.left} fill="url(#poster-windows-dim)" />
            <polygon points={f.right} fill="url(#poster-windows)" />
            <polygon points={f.top} fill="var(--poster-top)" stroke="var(--poster-rim)" strokeWidth="0.6" />
          </g>
        );
      })}
    </svg>
  );
}
