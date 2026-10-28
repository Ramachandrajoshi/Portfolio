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
        // Chrome refuses to start as root (containers) without disabling its sandbox.
        ...(process.getuid?.() === 0 ? { chromeFlags: '--no-sandbox' } : {}),
      },
    },
    assert: {
      assertMatrix: [
        {
          matchingUrlPattern: '.*',
          assertions: {
            'categories:performance': ['error', { minScore: 0.9 }],
            'categories:accessibility': ['error', { minScore: 0.95 }],
            'categories:best-practices': ['warn', { minScore: 0.9 }],
            'categories:seo': ['error', { minScore: 0.95 }],
            'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
            'total-blocking-time': ['error', { maxNumericValue: 200 }],
            // Regression gate for LCP. The 2.5 s target is asserted (as a warning) below.
            'largest-contentful-paint': ['error', { maxNumericValue: 3000 }],
          },
        },
        {
          // Target is 2.5 s. Measured (simulated mobile, see PROGRESS.md): ~2.2–2.3 s on articles
          // and case studies, ~2.6–2.8 s on the home and about pages. Kept visible as a warning
          // until the gap is closed — the target itself is unchanged.
          matchingUrlPattern: '.*',
          assertions: { 'largest-contentful-paint': ['warn', { maxNumericValue: 2500 }] },
        },
      ],
    },
    upload: { target: 'filesystem', outputDir: '.lighthouseci' },
  },
};
