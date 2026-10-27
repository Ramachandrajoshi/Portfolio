import { describe, expect, it } from 'vitest';
import {
  buildColliders,
  cameraBoomFraction,
  generateCity,
  LANDMARKS,
  nearestLandmark,
  resolveCollisions,
  SPAWN,
  stepCharacter,
  WORLD,
} from '@/components/hero3d/world';

const city = generateCity();
const colliders = buildColliders(city);
const idle = { forward: 0, right: 0, run: false, jump: false };

function simulate(seconds: number, input = idle, yaw = 0, start = SPAWN) {
  let s = { ...start };
  for (let t = 0; t < seconds; t += 1 / 60) s = stepCharacter(s, input, yaw, 1 / 60, colliders);
  return s;
}

describe('procedural city', () => {
  it('is deterministic for a given seed', () => {
    expect(generateCity()).toEqual(city);
    expect(generateCity(1)).not.toEqual(city);
  });

  it('keeps the spawn plaza, the boulevard and landmark blocks free of buildings', () => {
    for (const b of city) {
      expect(Math.max(Math.abs(b.x), Math.abs(b.z)) > 8 || Math.abs(b.x) > 8).toBe(true);
      expect(!(Math.abs(b.x) < 8 && Math.abs(b.z + 20) < 8)).toBe(true);
      for (const l of LANDMARKS) expect(Math.hypot(b.x - l.x, b.z - l.z) > 6).toBe(true);
    }
  });

  it('does not place buildings on roads', () => {
    for (const b of city) {
      // Roads are centred on x, z ≡ 10 (mod 20) with half-width 3.
      for (const [c, h] of [
        [b.x, b.hx],
        [b.z, b.hz],
      ] as const) {
        const nearestRoad = Math.round((c - 10) / 20) * 20 + 10;
        expect(Math.abs(c - nearestRoad) - h).toBeGreaterThanOrEqual(3);
      }
    }
  });
});

describe('collision', () => {
  it('pushes a character out of a building it walks into', () => {
    const b = city[0]!;
    const inside = resolveCollisions(b.x, b.z, WORLD.characterRadius, colliders);
    expect(inside.hit).toBe(true);
    const outsideX = inside.x < b.x - b.hx || inside.x > b.x + b.hx;
    const outsideZ = inside.z < b.z - b.hz || inside.z > b.z + b.hz;
    expect(outsideX || outsideZ).toBe(true);
  });

  it('clamps to the world boundary', () => {
    const r = resolveCollisions(500, -500, WORLD.characterRadius, []);
    expect(r).toEqual({ x: WORLD.bound, z: -WORLD.bound, hit: true });
  });

  it('never ends a long run inside a collider', () => {
    const end = simulate(12, { forward: 1, right: 0.3, run: true, jump: false });
    for (const box of colliders) {
      const inside = end.x > box.minX && end.x < box.maxX && end.z > box.minZ && end.z < box.maxZ;
      expect(inside).toBe(false);
    }
  });
});

describe('movement', () => {
  it('moves away from the camera when pressing forward (camera behind, looking -z)', () => {
    const end = simulate(1, { forward: 1, right: 0, run: false, jump: false });
    expect(end.z).toBeLessThan(SPAWN.z - 3);
    expect(Math.abs(end.x)).toBeLessThan(0.1);
  });

  it('is camera-relative: with the camera rotated 90°, forward moves along -x', () => {
    const end = simulate(1, { forward: 1, right: 0, run: false, jump: false }, Math.PI / 2);
    expect(end.x).toBeLessThan(-3);
  });

  it('runs faster than it walks', () => {
    const walk = simulate(1, { forward: 1, right: 0, run: false, jump: false });
    const run = simulate(1, { forward: 1, right: 0, run: true, jump: false });
    expect(SPAWN.z - run.z).toBeGreaterThan(SPAWN.z - walk.z);
  });

  it('jumps and lands back on the ground', () => {
    let s = stepCharacter({ ...SPAWN }, { ...idle, jump: true }, 0, 1 / 60, colliders);
    expect(s.grounded).toBe(false);
    s = simulate(2, idle, 0, s);
    expect(s.grounded).toBe(true);
    expect(s.y).toBe(0);
  });

  it('stays still without input', () => {
    const end = simulate(2);
    expect(end.x).toBeCloseTo(SPAWN.x);
    expect(end.z).toBeCloseTo(SPAWN.z);
  });
});

describe('interaction and camera', () => {
  it('reports nothing in range at the spawn point', () => {
    expect(nearestLandmark(SPAWN.x, SPAWN.z).inRange).toBe(false);
  });

  it('detects the nearest landmark by footprint distance', () => {
    for (const l of LANDMARKS) {
      const { landmark, inRange } = nearestLandmark(l.approach.x, l.approach.z);
      expect(landmark.id).toBe(l.id);
      expect(inRange).toBe(true);
    }
  });

  it('every fly-to approach point is walkable', () => {
    for (const l of LANDMARKS)
      expect(resolveCollisions(l.approach.x, l.approach.z, WORLD.characterRadius, colliders).hit).toBe(false);
  });

  it('shortens the camera boom when a tall building is between camera and character', () => {
    const tall = [{ x: 0, z: 5, hx: 2, hz: 2, height: 40, seed: 0, style: 0 }];
    const fraction = cameraBoomFraction({ x: 0, y: 2, z: 0 }, { x: 0, y: 5, z: 10 }, tall);
    expect(fraction).toBeLessThan(0.5);
    expect(cameraBoomFraction({ x: 0, y: 2, z: 0 }, { x: 0, y: 5, z: 10 }, [])).toBe(1);
  });
});
