"use client";

import type { CVSuggestion } from "@/lib/cv/types";

export function ScoreDial({
  score,
  suggestions,
  onJump,
}: {
  score: number;
  suggestions: CVSuggestion[];
  onJump: (step: number) => void;
}) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const progress = circumference - (score / 100) * circumference;

  return (
    <section className="rounded-[var(--radius-card)] border border-border bg-surface p-5 shadow-[var(--shadow-card)]">
      <div className="flex items-center gap-4">
        <div className="relative h-32 w-32">
          <svg className="h-32 w-32 -rotate-90" viewBox="0 0 140 140">
            <circle
              cx="70"
              cy="70"
              fill="none"
              r={radius}
              stroke="var(--border-light)"
              strokeWidth="12"
            />
            <circle
              cx="70"
              cy="70"
              fill="none"
              r={radius}
              stroke="var(--accent)"
              strokeDasharray={circumference}
              strokeDashoffset={progress}
              strokeLinecap="round"
              strokeWidth="12"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-heading text-4xl text-foreground">{score}</span>
            <span className="text-xs uppercase tracking-[0.24em] text-[var(--ink-light)]">
              CV score
            </span>
          </div>
        </div>
        <div>
          <h2 className="font-heading text-2xl text-foreground">Nigerian CV Score</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--ink-light)]">
            Improve the missing sections and keep the score trending upward before
            generating the free watermarked preview.
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-3">
        {suggestions.length === 0 ? (
          <div className="rounded-[var(--radius-input)] border border-[var(--green)] bg-[var(--green-light)] px-4 py-3 text-sm text-[var(--green)]">
            All core sections are in place. The draft is ready for the free watermarked preview.
          </div>
        ) : (
          suggestions.slice(0, 4).map((suggestion) => (
            <div
              className="flex items-start justify-between gap-3 rounded-[var(--radius-input)] border border-[var(--border-light)] bg-white/70 px-4 py-3"
              key={suggestion.id}
            >
              <p className="text-sm leading-6 text-[var(--ink-light)]">{suggestion.message}</p>
              <button
                className="shrink-0 text-sm font-medium text-[var(--accent)]"
                onClick={() => onJump(suggestion.step)}
                type="button"
              >
                Fix this {"->"}
              </button>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
