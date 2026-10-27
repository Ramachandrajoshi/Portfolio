import type { Thing, WithContext } from 'schema-dts';

/** Serialises schema.org data safely (escapes "<" so content cannot close the script). */
export function JsonLd({ data }: { data: WithContext<Thing> | WithContext<Thing>[] }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }}
    />
  );
}
