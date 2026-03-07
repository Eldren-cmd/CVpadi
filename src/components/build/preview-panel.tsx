"use client";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ScoreDial } from "@/components/ui/ScoreDial";
import { FREE_PREVIEW_LIMIT } from "@/lib/cv/constants";
import type { CVFormData } from "@/lib/cv/types";
import { useEffect, useRef, useState } from "react";
import { ScoreSharePrompt } from "./score-share-prompt";

declare global {
  interface Window {
    grecaptcha?: {
      execute: (siteKey: string, options: { action: string }) => Promise<string>;
      ready: (callback: () => void) => void;
    };
  }
}

export function PreviewPanel({
  accountCreditKobo,
  cvId,
  deviceFingerprint,
  draft,
  honeypot,
  initialFreePreviewsUsed,
  isPaid,
  referralCode,
  isComplete,
  score,
}: {
  accountCreditKobo: number;
  cvId: string;
  deviceFingerprint: string | null;
  draft: CVFormData;
  honeypot: string;
  initialFreePreviewsUsed: number;
  isPaid: boolean;
  referralCode: string;
  isComplete: boolean;
  score: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [remainingPreviews, setRemainingPreviews] = useState(
    Math.max(0, FREE_PREVIEW_LIMIT - initialFreePreviewsUsed),
  );
  const [showSharePrompt, setShowSharePrompt] = useState(false);
  const [hasPreview, setHasPreview] = useState(false);
  const [statusMessage, setStatusMessage] = useState(
    isPaid
      ? "You can regenerate your preview anytime."
      : "Generate your watermarked preview. Pay to remove watermark and unlock clean downloads.",
  );
  const recaptchaSiteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
  const canGeneratePreview = (isPaid || remainingPreviews > 0) && !isGenerating;
  const previewButtonLabel = isPaid
    ? "Regenerate CV preview"
    : (
      remainingPreviews <= 0
        ? "Free preview limit reached"
        : (hasPreview ? "Regenerate preview" : "Generate free preview")
    );
  void isComplete;

  useEffect(() => {
    if (!isPaid) return;
    const storageKey = `cvpadi_score_share_prompt_${cvId}`;
    if (localStorage.getItem(storageKey) === "dismissed") return;
    setShowSharePrompt(true);
  }, [isPaid, cvId]);

  useEffect(() => {
    if (!isPaid) {
      return;
    }

    setStatusMessage("You can regenerate your preview anytime.");
  }, [isPaid]);

  async function handleGeneratePreview() {
    setIsGenerating(true);
    setStatusMessage("Generating watermarked preview...");

    try {
      const recaptchaToken = await getRecaptchaToken({
        action: "free_preview",
        siteKey: recaptchaSiteKey,
      });

      if (recaptchaSiteKey && !recaptchaToken) {
        throw new Error("Security check not ready. Refresh and try again.");
      }

      const response = await fetch(`/api/cv/preview/${cvId}`, {
        body: JSON.stringify({
          deviceFingerprint,
          formData: draft,
          honeypot,
          recaptchaToken,
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? "Unable to generate the preview.");
      }

      const previewBlob = await response.blob();
      const remaining = Number(response.headers.get("X-Free-Preview-Remaining"));
      if (Number.isFinite(remaining)) {
        setRemainingPreviews(remaining);
      }

      await drawPreviewOnCanvas({
        blob: previewBlob,
        canvas: canvasRef.current,
      });
      setHasPreview(true);

      setStatusMessage("Preview ready. This version stays watermarked until payment is confirmed.");
    } catch (error) {
      setStatusMessage(
        error instanceof Error ? error.message : "Unable to generate the preview right now.",
      );
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <Card className="!rounded-[16px] !border-[var(--border)] !bg-[var(--off-black)] !p-5 sm:!p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--mid)]">Watermarked preview</p>
          <h2 className="mt-2 font-display text-2xl text-[var(--cream)]">Preview your CV before payment</h2>
        </div>
        {isPaid ? (
          <span className="rounded-full border border-[var(--green)] bg-[var(--green-glow)] px-3 py-2 font-mono text-[11px] uppercase tracking-[0.1em] text-[var(--green)]">
            ✓ Paid - unlimited previews
          </span>
        ) : (
          <span className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-2 font-mono text-[11px] uppercase tracking-[0.1em] text-[var(--cream-dim)]">
            {remainingPreviews} free left
          </span>
        )}
      </div>

      <p className="mt-4 text-sm leading-6 text-[var(--cream-dim)]">{statusMessage}</p>

      <div className="mt-4 rounded-[12px] border border-[var(--border)] bg-[var(--surface)] p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-[var(--mid)]">
            Watermarked preview - pay to remove watermark
          </span>
          <ScoreDial
            animate
            colorMode="green"
            label="Score"
            score={score}
            size={56}
            strokeWidth={7}
          />
        </div>

        <div
          className={`mt-4 overflow-hidden rounded-[10px] border border-[var(--border)] bg-[var(--card)] p-3 transition-opacity duration-300 ${hasPreview ? "opacity-100" : "opacity-80"}`.trim()}
        >
          <canvas
            className="h-auto w-full rounded-[8px] bg-white"
            ref={canvasRef}
            style={hasPreview ? { animation: "fade-up 0.35s ease" } : undefined}
          />
          {!hasPreview && !isGenerating ? (
            <div className="mt-3 rounded-[8px] border border-dashed border-[var(--border)] px-3 py-2 text-sm text-[var(--mid)]">
              Preview canvas will appear here.
            </div>
          ) : null}
          {isGenerating ? <div className="mt-3 h-10 skeleton" /> : null}
        </div>

        <div className="mt-4 flex flex-col gap-4 rounded-[10px] border border-[var(--green)] bg-[var(--green-glow)] p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-display text-lg text-[var(--cream)]">Remove watermark and download</p>
            <p className="mt-1 font-mono text-[12px] uppercase tracking-[0.1em] text-[var(--green)]">
              {"\u20A6"}1,500 - one-time payment
            </p>
          </div>
          <Button
            className="w-full sm:w-auto"
            onClick={() => {
              document.getElementById("payment-panel")?.scrollIntoView({
                behavior: "smooth",
                block: "start",
              });
            }}
            variant="primary"
          >
            Pay {"\u20A6"}1,500 →
          </Button>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:flex sm:flex-wrap">
        <Button
          className="w-full sm:w-auto"
          disabled={!canGeneratePreview}
          loading={isGenerating}
          onClick={() => {
            void handleGeneratePreview();
          }}
          variant="ghost"
        >
          {previewButtonLabel}
        </Button>
      </div>

      {showSharePrompt ? (
        <div className="mt-4">
          <ScoreSharePrompt
            accountCreditKobo={accountCreditKobo}
            name={draft.fullName || "Nigerian Candidate"}
            onDismiss={() => {
              const storageKey = `cvpadi_score_share_prompt_${cvId}`;
              localStorage.setItem(storageKey, "dismissed");
              setShowSharePrompt(false);
            }}
            referralCode={referralCode}
            score={score}
          />
        </div>
      ) : null}
    </Card>
  );
}

async function drawPreviewOnCanvas({
  blob,
  canvas,
}: {
  blob: Blob;
  canvas: HTMLCanvasElement | null;
}) {
  if (!canvas) {
    throw new Error("Preview canvas is not ready.");
  }

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Preview canvas is unavailable.");
  }

  if ("createImageBitmap" in window) {
    const bitmap = await createImageBitmap(blob);
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.drawImage(bitmap, 0, 0);
    bitmap.close();
    return;
  }

  const objectUrl = URL.createObjectURL(blob);
  const image = new Image();
  image.src = objectUrl;
  await image.decode();
  canvas.width = image.width;
  canvas.height = image.height;
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.drawImage(image, 0, 0);
  URL.revokeObjectURL(objectUrl);
}

async function getRecaptchaToken({
  action,
  siteKey,
}: {
  action: string;
  siteKey?: string;
}) {
  if (!siteKey) {
    return null;
  }

  if (!window.grecaptcha) {
    return null;
  }

  return new Promise<string | null>((resolve) => {
    window.grecaptcha?.ready(() => {
      window.grecaptcha
        ?.execute(siteKey, { action })
        .then(resolve)
        .catch(() => resolve(null));
    });
  });
}
