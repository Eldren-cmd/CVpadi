"use client";

import { Button } from "@/components/ui/Button";
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
      <Button loading={isLoading} onClick={handleDownload} variant="primary">
        Download paid CV
      </Button>
      {errorMessage ? <p className="text-xs text-[var(--red)]">{errorMessage}</p> : null}
    </div>
  );
}
