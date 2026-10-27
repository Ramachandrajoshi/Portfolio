import { PageHeader } from '@/components/layout/PageHeader';
import { SearchClient } from '@/components/search/SearchClient';
import { pageMetadata } from '@/lib/metadata';

export const metadata = pageMetadata({
  title: 'Search',
  description: 'Full-text search across architecture case studies, articles and projects.',
  path: '/search/',
  noindex: true,
});

export default function SearchPage() {
  return (
    <>
      <PageHeader
        crumbs={[{ name: 'Search', path: '/search/' }]}
        eyebrow="Index"
        title="Search"
        lead={<p>Full-text search across case studies, articles and projects — served entirely from static files.</p>}
      />
      <div className="container-page py-10">
        <SearchClient />
        <noscript>
          <p className="mt-6 text-muted">
            Search requires JavaScript. Browse the{' '}
            <a className="link" href="../articles/">
              articles
            </a>{' '}
            or{' '}
            <a className="link" href="../architecture/">
              case studies
            </a>{' '}
            instead.
          </p>
        </noscript>
      </div>
    </>
  );
}
