"use client";

import { useEffect, useState } from "react";
import type { ComponentType } from "react";

export function DeferredCustomCursor() {
  const [CursorComponent, setCursorComponent] = useState<ComponentType | null>(null);

  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches) {
      return;
    }

    let hasLoaded = false;

    const loadCursor = () => {
      if (hasLoaded) {
        return;
      }

      hasLoaded = true;
      window.removeEventListener("pointermove", loadCursor);
      window.removeEventListener("mousemove", loadCursor);

      import("./CustomCursor").then((module) => {
        setCursorComponent(() => module.CustomCursor);
      });
    };

    window.addEventListener("pointermove", loadCursor, { passive: true, once: true });
    window.addEventListener("mousemove", loadCursor, { passive: true, once: true });

    return () => {
      window.removeEventListener("pointermove", loadCursor);
      window.removeEventListener("mousemove", loadCursor);
    };
  }, []);

  if (!CursorComponent) {
    return null;
  }

  return <CursorComponent />;
}
