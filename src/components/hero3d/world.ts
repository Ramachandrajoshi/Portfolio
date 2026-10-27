/**
 * Ram's Digital Metropolis — pure world model.
 *
 * Everything here is deterministic (seeded) and free of Three.js/React so it can be unit
 * tested: city layout, building colliders, landmark placement, movement integration and
 * collision resolution. The scene components only *render* this model.
 */

export const WORLD = {
  /** Distance between block centres (block + road). */
  pitch: 20,
  /** Block footprint (the rest of the pitch is road). */
  block: 14,
  /** Blocks span -extent..+extent on both axes (centres). */
  extent: 60,
  /** Walkable boundary (character centre). */
  bound: 68,
  characterRadius: 0.55,
  walkSpeed: 6,
  runSpeed: 11.5,
  jumpVelocity: 7.2,
  gravity: 22,
  interactRadius: 10,
} as const;

export type LandmarkId = 'architecture' | 'ai' | 'iot' | 'projects' | 'profile';

export interface Landmark {
  id: LandmarkId;
  name: string;
  district: string;
  /** World position of the landmark's centre (x, z). */
  x: number;
  z: number;
  /** Collision half-extents (axis-aligned). */
  halfX: number;
  halfZ: number;
  /** Where "fly to" places the character, facing the landmark. */
  approach: { x: number; z: number };
  color: string;
  href: string;
  cta: string;
  intro: string;
}

export const LANDMARKS: Landmark[] = [
  {
    id: 'architecture',
    name: 'The Architecture Spire',
    district: 'System Architecture',
    x: 0,
    z: -40,
    halfX: 4.5,
    halfZ: 4.5,
    approach: { x: 0, z: -16 },
    color: '#22d3ee',
    href: '/architecture/',
    cta: 'Explore the case studies',
    intro:
      'Each layer of the spire is a layer of a system. Inside: case studies that start from constraints, record decisions as ADRs, and are honest about trade-offs and failure modes.',
  },
  {
    id: 'ai',
    name: 'The Compute Core',
    district: 'AI & Inference',
    x: 40,
    z: -20,
    halfX: 5.5,
    halfZ: 5.5,
    approach: { x: 27, z: -20 },
    color: '#a78bfa',
    href: '/architecture/llm-inference-platform/',
    cta: 'Read the inference case study',
    intro:
      'Racks of accelerators around a model core. How do you serve LLMs within a GPU-memory, latency and concurrency budget? Weights, KV cache and scheduling — reasoned from first principles.',
  },
  {
    id: 'iot',
    name: 'The Industrial Hub',
    district: 'Connected Systems',
    x: 20,
    z: 40,
    halfX: 6,
    halfZ: 4.5,
    approach: { x: 20, z: 27 },
    color: '#f5b544',
    href: '/architecture/industrial-telemetry-platform/',
    cta: 'Follow the telemetry pipeline',
    intro:
      'The mast pulses like an MQTT broker. Edge gateways, store-and-forward buffering, stream processing and time-series storage for equipment that is often offline.',
  },
  {
    id: 'projects',
    name: 'The Engineering Workshop',
    district: 'Projects',
    x: -20,
    z: 40,
    halfX: 6,
    halfZ: 4.5,
    approach: { x: -20, z: 27 },
    color: '#60a5fa',
    href: '/projects/',
    cta: 'See the projects',
    intro: 'Where things get built. Projects documented with the same discipline as the case studies: problem, constraints, decisions and lessons.',
  },
  {
    id: 'profile',
    name: 'Profile Plaza',
    district: 'About & Contact',
    x: -40,
    z: -20,
    halfX: 3.2,
    halfZ: 3.2,
    approach: { x: -30, z: -20 },
    color: '#e7ecf5',
    href: '/about/',
    cta: 'Meet Ramachandra',
    intro: 'The beacon at the edge of the city. Background, focus areas and how to get in touch — résumé and contact are one step away.',
  },
];

export interface Building {
  x: number;
  /** Base elevation (stacked landmark layers); 0 for street-level buildings. */
  y?: number;
  z: number;
  /** Half-extents of the footprint. */
  hx: number;
  hz: number;
  height: number;
  /** 0..1 — drives window pattern and tint in the shader. */
  seed: number;
  /** 0 = navy glass, 1 = graphite, 2 = accent-trimmed. */
  style: number;
}

export interface AABB {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

/** Mulberry32 — tiny, fast, deterministic PRNG. */
export function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const isLandmarkBlock = (bx: number, bz: number) => LANDMARKS.some((l) => l.x === bx && l.z === bz);
const isPlazaBlock = (bx: number, bz: number) => bx === 0 && bz === 0;
/** The boulevard: an open block between the plaza and the Spire, so the first view frames it. */
export const isBoulevardBlock = (bx: number, bz: number) => bx === 0 && bz === -20;

/** Procedurally generates the walkable city's buildings. Deterministic for a given seed. */
export function generateCity(seed = 20261027): Building[] {
  const random = rng(seed);
  const buildings: Building[] = [];
  const { pitch, block, extent } = WORLD;
  for (let bx = -extent; bx <= extent; bx += pitch) {
    for (let bz = -extent; bz <= extent; bz += pitch) {
      if (isPlazaBlock(bx, bz) || isLandmarkBlock(bx, bz) || isBoulevardBlock(bx, bz)) continue;
      const distance = Math.hypot(bx, bz);
      // Taller towards the middle ring, lower at the edges — gives the skyline a shape.
      const heightScale = 0.55 + 0.9 * Math.exp(-((distance - 35) ** 2) / 900);
      const layout = random();
      if (layout < 0.28) {
        // One tower filling most of the block.
        const h = (18 + random() * 26) * heightScale;
        buildings.push({ x: bx, z: bz, hx: block / 2 - 1.2, hz: block / 2 - 1.2, height: h, seed: random(), style: Math.floor(random() * 3) });
      } else {
        // 2×2 lots with gaps (alleys).
        const lot = (block - 2) / 2;
        for (const ox of [-1, 1]) {
          for (const oz of [-1, 1]) {
            if (random() < 0.12) continue; // occasional empty lot — a small courtyard
            const shrink = 0.6 + random() * 0.4;
            buildings.push({
              x: bx + (ox * (lot + 2)) / 2,
              z: bz + (oz * (lot + 2)) / 2,
              hx: (lot / 2) * shrink,
              hz: (lot / 2) * (0.6 + random() * 0.4),
              height: (5 + random() * 18) * heightScale,
              seed: random(),
              style: Math.floor(random() * 3),
            });
          }
        }
      }
    }
  }
  return buildings;
}

/** Non-walkable silhouette buildings beyond the boundary, for depth. */
export function generateSkyline(seed = 7): Building[] {
  const random = rng(seed);
  const result: Building[] = [];
  for (let i = 0; i < 220; i++) {
    const angle = random() * Math.PI * 2;
    const radius = 95 + random() * 120;
    const size = 3 + random() * 7;
    result.push({
      x: Math.cos(angle) * radius,
      z: Math.sin(angle) * radius,
      hx: size,
      hz: size * (0.6 + random() * 0.6),
      height: 15 + random() * 70 * (radius < 140 ? 1 : 1.4),
      seed: random(),
      style: Math.floor(random() * 3),
    });
  }
  return result;
}

export function buildColliders(buildings: Building[]): AABB[] {
  const boxes: AABB[] = buildings.map((b) => ({ minX: b.x - b.hx, maxX: b.x + b.hx, minZ: b.z - b.hz, maxZ: b.z + b.hz }));
  for (const l of LANDMARKS) boxes.push({ minX: l.x - l.halfX, maxX: l.x + l.halfX, minZ: l.z - l.halfZ, maxZ: l.z + l.halfZ });
  return boxes;
}

/**
 * Pushes a circle (character footprint) out of every overlapping AABB along the shortest
 * separating direction, then clamps to the world boundary. Returns the corrected position.
 */
export function resolveCollisions(x: number, z: number, radius: number, colliders: AABB[]): { x: number; z: number; hit: boolean } {
  let hit = false;
  for (let iteration = 0; iteration < 3; iteration++) {
    let moved = false;
    for (const box of colliders) {
      const cx = Math.max(box.minX, Math.min(x, box.maxX));
      const cz = Math.max(box.minZ, Math.min(z, box.maxZ));
      const dx = x - cx;
      const dz = z - cz;
      const d2 = dx * dx + dz * dz;
      if (d2 >= radius * radius) continue;
      hit = moved = true;
      if (d2 > 1e-9) {
        const d = Math.sqrt(d2);
        x = cx + (dx / d) * radius;
        z = cz + (dz / d) * radius;
      } else {
        // Centre inside the box: exit through the nearest face.
        const exits = [
          { v: x - box.minX, fx: box.minX - radius, fz: z },
          { v: box.maxX - x, fx: box.maxX + radius, fz: z },
          { v: z - box.minZ, fx: x, fz: box.minZ - radius },
          { v: box.maxZ - z, fx: x, fz: box.maxZ + radius },
        ].sort((a, b) => a.v - b.v);
        x = exits[0]!.fx;
        z = exits[0]!.fz;
      }
    }
    if (!moved) break;
  }
  const b = WORLD.bound;
  if (Math.abs(x) > b || Math.abs(z) > b) hit = true;
  return { x: Math.max(-b, Math.min(b, x)), z: Math.max(-b, Math.min(b, z)), hit };
}

/** Ray (origin → target, 2D in xz) vs AABB slab test. Returns hit distance fraction 0..1, or null. */
export function segmentHitsBox(ox: number, oz: number, tx: number, tz: number, box: AABB): number | null {
  const dx = tx - ox;
  const dz = tz - oz;
  let tmin = 0;
  let tmax = 1;
  for (const [o, d, min, max] of [
    [ox, dx, box.minX, box.maxX],
    [oz, dz, box.minZ, box.maxZ],
  ] as const) {
    if (Math.abs(d) < 1e-9) {
      if (o < min || o > max) return null;
    } else {
      let t1 = (min - o) / d;
      let t2 = (max - o) / d;
      if (t1 > t2) [t1, t2] = [t2, t1];
      tmin = Math.max(tmin, t1);
      tmax = Math.min(tmax, t2);
      if (tmin > tmax) return null;
    }
  }
  return tmin;
}

/**
 * Camera collision avoidance: shortens the camera boom so it never ends inside or behind a
 * building taller than the camera line at that point.
 */
export function cameraBoomFraction(
  from: { x: number; y: number; z: number },
  to: { x: number; y: number; z: number },
  buildings: Building[],
): number {
  let fraction = 1;
  for (const b of buildings) {
    const t = segmentHitsBox(from.x, from.z, to.x, to.z, { minX: b.x - b.hx - 0.4, maxX: b.x + b.hx + 0.4, minZ: b.z - b.hz - 0.4, maxZ: b.z + b.hz + 0.4 });
    if (t === null || t >= fraction) continue;
    const yAt = from.y + (to.y - from.y) * t;
    if (yAt < b.height + 0.5) fraction = Math.max(0.12, t - 0.04);
  }
  return fraction;
}

export function nearestLandmark(x: number, z: number): { landmark: Landmark; distance: number } {
  let best = { landmark: LANDMARKS[0]!, distance: Infinity };
  for (const l of LANDMARKS) {
    // Distance to the landmark's footprint edge, not its centre.
    const dx = Math.max(Math.abs(x - l.x) - l.halfX, 0);
    const dz = Math.max(Math.abs(z - l.z) - l.halfZ, 0);
    const d = Math.hypot(dx, dz);
    if (d < best.distance) best = { landmark: l, distance: d };
  }
  return best;
}

export interface MoveInput {
  forward: number; // -1..1
  right: number; // -1..1
  run: boolean;
  jump: boolean;
}

export interface CharacterState {
  x: number;
  y: number;
  z: number;
  vy: number;
  heading: number; // radians, 0 = facing -z
  speed: number; // current horizontal speed (for animation)
  grounded: boolean;
}

/**
 * Integrates one frame of camera-relative movement with smoothing, jumping and collision.
 * `cameraYaw` is the camera's azimuth; "forward" means away from the camera.
 */
export function stepCharacter(state: CharacterState, input: MoveInput, cameraYaw: number, dt: number, colliders: AABB[]): CharacterState {
  const len = Math.hypot(input.forward, input.right);
  const fwd = len > 1 ? input.forward / len : input.forward;
  const rgt = len > 1 ? input.right / len : input.right;
  const targetSpeed = len > 0.05 ? (input.run ? WORLD.runSpeed : WORLD.walkSpeed) * Math.min(1, len) : 0;
  // Exponential smoothing: frame-rate independent acceleration and braking.
  const speed = state.speed + (targetSpeed - state.speed) * (1 - Math.exp(-dt * (targetSpeed > state.speed ? 8 : 12)));

  let heading = state.heading;
  if (len > 0.05) {
    // Camera-relative direction in world space.
    const sin = Math.sin(cameraYaw);
    const cos = Math.cos(cameraYaw);
    const dirX = -fwd * sin + rgt * cos;
    const dirZ = -fwd * cos - rgt * sin;
    const target = Math.atan2(-dirX, -dirZ);
    let delta = target - heading;
    delta = Math.atan2(Math.sin(delta), Math.cos(delta));
    heading += delta * (1 - Math.exp(-dt * 12));
  }
  let x = state.x - Math.sin(heading) * speed * dt;
  let z = state.z - Math.cos(heading) * speed * dt;
  const resolved = resolveCollisions(x, z, WORLD.characterRadius, colliders);
  x = resolved.x;
  z = resolved.z;

  let { y, vy, grounded } = state;
  if (grounded && input.jump) {
    vy = WORLD.jumpVelocity;
    grounded = false;
  }
  vy -= WORLD.gravity * dt;
  y += vy * dt;
  if (y <= 0) {
    y = 0;
    vy = 0;
    grounded = true;
  }
  return { x, y, z, vy, heading, speed, grounded };
}

export const SPAWN: CharacterState = { x: 0, y: 0, z: 6, vy: 0, heading: 0, speed: 0, grounded: true };
