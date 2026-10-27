/**
 * Lighthouse CI — mobile profile (Lighthouse's default emulation: Moto G-class device,
 * simulated slow 4G, 4× CPU slowdown). Runs against the static export served under the
 * same non-root base path as GitHub Pages. Results are stored as CI artifacts, not uploaded
 * to a public server.
 *
 * INP cannot be measured in a lab run; Total Blocking Time is the lab proxy asserted here.
 */
const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:4173/portfolio';

module.exports = {
  ci: {
    collect: {
      startServerCommand: 'pnpm exec tsx scripts/serve-static.ts 4173',
      startServerReadyPattern: 'Serving ./out',
      url: [
        `${base}/`,
        `${base}/architecture/multi-tenant-platform/`,
        `${base}/articles/llm-inference-under-gpu-memory-constraints/`,
        `${base}/about/`,
      ],
      numberOfRuns: 3,
      settings: {
        // Under mobile emulation (coarse pointer) the 3D city is opt-in, so these runs measure
        // what phones actually load by default. Desktop auto-start is covered by the budgets.
        skipAudits: ['bf-cache'],
      },
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.85 }],
        'categories:accessibility': ['error', { minScore: 0.95 }],
        'categories:best-practices': ['warn', { minScore: 0.9 }],
        'categories:seo': ['error', { minScore: 0.95 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'total-blocking-time': ['error', { maxNumericValue: 300 }],
      },
    },
    upload: { target: 'filesystem', outputDir: '.lighthouseci' },
  },
};
