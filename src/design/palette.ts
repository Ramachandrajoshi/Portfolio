/**
 * Scene palette for the 3D city, derived from src/styles/tokens.css.
 * tests/unit/tokens.test.ts asserts that every brand colour used here exists in the tokens.
 */
export const brand = {
  navy900: '#070b16',
  navy850: '#0b1120',
  navy800: '#0f172a',
  graphite700: '#1c2538',
  graphite600: '#2a3550',
  cyan400: '#22d3ee',
  cyan300: '#67e8f9',
  cyan700: '#0e7490',
  blue400: '#60a5fa',
  blue700: '#1d4ed8',
  violet400: '#a78bfa',
  violet700: '#6d28d9',
  amber400: '#f5b544',
  amber700: '#b45309',
  slate200: '#e2e8f0',
  slate400: '#94a3b8',
} as const;

export interface ScenePalette {
  sky: string;
  horizon: string;
  fog: string;
  fogNear: number;
  fogFar: number;
  ground: string;
  road: string;
  roadLine: string;
  sidewalk: string;
  buildingA: string;
  buildingB: string;
  buildingC: string;
  rim: string;
  windowWarm: string;
  windowCool: string;
  windowIntensity: number;
  particles: string;
  hemiSky: string;
  hemiGround: string;
  sun: string;
  sunIntensity: number;
  character: string;
  visor: string;
}

/** Night city — the primary identity. */
export const nightPalette: ScenePalette = {
  sky: brand.navy900,
  horizon: '#101b38',
  fog: '#0a1124',
  fogNear: 40,
  fogFar: 210,
  ground: '#080d1a',
  road: '#0c1324',
  roadLine: brand.cyan400,
  sidewalk: '#111a2e',
  buildingA: '#14223d',
  buildingB: '#1f2a42',
  buildingC: '#1a2140',
  rim: brand.cyan400,
  windowWarm: brand.amber400,
  windowCool: brand.cyan300,
  windowIntensity: 1,
  particles: brand.cyan300,
  hemiSky: '#3b5b9a',
  hemiGround: '#05070d',
  sun: '#8fb4ff',
  sunIntensity: 0.9,
  character: brand.slate200,
  visor: brand.cyan400,
};

/** Light theme — a daylight "blueprint" rendering of the same city. */
export const blueprintPalette: ScenePalette = {
  sky: '#dfe8f5',
  horizon: '#f5f7fb',
  fog: '#e6edf7',
  fogNear: 50,
  fogFar: 240,
  ground: '#e9eef6',
  road: '#d6dfec',
  roadLine: brand.cyan700,
  sidewalk: '#f2f5fa',
  buildingA: '#f8fafc',
  buildingB: '#e2e8f0',
  buildingC: '#edf1f7',
  rim: brand.cyan700,
  windowWarm: brand.amber700,
  windowCool: brand.blue700,
  windowIntensity: 0.35,
  particles: brand.cyan700,
  hemiSky: '#ffffff',
  hemiGround: '#a9b6cb',
  sun: '#ffffff',
  sunIntensity: 1.6,
  character: '#1c2538',
  visor: brand.cyan700,
};
