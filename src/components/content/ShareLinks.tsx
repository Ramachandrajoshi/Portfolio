import { absoluteUrl } from '@/lib/urls';
import { CopyLinkButton } from './CopyLinkButton';

/** Backend-free share links: plain URLs to each network's public share endpoint. */
export function ShareLinks({ title, path }: { title: string; path: string }) {
  const url = absoluteUrl(path);
  const e = encodeURIComponent;
  const links = [
    { label: 'LinkedIn', href: `https://www.linkedin.com/sharing/share-offsite/?url=${e(url)}` },
    { label: 'X', href: `https://twitter.com/intent/tweet?url=${e(url)}&text=${e(title)}` },
    { label: 'Hacker News', href: `https://news.ycombinator.com/submitlink?u=${e(url)}&t=${e(title)}` },
    { label: 'Email', href: `mailto:?subject=${e(title)}&body=${e(url)}` },
  ];
  return (
    <div className="flex flex-wrap items-center gap-2" data-print-hide>
      <span className="text-sm text-muted">Share:</span>
      {links.map((l) => (
        <a
          key={l.label}
          href={l.href}
          className="rounded-md border border-border px-2.5 py-1 text-sm text-muted hover:border-accent hover:text-accent"
          {...(l.href.startsWith('mailto:') ? {} : { target: '_blank', rel: 'noopener noreferrer' })}
        >
          {l.label}
          {l.href.startsWith('mailto:') ? null : <span className="sr-only"> (opens in a new tab)</span>}
        </a>
      ))}
      <CopyLinkButton url={url} />
    </div>
  );
}
