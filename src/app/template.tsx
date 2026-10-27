import type { ReactNode } from 'react';

// Re-mounted on every navigation: a short CSS entrance (disabled under reduced motion via
// the duration tokens). CSS rather than JS so content is visible without JavaScript.
export default function Template({ children }: { children: ReactNode }) {
  return <div className="page-enter">{children}</div>;
}
