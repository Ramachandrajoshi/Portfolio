# Ram's Digital Metropolis

The portfolio and architecture-thinking showcase of **Ramachandra Joshi, Solution Architect**.

A statically exported Next.js site that pairs an explorable, procedurally generated 3D city with
architecture case studies written the way real designs should be: context and constraints,
measurable quality attributes, decision records, alternatives, trade-offs, failure modes and a
validation plan.

- **GitHub:** https://github.com/Ramachandrajoshi
- **LinkedIn:** https://www.linkedin.com/in/ramachandra-joshi-a8b6aba2

> Personal site. Views and architecture material are the author's own and are not endorsed by any
> employer. Case studies are labelled by provenance (sanitised, illustrative, experimental).

---

## Contents

- [Features](#features)
- [Technology stack](#technology-stack)
- [Getting started](#getting-started)
- [Build, preview and verify](#build-preview-and-verify)
- [Repository structure](#repository-structure)
- [Environment variables](#environment-variables)
- [Deployment: GitHub Pages](#deployment-github-pages)
- [Deployment: custom domain](#deployment-custom-domain)
- [Updating personal information](#updating-personal-information)
- [Adding a project](#adding-a-project)
- [Adding an architecture case study](#adding-an-architecture-case-study)
- [Writing and publishing an article](#writing-and-publishing-an-article)
- [Adding and validating diagrams](#adding-and-validating-diagrams)
- [Tests and performance checks](#tests-and-performance-checks)
- [Manual accessibility verification](#manual-accessibility-verification)
- [Known limitations](#known-limitations)
- [Licensing and assets](#licensing-and-assets)

## Features

- **3D hero** — a third-person explorable city (React Three Fiber) with five interactive landmarks
  that lead to the portfolio's districts. Lazy-loaded, paused off-screen, optional (classic mode),
  reduced-motion aware, with an SVG poster of the same city as first paint and fallback.
- **Architecture showcase** — four case studies with the full 15-section structure, ADRs, C4 views
  compiled from D2, and an interactive React Flow **system explorer** that animates causal flows.
- **Publishing platform** — validated MDX articles (Velite + Zod), Shiki highlighting, TOC with scroll
  tracking, reading progress, series, related articles, tags, RSS, Pagefind search and a component
  library: `ADR`, `Tradeoffs`, `Callout`, `Tabs`, `Timeline`, `Mermaid`, `D2`, `Sandpack`,
  `ArchitectureDiagram`.
- **Portfolio pages** — about, projects (filterable), skills constellation linked to evidence,
  services, testimonials (approved only), contact (Formspree), résumé (print-ready).
- **SEO** — canonical URLs, Open Graph/Twitter, JSON-LD (`Person`, `WebSite`, `TechArticle`,
  `BreadcrumbList`), sitemap, robots, build-time social images (Satori).
- **Quality gates** — strict TypeScript, ESLint, Prettier, unit tests, export validation, JS budgets,
  Playwright + axe in both themes, Lighthouse CI, Conventional Commits.

## Technology stack

| Area          | Choice                                                                                                                 |
| ------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Framework     | Next.js 16 (App Router, `output: 'export'`), React 19.2, TypeScript (strict)                                           |
| Styling       | Tailwind CSS 4 with centralised design tokens (`src/styles/tokens.css`); shadcn/ui-style primitives (cva + Radix Slot) |
| 3D            | three.js, React Three Fiber, Drei (`PerformanceMonitor`) — procedural geometry and shaders only                        |
| Diagrams      | React Flow (`@xyflow/react`) for the explorer; D2 (WASM) and Mermaid compiled to SVG at build time                     |
| Content       | Velite (MDX + Zod), Shiki, rehype-slug/autolink, Pagefind                                                              |
| Animation     | Motion (`motion/mini`) for UI; GSAP ScrollTrigger for the single scroll story                                          |
| Validation    | Zod 4 (data, env), Velite schemas (content)                                                                            |
| Social images | Satori + resvg                                                                                                         |
| Testing       | Vitest, Playwright, axe-core, Lighthouse CI                                                                            |
| Tooling       | pnpm, ESLint, Prettier, Husky, lint-staged, commitlint, Dependabot, release-please                                     |

Why these choices — and what was rejected — is documented in [ARCHITECTURE.md](ARCHITECTURE.md).

## Getting started

Requirements: **Node.js 22.12+** and **pnpm 10** (`corepack enable` installs the pinned version).

```bash
pnpm install
pnpm exec playwright install chromium   # Mermaid diagrams are rendered in headless Chromium
pnpm dev                                 # http://localhost:3000
```

`pnpm dev` compiles diagrams and content once, then runs Velite in watch mode inside `next dev`.
Development builds show yellow **"To be supplied"** markers wherever a personal fact has not been
provided yet.

## Build, preview and verify

```bash
# Build exactly as GitHub Pages would serve a project site:
NEXT_PUBLIC_SITE_URL=http://localhost:4173/portfolio pnpm build

pnpm preview      # serves ./out under the base path → http://localhost:4173/portfolio/
pnpm verify       # export validation + JavaScript budgets
```

`pnpm build` runs: diagrams → content (Velite) → social images → `next build` → Pagefind index.

## Repository structure

```text
content/
  articles/                 MDX articles (+ diagrams/ for article diagram sources)
  architecture/<slug>/      index.mdx, system.yaml, adrs/*.yaml, diagrams/*.d2|*.mmd
  projects/                 MDX project case studies
  examples/<name>/          Runnable Sandpack examples (real files)
src/
  app/                      Routes, layouts, metadata routes (sitemap, robots, feed)
  components/
    architecture/           ADR, Tradeoffs, QualityAttributes, C4Views, SystemExplorer (+ catalogue)
    content/                TOC, reading progress, share links, article cards
    hero3d/                 world.ts (pure model), scene/*, HeroStage, HeroPoster, input, touch controls
    home/ layout/ mdx/ projects/ search/ skills/ contact/ seo/ ui/
  content/                  Typed, server-only access to Velite output
  data/                     profile, skills, services, navigation, testimonials (+ Zod schemas)
  design/                   3D scene palette (kept in sync with tokens by a test)
  lib/                      deployment, urls, metadata, structured data, preferences, contact, motion
  styles/                   tokens.css, globals.css, fonts.ts
scripts/                    build-diagrams, generate-og, check-export, check-budgets, validate-data, serve-static
tests/
  unit/                     Vitest
  e2e/                      Playwright
  fixtures/                 Content-validation fixtures
.github/                    CI, deploy, release-please workflows; Dependabot
```

## Environment variables

See [`.env.example`](.env.example). All are **public build-time values** — never put secrets in them.

| Variable                        | Purpose                                                                | Default                 |
| ------------------------------- | ---------------------------------------------------------------------- | ----------------------- |
| `NEXT_PUBLIC_SITE_URL`          | Absolute site URL including any sub-path; base path is derived from it | `http://localhost:3000` |
| `NEXT_PUBLIC_FORMSPREE_FORM_ID` | Formspree form id; without it the contact page shows alternatives      | unset                   |
| `NEXT_PUBLIC_SHOW_PLACEHOLDERS` | Show "to be supplied" markers in a production build (preview only)     | `false`                 |
| `SHOW_DRAFTS`                   | Include draft articles in a local build                                | `false`                 |

## Deployment: GitHub Pages

1. Repository **Settings → Pages → Build and deployment → Source: GitHub Actions**.
2. Optional: **Settings → Secrets and variables → Actions → Variables** → add
   `NEXT_PUBLIC_FORMSPREE_FORM_ID` (a variable, not a secret — the id is public).
3. Push to `main`. `.github/workflows/deploy.yml` builds with the URL reported by
   `actions/configure-pages`, validates the export, smoke-tests it under its real base path, uploads it
   with `actions/upload-pages-artifact` and deploys with `actions/deploy-pages`.

The site is then available at `https://<user>.github.io/<repository>/`. No `gh-pages` branch is used.
Only the deploy job has `pages: write` and `id-token: write`; a `pages` concurrency group prevents
overlapping deployments. Pull requests run `.github/workflows/ci.yml`.

## Deployment: custom domain

1. **Settings → Pages → Custom domain** → enter the domain and create the DNS records GitHub shows
   (`CNAME` to `<user>.github.io` for a subdomain; `A`/`AAAA` records for an apex domain).
2. Enable **Enforce HTTPS** once the certificate is issued.
3. Re-run the deploy workflow. `actions/configure-pages` now reports the root URL, so the base path
   becomes empty automatically — no code changes.

`robots.txt` and the sitemap only become authoritative for crawlers at a domain root.

## Updating personal information

Edit **`src/data/profile.ts`**. Rules:

- Every `null` is a fact that has not been supplied — replace it only with verified information
  (location, public email, role dates, role summary, highlights, résumé file).
- The employer name is derived from the supplied URL; set `employer.verifiedName: true` once confirmed
  (only then is it included in structured data).
- To publish a résumé PDF, put it in `public/resume/` and set `resume.file` (e.g. `/resume/cv.pdf`).
- Skills: `src/data/skills.ts` — set `level` only if you want to state it; the map plots evidence, not
  self-ratings. Services: `src/data/services.ts`. Testimonials: `src/data/testimonials.ts`, approved
  wording only; the page joins navigation and the sitemap automatically once one exists.

Run `pnpm validate:data` after editing.

## Adding a project

Create `content/projects/<slug>.mdx`:

```mdx
---
title: Project name
summary: One or two sentences (40–240 characters).
category: backend # architecture | ai-inference | iot | backend | developer-tooling | web
technologies: [.NET, PostgreSQL]
provenance: production-derived # or sanitized | illustrative | experimental | placeholder
status: complete # active | complete | archived | concept
date: 2026-10-01
featured: false
links:
  source: https://github.com/… # only public, verified URLs
relatedCaseStudy: multi-tenant-platform # optional
---

## Problem

## Context and constraints

## Approach

## Architecture

## Important decisions

## Technologies

## Challenges

## Results or lessons learned
```

`placeholder` projects are visible in development only.

## Adding an architecture case study

1. Create `content/architecture/<slug>/index.mdx` with the frontmatter used by the existing case studies
   (`title`, `summary`, `domain`, `order`, `provenance`, `status`, `date`, `tags`, `problem`,
   `qualityAttributes[]` with `basis`, `diagrams[]`).
2. Write the **15 mandatory sections** in order (the unit tests check them for `status: complete`):
   context, requirements and constraints, functional and non-functional requirements, quality
   attributes, architecture and boundaries, views, design decisions, alternatives, trade-offs,
   security, failure modes, scalability, observability, testing and validation, outcomes and lessons.
   Use `<QualityAttributes />`, `<C4Views />`, `<ArchitectureDiagram system="<slug>" />` and
   `<ADR id="…" />`.
3. Add ADRs as `adrs/<id>.yaml` (`XX-ADR-001` format) and the explorer model as `system.yaml`.
4. Add diagram sources under `diagrams/` and list them in the frontmatter.
5. Label numbers honestly: `basis: measured` is rejected for illustrative or sanitised studies.

## Writing and publishing an article

Create `content/articles/<kebab-case-slug>.mdx`:

```mdx
---
title: A clear, specific title
description: 50–200 characters used in listings, search results and social cards.
date: 2026-10-27
tags: [system-design, adr] # kebab-case, 1–8
series: Architecture fundamentals # optional, with seriesOrder
draft: true # remove (or set false) to publish
provenance: illustrative
---
```

Drafts are removed by the pipeline before anything is generated — no route, feed entry, sitemap entry
or search result. Preview a draft locally with `SHOW_DRAFTS=true pnpm dev`. Every available component is
demonstrated in [`content/articles/mdx-component-reference.mdx`](content/articles/mdx-component-reference.mdx).
Runnable examples live as real files in `content/examples/<name>/` and are referenced with
`<Sandpack example="<name>" … />`.

## Adding and validating diagrams

1. Add `content/<path>/<name>.d2` (C4 views; use the class conventions in existing files) or
   `<name>.mmd` (Mermaid sequence/state diagrams).
2. Reference it by id — the path under `content/` without extension:

   ```mdx
   <D2
     src="architecture/<slug>/diagrams/c4-container"
     title="Containers"
     description="What the diagram shows, in words."
   />
   ```

3. Run `pnpm content` (or `tsx scripts/build-diagrams.ts`). Invalid sources fail with the file and the
   parser's message; unchanged sources are cached by content hash.

## Tests and performance checks

| Command                                              | What it does                                                                                                                                                                |
| ---------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm lint` / `pnpm format:check` / `pnpm typecheck` | Static checks                                                                                                                                                               |
| `pnpm validate:data`                                 | Zod validation of `src/data`                                                                                                                                                |
| `pnpm test`                                          | Unit tests (needs `pnpm content` first): URLs under a base path, world model and collisions, contact logic, tokens and contrast, content completeness, frontmatter fixtures |
| `pnpm test:e2e`                                      | Playwright against `./out` under `/portfolio` — build first with `NEXT_PUBLIC_SITE_URL=http://localhost:4173/portfolio NEXT_PUBLIC_FORMSPREE_FORM_ID=testform1 pnpm build`  |
| `pnpm verify`                                        | Export validation (routes, links, canonicals, JSON-LD, drafts, search index) and JS budgets                                                                                 |
| `pnpm budgets`                                       | Initial JS per route and lazy-chunk budgets                                                                                                                                 |
| `pnpm lhci`                                          | Lighthouse CI, mobile profile (needs Chrome; set `CHROME_PATH` if necessary)                                                                                                |

## Manual accessibility verification

Automated checks (axe, Lighthouse) catch a subset of issues. Before a release, verify by hand:

1. **Keyboard only:** skip link; full navigation; mobile menu (Escape returns focus); tabs (arrow keys);
   contact form errors; the city (click or Tab to focus, WASD, E, Escape releases focus) and the
   "Fly to a district" list.
2. **Screen readers:** NVDA + Firefox and VoiceOver + Safari — headings, landmarks, the system-explorer
   component catalogue, landmark panel announcements, form error summary.
3. **Zoom and reflow:** 200 % and 400 % zoom, 320 px width — no loss of content.
4. **Reduced motion:** OS setting on — no auto-started 3D, no scroll animation.
5. **Forced colours / high contrast:** Windows high-contrast mode — focus and borders remain visible.

## Known limitations

- Software-rendered WebGL (CI, some VMs) is slow; the 3D tests allow extra time.
- Mermaid rendering needs Chromium at build time.
- Lighthouse cannot measure INP in the lab; Total Blocking Time is asserted as a proxy, and real INP
  should be checked with field data after launch.
- Inbox-style idempotency, capacity figures and other numbers in case studies are illustrative
  reasoning, not measurements.
- Personal facts not supplied by the owner (dates, location, email, résumé PDF, earlier roles,
  testimonials) are intentionally absent from production builds.

## Licensing and assets

- Source code and written content © Ramachandra Joshi. All rights reserved unless a license file is added.
- Fonts: Inter, Space Grotesk and JetBrains Mono (SIL Open Font License 1.1), self-hosted via
  `@fontsource`.
- The 3D city, character, poster and social images are generated procedurally by this repository; no
  third-party models, textures or images are used.
- Third-party libraries are used under their respective open-source licenses (see `package.json`).
