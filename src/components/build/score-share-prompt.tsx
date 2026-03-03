"use client";

import { useMemo, useState } from "react";

export function ScoreSharePrompt({
  name,
  onDismiss,
  score,
}: {
  name: string;
  onDismiss: () => void;
  score: number;
}) {
  const [statusMessage, setStatusMessage] = useState("");
  const shareUrl = useMemo(() => {
    const origin =
      process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || window.location.origin;
    const params = new URLSearchParams({
      name,
      score: String(score),
    });

    return `${origin}/api/og/cv-score?${params.toString()}`;
  }, [name, score]);

  async function handleShare() {
    setStatusMessage("");

    const shareText = `My Nigerian CV score is ${score}. Check yours on CVPadi.`;

    if (navigator.share) {
      try {
        await navigator.share({
          text: shareText,
          title: "My Nigerian CV Score",
          url: shareUrl,
        });
        setStatusMessage("Shared.");
        return;
      } catch {
        // fall through to clipboard copy
      }
    }

    await handleCopy();
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setStatusMessage("Share link copied.");
    } catch {
      setStatusMessage("Copy failed. Open the card and copy the URL manually.");
    }
  }

  return (
    <div className="rounded-[var(--radius-input)] border border-[var(--gold)] bg-[var(--gold-light)] px-4 py-4 text-sm text-foreground">
      <p className="font-medium">
        Looking good. Share your score now while the result still feels fresh.
      </p>
      <p className="mt-2 leading-6 text-[var(--ink-light)]">
        This is the moment the docs call out: first completed CV view, not payment.
      </p>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <button
          className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-input)] bg-[var(--accent)] px-4 text-sm font-medium text-white"
          onClick={() => {
            void handleShare();
          }}
          type="button"
        >
          Share score
        </button>
        <button
          className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-input)] border border-border px-4 text-sm font-medium text-foreground"
          onClick={() => {
            void handleCopy();
          }}
          type="button"
        >
          Copy link
        </button>
        <a
          className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-input)] border border-border px-4 text-sm font-medium text-foreground"
          href={shareUrl}
          rel="noreferrer"
          target="_blank"
        >
          Open card
        </a>
      </div>

      {statusMessage ? (
        <p className="mt-3 text-xs uppercase tracking-[0.14em] text-[var(--ink-light)]">
          {statusMessage}
        </p>
      ) : null}

      <button
        className="mt-4 text-sm font-medium text-[var(--accent)]"
        onClick={onDismiss}
        type="button"
      >
        Dismiss
      </button>
    </div>
  );
}
