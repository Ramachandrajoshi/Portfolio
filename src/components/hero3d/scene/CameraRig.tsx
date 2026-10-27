'use client';

import { useFrame, useThree } from '@react-three/fiber';
import { useRef, type RefObject } from 'react';
import * as THREE from 'three';
import { cameraBoomFraction, type Building, type CharacterState } from '../world';

export interface CameraState {
  yaw: number;
  pitch: number;
  /** 0 → 1 progress of the optional intro fly-in; 1 = finished/skipped. */
  intro: number;
  /** performance.now() when the intro started (wall-clock based, frame-rate independent). */
  introStart?: number;
}

const INTRO_MS = 3200;

const BOOM = 9.5;
const ease = (t: number) => 1 - Math.pow(1 - t, 3);

/**
 * Third-person follow camera: damped position, orbit from pointer drags, gentle
 * re-alignment behind the character while moving forward, and a collision-aware boom that
 * never ends inside or behind a building. The intro is a short skippable fly-in.
 */
export function CameraRig({
  character,
  camera: camState,
  buildings,
  look,
  forwardOnly,
  reducedMotion,
}: {
  character: RefObject<CharacterState>;
  camera: RefObject<CameraState>;
  buildings: Building[];
  look: () => { yaw: number; pitch: number };
  forwardOnly: () => boolean;
  reducedMotion: boolean;
}) {
  const { camera } = useThree();
  const target = useRef(new THREE.Vector3());
  const desired = useRef(new THREE.Vector3());
  const introFrom = useRef(new THREE.Vector3(70, 95, 130));

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const s = character.current;
    const c = camState.current;
    if (!s || !c) return;
    const delta = look();
    c.yaw += delta.yaw;
    c.pitch = THREE.MathUtils.clamp(c.pitch + delta.pitch, 0.08, 1.05);
    // Drift behind the character while it runs forward (never fights a manual orbit).
    if (s.speed > 2 && forwardOnly() && delta.yaw === 0) {
      let d = s.heading - c.yaw;
      d = Math.atan2(Math.sin(d), Math.cos(d));
      c.yaw += d * (1 - Math.exp(-dt * 0.9));
    }

    target.current.set(s.x, s.y + 1.7, s.z);
    const horizontal = Math.cos(c.pitch) * BOOM;
    desired.current.set(
      s.x + Math.sin(c.yaw) * horizontal,
      s.y + 1.7 + Math.sin(c.pitch) * BOOM,
      s.z + Math.cos(c.yaw) * horizontal,
    );
    const fraction = cameraBoomFraction(target.current, desired.current, buildings);
    if (fraction < 1) desired.current.lerpVectors(target.current, desired.current, fraction);

    if (c.intro < 1) {
      c.introStart ??= performance.now();
      c.intro = reducedMotion ? 1 : Math.min(1, (performance.now() - c.introStart) / INTRO_MS);
      const k = ease(c.intro);
      camera.position.lerpVectors(introFrom.current, desired.current, k);
      const lookAt = new THREE.Vector3().lerpVectors(new THREE.Vector3(0, 8, -15), target.current, k);
      camera.lookAt(lookAt);
      return;
    }
    // Snap in quickly when the boom shortens (collision), ease out slowly otherwise.
    const pull =
      camera.position.distanceToSquared(target.current) > desired.current.distanceToSquared(target.current) ? 18 : 6;
    camera.position.lerp(desired.current, reducedMotion ? 1 : 1 - Math.exp(-dt * pull));
    camera.lookAt(target.current);
  }, -1);

  return null;
}
