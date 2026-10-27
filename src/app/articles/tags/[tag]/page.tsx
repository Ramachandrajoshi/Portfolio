import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PageHeader } from '@/components/layout/PageHeader';
import { ArticleCard } from '@/components/content/ArticleCard';
import { TagList } from '@/components/content/TagList';
import { allArticles, allTags } from '@/content';
import { pageMetadata } from '@/lib/metadata';

type Params = { tag: string };
export const dynamicParams = false;

export function generateStaticParams(): Params[] {
  return allTags().map(({ tag }) => ({ tag }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { tag } = await params;
  return pageMetadata({
    title: `Articles tagged #${tag}`,
    description: `Technical articles about ${tag.replace(/-/g, ' ')}.`,
    path: `/articles/tags/${tag}/`,
    image: '/og/articles.png',
  });
}

export default async function TagPage({ params }: { params: Promise<Params> }) {
  const { tag } = await params;
  const articles = allArticles.filter((a) => a.tags.includes(tag));
  if (!articles.length) notFound();
  return (
    <>
      <PageHeader
        crumbs={[
          { name: 'Articles', path: '/articles/' },
          { name: `#${tag}`, path: `/articles/tags/${tag}/` },
        ]}
        eyebrow="Tag"
        title={`#${tag}`}
        lead={<p>{articles.length === 1 ? '1 article' : `${articles.length} articles`}</p>}
      />
      <div className="container-page py-10">
        <TagList tags={allTags()} active={tag} />
        <ul className="mt-8 grid gap-6 md:grid-cols-2">
          {articles.map((a) => (
            <li key={a.slug}>
              <ArticleCard article={a} />
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
