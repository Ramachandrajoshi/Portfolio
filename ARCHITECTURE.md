# Architecture

This document describes how the portfolio is built and why. It is written the way the case studies
on the site are written: context and constraints first, then structure, then decisions with their
trade-offs. Decisions are recorded as ADRs at the end.

- [1. Context and constraints](#1-context-and-constraints)
- [2. System overview](#2-system-overview)
- [3. Static rendering and export strategy](#3-static-rendering-and-export-strategy)
- [4. Component boundaries](#4-component-boundaries)
- [5. Content pipeline](#5-content-pipeline)
- [6. 3D hero loading strategy](#6-3d-hero-loading-strategy)
- [7. Architecture diagrams as code](#7-architecture-diagrams-as-code)
- [8. SEO and generated assets](#8-seo-and-generated-assets)
- [9. Deployment design](#9-deployment-design)
- [10. Performance budgets](#10-performance-budgets)
- [11. Accessibility strategy](#11-accessibility-strategy)
- [12. Quality gates](#12-quality-gates)
- [13. Architecture Decision Records](#13-architecture-decision-records)

---

## 1. Context and constraints

| Constraint                                                                | Consequence                                                                   |
| ------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Hosted on GitHub Pages                                                    | Fully static output; no server, API routes, ISR or image optimiser.           |
| Must work under a project path (`/<repo>/`) _and_ at a custom-domain root | All URLs derive from one variable; no hard-coded base path.                   |
| Initial JS ≤ 150 KB gzip per route; 3D ≤ 300 KB gzip                      | Heavy libraries are lazy islands; budgets enforced against the real export.   |
| WCAG 2.2 AA; nothing essential may depend on WebGL                        | Server-rendered content first; every visual has a text equivalent.            |
| No fabricated facts                                                       | Provenance and placeholders are part of the data model and enforced by tests. |

## 2. System overview

```text
                         ┌──────────── build time (CI) ────────────┐
content/**/*.mdx|yaml ──▶│ Velite (Zod) ──▶ .velite/*.json          │
content/**/*.d2|mmd   ──▶│ build-diagrams ──▶ public/generated/*.svg│
src/data/*.ts         ──▶│ validate-data (Zod)                      │
                         │ generate-og (Satori) ──▶ public/og/*.png │
                         │ next build (output: export) ──▶ out/     │
                         │ pagefind ──▶ out/pagefind/               │
                         │ check-export · check-budgets · e2e · LHCI│
                         └──────────────────────────────────────────┘
                                          │ upload-pages-artifact
                                          ▼
                              GitHub Pages (static files)
                                          │
                 ┌────────────────────────┴────────────────────────┐
           HTML + CSS (all content)                  Lazy islands on demand
                 │                                   ├─ 3D city (three, R3F)      — home only
                 │                                   ├─ System explorer (React Flow)
                 │                                   ├─ Scroll story (GSAP)
                 │                                   ├─ Sandpack (on "Run")
                 │                                   └─ Pagefind (search page)
```

## 3. Static rendering and export strategy

- **App Router, `output: 'export'`, `trailingSlash: true`.** Every route is pre-rendered to
  `out/<route>/index.html`, which GitHub Pages serves for `/<route>/` without redirects.
- **Dynamic segments** (`/architecture/[slug]/`, `/articles/[slug]/`, `/projects/[slug]/`,
  `/articles/tags/[tag]/`) use `generateStaticParams` with `dynamicParams = false`, so an unknown slug
  is a build-time 404, never a runtime lookup.
- **Server components by default.** Content pages render entirely on the server at build time. Client
  components exist only where browser APIs or interaction require them (theme toggle, navigation state,
  table-of-contents tracking, tabs, forms, the islands above).
- **Metadata routes** (`sitemap.ts`, `robots.ts`, `feed.xml/route.ts`) use `dynamic = 'force-static'`.
- **Images:** `images.unoptimized = true` (no optimiser exists on static hosting). Diagrams are SVG,
  social images are pre-rendered PNGs, and the hero poster is inline SVG; there are no large raster
  images on the critical path.

## 4. Component boundaries

| Path                           | Responsibility                                                                               | Runs in                                       |
| ------------------------------ | -------------------------------------------------------------------------------------------- | --------------------------------------------- |
| `src/app/`                     | Routes, layouts, metadata                                                                    | Server (build)                                |
| `src/components/layout/`       | Header, footer, breadcrumbs, mobile nav (native `<dialog>`)                                  | Server + small client islands                 |
| `src/components/hero3d/`       | `world.ts` (pure model), `scene/*` (R3F), `HeroStage` (loader), `HeroPoster` (SVG)           | Client (lazy) / server (poster)               |
| `src/components/architecture/` | ADR cards, trade-off tables, quality-attribute tables, C4 views, system explorer + catalogue | Server; explorer is a lazy client island      |
| `src/components/mdx/`          | MDX renderer and component library                                                           | Server; `Tabs`, `SandpackLauncher` are client |
| `src/content/`                 | Typed access layer over Velite output (ordering, lookups, draft rules)                       | Server only                                   |
| `src/data/`                    | Hand-edited profile, skills, services, navigation, testimonials                              | Server; validated in build/tests              |
| `src/lib/`                     | URL helpers, deployment config, metadata, structured data, preferences, contact logic        | Mixed                                         |
| `scripts/`                     | Diagram compiler, OG generator, export/budget checks, data validation, static server         | Node (build/CI)                               |

**Rules enforced by lint:** client components may not import `#site/content` (content stays on the
server) or `tailwind-merge` (server-only `cn`; clients use the 1 KB `cx`).

## 5. Content pipeline

Velite is the single content pipeline ([ADR-003](#adr-003-velite-and-mdx-as-the-single-content-pipeline)).

| Collection    | Source                                    | Notes                                                                                                                                                          |
| ------------- | ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `articles`    | `content/articles/*.mdx`                  | Zod-validated frontmatter (`title`, `description`, `date`, `tags`, `series`, `cover`, `draft`, `provenance`); slug from file name; reading time, TOC, excerpt. |
| `caseStudies` | `content/architecture/<slug>/index.mdx`   | Quality-attribute scenarios with an evidential `basis`; C4 diagram list; status.                                                                               |
| `adrs`        | `content/architecture/<slug>/adrs/*.yaml` | Unique ids (`MT-ADR-001`), alternatives, consequences, risks, follow-ups.                                                                                      |
| `systems`     | `content/architecture/<slug>/system.yaml` | Explorer nodes, edges and causal flows; referential integrity checked in the schema.                                                                           |
| `projects`    | `content/projects/*.mdx`                  | Verified links only; `placeholder` provenance is excluded from production.                                                                                     |

**MDX processing:** GFM, `rehype-slug`, `rehype-autolink-headings`, Shiki (dual light/dark high-contrast
themes via CSS variables). Compiled MDX is rendered by `MDXContent` on the server at build time.

**Integrity checks (`prepareContent` in `velite.config.ts`)** fail the build when an ADR references an
unknown case study, a system node references an unknown ADR, a project references an unknown case
study, or two articles share a slug. Drafts are removed here — before routes, feeds, the sitemap or the
search index can see them. Dates use a strict ISO validator so a malformed date is a readable error.

**Search:** Pagefind indexes only elements marked `data-pagefind-body` (case studies, articles,
projects) after `next build`, producing a chunked static index in `out/pagefind/`. The search page loads
`pagefind.js` dynamically; plain HTML search forms submit to `/search/?q=`.

## 6. 3D hero loading strategy

The city is a **gateway, not a gate** ([ADR-002](#adr-002-the-3d-hero-is-isolated-from-content-pages)).

1. **First paint:** server-rendered hero text and actions over `HeroPoster`, an isometric SVG of the
   _same_ procedural city (same seed). No JavaScript or image request is needed for the LCP element.
2. **Activation (`HeroStage`)**, all of which must hold:
   - the hero is visible (IntersectionObserver);
   - WebGL is available (a cheap probe on a detached canvas);
   - the visitor has not chosen **classic mode** and does not prefer **reduced motion**;
   - the device is not constrained (fine pointer and ≥ 768 px, no data-saver, ≥ 4 GB device memory);
   - the browser is idle (`requestIdleCallback`, 2.5 s timeout).
     Otherwise a one-click **"Enter the 3D city"** button is shown.
3. **Download:** `React.lazy(() => import('./CityExperience'))` — three, R3F and the scene are one lazy
   chunk, never referenced by any HTML page.
4. **Run:** the canvas fades in over the poster after its first frame. Rendering pauses when the hero
   leaves the viewport (`frameloop="never"`) and when the tab is hidden.
5. **Failure:** an error boundary and a `webglcontextlost` handler return to the poster with an
   explanation; all actions remain available.

**Scene architecture.** `world.ts` is a pure, unit-tested model: seeded city generation, colliders,
camera-relative movement, circle-vs-AABB collision, camera-boom collision, landmark proximity. The R3F
components only render that model. Buildings are one `InstancedMesh` with a custom shader
(anti-aliased procedural windows, rim light, fog); the ground is one shader plane drawing roads, lane
markings, plaza rings and landmark pads; street lights, traffic and particles are instanced. There are
no external models or textures. Post-processing bloom was rejected for budget reasons
([ADR-012](#adr-012-no-post-processing-in-the-3d-scene)); glow comes from emissive materials and
additive halo sprites.

**Input.** Keys are captured only while the city has focus, so WASD, arrows and Space never hijack page
scrolling; state resets on blur, focus loss and tab hiding. Escape closes the landmark panel, then
releases focus. The "Fly to a district" list, the landmark panel and the district cards below the hero
are the keyboard and non-3D alternatives.

## 7. Architecture diagrams as code

([ADR-004](#adr-004-diagrams-as-code-compiled-at-build-time))

- **Sources:** `content/**/*.d2` (C4 context/container/component views) and `content/**/*.mmd`
  (sequence and state diagrams), versioned next to the content that uses them.
- **Compiler:** `scripts/build-diagrams.ts` — D2 via its WASM build (no binary, no server) and Mermaid
  in headless Chromium with `securityLevel: 'strict'` and SVG text labels. Each source yields
  `<id>.light.svg` and `<id>.dark.svg` themed from the design tokens, plus a manifest with dimensions
  (no layout shift) and a content hash (incremental rebuilds).
- **Rendering:** `<Diagram>` / `<D2>` / `<Mermaid>` emit two `<img>` elements; CSS shows the one for
  the active theme and the hidden lazy image is never fetched. Every diagram requires a text
  description; the source is one click away.
- **Failure:** invalid source fails the build with the file and parser message.
- **Interactive views:** `system.yaml` models drive the React Flow explorer; a unit test keeps
  explorer models connected and flows causally ordered.

## 8. SEO and generated assets

- `pageMetadata()` builds titles, descriptions, canonical URLs, Open Graph and Twitter cards with
  **absolute** URLs from `absoluteUrl()` (Next's relative resolution against `metadataBase` would drop
  a project base path).
- JSON-LD via `schema-dts`: `Person` (verified facts only — the employer is omitted until its name is
  verified), `WebSite`, `TechArticle` for articles and case studies, `BreadcrumbList` on every page with
  breadcrumbs.
- `sitemap.xml` (excludes drafts and the testimonials page while it is empty), `robots.txt`,
  `feed.xml` (RSS 2.0).
- Social images: `scripts/generate-og.tsx` renders 1200×630 PNGs with Satori + resvg for every page
  type, article, case study and project.
- `noindex` for search, empty testimonials and placeholder projects.

## 9. Deployment design

([ADR-001](#adr-001-static-export-to-github-pages), [ADR-007](#adr-007-one-variable-decides-where-the-site-lives))

- **One variable:** `NEXT_PUBLIC_SITE_URL` (e.g. `https://ramachandrajoshi.github.io/Portfolio`).
  `src/lib/deployment.ts` derives `basePath`/`assetPrefix`; `src/lib/urls.ts` provides `route()`,
  `asset()`, `absoluteUrl()`. In CI, `actions/configure-pages` supplies the URL, so moving to a custom
  domain needs no code change.
- **Workflows:** `ci.yml` (PRs and branches) and `deploy.yml` (main). Deployment uses
  `actions/upload-pages-artifact` + `actions/deploy-pages`; there is no `gh-pages` branch. The deploy
  job alone holds `pages: write` and `id-token: write`; builds are read-only. A `pages` concurrency
  group prevents overlapping deployments.
- **Artifact validation before upload:** export checker, budgets and a Playwright smoke run against the
  artifact served under its real base path.
- **Local parity:** `scripts/serve-static.ts` reproduces Pages semantics (base path mount, directory
  index, 404 page, nothing served outside the base path).

## 10. Performance budgets

| Budget                      | Limit                | Enforced by                                                                       |
| --------------------------- | -------------------- | --------------------------------------------------------------------------------- |
| Initial JS per route (gzip) | 150 KB               | `scripts/check-budgets.ts` — sums every `<script src>` in each exported HTML page |
| 3D city chunk(s)            | 300 KB               | same script, chunks identified by stable markers                                  |
| React Flow explorer         | 90 KB                | same                                                                              |
| GSAP scroll story           | 60 KB                | same                                                                              |
| Sandpack                    | 400 KB               | same (loaded only after "Run")                                                    |
| LCP / CLS / TBT (mobile)    | 2.5 s / 0.1 / 300 ms | Lighthouse CI assertions                                                          |

The framework baseline (Next.js runtime + React DOM) is ~130 KB of the 150 KB initial budget, which
drove several decisions: native `<dialog>` instead of a dialog library (−26 KB), `tailwind-merge` kept
server-side (−9 KB), Zod kept out of client bundles, Motion used through `motion/mini` (~3 KB).
Current measurements are printed by `pnpm budgets` and recorded in `PROGRESS.md`.

## 11. Accessibility strategy

- Semantic landmarks, a skip link, one `<h1>` per page (checked by `check-export`), logical headings.
- One global, high-contrast `:focus-visible` style; colour tokens verified for WCAG AA contrast in
  unit tests (including text on tinted badge backgrounds).
- Theme applied before first paint; `prefers-color-scheme` respected without JavaScript.
- `prefers-reduced-motion`: motion tokens collapse to 0 ms; GSAP story is not loaded; 3D does not
  auto-start, and when entered has no intro flight or ambient animation.
- Every visual has a text equivalent: diagrams require descriptions; the explorer ships a full
  server-rendered component catalogue; the skills map has a list view; the 3D city mirrors the
  conventional navigation.
- Forms: visible labels, `aria-invalid`/`aria-describedby`, an error summary that receives focus,
  live-region status, and a honeypot hidden from assistive technology.
- Automated: axe (WCAG 2.0–2.2 A/AA tags) on key pages in both themes in Playwright; Lighthouse
  accessibility ≥ 0.95. Manual verification steps are listed in `README.md`.

## 12. Quality gates

| Gate                          | Tool                                                                                                        |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Formatting / lint / types     | Prettier, ESLint (Next + TypeScript + React Compiler rules), `tsc --strict`                                 |
| Content schemas and integrity | Velite (strict) + `prepareContent`                                                                          |
| Data modules                  | `scripts/validate-data.ts` (Zod)                                                                            |
| Unit tests                    | Vitest: deployment/URLs, world model, contact logic, tokens & contrast, content model, frontmatter fixtures |
| Static export                 | `scripts/check-export.ts`                                                                                   |
| Budgets                       | `scripts/check-budgets.ts`                                                                                  |
| Browser tests                 | Playwright: routes, theme, hero fallbacks, explorer, contact, search, mobile, keyboard, axe                 |
| Web vitals (lab)              | Lighthouse CI, mobile profile                                                                               |
| Commits                       | Husky + lint-staged + commitlint (Conventional Commits), release-please changelog                           |

---

## 13. Architecture Decision Records

### ADR-001: Static export to GitHub Pages

- **Status:** accepted
- **Context:** A personal site with build-time-known content, no user accounts and no server-side
  data. Hosting should be free, reliable and require no operations.
- **Decision:** Next.js App Router with `output: 'export'`, deployed to GitHub Pages through GitHub
  Actions.
- **Alternatives:** a Node/edge host (Vercel, a VM) — rejected: adds operational surface and cost for
  no feature the site needs; a static-site generator without React — rejected: the 3D scene, React Flow
  and MDX components are React.
- **Consequences:** ➕ no runtime to operate or attack, global CDN, trivially cacheable; ➖ no API
  routes (contact via Formspree), no image optimiser, no request-time rendering, and base-path handling
  must be explicit.
- **Risks / follow-ups:** GitHub Pages limits (artifact size, bandwidth) — monitored via the build size.

### ADR-002: The 3D hero is isolated from content pages

- **Status:** accepted
- **Context:** The 3D city is the most expensive feature (~240 KB gzip, GPU work) and optional by nature.
- **Decision:** One lazily imported chunk, activated only on the home page under the conditions in §6,
  with a poster of the same city as first paint and fallback. No other route can load it.
- **Alternatives:** a persistent background canvas across routes — rejected: cost on every page, focus
  and accessibility complexity; a separate game app — rejected: splits the experience from the content.
- **Consequences:** ➕ content pages stay fast; failure is contained; ➖ the scene re-initialises when
  returning to the home page.

### ADR-003: Velite and MDX as the single content pipeline

- **Status:** accepted
- **Context:** Long-form technical writing needs components (ADRs, diagrams, explorers, sandboxes),
  type-safe metadata, and validation that fails the build.
- **Decision:** Velite (Zod schemas, MDX compiled at build time) for every collection; no second
  content framework.
- **Alternatives:** Contentlayer — unmaintained; `@next/mdx` alone — no collections, schemas or
  cross-document validation; a headless CMS — needs network at build and an account, content leaves
  the repo.
- **Consequences:** ➕ content is reviewable in pull requests, validated and typed; ➖ Velite's schema
  library is Zod 3-based (separate from the app's Zod 4) — accepted, the two never mix at runtime.

### ADR-004: Diagrams as code, compiled at build time

- **Status:** accepted
- **Context:** Architecture diagrams must stay in sync with the text, be reviewable, and cost nothing
  at runtime.
- **Decision:** D2 for C4 views and Mermaid for sequence/state diagrams, compiled to themed SVG by a
  build script; interactive explorer models in YAML.
- **Alternatives:** Structurizr DSL — strongest C4 semantics but needs a JVM in the build; LikeC4 —
  attractive, but heavier tooling than needed; runtime Mermaid — hundreds of KB of JavaScript and no
  content without JS.
- **Consequences:** ➕ diffs review like code, no runtime renderer, invalid sources fail CI; ➖ C4
  semantics are by convention (classes and labels) rather than enforced by a C4-specific tool; Mermaid
  needs a headless browser in CI (already present for Playwright).

### ADR-005: Contact through an external form service

- **Status:** accepted
- **Context:** Static hosting has no server to receive form posts; secrets cannot be shipped to the browser.
- **Decision:** Formspree, configured by a public form id (`NEXT_PUBLIC_FORMSPREE_FORM_ID`). The form is
  a real HTML form posting to Formspree (works without JS) and is enhanced with inline validation,
  `fetch` submission and live status.
- **Alternatives:** a serverless function — reintroduces a runtime to operate; `mailto:` only — poor UX.
- **Consequences:** ➕ no backend, no secrets; ➖ third-party dependency and data processor (disclosed
  on the page); spam protection relies on the honeypot plus Formspree's server-side filtering, which
  should be enabled in the Formspree dashboard.

### ADR-006: Reduced motion and WebGL failure handling

- **Status:** accepted
- **Context:** Motion can cause discomfort; WebGL can be missing, blocklisted or lost mid-session.
- **Decision:** Reduced motion → no auto-start, no GSAP, zero-duration transitions, no camera intro or
  ambient animation if the city is entered. WebGL failure (probe, initialisation error, context loss) →
  poster plus explanation; navigation and content unaffected. Both paths are covered by Playwright tests.
- **Consequences:** ➕ the site is complete without motion or WebGL; ➖ some visitors never see the city
  unless they choose to — by design.

### ADR-007: One variable decides where the site lives

- **Status:** accepted
- **Decision:** `NEXT_PUBLIC_SITE_URL` is the only deployment input; base path, asset prefix,
  canonical URLs, feeds and structured data all derive from it.
- **Consequences:** ➕ the repository name is never hard-coded; switching to a custom domain is a
  settings change; ➖ every raw asset URL must use `asset()` — enforced by the export checker, which
  fails on references outside the base path.

### ADR-008: Validation at build time, not in the browser

- **Status:** accepted
- **Context:** Zod in a shared data module was pulled into every client bundle (~15 KB).
- **Decision:** Data modules are plain typed objects; Zod schemas validate them in
  `scripts/validate-data.ts` and unit tests. Content is validated by Velite at build time.
- **Consequences:** ➕ zero validation code ships to browsers; ➖ an edit to `src/data` is only checked
  when CI (or `pnpm validate:data`) runs.

### ADR-009: Native `<dialog>` for the mobile menu

- **Status:** accepted
- **Context:** A JS dialog primitive cost ~26 KB gzip on every page — 17 % of the initial budget.
- **Decision:** `showModal()` on a native `<dialog>`: top layer, inert background, Escape to close and
  focus restoration come from the browser.
- **Consequences:** ➕ budget headroom; ➖ styling the backdrop and enter animation by hand (Motion's
  `animate()`), and older browsers without `<dialog>` support are not targeted.

### ADR-010: Animation policy

- **Status:** accepted
- **Decision:** Motion (via `motion/mini`, ~3 KB) for interface animation; GSAP + ScrollTrigger only
  for the single scroll-storytelling section, loaded on approach; page entrance is a CSS animation (no
  competing page-transition systems, and content is visible without JavaScript). All respect reduced motion.
- **Alternatives:** Motion's full React API — ~40 KB, which would have pushed the 3D chunk to the edge
  of its budget; GSAP everywhere — heavier and imperative for simple UI.

### ADR-011: Budgets measured on the real export

- **Status:** accepted
- **Decision:** A custom checker reads every exported HTML page and sums the gzip size of the scripts
  it loads; lazy features are identified by stable markers in emitted chunks. This replaces size-limit,
  which measures synthetic bundles rather than what the browser actually downloads.
- **Consequences:** ➕ numbers match reality, per route; ➖ markers must be kept stable when libraries
  change (a missing marker is reported).

### ADR-012: No post-processing in the 3D scene

- **Status:** accepted
- **Context:** Bloom would add ~50 KB and a full-screen pass per frame.
- **Decision:** Emissive, non-tone-mapped materials, additive halo sprites, fog and shader rim lighting.
- **Consequences:** ➕ 3D chunk ~240 KB with headroom; cheaper on integrated GPUs; ➖ less "glow" than a
  true bloom pass.

### ADR-013: Content integrity is part of the data model

- **Status:** accepted
- **Decision:** Every case study, article and project has a `provenance` (`production-derived`,
  `sanitized`, `illustrative`, `experimental`, `placeholder`), shown in the UI. Quality-attribute
  numbers carry a `basis` (`requirement`, `target`, `design-assumption`, `measured`); tests forbid
  `measured` in illustrative or sanitised material. Unsupplied personal facts are `null` and render as
  visible placeholders in development only; the export checker fails if a placeholder marker ships.
- **Consequences:** ➕ honesty is enforced, not just intended; ➖ the site launches with fewer claims —
  by design.
