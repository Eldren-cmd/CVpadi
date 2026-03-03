"use client";

import * as Sentry from "@sentry/nextjs";
import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class FormErrorBoundary extends Component<Props, State> {
  state: State = {
    hasError: false,
  };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    Sentry.captureException(error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-[var(--radius-card)] border border-[var(--red)] bg-[var(--red-light)] p-6 text-center shadow-[var(--shadow-card)]">
          <h2 className="font-heading text-2xl text-foreground">Something went wrong</h2>
          <p className="mt-3 text-sm leading-6 text-[var(--ink-light)]">
            Don&apos;t worry. Your progress is saved locally. Reload the page to
            continue.
          </p>
          <button
            className="mt-5 inline-flex min-h-11 items-center justify-center rounded-[var(--radius-input)] bg-[var(--accent)] px-4 text-sm font-medium text-white"
            onClick={() => window.location.reload()}
            type="button"
          >
            Reload
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
