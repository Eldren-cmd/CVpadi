"use client";

import { useEffect, type RefObject } from "react";

interface UseRevealOptions {
  once?: boolean;
  threshold?: number;
}

export function useReveal<T extends HTMLElement>(
  ref: RefObject<T>,
  options?: UseRevealOptions,
) {
  const once = options?.once ?? true;
  const threshold = options?.threshold ?? 0.12;

  useEffect(() => {
    const element = ref.current;
    if (!element) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return;
          }

          entry.target.classList.add("visible");
          if (once) {
            observer.unobserve(entry.target);
          }
        });
      },
      {
        rootMargin: "0px 0px -40px 0px",
        threshold,
      },
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [once, ref, threshold]);
}
