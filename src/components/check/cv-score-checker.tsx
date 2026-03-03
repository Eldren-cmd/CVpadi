"use client";

import { magicLinkSchema } from "@/lib/cv/validation";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

interface CheckResult {
  preview: string;
  score: number;
  suggestions: Array<{
    id: string;
    message: string;
    step: number;
  }>;
}

export function CvScoreChecker() {
  const router = useRouter();
  const [cvText, setCvText] = useState("");
  const [email, setEmail] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [result, setResult] = useState<CheckResult | null>(null);
  const [statusMessage, setStatusMessage] = useState(
    "Paste your CV text or upload a PDF. We reuse the same Nigerian CV score engine as the builder.",
  );
  const [isPending, setIsPending] = useState(false);
  const emailIsValid = useMemo(
    () => magicLinkSchema.safeParse({ email }).success,
    [email],
  );

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsPending(true);
    setStatusMessage("Scoring your CV...");

    try {
      const payload = new FormData();
      payload.set("text", cvText);
      if (pdfFile) {
        payload.set("pdf", pdfFile);
      }

      const response = await fetch("/api/check/score", {
        body: payload,
        method: "POST",
      });

      const nextResult = (await response.json()) as CheckResult | { error?: string };

      if (!response.ok || !("score" in nextResult)) {
        const errorMessage = "error" in nextResult ? nextResult.error : undefined;
        throw new Error(errorMessage ?? "Unable to score this CV right now.");
      }

      setResult(nextResult);
      setStatusMessage("Score ready. Tighten the weak spots, then rebuild it properly.");
    } catch (error) {
      setResult(null);
      setStatusMessage(
        error instanceof Error ? error.message : "Unable to score this CV right now.",
      );
    } finally {
      setIsPending(false);
    }
  }

  function handleStartFree() {
    if (!emailIsValid) {
      setStatusMessage("Enter a valid email address so we can carry it into the free build flow.");
      return;
    }

    router.push(`/login?next=/build&email=${encodeURIComponent(email)}`);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
      <section className="rounded-[var(--radius-card)] border border-border bg-surface p-5 shadow-[var(--shadow-card)] sm:p-6">
        <p className="font-mono text-xs uppercase tracking-[0.24em] text-[var(--ink-light)]">
          CV checker
        </p>
        <h1 className="mt-2 font-heading text-4xl text-foreground">Check my Nigerian CV</h1>
        <p className="mt-4 text-base leading-7 text-[var(--ink-light)]">
          Paste the CV text or upload a PDF. You get an instant score and five practical
          fixes from the same scoring engine behind the builder.
        </p>

        <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
          <label className="grid gap-2 text-sm">
            <span>Paste CV text</span>
            <textarea
              className="min-h-72 rounded-[var(--radius-input)] border border-border bg-white px-4 py-3"
              onChange={(event) => setCvText(event.target.value)}
              placeholder="Paste your CV text here if you don't want to upload a PDF."
              value={cvText}
            />
          </label>

          <label className="grid gap-2 text-sm">
            <span>Or upload PDF</span>
            <input
              accept="application/pdf"
              className="min-h-12 rounded-[var(--radius-input)] border border-border bg-white px-4 py-3"
              onChange={(event) => setPdfFile(event.target.files?.[0] ?? null)}
              type="file"
            />
          </label>

          <button
            className="inline-flex min-h-12 items-center justify-center rounded-[var(--radius-input)] bg-[var(--accent)] px-5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isPending}
            type="submit"
          >
            {isPending ? "Scoring..." : "Check my CV"}
          </button>
        </form>

        <p className="mt-4 rounded-[var(--radius-input)] border border-[var(--border-light)] bg-white/70 px-4 py-3 text-sm leading-6 text-[var(--ink-light)]">
          {statusMessage}
        </p>
      </section>

      <div className="grid gap-6">
        <section className="rounded-[var(--radius-card)] border border-border bg-surface p-5 shadow-[var(--shadow-card)] sm:p-6">
          <p className="font-mono text-xs uppercase tracking-[0.24em] text-[var(--ink-light)]">
            Result
          </p>
          <div className="mt-4 flex items-center gap-4">
            <div className="flex h-24 w-24 items-center justify-center rounded-full border border-[var(--accent)] bg-[var(--accent-light)]">
              <span className="font-heading text-4xl text-[var(--accent)]">
                {result?.score ?? "--"}
              </span>
            </div>
            <div>
              <h2 className="font-heading text-2xl text-foreground">Instant CV score</h2>
              <p className="mt-2 text-sm leading-6 text-[var(--ink-light)]">
                Five tips max, focused on the biggest gaps first.
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-3">
            {result ? (
              result.suggestions.length > 0 ? (
                result.suggestions.map((suggestion) => (
                  <div
                    className="rounded-[var(--radius-input)] border border-[var(--border-light)] bg-white/70 px-4 py-3 text-sm leading-6 text-[var(--ink-light)]"
                    key={suggestion.id}
                  >
                    {suggestion.message}
                  </div>
                ))
              ) : (
                <div className="rounded-[var(--radius-input)] border border-[var(--green)] bg-[var(--green-light)] px-4 py-3 text-sm text-[var(--green)]">
                  Strong structure already. This CV is ready for a cleaner rebuild in the full wizard.
                </div>
              )
            ) : (
              <div className="rounded-[var(--radius-input)] border border-[var(--border-light)] bg-white/70 px-4 py-3 text-sm leading-6 text-[var(--ink-light)]">
                Your score and five tips will appear here after the check runs.
              </div>
            )}
          </div>

          {result?.preview ? (
            <details className="mt-5 rounded-[var(--radius-input)] border border-[var(--border-light)] bg-[var(--bg)] px-4 py-3">
              <summary className="cursor-pointer text-sm font-medium text-foreground">
                Preview extracted text
              </summary>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[var(--ink-light)]">
                {result.preview}
              </p>
            </details>
          ) : null}
        </section>

        <section className="rounded-[var(--radius-card)] border border-border bg-surface p-5 shadow-[var(--shadow-card)] sm:p-6">
          <p className="font-mono text-xs uppercase tracking-[0.24em] text-[var(--ink-light)]">
            Next step
          </p>
          <h2 className="mt-2 font-heading text-2xl text-foreground">
            Want to rebuild your CV properly?
          </h2>
          <p className="mt-3 text-sm leading-6 text-[var(--ink-light)]">
            Enter your email and we&apos;ll carry it straight into the free builder flow.
          </p>

          {result ? (
            <div className="mt-4 grid gap-3">
              <input
                className="min-h-12 rounded-[var(--radius-input)] border border-border bg-white px-4"
                onChange={(event) => setEmail(event.target.value)}
                placeholder="name@example.com"
                type="email"
                value={email}
              />
              <button
                className="inline-flex min-h-12 items-center justify-center rounded-[var(--radius-input)] bg-[var(--accent)] px-4 text-sm font-medium text-white"
                onClick={handleStartFree}
                type="button"
              >
                Start free
              </button>
            </div>
          ) : (
            <div className="mt-4 rounded-[var(--radius-input)] border border-[var(--border-light)] bg-white/70 px-4 py-3 text-sm leading-6 text-[var(--ink-light)]">
              Run the score first. The handoff prompt appears after the result so it lands at the right moment.
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
