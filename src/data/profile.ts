/**
 * Owner profile. EDIT THIS FILE to update personal information.
 *
 * Integrity rules (see README → "Updating personal information"):
 *  - Only the name, title, GitHub, LinkedIn and employer link were supplied by the owner.
 *  - Every `null` is a fact that has NOT been supplied. Do not replace a null with a guess.
 *  - Development builds flag nulls visibly; production builds omit them.
 *  - Validated against profileSchema by `pnpm validate:data` and the unit tests (kept out of
 *    the runtime so Zod never ships to the browser).
 */
import type { Profile } from './schema';

export const profile: Profile = {
  name: 'Ramachandra Joshi',
  title: 'Solution Architect',
  positioning:
    'I design software systems by starting from constraints — load, failure, cost, change — and I stay hands-on enough to know what each decision costs to build, run and evolve.',
  shortBio:
    'Solution Architect working across application architecture, distributed systems, AI inference and industrial connectivity. This site is where I show how I reason about systems, not just which tools I have used.',
  location: null, // PLACEHOLDER — e.g. "Bengaluru, India"
  email: null, // PLACEHOLDER — a public contact address enables the direct email link
  employer: {
    // Name derived from the supplied employer URL; set verifiedName to true once confirmed.
    name: 'NSP Global Tech',
    url: 'https://nspglobaltech.com/about',
    verifiedName: false,
  },
  links: {
    github: 'https://github.com/Ramachandrajoshi',
    linkedin: 'https://www.linkedin.com/in/ramachandra-joshi-a8b6aba2',
  },
  resume: {
    file: null, // PLACEHOLDER — drop a PDF in public/resume/ and set its path here
    updated: null,
  },
  focusAreas: [
    {
      title: 'Enterprise & distributed architecture',
      description:
        'Service boundaries, multi-tenancy, API design and incremental modernisation of systems that cannot stop running.',
    },
    {
      title: 'AI & local LLM inference',
      description:
        'Serving models under real GPU-memory, latency and concurrency budgets — quantisation, KV-cache capacity and scheduling.',
    },
    {
      title: 'Industrial IoT & telemetry',
      description:
        'Edge collection, MQTT ingestion, stream processing and time-series storage for connected equipment.',
    },
    {
      title: 'Event-driven systems',
      description:
        'Delivery semantics, idempotency, retries, back-pressure and replay — the parts that decide whether async systems are trustworthy.',
    },
    {
      title: 'Languages & developer tooling',
      description:
        'Rust, compilers and experimental programming languages — understanding the machinery beneath the frameworks.',
    },
  ],
  architecturalInterests: [
    'Making trade-offs explicit and reviewable (ADRs, fitness functions)',
    'Failure-mode-first design: what happens when each dependency is slow, wrong or gone',
    'Capacity reasoning from first principles before reaching for benchmarks',
    'Incremental modernisation over big-bang rewrites',
    'Observability designed in, not bolted on',
  ],
  timeline: [
    {
      role: 'Solution Architect',
      organisation: 'NSP Global Tech',
      organisationUrl: 'https://nspglobaltech.com/about',
      start: null, // PLACEHOLDER — "YYYY-MM"
      end: null,
      current: true,
      summary: null, // PLACEHOLDER — one or two sentences on scope and ownership
      highlights: [], // PLACEHOLDER — verified responsibilities only
    },
    // PLACEHOLDER — add earlier roles here, most recent first.
  ],
};
