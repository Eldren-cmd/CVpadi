"use client";

import { useEffect } from "react";

export function LandingReveal() {
  useEffect(() => {
    const reveals = document.querySelectorAll<HTMLElement>(".reveal");
    const isMobile = window.matchMedia("(max-width: 768px)").matches;

    if (isMobile) {
      reveals.forEach((element) => element.classList.add("visible"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" },
    );

    reveals.forEach((element) => observer.observe(element));

    document
      .querySelectorAll<HTMLElement>(".step, .feature, .testimonial, .nigeria-list li")
      .forEach((element, index) => {
        element.style.transitionDelay = `${(index % 3) * 0.1}s`;
      });

    return () => {
      observer.disconnect();
    };
  }, []);

  return null;
}
