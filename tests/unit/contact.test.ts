import { describe, expect, it, vi } from 'vitest';
import { formspreeEndpoint, isLikelyBot, submitContact, validateContact, type ContactInput } from '@/lib/contact';

const valid: ContactInput = {
  name: 'Ada Lovelace',
  email: 'ada@example.com',
  topic: 'System design',
  message: 'I would like to discuss an architecture review.',
  company: '',
};

describe('validateContact', () => {
  it('accepts a complete message', () => {
    expect(validateContact(valid)).toEqual({});
  });

  it('reports every missing field with an actionable message', () => {
    const errors = validateContact({ name: ' ', email: '', topic: '', message: '', company: '' });
    expect(Object.keys(errors).sort()).toEqual(['email', 'message', 'name', 'topic']);
    expect(errors.email).toMatch(/email/i);
  });

  it.each(['plainaddress', 'a@b', 'a@b.', '@example.com', 'a b@example.com'])('rejects invalid email %s', (email) => {
    expect(validateContact({ ...valid, email }).email).toBeDefined();
  });

  it('enforces message length bounds', () => {
    expect(validateContact({ ...valid, message: 'too short' }).message).toMatch(/20 characters/);
    expect(validateContact({ ...valid, message: 'x'.repeat(5001) }).message).toMatch(/5,000/);
  });

  it('only accepts known topics', () => {
    expect(validateContact({ ...valid, topic: 'Spam' }).topic).toBeDefined();
  });
});

describe('honeypot', () => {
  it('flags submissions that fill the hidden field', () => {
    expect(isLikelyBot({ ...valid, company: 'ACME' })).toBe(true);
    expect(isLikelyBot(valid)).toBe(false);
  });
});

describe('formspreeEndpoint', () => {
  it('builds the endpoint only from a plausible form id', () => {
    expect(formspreeEndpoint('xyzabcd1')).toBe('https://formspree.io/f/xyzabcd1');
    expect(formspreeEndpoint(undefined)).toBeNull();
    expect(formspreeEndpoint('')).toBeNull();
    expect(formspreeEndpoint('../../evil')).toBeNull();
  });
});

describe('submitContact', () => {
  it('posts JSON with reply-to and honeypot fields', async () => {
    const fetchMock = vi.fn(async () => new Response('{}', { status: 200 }));
    const result = await submitContact('https://formspree.io/f/abc123', valid, fetchMock as unknown as typeof fetch);
    expect(result).toEqual({ ok: true });
    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    const body = JSON.parse(String(init.body));
    expect(body).toMatchObject({ email: 'ada@example.com', _replyto: 'ada@example.com', _gotcha: '' });
    expect((init.headers as Record<string, string>).Accept).toBe('application/json');
  });

  it('surfaces provider error messages', async () => {
    const fetchMock = vi.fn(
      async () => new Response(JSON.stringify({ errors: [{ message: 'Form not found' }] }), { status: 404 }),
    );
    expect(await submitContact('https://formspree.io/f/abc123', valid, fetchMock as unknown as typeof fetch)).toEqual({
      ok: false,
      message: 'Form not found',
    });
  });

  it('handles network failures', async () => {
    const fetchMock = vi.fn(async () => {
      throw new TypeError('offline');
    });
    const result = await submitContact('https://formspree.io/f/abc123', valid, fetchMock as unknown as typeof fetch);
    expect(result.ok).toBe(false);
  });
});
