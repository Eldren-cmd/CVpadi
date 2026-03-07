"use client";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ScoreDial } from "@/components/ui/ScoreDial";
import { magicLinkSchema } from "@/lib/cv/validation";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

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
  const [showNextStep, setShowNextStep] = useState(false);
  const [statusMessage, setStatusMessage] = useState(
    "Paste your CV text or upload a PDF to run an instant Nigerian CV diagnostic.",
  );
  const [isPending, setIsPending] = useState(false);
  const [isDraggingPdf, setIsDraggingPdf] = useState(false);

  const emailIsValid = useMemo(
    () => magicLinkSchema.safeParse({ email }).success,
    [email],
  );

  useEffect(() => {
    if (!result) {
      setShowNextStep(false);
      return;
    }

    const timeout = window.setTimeout(() => setShowNextStep(true), 500);
    return () => window.clearTimeout(timeout);
  }, [result]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsPending(true);
    setStatusMessage("Analyzing your CV...");

    try {
      const response = pdfFile
        ? await (() => {
            const payload = new FormData();
            payload.set("file", pdfFile);
            return fetch("/api/check/score", {
              body: payload,
              method: "POST",
            });
          })()
        : await fetch("/api/check/score", {
            body: JSON.stringify({ text: cvText }),
            headers: {
              "Content-Type": "application/json",
            },
            method: "POST",
          });

      const nextResult = (await response.json()) as CheckResult | { error?: string };

      if (!response.ok || !("score" in nextResult)) {
        const errorMessage = "error" in nextResult ? nextResult.error : undefined;
        throw new Error(errorMessage ?? "Unable to score this CV right now.");
      }

      setResult(nextResult);
      setStatusMessage("Diagnostic ready. Use the highest-severity fixes first.");
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
    <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr] page-enter">
      <Card className="!rounded-[16px] !border-[var(--border)] !bg-[var(--off-black)] !p-5 sm:!p-6">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--mid)]">CV diagnostic</p>
        <h1 className="mt-2 font-heading text-5xl leading-[1.02] text-[var(--cream)]">Check my Nigerian CV</h1>
        <p className="mt-3 text-sm leading-6 text-[var(--cream-dim)]">
          Fast, clinical feedback from the same score engine used in the builder.
        </p>

        <form className="mt-5 grid gap-4" onSubmit={handleSubmit}>
          <label className="grid gap-2 text-sm text-[var(--cream-dim)]">
            <span>Paste CV text</span>
            <textarea
              className="min-h-[280px] rounded-[10px] border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--cream)]"
              onChange={(event) => setCvText(event.target.value)}
              placeholder="Paste your CV text here..."
              value={cvText}
            />
          </label>

          <div
            className={`rounded-[10px] border border-dashed p-4 text-sm transition-all duration-200 ${isDraggingPdf ? "border-[var(--green)] bg-[var(--green-glow)]" : "border-[var(--border)] bg-[var(--surface)]"}`.trim()}
            onDragLeave={() => setIsDraggingPdf(false)}
            onDragOver={(event) => {
              event.preventDefault();
              setIsDraggingPdf(true);
            }}
            onDrop={(event) => {
              event.preventDefault();
              setIsDraggingPdf(false);
              const file = event.dataTransfer.files?.[0];
              if (file?.type === "application/pdf") {
                setPdfFile(file);
              }
            }}
          >
            <p className="text-[var(--cream-dim)]">Or upload PDF</p>
            <input
              accept="application/pdf"
              className="mt-2 min-h-11 w-full rounded-[8px] border border-[var(--border)] bg-[var(--off-black)] px-3 text-[var(--cream)]"
              onChange={(event) => setPdfFile(event.target.files?.[0] ?? null)}
              type="file"
            />
            {pdfFile ? (
              <p className="mt-2 text-xs text-[var(--green)]">✓ {pdfFile.name}</p>
            ) : null}
          </div>

          <Button className="w-full" loading={isPending} type="submit" variant="primary">
            Check my CV
          </Button>
        </form>

        <p className="mt-4 rounded-[8px] border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-sm text-[var(--cream-dim)]">
          {statusMessage}
        </p>
      </Card>

      <div className="grid gap-6">
        <Card className="!rounded-[16px] !border-[var(--border)] !bg-[var(--off-black)] !p-5 sm:!p-6">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--mid)]">Results</p>

          {isPending ? (
            <div className="mt-4 grid gap-3">
              <div className="h-40 skeleton" />
              <div className="h-14 skeleton" />
              <div className="h-14 skeleton" />
              <div className="h-14 skeleton" />
            </div>
          ) : (
            <>
              <div className="mt-4 flex items-center gap-4">
                <ScoreDial animate colorMode="auto" label="Your CV score" score={result?.score ?? 0} size={144} />
                <div>
                  <p className="font-display text-2xl text-[var(--cream)]">Diagnostic score</p>
                  <p className="text-sm text-[var(--cream-dim)]">Top 5 fixes shown in priority order.</p>
                </div>
              </div>

              <div className="mt-5 grid gap-3">
                {result ? (
                  result.suggestions.length > 0 ? (
                    result.suggestions.map((suggestion, index) => {
                      const severity = index === 0 ? "high" : index < 3 ? "medium" : "low";
                      const severityColor =
                        severity === "high"
                          ? "var(--red)"
                          : severity === "medium"
                            ? "var(--gold)"
                            : "var(--green)";

                      return (
                        <article
                          className="fade-up rounded-[10px] border border-[var(--border)] bg-[var(--card)] px-4 py-3"
                          key={suggestion.id}
                        >
                          <div className="flex items-start gap-3">
                            <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-[var(--green-glow)] font-mono text-[11px] text-[var(--green)]">
                              {String(index + 1).padStart(2, "0")}
                            </span>
                            <div className="flex-1">
                              <p className="text-sm leading-6 text-[var(--cream-dim)]">{suggestion.message}</p>
                              <p className="mt-1 flex items-center gap-2 text-xs uppercase tracking-[0.1em] text-[var(--mid)]">
                                <span className="h-2 w-2 rounded-full" style={{ background: severityColor }} />
                                {severity} severity
                              </p>
                            </div>
                          </div>
                        </article>
                      );
                    })
                  ) : (
                    <div className="rounded-[10px] border border-[var(--green)] bg-[var(--green-glow)] px-4 py-3 text-sm text-[var(--green)]">
                      Strong structure already. You can move to clean build and download.
                    </div>
                  )
                ) : (
                  <div className="rounded-[10px] border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-sm text-[var(--cream-dim)]">
                    Score and fixes will appear here after running the check.
                  </div>
                )}
              </div>
            </>
          )}
        </Card>

        {showNextStep ? (
          <Card className="!rounded-[16px] !border-[var(--green)] !bg-[var(--off-black)] !p-5 sm:!p-6">
            <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-[var(--green)]">Next step</p>
            <h2 className="mt-2 font-display text-2xl text-[var(--cream)]">Rebuild your CV properly →</h2>
            <p className="mt-2 text-sm text-[var(--cream-dim)]">Enter your email and continue in the full builder flow.</p>
            <div className="mt-4 rounded-[10px] border border-dashed border-[var(--green)] bg-[var(--green-glow)] p-4">
              <input
                className="min-h-11 w-full rounded-[8px] border border-[var(--border)] bg-[var(--off-black)] px-4 text-[var(--cream)]"
                onChange={(event) => setEmail(event.target.value)}
                placeholder="name@example.com"
                type="email"
                value={email}
              />
              <Button className="mt-3 w-full" onClick={handleStartFree} type="button" variant="ghost">
                Start free build
              </Button>
            </div>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
