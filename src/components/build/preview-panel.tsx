"use client";

import { FREE_PREVIEW_LIMIT } from "@/lib/cv/constants";
import type { CVFormData } from "@/lib/cv/types";
import { useRef, useState } from "react";

declare global {
  interface Window {
    grecaptcha?: {
      execute: (siteKey: string, options: { action: string }) => Promise<string>;
      ready: (callback: () => void) => void;
    };
  }
}

export function PreviewPanel({
  cvId,
  deviceFingerprint,
  draft,
  honeypot,
  initialFreePreviewsUsed,
}: {
  cvId: string;
  deviceFingerprint: string | null;
  draft: CVFormData;
  honeypot: string;
  initialFreePreviewsUsed: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [remainingPreviews, setRemainingPreviews] = useState(
    Math.max(0, FREE_PREVIEW_LIMIT - initialFreePreviewsUsed),
  );
  const [statusMessage, setStatusMessage] = useState(
    "Free preview is watermarked over your name, phone, and email. It is capped at 600px and prints badly by design.",
  );
  const recaptchaSiteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

  async function handleGeneratePreview() {
    setIsGenerating(true);
    setStatusMessage("Generating a watermarked preview on the server...");

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

      setStatusMessage(
        "Watermarked preview ready. It sits on a canvas, not an image tag, and stays intentionally low-resolution.",
      );
    } catch (error) {
      setStatusMessage(
        error instanceof Error ? error.message : "Unable to generate the preview right now.",
      );
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <section className="rounded-[var(--radius-card)] border border-border bg-surface p-5 shadow-[var(--shadow-card)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.24em] text-[var(--ink-light)]">
            Free preview
          </p>
          <h2 className="mt-2 font-heading text-2xl text-foreground">
            Watermarked canvas preview
          </h2>
        </div>
        <span className="rounded-full bg-[var(--gold-light)] px-3 py-2 font-mono text-sm text-[var(--gold)]">
          {remainingPreviews} left
        </span>
      </div>

      <p className="mt-4 text-sm leading-6 text-[var(--ink-light)]">{statusMessage}</p>

      <div className="mt-5 flex flex-col gap-3">
        <button
          className="inline-flex min-h-12 items-center justify-center rounded-[var(--radius-input)] border border-border px-4 text-sm font-medium text-foreground disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isGenerating || remainingPreviews <= 0}
          onClick={() => {
            void handleGeneratePreview();
          }}
          type="button"
        >
          {remainingPreviews <= 0
            ? "Free preview limit reached"
            : isGenerating
              ? "Generating preview..."
              : "Generate free preview"}
        </button>

        <div className="overflow-hidden rounded-[var(--radius-input)] border border-[var(--border-light)] bg-[var(--bg)] p-3">
          <canvas
            className="h-auto w-full rounded-[calc(var(--radius-input)-6px)] bg-white"
            ref={canvasRef}
          />
        </div>
      </div>
    </section>
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
