import Link from 'next/link';
import { asset } from '@/lib/urls';
import { primaryNav, secondaryNav } from '@/data/navigation';
import { profile } from '@/data/profile';
import { GitHubIcon, LinkedInIcon, RssIcon } from '@/components/ui/icons';

export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer data-site-footer className="mt-24 border-t border-border bg-bg-elevated">
      <div className="container-page grid gap-10 py-12 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <p className="font-display text-lg font-semibold">{profile.name}</p>
          <p className="mt-1 text-sm text-muted">{profile.title}</p>
          <p className="mt-4 max-w-sm text-sm text-muted">{profile.shortBio}</p>
          <ul className="mt-5 flex gap-2" aria-label="Profiles">
            <li>
              <a
                href={profile.links.github}
                className="inline-flex size-10 items-center justify-center rounded-md border border-border text-muted hover:border-accent hover:text-accent"
                rel="me noopener"
                target="_blank"
              >
                <GitHubIcon className="size-5" />
                <span className="sr-only">GitHub (opens in a new tab)</span>
              </a>
            </li>
            <li>
              <a
                href={profile.links.linkedin}
                className="inline-flex size-10 items-center justify-center rounded-md border border-border text-muted hover:border-accent hover:text-accent"
                rel="me noopener"
                target="_blank"
              >
                <LinkedInIcon className="size-5" />
                <span className="sr-only">LinkedIn (opens in a new tab)</span>
              </a>
            </li>
            <li>
              <a
                href={asset('/feed.xml')}
                className="inline-flex size-10 items-center justify-center rounded-md border border-border text-muted hover:border-accent hover:text-accent"
              >
                <RssIcon className="size-5" />
                <span className="sr-only">Articles RSS feed</span>
              </a>
            </li>
          </ul>
        </div>
        <nav aria-label="Footer — explore">
          <p className="eyebrow">Explore</p>
          <ul className="mt-3 space-y-2 text-sm">
            {primaryNav.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="text-muted hover:text-fg">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <nav aria-label="Footer — more">
          <p className="eyebrow">More</p>
          <ul className="mt-3 space-y-2 text-sm">
            {secondaryNav.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="text-muted hover:text-fg">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <div className="border-t border-border">
        <div className="container-page flex flex-col gap-2 py-5 text-xs text-subtle sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {profile.name}. Personal site — views are my own and not endorsed by any employer.
          </p>
          <p>Architecture material is labelled by provenance: sanitised, illustrative or experimental.</p>
        </div>
      </div>
    </footer>
  );
}
