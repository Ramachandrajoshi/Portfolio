'use client';

import { useFrame } from '@react-three/fiber';
import { useMemo, useRef, type RefObject } from 'react';
import * as THREE from 'three';
import type { ScenePalette } from '@/design/palette';
import { WORLD, type CharacterState } from '../world';

/**
 * Procedurally built third-person character (no external model). Limbs are pivoted groups
 * animated from the simulation state: idle breathing, walk and run cycles, airborne tuck.
 */
export function Character({
  state,
  palette,
  reducedMotion,
}: {
  state: RefObject<CharacterState>;
  palette: ScenePalette;
  reducedMotion: boolean;
}) {
  const root = useRef<THREE.Group>(null);
  const body = useRef<THREE.Group>(null);
  const leftLeg = useRef<THREE.Group>(null);
  const rightLeg = useRef<THREE.Group>(null);
  const leftArm = useRef<THREE.Group>(null);
  const rightArm = useRef<THREE.Group>(null);
  const shadow = useRef<THREE.Mesh>(null);
  const phase = useRef(0);
  const clock = useRef(0);

  const materials = useMemo(
    () => ({
      suit: new THREE.MeshStandardMaterial({ color: palette.character, roughness: 0.45, metalness: 0.35 }),
      dark: new THREE.MeshStandardMaterial({ color: '#1c2538', roughness: 0.6, metalness: 0.5 }),
      glow: new THREE.MeshBasicMaterial({ color: palette.visor, toneMapped: false }),
    }),
    [palette],
  );

  useFrame((_, dt) => {
    const s = state.current;
    const g = root.current;
    if (!s || !g) return;
    clock.current += dt;
    g.position.set(s.x, s.y, s.z);
    g.rotation.y = s.heading;

    const t = Math.min(1, s.speed / WORLD.runSpeed);
    phase.current += dt * (4 + s.speed * 0.95);
    const swing = Math.sin(phase.current) * (0.15 + 0.85 * t) * (s.speed > 0.3 ? 1 : 0);
    const airborne = !s.grounded;

    if (leftLeg.current && rightLeg.current) {
      leftLeg.current.rotation.x = airborne ? -0.7 : swing * 0.9;
      rightLeg.current.rotation.x = airborne ? 0.35 : -swing * 0.9;
    }
    if (leftArm.current && rightArm.current) {
      leftArm.current.rotation.x = airborne ? -1.6 : -swing * 0.8;
      rightArm.current.rotation.x = airborne ? -1.6 : swing * 0.8;
      leftArm.current.rotation.z = airborne ? 0.5 : 0.08;
      rightArm.current.rotation.z = airborne ? -0.5 : -0.08;
    }
    if (body.current) {
      const breathe = reducedMotion ? 0 : Math.sin(clock.current * 2.2) * 0.015 * (1 - t);
      const bob = Math.abs(Math.sin(phase.current)) * 0.06 * t;
      body.current.position.y = breathe + bob;
      body.current.rotation.x = -0.18 * t; // lean into the run
    }
    if (shadow.current) {
      const k = 1 / (1 + s.y * 0.35);
      shadow.current.scale.setScalar(k);
      shadow.current.position.y = -s.y + 0.02;
    }
  });

  return (
    <group ref={root}>
      {/* Blob shadow: cheap contact grounding without shadow maps. */}
      <mesh ref={shadow} rotation-x={-Math.PI / 2}>
        <circleGeometry args={[0.65, 24]} />
        <meshBasicMaterial color="#000" transparent opacity={0.45} depthWrite={false} />
      </mesh>
      <group ref={body}>
        {/* Legs pivot at the hips. */}
        <group ref={leftLeg} position={[-0.17, 0.92, 0]}>
          <mesh position={[0, -0.42, 0]} material={materials.dark}>
            <capsuleGeometry args={[0.11, 0.6, 4, 8]} />
          </mesh>
          <mesh position={[0, -0.86, -0.06]} material={materials.suit}>
            <boxGeometry args={[0.2, 0.1, 0.34]} />
          </mesh>
        </group>
        <group ref={rightLeg} position={[0.17, 0.92, 0]}>
          <mesh position={[0, -0.42, 0]} material={materials.dark}>
            <capsuleGeometry args={[0.11, 0.6, 4, 8]} />
          </mesh>
          <mesh position={[0, -0.86, -0.06]} material={materials.suit}>
            <boxGeometry args={[0.2, 0.1, 0.34]} />
          </mesh>
        </group>
        {/* Torso */}
        <mesh position={[0, 1.28, 0]} material={materials.suit}>
          <capsuleGeometry args={[0.27, 0.48, 6, 12]} />
        </mesh>
        <mesh position={[0, 1.33, 0.255]} material={materials.dark}>
          <boxGeometry args={[0.36, 0.5, 0.14]} />
        </mesh>
        {/* Back-pack light strip — reads as the character's "signal". */}
        <mesh position={[0, 1.35, 0.33]} material={materials.glow}>
          <boxGeometry args={[0.05, 0.36, 0.02]} />
        </mesh>
        <mesh position={[0, 1.04, 0]} material={materials.glow}>
          <torusGeometry args={[0.27, 0.018, 6, 24]} />
        </mesh>
        {/* Head + visor */}
        <mesh position={[0, 1.83, 0]} material={materials.suit}>
          <sphereGeometry args={[0.21, 20, 16]} />
        </mesh>
        <mesh position={[0, 1.85, -0.13]} material={materials.glow}>
          <boxGeometry args={[0.3, 0.08, 0.12]} />
        </mesh>
        {/* Arms pivot at the shoulders. */}
        <group ref={leftArm} position={[-0.36, 1.55, 0]}>
          <mesh position={[0, -0.32, 0]} material={materials.suit}>
            <capsuleGeometry args={[0.085, 0.48, 4, 8]} />
          </mesh>
        </group>
        <group ref={rightArm} position={[0.36, 1.55, 0]}>
          <mesh position={[0, -0.32, 0]} material={materials.suit}>
            <capsuleGeometry args={[0.085, 0.48, 4, 8]} />
          </mesh>
        </group>
      </group>
    </group>
  );
}
