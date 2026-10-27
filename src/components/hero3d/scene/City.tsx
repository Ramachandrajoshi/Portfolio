'use client';

import { useFrame } from '@react-three/fiber';
import { useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import type { ScenePalette } from '@/design/palette';
import { LANDMARKS, rng, WORLD, type Building } from '../world';
import {
  buildingFragment,
  buildingVertex,
  glowFragment,
  groundFragment,
  groundVertex,
  particleFragment,
  particleVertex,
  uvVertex,
} from './shaders';

const unitBox = (() => {
  const g = new THREE.BoxGeometry(1, 1, 1);
  g.translate(0, 0.5, 0); // base at y = 0 so scale.y = height
  return g;
})();

function useBuildingMaterial(palette: ScenePalette) {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: buildingVertex,
        fragmentShader: buildingFragment,
        fog: true,
        uniforms: {
          ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog),
          uColorA: { value: new THREE.Color() },
          uColorB: { value: new THREE.Color() },
          uColorC: { value: new THREE.Color() },
          uRim: { value: new THREE.Color() },
          uWarm: { value: new THREE.Color() },
          uCool: { value: new THREE.Color() },
          uWindows: { value: 1 },
          uTime: { value: 0 },
        },
      }),
    [],
  );
  useLayoutEffect(() => {
    const u = material.uniforms;
    u.uColorA!.value.set(palette.buildingA);
    u.uColorB!.value.set(palette.buildingB);
    u.uColorC!.value.set(palette.buildingC);
    u.uRim!.value.set(palette.rim);
    u.uWarm!.value.set(palette.windowWarm);
    u.uCool!.value.set(palette.windowCool);
    u.uWindows!.value = palette.windowIntensity;
  }, [material, palette]);
  useLayoutEffect(() => () => material.dispose(), [material]);
  return material;
}

/** All buildings of one kind in a single draw call (InstancedMesh + per-instance seed/style). */
export function Buildings({ buildings, palette, animate }: { buildings: Building[]; palette: ScenePalette; animate: boolean }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const material = useBuildingMaterial(palette);
  const geometry = useMemo(() => {
    const g = unitBox.clone();
    g.setAttribute('aSeed', new THREE.InstancedBufferAttribute(new Float32Array(buildings.map((b) => b.seed)), 1));
    g.setAttribute('aStyle', new THREE.InstancedBufferAttribute(new Float32Array(buildings.map((b) => b.style)), 1));
    return g;
  }, [buildings]);

  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const m = new THREE.Matrix4();
    buildings.forEach((b, i) => {
      m.makeScale(b.hx * 2, b.height, b.hz * 2);
      m.setPosition(b.x, b.y ?? 0, b.z);
      mesh.setMatrixAt(i, m);
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [buildings]);
  useLayoutEffect(() => () => geometry.dispose(), [geometry]);

  useFrame((_, dt) => {
    if (animate) material.uniforms.uTime!.value += dt;
  });

  return <instancedMesh ref={ref} args={[geometry, material, buildings.length]} frustumCulled={false} />;
}

export function Ground({ palette, animate }: { palette: ScenePalette; animate: boolean }) {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: groundVertex,
        fragmentShader: groundFragment,
        fog: true,
        uniforms: {
          ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog),
          uGround: { value: new THREE.Color() },
          uRoad: { value: new THREE.Color() },
          uLine: { value: new THREE.Color() },
          uSidewalk: { value: new THREE.Color() },
          uTime: { value: 0 },
          uPads: { value: LANDMARKS.map((l) => new THREE.Vector3(l.x, l.z, Math.max(l.halfX, l.halfZ) + 2.5)) },
          uPadColors: { value: LANDMARKS.map((l) => new THREE.Color(l.color)) },
        },
      }),
    [],
  );
  useLayoutEffect(() => {
    const u = material.uniforms;
    u.uGround!.value.set(palette.ground);
    u.uRoad!.value.set(palette.road);
    u.uLine!.value.set(palette.roadLine);
    u.uSidewalk!.value.set(palette.sidewalk);
  }, [material, palette]);
  useLayoutEffect(() => () => material.dispose(), [material]);
  useFrame((_, dt) => {
    if (animate) material.uniforms.uTime!.value += dt;
  });
  return (
    <mesh rotation-x={-Math.PI / 2} material={material} receiveShadow={false}>
      <planeGeometry args={[520, 520, 1, 1]} />
    </mesh>
  );
}

/** Street lights along every road, plus soft additive light pools on the pavement. */
export function StreetLights({ palette }: { palette: ScenePalette }) {
  const poles = useRef<THREE.InstancedMesh>(null);
  const heads = useRef<THREE.InstancedMesh>(null);
  const pools = useRef<THREE.InstancedMesh>(null);
  const positions = useMemo(() => {
    const list: { x: number; z: number }[] = [];
    for (let road = -70; road <= 70; road += 20) {
      for (let along = -60; along <= 60; along += 20) {
        for (const side of [-1, 1]) {
          // Keep the central plaza open (spawn point and the camera's first view).
          const nearPlaza = Math.abs(along) < 8 && Math.abs(road) === 10;
          if (nearPlaza) continue;
          for (const p of [
            { x: road + side * 3.6, z: along },
            { x: along, z: road + side * 3.6 },
          ]) {
            // Keep sightlines to landmarks and their approach points clear.
            const blocked = LANDMARKS.some((l) => Math.hypot(p.x - l.x, p.z - l.z) < 13 || Math.hypot(p.x - l.approach.x, p.z - l.approach.z) < 7);
            if (!blocked && !(Math.abs(p.x) < 4 && p.z < 0 && p.z > -34)) list.push(p);
          }
        }
      }
    }
    return list;
  }, []);
  const poolMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: uvVertex,
        fragmentShader: glowFragment,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: { uColor: { value: new THREE.Color() }, uOpacity: { value: 0.22 } },
      }),
    [],
  );
  useLayoutEffect(() => {
    poolMaterial.uniforms.uColor!.value.set(palette.windowCool);
    poolMaterial.uniforms.uOpacity!.value = palette.windowIntensity > 0.5 ? 0.2 : 0.06;
  }, [poolMaterial, palette]);
  useLayoutEffect(() => {
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0));
    positions.forEach((p, i) => {
      m.makeTranslation(p.x, 2.25, p.z);
      poles.current?.setMatrixAt(i, m);
      m.makeTranslation(p.x, 4.55, p.z);
      heads.current?.setMatrixAt(i, m);
      m.compose(new THREE.Vector3(p.x, 0.03, p.z), q, new THREE.Vector3(7, 7, 1));
      pools.current?.setMatrixAt(i, m);
    });
    for (const mesh of [poles.current, heads.current, pools.current]) {
      if (!mesh) continue;
      mesh.instanceMatrix.needsUpdate = true;
      mesh.computeBoundingSphere();
    }
  }, [positions]);
  return (
    <group>
      <instancedMesh ref={poles} args={[undefined, undefined, positions.length]}>
        <cylinderGeometry args={[0.06, 0.09, 4.5, 6]} />
        <meshStandardMaterial color={palette.buildingB} roughness={0.6} metalness={0.4} />
      </instancedMesh>
      <instancedMesh ref={heads} args={[undefined, undefined, positions.length]}>
        <boxGeometry args={[0.5, 0.12, 0.5]} />
        <meshBasicMaterial color={palette.windowCool} toneMapped={false} />
      </instancedMesh>
      <instancedMesh ref={pools} args={[undefined, poolMaterial, positions.length]}>
        <planeGeometry args={[1, 1]} />
      </instancedMesh>
    </group>
  );
}

/** Slowly rising "data motes". Frozen in place under reduced motion. */
export function Particles({ palette, animate, count = 700 }: { palette: ScenePalette; animate: boolean; count?: number }) {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: particleVertex,
        fragmentShader: particleFragment,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        fog: true,
        uniforms: {
          ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog),
          uTime: { value: 0 },
          uColor: { value: new THREE.Color() },
          uPixelRatio: { value: 1 },
        },
      }),
    [],
  );
  const geometry = useMemo(() => {
    const random = rng(99);
    const pos = new Float32Array(count * 3);
    const speed = new Float32Array(count);
    const size = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (random() - 0.5) * 150;
      pos[i * 3 + 1] = random() * 46;
      pos[i * 3 + 2] = (random() - 0.5) * 150;
      speed[i] = 0.4 + random() * 1.4;
      size[i] = 1 + random() * 2.5;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('aSpeed', new THREE.BufferAttribute(speed, 1));
    g.setAttribute('aSize', new THREE.BufferAttribute(size, 1));
    return g;
  }, [count]);
  useLayoutEffect(() => {
    material.uniforms.uColor!.value.set(palette.particles);
  }, [material, palette]);
  useLayoutEffect(
    () => () => {
      material.dispose();
      geometry.dispose();
    },
    [material, geometry],
  );
  useFrame((state, dt) => {
    material.uniforms.uPixelRatio!.value = state.gl.getPixelRatio();
    if (animate) material.uniforms.uTime!.value += dt;
  });
  return <points geometry={geometry} material={material} frustumCulled={false} />;
}

/** Air traffic: light streaks gliding along sky lanes above the avenues. */
export function AirTraffic({ animate, palette }: { animate: boolean; palette: ScenePalette }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const cars = useMemo(() => {
    const random = rng(4242);
    return Array.from({ length: 46 }, () => {
      const alongX = random() < 0.5;
      const lane = -70 + Math.floor(random() * 8) * 20 + (random() < 0.5 ? -1.2 : 1.2);
      return {
        alongX,
        lane,
        height: 20 + random() * 16,
        offset: random() * 200,
        speed: (random() < 0.5 ? -1 : 1) * (14 + random() * 12),
      };
    });
  }, []);
  const colors = useMemo(() => {
    const random = rng(5);
    const warm = new THREE.Color(palette.windowWarm);
    const cool = new THREE.Color(palette.windowCool);
    return cars.map(() => (random() < 0.5 ? warm : cool));
  }, [cars, palette]);
  const time = useRef(0);
  const m = useMemo(() => new THREE.Matrix4(), []);
  const q = useMemo(() => new THREE.Quaternion(), []);
  const update = () => {
    const mesh = ref.current;
    if (!mesh) return;
    cars.forEach((c, i) => {
      const t = ((((c.offset + time.current * c.speed) % 200) + 200) % 200) - 100;
      const pos = c.alongX ? new THREE.Vector3(t, c.height, c.lane) : new THREE.Vector3(c.lane, c.height, t);
      q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), c.alongX ? 0 : Math.PI / 2);
      m.compose(pos, q, new THREE.Vector3(2.2, 0.18, 0.4));
      mesh.setMatrixAt(i, m);
    });
    mesh.instanceMatrix.needsUpdate = true;
  };
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    colors.forEach((c, i) => mesh.setColorAt(i, c));
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    update();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- initial placement only
  }, [colors]);
  useFrame((_, dt) => {
    if (!animate) return;
    time.current += dt;
    update();
  });
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, cars.length]} frustumCulled={false}>
      <boxGeometry args={[1, 1, 1]} />
      <meshBasicMaterial toneMapped={false} />
    </instancedMesh>
  );
}

/** Invisible-but-felt boundary: a faint light wall at the edge of the walkable city. */
export function Boundary({ palette }: { palette: ScenePalette }) {
  const b = WORLD.bound + 1;
  return (
    <group>
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i} position={[i === 0 ? b : i === 1 ? -b : 0, 1.2, i === 2 ? b : i === 3 ? -b : 0]} rotation-y={i < 2 ? Math.PI / 2 : 0}>
          <planeGeometry args={[b * 2, 2.4]} />
          <meshBasicMaterial color={palette.rim} transparent opacity={0.06} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
}
