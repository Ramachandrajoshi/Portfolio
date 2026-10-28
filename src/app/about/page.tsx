import Link from 'next/link';
import { PageHeader } from '@/components/layout/PageHeader';
import { Placeholder } from '@/components/ui/Placeholder';
import { Button } from '@/components/ui/button';
import { ArrowRightIcon, GitHubIcon, LinkedInIcon } from '@/components/ui/icons';
import { JsonLd } from '@/components/seo/JsonLd';
import { allCaseStudies, allProjects } from '@/content';
import { profile } from '@/data/profile';
import { pageMetadata } from '@/lib/metadata';
import { personSchema } from '@/lib/structured-data';

export const metadata = pageMetadata({
  title: 'About',
  description: `${profile.name} — ${profile.title}. ${profile.shortBio}`,
  path: '/about/',
  type: 'profile',
  image: '/og/about.png',
});

function formatYearMonth(value: string | null) {
  if (!value) return null;
  const [y, m] = value.split('-');
  return m
    ? new Date(Date.UTC(Number(y), Number(m) - 1)).toLocaleDateString('en-GB', {
        month: 'short',
        year: 'numeric',
        timeZone: 'UTC',
      })
    : y;
}

export default function AboutPage() {
  return (
    <>
      <PageHeader
        crumbs={[{ name: 'About', path: '/about/' }]}
        eyebrow="Profile"
        title={profile.name}
        lead={
          <>
            <p className="font-display text-xl text-fg">{profile.title}</p>
            <p className="mt-3">{profile.positioning}</p>
          </>
        }
      >
        <div className="mt-6 flex flex-wrap gap-3">
          <Button asChild variant="secondary">
            <a href={profile.links.linkedin} rel="me noopener" target="_blank">
              <LinkedInIcon /> LinkedIn<span className="sr-only"> (opens in a new tab)</span>
            </a>
          </Button>
          <Button asChild variant="secondary">
            <a href={profile.links.github} rel="me noopener" target="_blank">
              <GitHubIcon /> GitHub<span className="sr-only"> (opens in a new tab)</span>
            </a>
          </Button>
          <Button asChild>
            <Link href="/resume/">
              Résumé <ArrowRightIcon />
            </Link>
          </Button>
        </div>
      </PageHeader>

      <div className="container-page grid gap-14 py-14 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0 space-y-14">
          <section aria-labelledby="overview">
            <h2 id="overview" className="font-display text-2xl font-semibold">
              Overview
            </h2>
            <div className="mt-4 max-w-[var(--prose-width)] space-y-4 text-muted">
              <p>{profile.shortBio}</p>
              <p>
                I work as a {profile.title} at{' '}
                <a href={profile.employer.url} className="link" rel="noopener" target="_blank">
                  {profile.employer.name}
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>
                . This is a personal site: the views and the architecture material here are my own and are not endorsed
                by my employer.
              </p>
              <p>
                What I care about is <strong className="text-fg">engineering judgement</strong>: understanding the
                business problem and its constraints, making trade-offs explicit, and taking ownership of an
                architecture through delivery, operation and change — not just drawing it.
              </p>
              {profile.location ? (
                <p>Based in {profile.location}.</p>
              ) : (
                <p>
                  <Placeholder>location</Placeholder>
                </p>
              )}
            </div>
          </section>

          <section aria-labelledby="focus">
            <h2 id="focus" className="font-display text-2xl font-semibold">
              Technical areas of focus
            </h2>
            <ul className="mt-6 grid gap-4 sm:grid-cols-2">
              {profile.focusAreas.map((f) => (
                <li key={f.title} className="card p-5">
                  <h3 className="font-display text-lg font-semibold">{f.title}</h3>
                  <p className="mt-2 text-sm text-muted">{f.description}</p>
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="interests">
            <h2 id="interests" className="font-display text-2xl font-semibold">
              How I approach architecture
            </h2>
            <ul className="mt-5 max-w-[var(--prose-width)] space-y-3">
              {profile.architecturalInterests.map((i) => (
                <li key={i} className="flex gap-3 text-muted">
                  <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-accent" />
                  {i}
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="timeline">
            <h2 id="timeline" className="font-display text-2xl font-semibold">
              Career timeline
            </h2>
            <p className="mt-2 text-sm text-muted">Only verified roles are listed.</p>
            <ol className="mt-6 space-y-8 border-l border-border-strong pl-6">
              {profile.timeline.map((entry) => {
                const start = formatYearMonth(entry.start);
                const end = entry.current ? 'Present' : formatYearMonth(entry.end);
                return (
                  <li key={`${entry.role}-${entry.organisation}`} className="relative">
                    <span
                      aria-hidden
                      className="absolute top-1.5 -left-[1.94rem] size-3 rounded-full border-2 border-accent bg-accent/40"
                    />
                    <p className="font-mono text-xs tracking-wider text-accent uppercase">
                      {start ? `${start} — ${end}` : entry.current ? 'Current role' : null}{' '}
                      {!start ? <Placeholder>start date</Placeholder> : null}
                    </p>
                    <h3 className="mt-1 font-display text-lg font-semibold">
                      {entry.role} ·{' '}
                      {entry.organisationUrl ? (
                        <a href={entry.organisationUrl} className="hover:text-accent" rel="noopener" target="_blank">
                          {entry.organisation}
                          <span className="sr-only"> (opens in a new tab)</span>
                        </a>
                      ) : (
                        entry.organisation
                      )}
                    </h3>
                    {entry.summary ? (
                      <p className="mt-2 text-muted">{entry.summary}</p>
                    ) : (
                      <p className="mt-2">
                        <Placeholder>role summary and verified responsibilities</Placeholder>
                      </p>
                    )}
                    {entry.highlights.length ? (
                      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted">
                        {entry.highlights.map((h) => (
                          <li key={h}>{h}</li>
                        ))}
                      </ul>
                    ) : null}
                  </li>
                );
              })}
            </ol>
            <p className="mt-6">
              <Placeholder>earlier roles (most recent first)</Placeholder>
            </p>
          </section>
        </div>

        <aside className="space-y-6">
          <div className="card p-5">
            <p className="eyebrow">Selected case studies</p>
            <ul className="mt-3 space-y-3 text-sm">
              {allCaseStudies.map((c) => (
                <li key={c.slug}>
                  <Link href={c.url} className="hover:text-accent">
                    {c.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          {allProjects.length ? (
            <div className="card p-5">
              <p className="eyebrow">Selected projects</p>
              <ul className="mt-3 space-y-3 text-sm">
                {allProjects.slice(0, 4).map((p) => (
                  <li key={p.slug}>
                    <Link href={p.url} className="hover:text-accent">
                      {p.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          <div className="card p-5">
            <p className="eyebrow">Get in touch</p>
            <p className="mt-2 text-sm text-muted">Architecture reviews, system design or a technical conversation.</p>
            <Button asChild className="mt-4 w-full">
              <Link href="/contact/">Contact</Link>
            </Button>
          </div>
        </aside>
      </div>
      <JsonLd data={personSchema()} />
    </>
  );
}
