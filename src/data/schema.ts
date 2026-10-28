import { z } from 'zod';

const url = z.url({ protocol: /^https?$/ });

/** Where a piece of content comes from — always shown next to architecture material. */
export const provenance = z.enum([
  'production-derived', // based on real work, sanitised and approved
  'sanitized', // real problem shape, all identifying detail removed
  'illustrative', // reference design written for this portfolio
  'experimental', // personal experiment / lab work
  'placeholder', // template awaiting the owner's facts — hidden in production
]);
export type Provenance = z.infer<typeof provenance>;

export const timelineEntrySchema = z.object({
  role: z.string().min(1),
  organisation: z.string().min(1),
  organisationUrl: url.optional(),
  /** ISO year-month, e.g. "2021-04". null = not yet supplied by the owner. */
  start: z
    .string()
    .regex(/^\d{4}(-\d{2})?$/)
    .nullable(),
  end: z
    .string()
    .regex(/^\d{4}(-\d{2})?$/)
    .nullable(),
  current: z.boolean(),
  summary: z.string().nullable(),
  highlights: z.array(z.string()),
});

export const profileSchema = z.object({
  name: z.string().min(1),
  title: z.string().min(1),
  positioning: z.string().min(20),
  shortBio: z.string().min(20),
  location: z.string().nullable(),
  email: z.email().nullable(),
  employer: z.object({ name: z.string(), url, verifiedName: z.boolean() }),
  links: z.object({ github: url, linkedin: url }),
  resume: z.object({
    /** Path under /public, e.g. "/resume/ramachandra-joshi.pdf". null until supplied. */
    file: z.string().startsWith('/').nullable(),
    updated: z.string().nullable(),
  }),
  focusAreas: z.array(z.object({ title: z.string(), description: z.string() })).min(1),
  architecturalInterests: z.array(z.string()).min(1),
  timeline: z.array(timelineEntrySchema),
});
export type Profile = z.infer<typeof profileSchema>;

export const testimonialSchema = z.object({
  quote: z.string().min(20),
  author: z.string().min(1),
  role: z.string().min(1),
  relationship: z.string().min(1),
  /** Link to where the testimonial is publicly verifiable (e.g. a LinkedIn recommendation). */
  source: url.optional(),
  /** Must be true — the author has approved publication of this exact wording. */
  approved: z.literal(true),
});
export type Testimonial = z.infer<typeof testimonialSchema>;
