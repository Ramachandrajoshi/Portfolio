'use client';

import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import type { ScenePalette } from '@/design/palette';
import { LANDMARKS, rng, type Building, type Landmark, type LandmarkId } from '../world';
import { Buildings } from './City';

interface LandmarkProps {
  landmark: Landmark;
  palette: ScenePalette;
  animate: boolean;
  active: boolean;
}

/** Canvas-texture label sprite: crisp text without a font-rendering dependency. */
function Label({ text, sub, color, y }: { text: string; sub: string; color: string; y: number }) {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = 'rgba(7, 11, 22, 0.72)';
    ctx.strokeStyle = color;
    ctx.lineWidth = 4;
    const r = 36;
    ctx.beginPath();
    ctx.roundRect(8, 40, 1008, 176, r);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = color;
    ctx.font = '600 30px ui-monospace, SFMono-Regular, Menlo, monospace';
    ctx.textAlign = 'center';
    ctx.fillText(sub.toUpperCase(), 512, 102);
    ctx.fillStyle = '#e7ecf5';
    ctx.font = '600 64px system-ui, -apple-system, Segoe UI, sans-serif';
    ctx.fillText(text, 512, 178);
    const t = new THREE.CanvasTexture(canvas);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    return t;
  }, [text, sub, color]);
  useLayoutEffect(() => () => texture.dispose(), [texture]);
  return (
    <sprite position={[0, y, 0]} scale={[9, 2.25, 1]}>
      <spriteMaterial map={texture} transparent depthWrite={false} toneMapped={false} />
    </sprite>
  );
}

function emissive(color: string, intensity = 2) {
  return new THREE.MeshStandardMaterial({
    color: '#0b1120',
    emissive: color,
    emissiveIntensity: intensity,
    roughness: 0.4,
    metalness: 0.2,
    toneMapped: false,
  });
}

/** Facade material for landmark shells: lighter than the city so landmarks read as landmarks. */
function shellMaterial(palette: ScenePalette, accent: string) {
  return new THREE.MeshStandardMaterial({
    color: palette.buildingB,
    emissive: accent,
    emissiveIntensity: 0.08,
    roughness: 0.35,
    metalness: 0.55,
  });
}

/** Soft additive halo sprite — the cheap stand-in for bloom. */
function Halo({ color, size, y = 0, opacity = 0.55 }: { color: string; size: number; y?: number; opacity?: number }) {
  const texture = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const ctx = c.getContext('2d')!;
    const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.25, 'rgba(255,255,255,0.45)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(c);
  }, []);
  useLayoutEffect(() => () => texture.dispose(), [texture]);
  return (
    <sprite position={[0, y, 0]} scale={[size, size, 1]}>
      <spriteMaterial
        map={texture}
        color={color}
        transparent
        opacity={opacity}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        toneMapped={false}
      />
    </sprite>
  );
}

function ArchitectureSpire({ landmark, palette, animate, active }: LandmarkProps) {
  const rings = useRef<THREE.Group>(null);
  const glow = useMemo(() => emissive(landmark.color, 2.2), [landmark.color]);
  useFrame((_, dt) => {
    if (animate && rings.current) rings.current.rotation.y += dt * (active ? 0.7 : 0.25);
  });
  // Stacked, tapering layers — presentation, application, domain, data.
  const layers = [
    { y: 0, h: 7, r: 4.4 },
    { y: 7, h: 9, r: 3.6 },
    { y: 16, h: 10, r: 2.8 },
    { y: 26, h: 12, r: 2 },
  ];
  const layerBuildings = useMemo<Building[]>(
    () => layers.map((l, i) => ({ x: 0, y: l.y, z: 0, hx: l.r, hz: l.r, height: l.h, seed: 0.2 + i * 0.17, style: 2 })),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- static geometry
    [],
  );
  return (
    <group>
      {/* Layers use the city's facade shader (windows, rims) in its accent style. */}
      <Buildings buildings={layerBuildings} palette={palette} animate={animate} />
      {layers.map((l, i) => (
        <group key={i}>
          <mesh position={[0, l.y + l.h - 0.15, 0]} material={glow}>
            <boxGeometry args={[l.r * 2 + 0.25, 0.22, l.r * 2 + 0.25]} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 41, 0]} material={glow}>
        <octahedronGeometry args={[1.2, 0]} />
      </mesh>
      <Halo color={landmark.color} size={14} y={41} />
      {/* Vertical light seams on each layer */}
      {layers.map((l, i) =>
        [-1, 1].map((sx) => (
          <mesh key={`${i}${sx}`} position={[sx * l.r, l.y + l.h / 2, l.r + 0.01]} material={glow}>
            <boxGeometry args={[0.08, l.h * 0.9, 0.05]} />
          </mesh>
        )),
      )}
      <group ref={rings} position={[0, 0, 0]}>
        {[12, 21, 31].map((y, i) => (
          <mesh key={y} position={[0, y, 0]} rotation={[Math.PI / 2 + (i - 1) * 0.12, 0, 0]} material={glow}>
            <torusGeometry args={[6.2 - i * 1.1, 0.07, 6, 64]} />
          </mesh>
        ))}
      </group>
      <Label text={landmark.name} sub={landmark.district} color={landmark.color} y={46} />
    </group>
  );
}

function ComputeCore({ landmark, palette, animate, active }: LandmarkProps) {
  const core = useRef<THREE.Mesh>(null);
  const orbit = useRef<THREE.Group>(null);
  const racks = useRef<THREE.InstancedMesh>(null);
  const shell = useMemo(() => shellMaterial(palette, landmark.color), [palette, landmark.color]);
  const glow = useMemo(() => emissive(landmark.color, 2.5), [landmark.color]);
  const rackPositions = useMemo(() => {
    const list: [number, number][] = [];
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      list.push([Math.cos(a) * 4.2, Math.sin(a) * 4.2]);
    }
    return list;
  }, []);
  useLayoutEffect(() => {
    const m = new THREE.Matrix4();
    rackPositions.forEach(([x, z], i) => {
      m.makeRotationY(Math.atan2(x, z));
      m.setPosition(x, 3.2, z);
      racks.current?.setMatrixAt(i, m);
    });
    if (racks.current) racks.current.instanceMatrix.needsUpdate = true;
  }, [rackPositions]);
  useFrame((_, dt) => {
    if (!animate) return;
    if (core.current) {
      core.current.rotation.y += dt * 0.6;
      core.current.rotation.x += dt * 0.25;
    }
    if (orbit.current) orbit.current.rotation.y -= dt * (active ? 1.2 : 0.5);
  });
  return (
    <group>
      <mesh position={[0, 0.4, 0]} material={shell}>
        <cylinderGeometry args={[5.6, 5.8, 0.8, 8]} />
      </mesh>
      <instancedMesh ref={racks} args={[undefined, undefined, rackPositions.length]}>
        <boxGeometry args={[1.6, 5.6, 0.9]} />
        <meshStandardMaterial
          color={palette.buildingA}
          emissive={landmark.color}
          emissiveIntensity={0.35}
          roughness={0.4}
          metalness={0.6}
        />
      </instancedMesh>
      <mesh ref={core} position={[0, 7.5, 0]} material={glow}>
        <icosahedronGeometry args={[1.8, 1]} />
      </mesh>
      <Halo color={landmark.color} size={13} y={7.5} opacity={0.6} />
      <mesh position={[0, 7.5, 0]}>
        <icosahedronGeometry args={[2.6, 1]} />
        <meshBasicMaterial color={landmark.color} wireframe transparent opacity={0.35} toneMapped={false} />
      </mesh>
      <group ref={orbit} position={[0, 7.5, 0]}>
        {Array.from({ length: 10 }, (_, i) => {
          const a = (i / 10) * Math.PI * 2;
          return (
            <mesh key={i} position={[Math.cos(a) * 4, Math.sin(a * 2) * 0.8, Math.sin(a) * 4]} material={glow}>
              <boxGeometry args={[0.3, 0.3, 0.3]} />
            </mesh>
          );
        })}
      </group>
      <Label text={landmark.name} sub={landmark.district} color={landmark.color} y={14} />
    </group>
  );
}

function IndustrialHub({ landmark, palette, animate, active }: LandmarkProps) {
  const pulses = useRef<THREE.Group>(null);
  const shell = useMemo(() => shellMaterial(palette, landmark.color), [palette, landmark.color]);
  const glow = useMemo(() => emissive(landmark.color, 2.2), [landmark.color]);
  const time = useRef(0);
  useFrame((_, dt) => {
    if (!animate || !pulses.current) return;
    time.current += dt * (active ? 1.4 : 0.8);
    pulses.current.children.forEach((child, i) => {
      const t = (time.current * 0.5 + i / 3) % 1;
      child.scale.setScalar(1 + t * 9);
      const mat = (child as THREE.Mesh).material as THREE.MeshBasicMaterial;
      mat.opacity = 0.7 * (1 - t);
    });
  });
  return (
    <group>
      {/* Factory hall with saw-tooth roof */}
      <mesh position={[-1.5, 2.5, 0]} material={shell}>
        <boxGeometry args={[8, 5, 8]} />
      </mesh>
      {[-4.5, -1.5, 1.5].map((x) => (
        <mesh key={x} position={[x + 0.8, 5.6, 0]} rotation={[0, 0, 0.5]} material={shell}>
          <boxGeometry args={[0.3, 2.4, 8]} />
        </mesh>
      ))}
      <mesh position={[-1.5, 5.05, 4.05]} material={glow}>
        <boxGeometry args={[8, 0.15, 0.1]} />
      </mesh>
      {/* Silos */}
      {[0, 1].map((i) => (
        <mesh key={i} position={[4.2, 3.5, -2 + i * 3.6]} material={shell}>
          <cylinderGeometry args={[1.3, 1.3, 7, 16]} />
        </mesh>
      ))}
      {/* Broker mast with MQTT-style pulses */}
      <mesh position={[4.2, 10, 3.2]} material={shell}>
        <cylinderGeometry args={[0.12, 0.25, 13, 8]} />
      </mesh>
      <mesh position={[4.2, 16.6, 3.2]} material={glow}>
        <sphereGeometry args={[0.45, 16, 12]} />
      </mesh>
      <group position={[4.2, 0, 3.2]}>
        <Halo color={landmark.color} size={7} y={16.6} />
      </group>
      <group ref={pulses} position={[4.2, 16.6, 3.2]}>
        {[0, 1, 2].map((i) => (
          <mesh key={i} rotation-x={Math.PI / 2}>
            <torusGeometry args={[0.6, 0.03, 6, 48]} />
            <meshBasicMaterial color={landmark.color} transparent opacity={0.5} toneMapped={false} depthWrite={false} />
          </mesh>
        ))}
      </group>
      <Label text={landmark.name} sub={landmark.district} color={landmark.color} y={21} />
    </group>
  );
}

function Workshop({ landmark, palette, animate, active }: LandmarkProps) {
  const panels = useRef<THREE.Group>(null);
  const shell = useMemo(() => {
    const m = shellMaterial(palette, landmark.color);
    m.side = THREE.DoubleSide;
    return m;
  }, [palette, landmark.color]);
  const glow = useMemo(() => emissive(landmark.color, 2), [landmark.color]);
  const codeTexture = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = 256;
    c.height = 160;
    const ctx = c.getContext('2d')!;
    ctx.fillStyle = 'rgba(11,17,32,0.85)';
    ctx.fillRect(0, 0, 256, 160);
    const random = rng(11);
    for (let line = 0; line < 9; line++) {
      let x = 14 + (random() < 0.5 ? 0 : 18);
      while (x < 230) {
        const w = 10 + random() * 40;
        ctx.fillStyle = ['#22d3ee', '#a78bfa', '#60a5fa', '#f5b544', '#94a3b8'][Math.floor(random() * 5)]!;
        ctx.fillRect(x, 14 + line * 16, w, 6);
        x += w + 8;
        if (random() < 0.2) break;
      }
    }
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, []);
  useLayoutEffect(() => () => codeTexture.dispose(), [codeTexture]);
  const time = useRef(0);
  useFrame((_, dt) => {
    if (!animate || !panels.current) return;
    time.current += dt;
    panels.current.children.forEach((p, i) => {
      p.position.y = 6.5 + i * 1.7 + Math.sin(time.current * (active ? 1.6 : 0.8) + i) * 0.35;
    });
  });
  return (
    <group>
      {/* Hangar: a half-cylinder vault */}
      <mesh position={[0, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={shell}>
        <cylinderGeometry args={[4.6, 4.6, 11, 24, 1, true, 0, Math.PI]} />
      </mesh>
      <mesh position={[0, 0.02, 0]} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[11, 9.2]} />
        <meshStandardMaterial color={palette.road} />
      </mesh>
      {[-5.5, 5.5].map((x) => (
        <mesh key={x} position={[x, 2.3, 0]} rotation={[0, Math.PI / 2, 0]} material={glow}>
          <torusGeometry args={[4.6, 0.08, 6, 32, Math.PI]} />
        </mesh>
      ))}
      <group ref={panels} position={[0, 0, 0]}>
        {[-3, 0, 3].map((x, i) => (
          <mesh key={x} position={[x, 6.5 + i * 1.7, -1 + i]} rotation={[0, -0.3 + i * 0.3, 0]}>
            <planeGeometry args={[3.2, 2]} />
            <meshBasicMaterial
              map={codeTexture}
              transparent
              opacity={0.92}
              side={THREE.DoubleSide}
              toneMapped={false}
            />
          </mesh>
        ))}
      </group>
      <Label text={landmark.name} sub={landmark.district} color={landmark.color} y={13.5} />
    </group>
  );
}

function ProfileBeacon({ landmark, palette, animate, active }: LandmarkProps) {
  const ring = useRef<THREE.Mesh>(null);
  const beam = useRef<THREE.Mesh>(null);
  const shell = useMemo(() => shellMaterial(palette, palette.visor), [palette]);
  const time = useRef(0);
  useFrame((_, dt) => {
    if (!animate) return;
    time.current += dt;
    if (ring.current) ring.current.rotation.z += dt * 0.4;
    if (beam.current)
      (beam.current.material as THREE.MeshBasicMaterial).opacity =
        (active ? 0.32 : 0.18) + Math.sin(time.current * 2) * 0.05;
  });
  return (
    <group>
      <mesh position={[0, 0.25, 0]} material={shell}>
        <cylinderGeometry args={[3.2, 3.4, 0.5, 32]} />
      </mesh>
      <mesh position={[0, 4.5, 0]} material={shell}>
        <boxGeometry args={[1.4, 8, 0.5]} />
      </mesh>
      <mesh position={[0, 4.5, -0.26]}>
        <planeGeometry args={[1.1, 7.4]} />
        <meshBasicMaterial color={palette.visor} transparent opacity={0.55} toneMapped={false} />
      </mesh>
      <Halo color={palette.visor} size={8} y={9.4} opacity={0.4} />
      <mesh ref={ring} position={[0, 9.4, 0]} rotation-x={Math.PI / 2}>
        <torusGeometry args={[2, 0.06, 6, 64]} />
        <meshBasicMaterial color={palette.visor} toneMapped={false} />
      </mesh>
      <mesh ref={beam} position={[0, 30, 0]}>
        <cylinderGeometry args={[0.35, 0.9, 60, 16, 1, true]} />
        <meshBasicMaterial
          color={palette.visor}
          transparent
          opacity={0.2}
          depthWrite={false}
          side={THREE.DoubleSide}
          toneMapped={false}
        />
      </mesh>
      <Label text={landmark.name} sub={landmark.district} color={palette.visor} y={12.5} />
    </group>
  );
}

const components: Record<LandmarkId, (p: LandmarkProps) => React.JSX.Element> = {
  architecture: ArchitectureSpire,
  ai: ComputeCore,
  iot: IndustrialHub,
  projects: Workshop,
  profile: ProfileBeacon,
};

export function Landmarks({
  palette,
  animate,
  activeId,
  onSelect,
}: {
  palette: ScenePalette;
  animate: boolean;
  activeId: LandmarkId | null;
  onSelect: (id: LandmarkId) => void;
}) {
  return (
    <group>
      {LANDMARKS.map((l) => {
        const Component = components[l.id];
        return (
          <group
            key={l.id}
            position={[l.x, 0, l.z]}
            onClick={(e: ThreeEvent<MouseEvent>) => {
              e.stopPropagation();
              onSelect(l.id);
            }}
            onPointerOver={() => (document.body.style.cursor = 'pointer')}
            onPointerOut={() => (document.body.style.cursor = '')}
          >
            <Component landmark={l} palette={palette} animate={animate} active={activeId === l.id} />
            <pointLight
              position={[0, 6, 0]}
              color={l.color}
              intensity={activeId === l.id ? 22 : 10}
              distance={24}
              decay={1.6}
            />
          </group>
        );
      })}
    </group>
  );
}
