'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { cx } from '@/lib/cx';
import type { SkillWithEvidence } from './evidence';

interface Category {
  id: string;
  label: string;
  description: string;
}

const SIZE = 560;
const C = SIZE / 2;
const RINGS = [
  { r: 90, label: 'Demonstrated in 2+ pages' },
  { r: 170, label: 'Demonstrated in 1 page' },
  { r: 245, label: 'Listed — evidence not yet published' },
];
const palette = ['var(--color-accent)', 'var(--color-secondary)', 'var(--color-tertiary)', 'var(--color-highlight)', 'var(--color-success)', 'var(--color-accent-strong)'];

/**
 * 2D skills constellation. Sectors are categories; the radial position encodes *evidence on
 * this site* (not self-assessed proficiency). Every dot is a focusable button; details are
 * shown in a panel, never on hover only. A full list view is rendered alongside on the server.
 */
export function SkillConstellation({ skills, categories }: { skills: SkillWithEvidence[]; categories: Category[] }) {
  const [filter, setFilter] = useState<string>('all');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<string | null>(null);

  const points = useMemo(() => {
    const sector = (2 * Math.PI) / categories.length;
    return categories.flatMap((cat, ci) => {
      const inCat = skills.filter((s) => s.category === cat.id);
      return inCat.map((skill, i) => {
        const ring = skill.evidence.length >= 2 ? 0 : skill.evidence.length === 1 ? 1 : 2;
        const inner = ring === 0 ? 35 : RINGS[ring - 1]!.r + 14;
        const outer = RINGS[ring]!.r - 14;
        // Deterministic spread inside the sector band.
        const t = (i + 0.5) / inCat.length;
        const angle = -Math.PI / 2 + ci * sector + sector * (0.12 + 0.76 * t);
        const radius = inner + (outer - inner) * (0.25 + 0.5 * ((i * 0.618) % 1));
        return { skill, color: palette[ci % palette.length]!, x: C + radius * Math.cos(angle), y: C + radius * Math.sin(angle) };
      });
    });
  }, [skills, categories]);

  const q = query.trim().toLowerCase();
  const visible = (s: SkillWithEvidence) => (filter === 'all' || s.category === filter) && (!q || s.name.toLowerCase().includes(q));
  const current = skills.find((s) => s.name === selected);
  const matches = skills.filter(visible).length;

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <label htmlFor="skill-search" className="sr-only">Search technologies</label>
          <input
            id="skill-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search technologies…"
            className="h-9 w-52 rounded-md border border-border-strong bg-surface px-3 text-sm placeholder:text-subtle"
          />
          <div role="group" aria-label="Filter by category" className="flex flex-wrap gap-1.5">
            {[{ id: 'all', label: 'All' }, ...categories].map((c) => (
              <button
                key={c.id}
                type="button"
                aria-pressed={filter === c.id}
                onClick={() => setFilter(c.id)}
                className={cx('rounded-full border px-2.5 py-1 text-xs', filter === c.id ? 'border-accent bg-accent/10 text-accent' : 'border-border text-muted hover:text-fg')}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>
        <p className="mt-2 text-xs text-muted" aria-live="polite">{matches} of {skills.length} technologies shown</p>
        <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="mx-auto mt-4 w-full max-w-[36rem]" role="group" aria-label="Skills constellation">
          <title>Skills constellation by category and evidence</title>
          {RINGS.map((ring) => (
            <circle key={ring.r} cx={C} cy={C} r={ring.r} fill="none" stroke="var(--color-border)" strokeDasharray="3 5" />
          ))}
          {categories.map((cat, i) => {
            const a = -Math.PI / 2 + (i * 2 * Math.PI) / categories.length;
            const mid = a + Math.PI / categories.length;
            return (
              <g key={cat.id} aria-hidden>
                <line x1={C} y1={C} x2={C + 260 * Math.cos(a)} y2={C + 260 * Math.sin(a)} stroke="var(--color-border)" />
                <text
                  x={C + 268 * Math.cos(mid)}
                  y={C + 268 * Math.sin(mid)}
                  textAnchor={Math.cos(mid) > 0.3 ? 'start' : Math.cos(mid) < -0.3 ? 'end' : 'middle'}
                  dominantBaseline="middle"
                  className="fill-[var(--color-text-muted)] font-mono text-[10px] uppercase tracking-wider"
                >
                  {cat.label}
                </text>
              </g>
            );
          })}
          {points.map(({ skill, color, x, y }) => {
            const on = visible(skill);
            const isSel = selected === skill.name;
            return (
              <g
                key={skill.name}
                role="button"
                tabIndex={on ? 0 : -1}
                aria-label={`${skill.name}: ${skill.evidence.length} evidence ${skill.evidence.length === 1 ? 'page' : 'pages'}`}
                aria-pressed={isSel}
                onClick={() => setSelected(isSel ? null : skill.name)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setSelected(isSel ? null : skill.name);
                  }
                }}
                className="cursor-pointer outline-none [&:focus-visible>circle:first-child]:stroke-[var(--color-focus)]"
                style={{ opacity: on ? 1 : 0.15, transition: 'opacity var(--duration-base)' }}
              >
                <circle cx={x} cy={y} r={isSel ? 11 : 8} fill="transparent" stroke={isSel ? color : 'transparent'} strokeWidth={2} />
                <circle cx={x} cy={y} r={isSel ? 6 : 4.5} fill={color} />
                <text x={x + 9} y={y + 3.5} className="pointer-events-none fill-[var(--color-text)] text-[9.5px]">{skill.name}</text>
              </g>
            );
          })}
        </svg>
        <ul className="mt-4 flex flex-wrap justify-center gap-x-5 gap-y-1 text-xs text-muted" aria-label="Ring legend">
          {RINGS.map((r, i) => (
            <li key={r.r}>
              Ring {i + 1}: {r.label}
            </li>
          ))}
        </ul>
      </div>
      <aside aria-live="polite" className="card h-fit p-5">
        {current ? (
          <div>
            <p className="eyebrow">{categories.find((c) => c.id === current.category)?.label}</p>
            <h3 className="mt-1 font-display text-xl font-semibold">{current.name}</h3>
            <p className="mt-2 text-sm text-muted">
              {current.level ? `Experience level: ${current.level}.` : 'Experience level not stated.'}
            </p>
            <p className="mt-4 text-sm font-medium">Where it is demonstrated on this site</p>
            {current.evidence.length ? (
              <ul className="mt-2 space-y-2 text-sm">
                {current.evidence.map((e) => (
                  <li key={e.href}>
                    <span className="font-mono text-[0.68rem] uppercase tracking-wider text-subtle">{e.kind}</span>
                    <Link href={e.href} className="link block">{e.title}</Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-muted">No published case study or article yet.</p>
            )}
          </div>
        ) : (
          <div className="text-sm text-muted">
            <p className="font-medium text-fg">How to read this map</p>
            <p className="mt-2">Sectors are categories. Distance from the centre shows how much published evidence this site contains for each technology — it is not a self-rating.</p>
            <p className="mt-2">Select a technology (click, or Tab then Enter) to see where it is demonstrated.</p>
          </div>
        )}
      </aside>
    </div>
  );
}
