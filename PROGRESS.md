# Progress

Living status of the build. Updated at the end of every milestone. "Done" means implemented **and**
verified by the listed checks; anything not verified is listed as outstanding.

_Last updated: 2026-10-27_

## Starting point

The repository was empty (no commits, no files). Everything here was built from scratch on branch
`claude/ramachandra-joshi-portfolio-570ub7`.

## Proposal (summary)

- **Architecture:** a statically exported Next.js 16 App Router site on GitHub Pages. Content pages are
  server-rendered HTML; heavy experiences (3D city, React Flow explorer, GSAP story, Sandpack, search)
  are lazy islands. Details: [ARCHITECTURE.md](ARCHITECTURE.md).
- **Content:** Velite (Zod-validated MDX/YAML) for articles, case studies, ADRs, system models and
  projects; diagrams as code (D2, Mermaid) compiled to SVG at build time.
- **Key risks identified up front, and how they were handled:**
  - _Initial-JS budget vs framework baseline_ — Next.js + React use ~130 KB of the 150 KB. Mitigated by
    native `<dialog>`, server-only `tailwind-merge` and Zod, `motion/mini`, lazy islands; enforced per
    route on the real export.
  - _3D chunk budget_ — three + R3F ≈ 200 KB before the scene. No post-processing; one lazy chunk.
  - _Base path correctness_ — one deployment variable, centralised URL helpers, export checker and
    Playwright tests under `/portfolio`.
  - _Content integrity_ — provenance and evidential basis in the schema; placeholders hidden in
    production and checked by the export validator.
  - _Library compatibility_ — React pinned to 19.2 (R3F 9 supports < 19.4), three 0.180, Velite 0.4
    (its own Zod 3) alongside app Zod 4, TypeScript 5.9 (Next 16 support), Playwright 1.63 matching the
    pre-installed Chromium.

## Milestones

| #   | Milestone                                                                                                                                          | Status                                    | Verified by                                                                                                                                                                   |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Foundation: App Router, strict TS, Tailwind 4 + tokens, themes without flash, static export with derived base path, layout/nav/footer, routes      | ✅ Done                                   | Build under `/portfolio`; theme e2e (incl. pre-paint and no-JS); route e2e; export checker                                                                                    |
| 2   | 3D hero: procedural city, third-person character, camera with collision, landmarks, poster fallback, reduced motion, lazy loading                  | ✅ Done                                   | World-model unit tests; hero e2e (load, fly-to, E/Escape, focus, WebGL unavailable, WebGL init failure, reduced motion, classic mode, not loaded on content pages); 3D budget |
| 3   | Architecture showcase: listing, case-study model, ADR/trade-off components, React Flow explorer, code-sourced C4 diagrams, one complete case study | ✅ Done (4 complete case studies)         | Content tests (15 sections, ADRs, diagrams, explorer integrity); explorer e2e (lazy load, select, click, keyboard, flow, no-JS catalogue)                                     |
| 4   | Content platform: MDX pipeline, article routes, Shiki, TOC, progress, related, tags, Pagefind, MDX components, feeds, social images                | ✅ Done                                   | Frontmatter fixture tests (invalid fails strict build, drafts dropped); search e2e; feed/sitemap e2e; export checker                                                          |
| 5   | Portfolio content: about, projects, skills, services, testimonials, contact (Formspree), résumé                                                    | ✅ Done (with owner placeholders)         | Contact e2e (validation, success, failure, honeypot); routes e2e; axe                                                                                                         |
| 6   | SEO & quality: metadata, JSON-LD, sitemap, robots, link validation, unit/e2e/a11y tests, budgets, mobile profile                                   | ✅ Done                                   | Export checker (canonicals, JSON-LD, one h1, links); axe in both themes, desktop + mobile; Lighthouse CI config                                                               |
| 7   | Deployment: CI and Pages workflows, project-path validation, custom-domain docs                                                                    | ✅ Implemented — ⏳ not yet run on GitHub | Workflows written; every step was run locally. They have not executed on GitHub because the branch could not be pushed from this session (see Outstanding).                   |

## Current measurements (local, this commit)

Environment: Linux container, Node 22.22, Playwright Chromium 1243 (software WebGL), build with
`NEXT_PUBLIC_SITE_URL=http://localhost:4173/portfolio`.

- **Initial JavaScript per route (gzip -6):** 140.9–144.3 KB across 44 routes (budget 150 KB).
- **Lazy chunks (gzip):** 3D city 240.7 KB (budget 300), React Flow 57.8 KB (90), GSAP 43.8 KB (60),
  Sandpack 241.0 KB (400, only after "Run").
- **Static export:** 46 HTML pages, 1,820 internal references checked, 0 broken.
- **Unit tests:** 76 passing.
- **Playwright:** see the latest run below; desktop + mobile projects, axe in both themes.
- **Lighthouse CI (local, mobile simulation, gzip):** performance 0.95–0.98; accessibility 1.0; SEO 1.0;
  best practices 1.0; CLS 0.000; TBT 48–189 ms; LCP 2.2–2.8 s (see Outstanding). Container lab results
  are indicative; GitHub-runner CI is the reference.
- **Playwright (local):** 104 passed, 6 skipped (device-specific), desktop + mobile projects.

## Decisions log

All significant decisions are recorded as ADRs in [ARCHITECTURE.md](ARCHITECTURE.md#13-architecture-decision-records)
(ADR-001 … ADR-013). Notable course corrections during the build:

- Replaced Radix Dialog with native `<dialog>` after the budget checker measured 26 KB on every page.
- Moved Zod validation of `src/data` out of runtime after it appeared in client bundles.
- Kept `tailwind-merge` server-side (−9 KB on every page).
- Replaced Motion's React API with `motion/mini` in the 3D chunk (+40 KB → +3 KB).
- Velite's `s.isodate()` crashed on malformed dates; added a strict ISO validator so invalid dates are
  readable validation errors.
- Light-theme accent, warning and success colours darkened after axe found sub-4.5:1 contrast on tinted
  badges; Shiki switched to high-contrast GitHub themes.
- On touch/small/low-memory devices the 3D city is opt-in (saves data and battery, keeps mobile vitals clean).

## Outstanding

- **First deploy.** The branch is pushed and `ci.yml` runs on GitHub. Because the repository was empty,
  this branch became the default branch; `deploy.yml` runs on pushes to `main`. Create `main` from this
  branch (or rename it to `main`) and make it the default to trigger the first Pages deployment.
- **LCP on the home and about pages (simulated mobile).** Lighthouse (Lantern, slow-4G simulation,
  gzip-served export) measures LCP ≈ 2.2–2.3 s on articles and case studies but ≈ 2.6–2.8 s on the
  home and about pages; observed (unthrottled) LCP is ~150 ms and equals FCP. The simulated gap comes
  from the framework JS (~140 KB gzip) being counted on the critical path. CI fails on LCP > 3.0 s and
  warns above the 2.5 s target. Next steps: confirm on GitHub runners, then field data; options include
  reducing shared client JS further and trimming the duplicated RSC payload on the home page.
- **GitHub settings** (owner): Pages source = GitHub Actions; optional repository variable
  `NEXT_PUBLIC_FORMSPREE_FORM_ID`; enable Formspree's spam filtering for the form.
- **Field data:** INP and real-world LCP/CLS need measurement after launch (lab tests cannot measure INP).
- **Manual accessibility pass** with NVDA/VoiceOver, zoom and forced colours (steps in README).
- **Optional enhancements:** prefix-aware routing note in the LLM case study could become an article;
  component-level (L3) C4 views for case studies B–D; a light-theme screenshot review of every page on
  real hardware.

## Information needed from the owner

Everything below is currently a placeholder (visible only in development builds):

1. Role start date and a one-to-two sentence summary of scope at the current employer, plus verified
   highlights; confirmation of the employer's exact name (then set `employer.verifiedName: true`).
2. Earlier roles (title, organisation, dates) — most recent first.
3. Location (city/country) and a public contact email, if you want them shown.
4. A résumé PDF (or confirmation that the structured résumé page is sufficient).
5. A Formspree form id.
6. Real projects you want listed, with public repository/demo links; details for the two project
   templates (experimental language/compiler in Rust, local LLM inference lab) — measured numbers only.
7. Whether any case study may be relabelled from _illustrative_ to _sanitised_ or _production-derived_
   (only if approved by the relevant organisation).
8. Approved testimonials, if any (exact wording, author approval, optional public source link).
9. Skill levels, only if you want to state them.
