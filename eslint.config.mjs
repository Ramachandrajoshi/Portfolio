import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';
import nextTypeScript from 'eslint-config-next/typescript';

/** @type {import('eslint').Linter.Config[]} */
const config = [
  ...nextCoreWebVitals,
  ...nextTypeScript,
  {
    ignores: ['.next/**', 'out/**', '.velite/**', 'public/**', 'node_modules/**', 'next-env.d.ts', 'coverage/**', 'playwright-report/**', 'test-results/**'],
  },
  {
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@typescript-eslint/consistent-type-imports': ['error', { fixStyle: 'inline-type-imports', disallowTypeAnnotations: false }],
      // Static export: next/image is unoptimised by design; plain <img> is used for pre-built SVGs.
      '@next/next/no-img-element': 'off',
      'react/no-unknown-property': 'off',
    },
  },
  {
    // Client components must never import server-only content modules (keeps Zod/Velite data out of bundles).
    files: ['src/components/**/*.tsx', 'src/lib/**/*.ts'],
    rules: {
      'no-restricted-imports': ['error', { paths: [{ name: '#site/content', message: 'Import content through src/content (server only).' }] }],
    },
  },
];

export default config;
