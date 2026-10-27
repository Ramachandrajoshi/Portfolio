import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import '@/styles/globals.css';
import { inter, jetbrainsMono, spaceGrotesk } from '@/styles/fonts';
import { SiteHeader } from '@/components/layout/SiteHeader';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { themeInitScript } from '@/lib/theme';
import { DEFAULT_DESCRIPTION, SITE_NAME } from '@/lib/metadata';
import { absoluteAsset, absoluteUrl, SITE_URL } from '@/lib/urls';
import { profile } from '@/data/profile';

export const metadata: Metadata = {
  metadataBase: new URL(`${SITE_URL}/`),
  title: { default: SITE_NAME, template: `%s · ${profile.name}` },
  description: DEFAULT_DESCRIPTION,
  applicationName: SITE_NAME,
  authors: [{ name: profile.name, url: absoluteUrl('/about/') }],
  creator: profile.name,
  alternates: {
    canonical: absoluteUrl('/'),
    types: { 'application/rss+xml': [{ url: absoluteAsset('/feed.xml'), title: `${profile.name} — Articles` }] },
  },
  icons: { icon: [{ url: absoluteAsset('/icon.svg'), type: 'image/svg+xml' }] },
  formatDetection: { telephone: false, email: false, address: false },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#070b16' },
    { media: '(prefers-color-scheme: light)', color: '#f5f7fb' },
  ],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      // The inline script sets data-theme before hydration; React must not warn about it.
      suppressHydrationWarning
      className={`${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="flex min-h-dvh flex-col">
        <a
          href="#main-content"
          className="sr-only z-[100] rounded-md bg-accent px-4 py-2 font-medium text-accent-contrast focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
        >
          Skip to content
        </a>
        <SiteHeader />
        <main id="main-content" tabIndex={-1} className="flex-1 focus:outline-none">
          {children}
        </main>
        <SiteFooter />
      </body>
    </html>
  );
}
