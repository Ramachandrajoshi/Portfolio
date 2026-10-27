/**
 * Build-time social preview images (Open Graph / Twitter) with Satori → SVG → PNG (resvg).
 * One 1200×630 image per page type and per article, case study and project, written to
 * public/og/ (git-ignored, regenerated every build). Metadata in src/lib/metadata.ts
 * references these paths; scripts/check-export.ts verifies every referenced image exists.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { Resvg } from '@resvg/resvg-js';
import satori from 'satori';
import { profile } from '../src/data/profile';
import { generateCity } from '../src/components/hero3d/world';
import type * as Content from '../src/content';

// Generate images only for what production publishes (placeholder projects are excluded).
(process.env as Record<string, string | undefined>).NODE_ENV ??= 'production';

const require = createRequire(import.meta.url);
const font = (pkg: string) => readFileSync(require.resolve(pkg));
const fonts = [
  {
    name: 'Inter',
    data: font('@fontsource/inter/files/inter-latin-400-normal.woff'),
    weight: 400 as const,
    style: 'normal' as const,
  },
  {
    name: 'Inter',
    data: font('@fontsource/inter/files/inter-latin-600-normal.woff'),
    weight: 600 as const,
    style: 'normal' as const,
  },
  {
    name: 'Space Grotesk',
    data: font('@fontsource/space-grotesk/files/space-grotesk-latin-700-normal.woff'),
    weight: 700 as const,
    style: 'normal' as const,
  },
];

const OUT = join(process.cwd(), 'public', 'og');
const C = {
  bg: '#070b16',
  panel: '#0c1323',
  border: '#1f2b44',
  text: '#e7ecf5',
  muted: '#a3b0c6',
  cyan: '#22d3ee',
  violet: '#a78bfa',
  amber: '#f5b544',
};

// A skyline strip derived from the same procedural city as the 3D hero.
const skyline = generateCity()
  .filter((b) => b.z < 0)
  .slice(0, 46)
  .map((b, i) => ({
    left: 560 + i * 14,
    width: 10 + (b.hx % 4),
    height: Math.min(260, 30 + b.height * 4.5),
    lit: b.seed > 0.55,
  }));

function Card({
  eyebrow,
  title,
  subtitle,
  accent = C.cyan,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  accent?: string;
}) {
  const titleSize = title.length > 70 ? 50 : title.length > 44 ? 58 : 68;
  return (
    <div
      style={{
        width: 1200,
        height: 630,
        display: 'flex',
        flexDirection: 'column',
        background: C.bg,
        position: 'relative',
        fontFamily: 'Inter',
        color: C.text,
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          backgroundImage: `linear-gradient(${C.border}55 1px, transparent 1px), linear-gradient(90deg, ${C.border}55 1px, transparent 1px)`,
          backgroundSize: '48px 48px',
        }}
      />
      <div style={{ position: 'absolute', right: 0, bottom: 0, width: 700, height: 300, display: 'flex' }}>
        {skyline.map((b, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: b.left - 560,
              bottom: 0,
              width: b.width,
              height: b.height,
              background: b.lit ? '#14223d' : '#101a30',
              borderTop: `2px solid ${b.lit ? accent : '#22d3ee55'}`,
              display: 'flex',
            }}
          />
        ))}
      </div>
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: 4,
          background: `linear-gradient(90deg, ${C.cyan}, ${C.violet}, ${C.amber})`,
          display: 'flex',
        }}
      />
      <div
        style={{ display: 'flex', flexDirection: 'column', padding: '64px 72px', height: '100%', position: 'relative' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 10,
              border: `2px solid ${C.border}`,
              background: C.panel,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                width: 18,
                height: 22,
                borderLeft: `3px solid ${C.cyan}`,
                borderRight: `3px solid ${C.cyan}`,
                display: 'flex',
              }}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: 24, fontWeight: 600 }}>{profile.name}</span>
            <span style={{ fontSize: 16, color: C.muted, letterSpacing: 3, textTransform: 'uppercase' }}>
              {profile.title}
            </span>
          </div>
        </div>
        <span style={{ marginTop: 72, fontSize: 20, color: accent, letterSpacing: 4, textTransform: 'uppercase' }}>
          {eyebrow}
        </span>
        <span
          style={{
            marginTop: 18,
            fontFamily: 'Space Grotesk',
            fontSize: titleSize,
            fontWeight: 700,
            lineHeight: 1.08,
            maxWidth: 900,
          }}
        >
          {title}
        </span>
        {subtitle ? (
          <span style={{ marginTop: 22, fontSize: 26, color: C.muted, maxWidth: 640, lineHeight: 1.35 }}>
            {subtitle}
          </span>
        ) : null}
      </div>
    </div>
  );
}

const truncate = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s);

async function render(path: string, element: React.ReactElement) {
  const svg = await satori(element, { width: 1200, height: 630, fonts });
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } }).render().asPng();
  const file = join(OUT, path);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, png);
}

async function main() {
  const { allArticles, allCaseStudies, allProjects }: typeof Content = await import('../src/content');
  const jobs: [string, React.ReactElement][] = [
    [
      'default.png',
      <Card
        key="d"
        eyebrow="Ram's Digital Metropolis"
        title="Architecture, explained by the person who designs it"
        subtitle={truncate(profile.positioning, 130)}
      />,
    ],
    [
      'about.png',
      <Card
        key="a"
        eyebrow="Profile"
        title={`${profile.name}, ${profile.title}`}
        subtitle={truncate(profile.shortBio, 130)}
      />,
    ],
    [
      'architecture.png',
      <Card
        key="ar"
        eyebrow="Architecture"
        title="Case studies: constraints, decisions, trade-offs"
        subtitle="ADRs, C4 views and interactive system explorers."
      />,
    ],
    [
      'articles.png',
      <Card key="ap" eyebrow="Articles" title="Technical writing on systems and their trade-offs" accent={C.violet} />,
    ],
    ['projects.png', <Card key="p" eyebrow="Projects" title="Selected engineering projects" accent="#60a5fa" />],
    ['skills.png', <Card key="s" eyebrow="Skills" title="A competency map, linked to evidence" />],
    ['services.png', <Card key="sv" eyebrow="Services" title="Architecture & engineering services" accent={C.amber} />],
    ['contact.png', <Card key="c" eyebrow="Contact" title="Let's talk systems" />],
    ['resume.png', <Card key="r" eyebrow="Résumé" title={`${profile.name} — ${profile.title}`} />],
    ...allArticles.map((a): [string, React.ReactElement] => [
      `articles/${a.slug}.png`,
      <Card
        key={a.slug}
        eyebrow={a.series ? `Article · ${a.series}` : 'Article'}
        title={a.title}
        subtitle={truncate(a.description, 120)}
        accent={C.violet}
      />,
    ]),
    ...allCaseStudies.map((c): [string, React.ReactElement] => [
      `architecture/${c.slug}.png`,
      <Card key={c.slug} eyebrow={`Case study · ${c.domain}`} title={c.title} subtitle={truncate(c.problem, 120)} />,
    ]),
    ...allProjects.map((p): [string, React.ReactElement] => [
      `projects/${p.slug}.png`,
      <Card key={p.slug} eyebrow="Project" title={p.title} subtitle={truncate(p.summary, 120)} accent="#60a5fa" />,
    ]),
  ];
  for (const [path, element] of jobs) await render(path, element);
  console.log(`✓ og: ${jobs.length} social images written to public/og/`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
