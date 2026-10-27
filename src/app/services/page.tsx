import Link from 'next/link';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { services } from '@/data/services';
import { pageMetadata } from '@/lib/metadata';

export const metadata = pageMetadata({
  title: 'Services',
  description: 'Architecture assessment, system design, backend and API architecture, AI inference deployment, IoT telemetry architecture and performance reviews.',
  path: '/services/',
  image: '/og/services.png',
});

export default function ServicesPage() {
  return (
    <>
      <PageHeader
        crumbs={[{ name: 'Services', path: '/services/' }]}
        eyebrow="How I can help"
        title="Architecture & engineering services"
        lead={<p>Offerings built around the way I work: constraints first, explicit trade-offs, and a validation plan for every significant decision. These describe what I offer — not claims about past client engagements.</p>}
      />
      <div className="container-page py-12">
        <ul className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {services.map((s) => (
            <li key={s.id} id={s.id} className="card flex flex-col p-6">
              <h2 className="font-display text-xl font-semibold">{s.title}</h2>
              <p className="mt-2 text-muted">{s.summary}</p>
              <p className="eyebrow mt-5">Deliverables</p>
              <ul className="mt-2 flex-1 space-y-1.5 text-sm">
                {s.deliverables.map((d) => (
                  <li key={d} className="flex gap-2">
                    <span aria-hidden className="text-accent">→</span>
                    {d}
                  </li>
                ))}
              </ul>
              <p className="mt-5 border-t border-border pt-4 text-sm text-muted">{s.approach}</p>
            </li>
          ))}
        </ul>
        <div className="mt-12 flex flex-col items-start gap-4 rounded-xl border border-border bg-surface-2/50 p-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-2xl text-muted">Have a system that needs a second pair of eyes, or a design decision to pressure-test?</p>
          <Button asChild>
            <Link href="/contact/">Start a conversation</Link>
          </Button>
        </div>
      </div>
    </>
  );
}
