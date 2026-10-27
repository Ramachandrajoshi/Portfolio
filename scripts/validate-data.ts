/**
 * Validates hand-edited data modules in src/data against their Zod schemas. The runtime
 * modules are plain objects (so Zod never ships to browsers); this script and the unit
 * tests are where they are enforced. Runs in CI and before every build.
 */
import { z } from 'zod';
import { profileSchema, testimonialSchema } from '../src/data/schema';
import { profile } from '../src/data/profile';
import { testimonials } from '../src/data/testimonials';
import { skillCategories, skills } from '../src/data/skills';
import { services } from '../src/data/services';
import { allNav } from '../src/data/navigation';

const checks: [string, () => unknown][] = [
  ['profile', () => profileSchema.parse(profile)],
  ['testimonials', () => z.array(testimonialSchema).parse(testimonials)],
  [
    'skills',
    () =>
      z
        .array(
          z.object({
            name: z.string().min(1),
            category: z.enum(skillCategories.map((c) => c.id) as [string, ...string[]]),
            aliases: z.array(z.string().min(1)).min(1),
            level: z.enum(['working', 'proficient', 'expert']).nullable(),
          }),
        )
        .refine((list) => new Set(list.map((s) => s.name)).size === list.length, 'duplicate skill name')
        .parse(skills),
  ],
  [
    'services',
    () =>
      z
        .array(
          z.object({
            id: z.string().regex(/^[a-z0-9-]+$/),
            title: z.string(),
            summary: z.string(),
            deliverables: z.array(z.string()).min(1),
            approach: z.string(),
          }),
        )
        .parse(services),
  ],
  [
    'navigation',
    () =>
      z
        .array(z.object({ href: z.string().regex(/^\/([a-z0-9-]+\/)*$/), label: z.string(), description: z.string() }))
        .parse(allNav),
  ],
];

let failed = false;
for (const [name, check] of checks) {
  try {
    check();
    console.log(`✓ data: ${name}`);
  } catch (error) {
    failed = true;
    console.error(`✗ data: ${name}\n${error instanceof z.ZodError ? z.prettifyError(error) : String(error)}`);
  }
}
process.exit(failed ? 1 : 0);
