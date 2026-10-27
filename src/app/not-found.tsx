import Link from 'next/link';
import { allNav } from '@/data/navigation';

export const metadata = { title: 'Page not found', robots: { index: false } };

export default function NotFound() {
  return (
    <div className="container-page py-24">
      <p className="eyebrow">404 · Off the map</p>
      <h1 className="mt-3 font-display text-[length:var(--text-5xl)] font-semibold">This street isn&apos;t on the map.</h1>
      <p className="mt-4 max-w-xl text-lg text-muted">
        The page you were looking for doesn&apos;t exist or has moved. Every district of the city is reachable from here:
      </p>
      <ul className="mt-8 grid max-w-3xl gap-3 sm:grid-cols-2">
        {allNav.map((item) => (
          <li key={item.href}>
            <Link href={item.href} className="card card-interactive block p-4">
              <span className="font-medium">{item.label}</span>
              <span className="block text-sm text-muted">{item.description}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
