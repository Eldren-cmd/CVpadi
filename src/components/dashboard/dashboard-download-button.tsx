"use client";

import { useState } from "react";
import type { DeliveryLinksResponse } from "@/lib/payments/types";

export function DashboardDownloadButton({ cvId }: { cvId: string }) {
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleDownload() {
    setErrorMessage("");
    setIsLoading(true);

    try {
      const response = await fetch(`/api/cv-assets/${cvId}`, {
        cache: "no-store",
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        setErrorMessage(payload?.error ?? "Unable to prepare the download links right now.");
        return;
      }

      const payload = (await response.json()) as DeliveryLinksResponse;
      window.open(payload.pdfUrl, "_blank", "noopener,noreferrer");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="grid gap-2">
      <button
        className="inline-flex min-h-12 items-center justify-center rounded-[var(--radius-input)] border border-border px-5 text-sm font-medium text-foreground disabled:cursor-not-allowed disabled:opacity-60"
        disabled={isLoading}
        onClick={handleDownload}
        type="button"
      >
        {isLoading ? "Preparing PDF..." : "Download paid CV"}
      </button>
      {errorMessage ? (
        <p className="text-xs leading-5 text-[var(--red)]">{errorMessage}</p>
      ) : null}
    </div>
  );
}
