"use client";

import { useEffect, useState } from "react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

function scheduleIdle(callback: () => void) {
  const idleHost = globalThis as typeof globalThis & {
    requestIdleCallback?: (callback: IdleRequestCallback, options?: IdleRequestOptions) => number;
    cancelIdleCallback?: (handle: number) => void;
  };

  if (typeof idleHost.requestIdleCallback === "function") {
    const idleId = idleHost.requestIdleCallback(() => callback(), { timeout: 1200 });
    return () => idleHost.cancelIdleCallback?.(idleId);
  }

  const timeoutId = setTimeout(callback, 250);
  return () => clearTimeout(timeoutId);
}

export function DeferredThemeToggle({ className = "" }: { className?: string }) {
  const [ready, setReady] = useState(false);

  useEffect(() => scheduleIdle(() => setReady(true)), []);

  if (!ready) {
    return (
      <div
        aria-hidden="true"
        className={`theme-toggle ${className}`.trim()}
        style={{ visibility: "hidden" }}
      >
        DARK
      </div>
    );
  }

  return <ThemeToggle className={className} />;
}
