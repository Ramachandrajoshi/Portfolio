import Link from 'next/link';
import { PageHeader } from '@/components/layout/PageHeader';
import { testimonials } from '@/data/testimonials';
import { pageMetadata } from '@/lib/metadata';
import { SHOW_PLACEHOLDERS } from '@/lib/placeholders';

export const metadata = pageMetadata({
  title: 'Testimonials',
  description: 'Approved testimonials from colleagues and collaborators.',
  path: '/testimonials/',
  // Until approved testimonials exist the page is excluded from search engines and the sitemap.
  noindex: testimonials.length === 0,
});

export default function TestimonialsPage() {
  return (
    <>
      <PageHeader
        crumbs={[{ name: 'Testimonials', path: '/testimonials/' }]}
        eyebrow="In their words"
        title="Testimonials"
      />
      <div className="container-page py-12">
        {testimonials.length ? (
          <ul className="grid gap-6 md:grid-cols-2">
            {testimonials.map((t) => (
              <li key={t.author} className="card p-6">
                <figure>
                  <blockquote className="text-lg leading-relaxed">“{t.quote}”</blockquote>
                  <figcaption className="mt-4 text-sm text-muted">
                    <span className="font-medium text-fg">{t.author}</span>, {t.role} — {t.relationship}
                    {t.source ? (
                      <>
                        {' · '}
                        <a href={t.source} className="link" target="_blank" rel="noopener noreferrer">
                          source<span className="sr-only"> (opens in a new tab)</span>
                        </a>
                      </>
                    ) : null}
                  </figcaption>
                </figure>
              </li>
            ))}
          </ul>
        ) : (
          <div className="max-w-2xl">
            <p className="text-lg text-muted">No testimonials have been published yet.</p>
            <p className="mt-3 text-muted">
              Testimonials appear here only with the author&apos;s explicit approval of the exact wording. In the
              meantime, the{' '}
              <Link href="/architecture/" className="link">
                architecture case studies
              </Link>{' '}
              show how I work.
            </p>
            {SHOW_PLACEHOLDERS ? (
              <p
                className="mt-6 rounded-md border border-dashed border-highlight/60 bg-highlight/10 p-4 font-mono text-xs text-highlight"
                data-placeholder
              >
                Development note: add approved entries to src/data/testimonials.ts (validated by testimonialSchema). The
                page joins navigation and the sitemap automatically once the list is non-empty.
              </p>
            ) : null}
          </div>
        )}
      </div>
    </>
  );
}
