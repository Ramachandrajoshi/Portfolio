// Fixture pipeline for tests/unit/frontmatter.test.ts: the real article schema, mdx options
// and prepare hook, pointed at deliberately invalid articles.
import { defineConfig } from 'velite';
import { collections, mdxOptions, prepareContent } from '../../../../velite.config';

export default defineConfig({
  root: 'content',
  output: {
    data: '../../../../node_modules/.cache/velite-fixture-invalid',
    assets: '../../../../node_modules/.cache/velite-fixture-invalid/static',
    base: '/static/',
    clean: true,
  },
  collections: { articles: collections.articles },
  mdx: mdxOptions,
  prepare: (data) => prepareContent(data as never),
});
