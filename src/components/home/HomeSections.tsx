import Link from 'next/link';
import { ArticleCard } from '@/components/content/ArticleCard';
import { ProvenanceBadge } from '@/components/architecture/ProvenanceBadge';
import { Button } from '@/components/ui/button';
import { ArrowRightIcon } from '@/components/ui/icons';
import { allArticles, allCaseStudies, adrsFor } from '@/content';
import { profile } from '@/data/profile';
import { LANDMARKS } from '@/components/hero3d/world';
import { ApproachStory, type StoryStep } from './ApproachStory';

const steps: StoryStep[] = [
  {
    id: 'context',
    label: 'Context',
    title: 'Understand the problem before the technology',
    body: (
      <p>
        Who is affected, what hurts today, and what would make the change worth it. A design without a stated problem
        cannot be evaluated — only admired.
      </p>
    ),
  },
  {
    id: 'constraints',
    label: 'Constraints',
    title: 'Let constraints eliminate most of the design space',
    body: (
      <p>
        Contracts, budgets, regulations, team skills and existing systems remove options early. In the{' '}
        <Link href="/architecture/multi-tenant-platform/" className="link">
          multi-tenant case study
        </Link>
        , one contractual promise — physically separate customer data — ruled out half the tenancy models before any
        technology discussion.
      </p>
    ),
  },
  {
    id: 'options',
    label: 'Options',
    title: 'Compare credible alternatives against the same criteria',
    body: (
      <p>
        At least two real options, scored on the quality attributes that matter here — not on popularity. Quality
        attributes become measurable scenarios with acceptance criteria.
      </p>
    ),
  },
  {
    id: 'decision',
    label: 'Decision',
    title: 'Record what was chosen — and what was given up',
    body: (
      <p>
        Every significant choice becomes an Architecture Decision Record: context, decision, alternatives, positive and
        negative consequences, risks and follow-ups. Trade-offs are written down, not implied.
      </p>
    ),
  },
  {
    id: 'validation',
    label: 'Validation',
    title: 'Prove it, or find out early that it is wrong',
    body: (
      <p>
        Capacity arithmetic before load tests, architecture tests in CI, failure-injection for the containment claims.
        Numbers are labelled as assumptions until something measures them.
      </p>
    ),
  },
];

export function HomeSections() {
  const featured = allCaseStudies[0];
  const latest = allArticles.slice(0, 3);
  return (
    <>
      <section aria-labelledby="districts-heading" className="container-page py-20">
        <p className="eyebrow">The districts</p>
        <h2 id="districts-heading" className="mt-2 font-display text-[length:var(--text-4xl)] font-semibold">
          Every landmark is a part of the work
        </h2>
        <p className="mt-3 max-w-2xl text-muted">The same destinations as the 3D city — no exploration required.</p>
        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {LANDMARKS.map((l) => (
            <li key={l.id} className="card card-interactive relative flex flex-col p-5">
              <span aria-hidden className="h-1 w-10 rounded-full" style={{ background: l.color }} />
              <p className="mt-4 font-mono text-[0.68rem] tracking-wider text-muted uppercase">{l.district}</p>
              <h3 className="mt-1 font-display text-lg font-semibold">
                <Link href={l.href} className="after:absolute after:inset-0 after:rounded-[inherit]">
                  {l.name}
                </Link>
              </h3>
              <p className="mt-2 flex-1 text-sm text-muted">{l.intro}</p>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="approach-heading" className="border-y border-border bg-bg-elevated/60 py-20">
        <div className="container-page">
          <p className="eyebrow">How I think</p>
          <h2 id="approach-heading" className="mt-2 max-w-3xl font-display text-[length:var(--text-4xl)] font-semibold">
            From context and constraints to decisions you can defend
          </h2>
          <div className="mt-12">
            <ApproachStory steps={steps} />
          </div>
        </div>
      </section>

      {featured ? (
        <section aria-labelledby="featured-heading" className="container-page py-20">
          <p className="eyebrow">Featured case study</p>
          <div className="mt-4 grid gap-8 rounded-2xl border border-border bg-surface p-6 shadow-md sm:p-10 lg:grid-cols-[1.2fr_1fr]">
            <div>
              <ProvenanceBadge value={featured.provenance} />
              <h2 id="featured-heading" className="mt-4 font-display text-[length:var(--text-4xl)] font-semibold">
                {featured.title}
              </h2>
              <p className="mt-4 text-lg text-muted">{featured.summary}</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild size="lg">
                  <Link href={featured.url}>
                    Read the case study <ArrowRightIcon />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="secondary">
                  <Link href={`${featured.url}#6-context-container-and-component-views`}>Explore the system</Link>
                </Button>
              </div>
            </div>
            <div>
              <p className="eyebrow">Quality attributes it is designed against</p>
              <ul className="mt-4 space-y-3">
                {featured.qualityAttributes.slice(0, 4).map((qa) => (
                  <li key={qa.attribute} className="rounded-md border border-border bg-bg/50 p-3 text-sm">
                    <span className="font-semibold">{qa.attribute}</span>
                    <span className="mt-1 block text-muted">{qa.measure}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-sm text-muted">
                {adrsFor(featured.slug).length} architecture decision records · C4 views · interactive system explorer
              </p>
            </div>
          </div>
        </section>
      ) : null}

      {latest.length ? (
        <section aria-labelledby="writing-heading" className="container-page py-12">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow">Writing</p>
              <h2 id="writing-heading" className="mt-2 font-display text-[length:var(--text-4xl)] font-semibold">
                Recent articles
              </h2>
            </div>
            <Link href="/articles/" className="link text-sm">
              All articles →
            </Link>
          </div>
          <ul className="mt-8 grid gap-6 md:grid-cols-3">
            {latest.map((a) => (
              <li key={a.slug}>
                <ArticleCard article={a} headingLevel="h3" />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section aria-labelledby="cta-heading" className="container-page pt-16">
        <div className="relative overflow-hidden rounded-2xl border border-border bg-surface-2/60 p-8 sm:p-12">
          <div aria-hidden className="grid-backdrop absolute inset-0 opacity-60" />
          <div className="relative max-w-2xl">
            <h2 id="cta-heading" className="font-display text-[length:var(--text-4xl)] font-semibold">
              Have a system worth thinking hard about?
            </h2>
            <p className="mt-3 text-lg text-muted">
              {profile.title} — available for architecture reviews, system design and technical conversations.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/contact/">Get in touch</Link>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <Link href="/services/">See services</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
