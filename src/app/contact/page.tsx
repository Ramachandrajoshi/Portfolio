import { PageHeader } from '@/components/layout/PageHeader';
import { ContactForm } from '@/components/contact/ContactForm';
import { GitHubIcon, LinkedInIcon, MailIcon } from '@/components/ui/icons';
import { profile } from '@/data/profile';
import { formspreeEndpoint } from '@/lib/contact';
import { pageMetadata } from '@/lib/metadata';

export const metadata = pageMetadata({
  title: 'Contact',
  description: `Get in touch with ${profile.name} about architecture reviews, system design, AI inference or IoT telemetry.`,
  path: '/contact/',
  image: '/og/contact.png',
});

const endpoint = formspreeEndpoint(process.env.NEXT_PUBLIC_FORMSPREE_FORM_ID);

export default function ContactPage() {
  return (
    <>
      <PageHeader
        crumbs={[{ name: 'Contact', path: '/contact/' }]}
        eyebrow="Profile plaza"
        title="Let's talk systems"
        lead={<p>Architecture reviews, design decisions to pressure-test, or a technical conversation — send a message or reach me on LinkedIn.</p>}
      />
      <div className="container-page grid gap-12 py-12 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <section aria-labelledby="form-heading" className="max-w-2xl">
          <h2 id="form-heading" className="font-display text-2xl font-semibold">Send a message</h2>
          <div className="mt-6">
            {endpoint ? (
              <ContactForm endpoint={endpoint} />
            ) : (
              <div className="card p-6 text-muted" data-testid="contact-unconfigured">
                <p className="font-medium text-fg">The contact form is not configured in this build.</p>
                <p className="mt-2 text-sm">Please use LinkedIn{profile.email ? ' or email' : ''} instead — links are alongside.</p>
              </div>
            )}
          </div>
          <p id="contact-privacy" className="mt-8 text-sm text-muted">
            <strong className="text-fg">Privacy:</strong> messages are delivered by{' '}
            <a href="https://formspree.io/legal/privacy-policy/" className="link" target="_blank" rel="noopener noreferrer">Formspree<span className="sr-only"> (opens in a new tab)</span></a>{' '}
            to my inbox. Your name and email are used only to reply; they are not added to any list or shared. This site sets no tracking cookies.
          </p>
        </section>
        <aside className="space-y-4" aria-label="Other ways to reach me">
          <a href={profile.links.linkedin} className="card card-interactive flex items-center gap-3 p-4" rel="me noopener" target="_blank">
            <LinkedInIcon className="size-6 text-secondary" />
            <span><span className="block font-medium">LinkedIn</span><span className="block text-sm text-muted">Connect or message</span></span>
            <span className="sr-only">(opens in a new tab)</span>
          </a>
          <a href={profile.links.github} className="card card-interactive flex items-center gap-3 p-4" rel="me noopener" target="_blank">
            <GitHubIcon className="size-6" />
            <span><span className="block font-medium">GitHub</span><span className="block text-sm text-muted">Code and experiments</span></span>
            <span className="sr-only">(opens in a new tab)</span>
          </a>
          {profile.email ? (
            <a href={`mailto:${profile.email}`} className="card card-interactive flex items-center gap-3 p-4">
              <MailIcon className="size-6 text-accent" />
              <span><span className="block font-medium">Email</span><span className="block text-sm text-muted">{profile.email}</span></span>
            </a>
          ) : null}
        </aside>
      </div>
    </>
  );
}
