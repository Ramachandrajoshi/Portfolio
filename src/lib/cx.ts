/**
 * Class-name joiner for client components. Deliberately clsx-only: tailwind-merge
 * (~9 KB gzip) is reserved for server components via `cn` in ./utils, so it never ships
 * in the browser bundle. Client components must not pass conflicting utilities.
 */
export { clsx as cx } from 'clsx';
