import Link from 'next/link';
import { PageHeader } from '@/components/layout/PageHeader';
import { SkillConstellation } from '@/components/skills/SkillConstellation';
import { skillCategories, skillsWithEvidence } from '@/components/skills/evidence';
import { pageMetadata } from '@/lib/metadata';

export const metadata = pageMetadata({
  title: 'Skills',
  description:
    'A technical competency map across architecture, backend, AI/LLM systems, data and messaging, infrastructure and languages — linked to the evidence on this site.',
  path: '/skills/',
  image: '/og/skills.png',
});

export default function SkillsPage() {
  const skills = skillsWithEvidence();
  const categories = skillCategories.map((c) => ({ id: c.id, label: c.label, description: c.description }));
  return (
    <>
      <PageHeader
        crumbs={[{ name: 'Skills', path: '/skills/' }]}
        eyebrow="Competency map"
        title="Technical competencies"
        lead={
          <p>
            Organised by what the work is, not by logo. Instead of self-rated bars, each technology links to where this
            site demonstrates it.
          </p>
        }
      />
      <div className="container-page space-y-16 py-12">
        <section aria-labelledby="constellation-heading">
          <h2 id="constellation-heading" className="sr-only">
            Interactive constellation
          </h2>
          <SkillConstellation skills={skills} categories={categories} />
        </section>
        <section aria-labelledby="list-heading">
          <h2 id="list-heading" className="font-display text-2xl font-semibold">
            List view
          </h2>
          <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {categories.map((cat) => (
              <section key={cat.id} className="card p-5" aria-labelledby={`cat-${cat.id}`}>
                <h3 id={`cat-${cat.id}`} className="font-display text-lg font-semibold">
                  {cat.label}
                </h3>
                <p className="mt-1 text-sm text-muted">{cat.description}</p>
                <ul className="mt-4 space-y-2 text-sm">
                  {skills
                    .filter((s) => s.category === cat.id)
                    .map((s) => (
                      <li key={s.name}>
                        <span className="font-medium">{s.name}</span>
                        {s.evidence.length ? (
                          <span className="text-muted">
                            {' — '}
                            {s.evidence.map((e, i) => (
                              <span key={e.href}>
                                {i > 0 ? ', ' : ''}
                                <Link href={e.href} className="link">
                                  {e.kind.toLowerCase()}
                                </Link>
                              </span>
                            ))}
                          </span>
                        ) : null}
                      </li>
                    ))}
                </ul>
              </section>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
