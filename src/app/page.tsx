import { Hero } from '@/components/hero3d/Hero';
import { HomeSections } from '@/components/home/HomeSections';
import { JsonLd } from '@/components/seo/JsonLd';
import { pageMetadata } from '@/lib/metadata';
import { personSchema, websiteSchema } from '@/lib/structured-data';
import { profile } from '@/data/profile';

export const metadata = pageMetadata({
  title: `${profile.name} — ${profile.title}`,
  description: profile.positioning,
  path: '/',
  image: '/og/default.png',
});

export default function HomePage() {
  return (
    <>
      <Hero />
      <HomeSections />
      <JsonLd data={[websiteSchema(), personSchema()]} />
    </>
  );
}
