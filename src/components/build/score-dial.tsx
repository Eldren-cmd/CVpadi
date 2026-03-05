"use client";

import { Button } from "@/components/ui/Button";
import { ScoreDial as SharedScoreDial } from "@/components/ui/ScoreDial";
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
  const scoreBand = score >= 75 ? "Excellent" : score >= 50 ? "Strong" : "Needs work";

  return (
    <section className="rounded-[16px] border border-[var(--border)] bg-[var(--off-black)] p-5 shadow-[0_22px_62px_rgba(0,0,0,0.42)] sm:p-6">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
        <SharedScoreDial animate colorMode="auto" label="Your CV score" score={score} size={168} />

        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-[var(--mid)]">Score status</p>
          <h2 className="mt-2 font-display text-3xl text-[var(--cream)]">{scoreBand}</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--cream-dim)]">
            {suggestions.length === 0
              ? "Everything important is in place. Generate your preview and move to payment when ready."
              : `${suggestions.length} suggestion${suggestions.length === 1 ? "" : "s"} left before this looks recruiter-ready.`}
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-3">
        {suggestions.length === 0 ? (
          <div className="rounded-[10px] border border-[var(--green)] bg-[var(--green-glow)] px-4 py-3 text-sm text-[var(--green)]">
            All core sections are complete.
          </div>
        ) : (
          suggestions.slice(0, 5).map((suggestion) => (
            <div
              className="rounded-[10px] border border-[var(--border)] bg-[var(--card)] px-4 py-3"
              key={suggestion.id}
            >
              <p className="text-sm leading-6 text-[var(--cream-dim)]">{suggestion.message}</p>
              <Button className="mt-3" onClick={() => onJump(suggestion.step)} variant="ghost">
                Fix this →
              </Button>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
