import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { blueprintPalette, brand, nightPalette } from '@/design/palette';

const tokens = readFileSync(join(process.cwd(), 'src/styles/tokens.css'), 'utf8').toLowerCase();

describe('design tokens', () => {
  it('every brand colour used by the 3D scene exists in tokens.css', () => {
    for (const [name, hex] of Object.entries(brand)) expect(tokens, `${name} ${hex}`).toContain(hex.toLowerCase());
  });

  it('defines both themes with the same semantic tokens', () => {
    const light = tokens.slice(0, tokens.indexOf('@media (prefers-color-scheme: dark)'));
    const dark = tokens.slice(tokens.indexOf(":root[data-theme='dark']"));
    const names = (block: string) => [...block.matchAll(/(--color-[a-z0-9-]+):/g)].map((m) => m[1]).sort();
    expect(new Set(names(dark))).toEqual(new Set(names(light)));
  });

  it('scene palettes define every key for both themes', () => {
    expect(Object.keys(blueprintPalette).sort()).toEqual(Object.keys(nightPalette).sort());
  });
});

/** WCAG 2.x relative luminance contrast. */
function contrast(a: string, b: string) {
  const lum = (hex: string) => {
    const [r, g, bl] = [1, 3, 5]
      .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
      .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
    return 0.2126 * r! + 0.7152 * g! + 0.0722 * bl!;
  };
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi! + 0.05) / (lo! + 0.05);
}

describe('colour contrast (WCAG 2.2 AA)', () => {
  const pairs: [string, string, string, number][] = [
    ['light text on bg', '#0b1220', '#f5f7fb', 4.5],
    ['light muted on bg', '#45526b', '#f5f7fb', 4.5],
    ['light subtle on surface', '#5d6a82', '#ffffff', 4.5],
    ['light accent on white', '#0b6580', '#ffffff', 4.5],
    ['light accent on 10% accent tint', '#0b6580', '#e7f0f2', 4.5],
    ['light accent button text', '#ffffff', '#0b6580', 4.5],
    ['light highlight on 10% tint', '#92400e', '#f4ece7', 4.5],
    ['light success on 10% tint', '#166534', '#e8f0eb', 4.5],
    ['dark text on bg', '#e7ecf5', '#070b16', 4.5],
    ['dark muted on bg', '#a3b0c6', '#070b16', 4.5],
    ['dark subtle on surface', '#8593ab', '#0c1323', 4.5],
    ['dark accent on bg', '#22d3ee', '#070b16', 4.5],
    ['dark accent button text', '#04111a', '#22d3ee', 4.5],
    ['dark tertiary on bg', '#a78bfa', '#070b16', 4.5],
    ['dark highlight on bg', '#f5b544', '#070b16', 4.5],
    ['light danger on white', '#b91c1c', '#ffffff', 4.5],
  ];
  it.each(pairs)('%s ≥ %d:1', (_label, fg, bg, min) => {
    expect(contrast(fg, bg)).toBeGreaterThanOrEqual(min);
  });
});
