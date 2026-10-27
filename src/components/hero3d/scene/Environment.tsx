'use client';

import { useLayoutEffect, useMemo } from 'react';
import * as THREE from 'three';
import type { ScenePalette } from '@/design/palette';
import { rng } from '../world';

const skyVertex = /* glsl */ `
  varying vec3 vDir;
  void main() {
    vDir = normalize(position);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const skyFragment = /* glsl */ `
  uniform vec3 uSky;
  uniform vec3 uHorizon;
  uniform vec3 uGlow;
  varying vec3 vDir;
  void main() {
    float h = clamp(vDir.y, 0.0, 1.0);
    vec3 col = mix(uHorizon, uSky, pow(h, 0.55));
    // Light pollution glow along the horizon.
    col += uGlow * pow(1.0 - h, 10.0) * 0.35;
    gl_FragColor = vec4(col, 1.0);
  }
`;

/** Gradient sky dome with horizon glow, plus stars at night. */
export function Sky({ palette, night }: { palette: ScenePalette; night: boolean }) {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: skyVertex,
        fragmentShader: skyFragment,
        side: THREE.BackSide,
        depthWrite: false,
        fog: false,
        uniforms: { uSky: { value: new THREE.Color() }, uHorizon: { value: new THREE.Color() }, uGlow: { value: new THREE.Color() } },
      }),
    [],
  );
  useLayoutEffect(() => {
    material.uniforms.uSky!.value.set(palette.sky);
    material.uniforms.uHorizon!.value.set(palette.horizon);
    material.uniforms.uGlow!.value.set(palette.rim);
  }, [material, palette]);
  const stars = useMemo(() => {
    const random = rng(3);
    const count = 900;
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const theta = random() * Math.PI * 2;
      const phi = Math.acos(0.15 + random() * 0.85);
      pos[i * 3] = Math.sin(phi) * Math.cos(theta) * 380;
      pos[i * 3 + 1] = Math.cos(phi) * 380;
      pos[i * 3 + 2] = Math.sin(phi) * Math.sin(theta) * 380;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    return g;
  }, []);
  useLayoutEffect(
    () => () => {
      material.dispose();
      stars.dispose();
    },
    [material, stars],
  );
  return (
    <group>
      <mesh material={material} renderOrder={-1}>
        <sphereGeometry args={[420, 32, 16]} />
      </mesh>
      {night ? (
        <points geometry={stars}>
          <pointsMaterial color="#cfe8ff" size={1.1} sizeAttenuation={false} transparent opacity={0.7} fog={false} depthWrite={false} />
        </points>
      ) : null}
    </group>
  );
}
