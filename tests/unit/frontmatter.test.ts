/**
 * Runs the real Velite article collection over fixture directories to prove that
 *  - invalid frontmatter fails the (strict) build and names the offending files, and
 *  - drafts are removed before anything is generated from them.
 */
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const fixture = (kind: 'valid' | 'invalid') => `tests/fixtures/content-validation/${kind}/velite.config.ts`;
const velite = (config: string) =>
  spawnSync(
    process.execPath,
    [join(process.cwd(), 'node_modules/velite/bin/velite.js'), 'build', '--config', config, '--strict'],
    {
      encoding: 'utf8',
      env: { ...process.env, FORCE_COLOR: '0' },
    },
  );

describe('article frontmatter validation', () => {
  it('fails the strict build on invalid frontmatter and reports each file', () => {
    const result = velite(fixture('invalid'));
    expect(result.status).not.toBe(0);
    const output = result.stdout + result.stderr;
    for (const file of ['missing-description', 'bad-tags', 'bad-date', 'cover-without-alt'])
      expect(output).toContain(file);
  });

  it('builds valid articles and drops drafts', () => {
    const result = velite(fixture('valid'));
    expect(result.status, result.stderr).toBe(0);
    const out = join(process.cwd(), 'node_modules/.cache/velite-fixture-valid/articles.json');
    const articles = JSON.parse(readFileSync(out, 'utf8')) as {
      slug: string;
      date: string;
      metadata: { readingTime: number };
    }[];
    expect(articles.map((a) => a.slug)).toEqual(['valid-article']);
    expect(articles[0]!.date).toBe('2026-01-15T00:00:00.000Z');
  });
});
