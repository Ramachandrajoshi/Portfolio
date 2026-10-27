import { allArticles } from '@/content';
import { profile } from '@/data/profile';
import { absoluteAsset, absoluteUrl } from '@/lib/urls';

// Generated once at build time into out/feed.xml.
export const dynamic = 'force-static';

const escape = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');

export function GET() {
  const items = allArticles
    .map(
      (a) => `    <item>
      <title>${escape(a.title)}</title>
      <link>${absoluteUrl(a.url)}</link>
      <guid isPermaLink="true">${absoluteUrl(a.url)}</guid>
      <description>${escape(a.description)}</description>
      <pubDate>${new Date(a.date).toUTCString()}</pubDate>
${a.tags.map((t) => `      <category>${escape(t)}</category>`).join('\n')}
    </item>`,
    )
    .join('\n');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escape(`${profile.name} — Articles`)}</title>
    <link>${absoluteUrl('/articles/')}</link>
    <atom:link href="${absoluteAsset('/feed.xml')}" rel="self" type="application/rss+xml" />
    <description>${escape('Technical writing on system design, AI inference, event-driven systems and industrial IoT.')}</description>
    <language>en</language>
    <lastBuildDate>${new Date(allArticles[0]?.date ?? Date.now()).toUTCString()}</lastBuildDate>
${items}
  </channel>
</rss>
`;
  return new Response(xml, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } });
}
