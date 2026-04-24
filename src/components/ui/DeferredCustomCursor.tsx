"use client";

import { useEffect, useState } from "react";
import type { ComponentType } from "react";

function scheduleIdle(callback: () => void) {
  const idleHost = globalThis as typeof globalThis & {
    requestIdleCallback?: (callback: IdleRequestCallback, options?: IdleRequestOptions) => number;
    cancelIdleCallback?: (handle: number) => void;
  };

  if (typeof idleHost.requestIdleCallback === "function") {
    const idleId = idleHost.requestIdleCallback(() => callback(), { timeout: 1500 });
    return () => idleHost.cancelIdleCallback?.(idleId);
  }

  const timeoutId = setTimeout(callback, 300);
  return () => clearTimeout(timeoutId);
}

export function DeferredCustomCursor() {
  const [CursorComponent, setCursorComponent] = useState<ComponentType | null>(null);

  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches) {
      return;
    }

    return scheduleIdle(() => {
      import("./CustomCursor").then((module) => {
        setCursorComponent(() => module.CustomCursor);
      });
    });
  }, []);

  if (!CursorComponent) {
    return null;
  }

  return <CursorComponent />;
}
