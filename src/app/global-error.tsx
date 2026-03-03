"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body className="bg-background text-foreground">
        <main className="flex min-h-screen items-center justify-center px-4 py-10">
          <div className="w-full max-w-xl rounded-[var(--radius-card)] border border-border bg-surface p-6 shadow-[var(--shadow-card)]">
            <p className="font-mono text-xs uppercase tracking-[0.24em] text-[var(--red)]">
              Application error
            </p>
            <h1 className="mt-3 font-heading text-3xl">Something went wrong.</h1>
            <p className="mt-3 text-sm leading-6 text-[var(--ink-light)]">
              The error has been recorded. Try again once, and if it persists,
              keep this tab open and review the latest changes before proceeding.
            </p>
            <button
              className="mt-6 inline-flex min-h-11 items-center justify-center rounded-[var(--radius-input)] bg-[var(--accent)] px-4 text-sm font-medium text-white"
              onClick={() => reset()}
              type="button"
            >
              Try again
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
