'use client';

import { useRef, useState, type FormEvent } from 'react';
import { CONTACT_TOPICS, isLikelyBot, submitContact, validateContact, type ContactErrors, type ContactInput } from '@/lib/contact';
import { cn } from '@/lib/utils';

type Status = { state: 'idle' } | { state: 'submitting' } | { state: 'success' } | { state: 'error'; message: string };

const fields = ['name', 'email', 'topic', 'message'] as const;
const labels = { name: 'Name', email: 'Email', topic: 'Topic', message: 'Message' };

/**
 * Progressive enhancement: without JavaScript this is a plain HTML form that posts to
 * Formspree. With JavaScript it validates inline, submits with fetch and reports state
 * through a live region. No backend of our own is involved.
 */
export function ContactForm({ endpoint }: { endpoint: string }) {
  const [errors, setErrors] = useState<ContactErrors>({});
  const [status, setStatus] = useState<Status>({ state: 'idle' });
  const summaryRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const read = (form: HTMLFormElement): ContactInput => {
    const data = new FormData(form);
    return {
      name: String(data.get('name') ?? ''),
      email: String(data.get('email') ?? ''),
      topic: String(data.get('topic') ?? ''),
      message: String(data.get('message') ?? ''),
      company: String(data.get('_gotcha') ?? ''),
    };
  };

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const input = read(form);
    const found = validateContact(input);
    setErrors(found);
    if (Object.keys(found).length) {
      setStatus({ state: 'idle' });
      requestAnimationFrame(() => summaryRef.current?.focus());
      return;
    }
    if (isLikelyBot(input)) {
      // Pretend success so automated submitters learn nothing.
      setStatus({ state: 'success' });
      return;
    }
    setStatus({ state: 'submitting' });
    const result = await submitContact(endpoint, input);
    if (result.ok) {
      setStatus({ state: 'success' });
      form.reset();
    } else {
      setStatus({ state: 'error', message: result.message });
    }
  }

  const errorList = fields.filter((f) => errors[f]);

  if (status.state === 'success') {
    return (
      <div role="status" className="card border-success/50 p-6" data-testid="contact-success" tabIndex={-1} ref={(el) => el?.focus()}>
        <p className="font-display text-xl font-semibold text-success">Message sent — thank you.</p>
        <p className="mt-2 text-muted">I read every message and usually reply within a few working days.</p>
        <button type="button" className="link mt-4 text-sm" onClick={() => setStatus({ state: 'idle' })}>
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form ref={formRef} action={endpoint} method="POST" noValidate onSubmit={onSubmit} className="space-y-5" data-testid="contact-form" aria-describedby="contact-privacy">
      {errorList.length ? (
        <div ref={summaryRef} tabIndex={-1} role="alert" className="rounded-md border border-danger/50 bg-danger/10 p-4 text-sm" data-testid="contact-error-summary">
          <p className="font-semibold text-danger">Please fix {errorList.length === 1 ? 'this problem' : `these ${errorList.length} problems`}:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {errorList.map((f) => (
              <li key={f}>
                <a href={`#contact-${f}`} className="underline">{labels[f]}: {errors[f]}</a>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="grid gap-5 sm:grid-cols-2">
        <Field id="name" label="Name" error={errors.name}>
          <input id="contact-name" name="name" type="text" autoComplete="name" required maxLength={100} {...aria('name', errors)} className={inputClass(errors.name)} />
        </Field>
        <Field id="email" label="Email" error={errors.email}>
          <input id="contact-email" name="email" type="email" autoComplete="email" required inputMode="email" {...aria('email', errors)} className={inputClass(errors.email)} />
        </Field>
      </div>
      <Field id="topic" label="Topic" error={errors.topic}>
        <select id="contact-topic" name="topic" required defaultValue="" {...aria('topic', errors)} className={inputClass(errors.topic)}>
          <option value="" disabled>Choose a topic…</option>
          {CONTACT_TOPICS.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </Field>
      <Field id="message" label="Message" hint="At least 20 characters. Please don't include confidential information." error={errors.message}>
        <textarea id="contact-message" name="message" required rows={7} maxLength={5000} {...aria('message', errors, true)} className={cn(inputClass(errors.message), 'h-auto py-2.5')} />
      </Field>

      {/* Honeypot — visually hidden and removed from the accessibility tree and tab order. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor="contact-company">Company (leave empty)</label>
        <input id="contact-company" name="_gotcha" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={status.state === 'submitting'}
          className="inline-flex h-11 items-center gap-2 rounded-md bg-accent px-5 font-medium text-accent-contrast hover:bg-accent-strong disabled:opacity-60"
        >
          {status.state === 'submitting' ? 'Sending…' : 'Send message'}
        </button>
        <p role="status" aria-live="polite" className="text-sm text-muted">
          {status.state === 'submitting' ? 'Sending your message…' : ''}
        </p>
      </div>
      {status.state === 'error' ? (
        <div role="alert" className="rounded-md border border-danger/50 bg-danger/10 p-4 text-sm" data-testid="contact-submit-error">
          <p className="font-semibold text-danger">Your message was not sent.</p>
          <p className="mt-1">{status.message}</p>
        </div>
      ) : null}
    </form>
  );
}

function aria(field: keyof ContactErrors, errors: ContactErrors, hasHint = false) {
  const describedBy = [hasHint ? `contact-${field}-hint` : null, errors[field] ? `contact-${field}-error` : null].filter(Boolean).join(' ');
  return { 'aria-invalid': errors[field] ? true : undefined, 'aria-describedby': describedBy || undefined };
}

function inputClass(error?: string) {
  return cn(
    'block h-11 w-full rounded-md border bg-surface px-3 text-base text-fg placeholder:text-subtle',
    error ? 'border-danger' : 'border-border-strong focus:border-accent',
  );
}

function Field({ id, label, hint, error, children }: { id: string; label: string; hint?: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={`contact-${id}`} className="block text-sm font-medium">
        {label} <span className="text-danger" aria-hidden>*</span>
        <span className="sr-only"> (required)</span>
      </label>
      {hint ? <p id={`contact-${id}-hint`} className="mt-1 text-xs text-muted">{hint}</p> : null}
      <div className="mt-1.5">{children}</div>
      {error ? (
        <p id={`contact-${id}-error`} className="mt-1.5 text-sm text-danger">
          <span aria-hidden>⚠ </span>{error}
        </p>
      ) : null}
    </div>
  );
}
