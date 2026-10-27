import Link from 'next/link';
import { PageHeader } from '@/components/layout/PageHeader';
import { Placeholder } from '@/components/ui/Placeholder';
import { Button } from '@/components/ui/button';
import { DownloadIcon } from '@/components/ui/icons';
import { allCaseStudies } from '@/content';
import { profile } from '@/data/profile';
import { skillCategories, skills } from '@/data/skills';
import { pageMetadata } from '@/lib/metadata';
import { asset } from '@/lib/urls';
import { PrintButton } from '@/components/content/PrintButton';

export const metadata = pageMetadata({
  title: 'Résumé',
  description: `Résumé of ${profile.name}, ${profile.title}: focus areas, experience and technical competencies.`,
  path: '/resume/',
  image: '/og/resume.png',
});

export default function ResumePage() {
  return (
    <>
      <PageHeader crumbs={[{ name: 'Résumé', path: '/resume/' }]} eyebrow="At a glance" title="Résumé">
        <div className="mt-6 flex flex-wrap gap-3" data-print-hide>
          {profile.resume.file ? (
            <Button asChild>
              <a href={asset(profile.resume.file)} download>
                <DownloadIcon /> Download PDF
              </a>
            </Button>
          ) : (
            <Placeholder>résumé PDF in public/resume/ (set profile.resume.file)</Placeholder>
          )}
          <PrintButton />
        </div>
      </PageHeader>
      <div className="container-page py-12">
        <article className="mx-auto max-w-3xl space-y-10 print:max-w-none">
          <header>
            <h2 className="font-display text-3xl font-semibold">{profile.name}</h2>
            <p className="mt-1 text-lg text-accent">{profile.title}</p>
            <p className="mt-3 text-sm text-muted">
              <a href={profile.links.linkedin} className="link">LinkedIn</a> · <a href={profile.links.github} className="link">GitHub</a>
              {profile.email ? <> · <a href={`mailto:${profile.email}`} className="link">{profile.email}</a></> : null}
              {profile.location ? <> · {profile.location}</> : null}
            </p>
          </header>
          <section aria-labelledby="r-summary">
            <h3 id="r-summary" className="eyebrow">Summary</h3>
            <p className="mt-2">{profile.positioning}</p>
          </section>
          <section aria-labelledby="r-experience">
            <h3 id="r-experience" className="eyebrow">Experience</h3>
            <ol className="mt-3 space-y-5">
              {profile.timeline.map((e) => (
                <li key={`${e.role}-${e.organisation}`}>
                  <p className="font-semibold">{e.role} — {e.organisation}</p>
                  <p className="text-sm text-muted">
                    {e.start ?? <Placeholder>dates</Placeholder>} {e.start ? `– ${e.current ? 'present' : e.end}` : null}
                  </p>
                  {e.summary ? <p className="mt-1 text-sm">{e.summary}</p> : <Placeholder>role summary</Placeholder>}
                  {e.highlights.length ? (
                    <ul className="mt-1 list-disc pl-5 text-sm">{e.highlights.map((h) => <li key={h}>{h}</li>)}</ul>
                  ) : null}
                </li>
              ))}
            </ol>
          </section>
          <section aria-labelledby="r-focus">
            <h3 id="r-focus" className="eyebrow">Focus areas</h3>
            <ul className="mt-2 space-y-1.5 text-sm">
              {profile.focusAreas.map((f) => (
                <li key={f.title}><span className="font-medium">{f.title}.</span> <span className="text-muted">{f.description}</span></li>
              ))}
            </ul>
          </section>
          <section aria-labelledby="r-skills">
            <h3 id="r-skills" className="eyebrow">Technical competencies</h3>
            <dl className="mt-2 space-y-1.5 text-sm">
              {skillCategories.map((c) => (
                <div key={c.id} className="sm:flex sm:gap-2">
                  <dt className="font-medium sm:w-48 sm:shrink-0">{c.label}</dt>
                  <dd className="text-muted">{skills.filter((s) => s.category === c.id).map((s) => s.name).join(', ')}</dd>
                </div>
              ))}
            </dl>
          </section>
          <section aria-labelledby="r-work" data-print-hide>
            <h3 id="r-work" className="eyebrow">Architecture writing on this site</h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
              {allCaseStudies.map((c) => <li key={c.slug}><Link href={c.url} className="link">{c.title}</Link></li>)}
            </ul>
          </section>
          <p className="text-sm"><Placeholder>education and certifications — only verified entries</Placeholder></p>
        </article>
      </div>
    </>
  );
}
