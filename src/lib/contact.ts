/**
 * Contact-form validation and submission. Pure functions, no dependencies, so the logic is
 * unit-tested and the client island stays tiny. Client-side checks are a usability aid —
 * Formspree applies its own server-side validation and spam filtering.
 */
export interface ContactInput {
  name: string;
  email: string;
  topic: string;
  message: string;
  /** Honeypot. Humans never see or fill it; bots often do. */
  company: string;
}

export type ContactErrors = Partial<Record<'name' | 'email' | 'topic' | 'message', string>>;

export const CONTACT_TOPICS = [
  'Architecture review',
  'System design',
  'AI / inference',
  'IoT / telemetry',
  'Speaking or writing',
  'Something else',
] as const;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function validateContact(input: ContactInput): ContactErrors {
  const errors: ContactErrors = {};
  const name = input.name.trim();
  const email = input.email.trim();
  const message = input.message.trim();
  if (!name) errors.name = 'Enter your name.';
  else if (name.length > 100) errors.name = 'Name must be 100 characters or fewer.';
  if (!email) errors.email = 'Enter your email address so I can reply.';
  else if (!EMAIL.test(email)) errors.email = 'Enter an email address in the format name@example.com.';
  if (!CONTACT_TOPICS.includes(input.topic as (typeof CONTACT_TOPICS)[number])) errors.topic = 'Choose a topic.';
  if (!message) errors.message = 'Enter a message.';
  else if (message.length < 20) errors.message = 'Please write at least 20 characters so I have some context.';
  else if (message.length > 5000) errors.message = 'Message must be 5,000 characters or fewer.';
  return errors;
}

export function isLikelyBot(input: ContactInput): boolean {
  return input.company.trim().length > 0;
}

/** Formspree form ids are public identifiers (not secrets); configured per environment. */
export function formspreeEndpoint(formId: string | undefined): string | null {
  const id = formId?.trim();
  if (!id || !/^[A-Za-z0-9]{6,12}$/.test(id)) return null;
  return `https://formspree.io/f/${id}`;
}

export type SubmitResult = { ok: true } | { ok: false; message: string };

export async function submitContact(
  endpoint: string,
  input: ContactInput,
  fetchImpl: typeof fetch = fetch,
): Promise<SubmitResult> {
  try {
    const response = await fetchImpl(endpoint, {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: input.name.trim(),
        email: input.email.trim(),
        _replyto: input.email.trim(),
        _subject: `Portfolio contact: ${input.topic}`,
        topic: input.topic,
        message: input.message.trim(),
        _gotcha: input.company,
      }),
    });
    if (response.ok) return { ok: true };
    const data = (await response.json().catch(() => null)) as { errors?: { message: string }[] } | null;
    return {
      ok: false,
      message:
        data?.errors?.map((e) => e.message).join(' ') || `The form service returned an error (${response.status}).`,
    };
  } catch {
    return { ok: false, message: 'Could not reach the form service. Check your connection and try again.' };
  }
}
