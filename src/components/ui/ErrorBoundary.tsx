'use client';

import { Component, type ErrorInfo, type ReactNode } from 'react';

/** Contains failures of optional, heavy islands (WebGL, React Flow, Sandpack). */
export class ErrorBoundary extends Component<
  { fallback: ReactNode; onError?: (error: Error) => void; children: ReactNode },
  { failed: boolean }
> {
  override state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  override componentDidCatch(error: Error, info: ErrorInfo) {
    this.props.onError?.(error);
    if (process.env.NODE_ENV !== 'production') console.error(error, info.componentStack);
  }

  override render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
