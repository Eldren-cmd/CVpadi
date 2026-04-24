"use client";

import { useEffect } from "react";

const INTERACTIVE_SELECTOR = [
  "a",
  "button",
  "[role='button']",
  "input",
  "select",
  "textarea",
  "summary",
  "label[for]",
  ".step",
  ".feature",
  ".testimonial",
  ".price-card",
].join(", ");

export function CustomCursor() {
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia("(pointer: fine)").matches) {
      return;
    }

    const cursor = document.getElementById("appCursor");
    const ring = document.getElementById("appCursorRing");

    if (!cursor || !ring) {
      return;
    }

    document.body.classList.add("has-custom-cursor");

    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let ringX = mouseX;
    let ringY = mouseY;
    let rafId = 0;
    let isInteractive = false;
    let isVisible = false;

    const renderCursor = () => {
      cursor.style.transform = `translate(${mouseX}px, ${mouseY}px) translate(-50%, -50%) scale(${isInteractive ? 2.5 : 1})`;
      cursor.style.background = isInteractive ? "var(--orange)" : "var(--green)";
      ring.style.opacity = isInteractive ? "0" : "1";

      if (!isVisible) {
        cursor.style.opacity = "1";
        ring.style.opacity = isInteractive ? "0" : "1";
        isVisible = true;
      }
    };

    const handleMouseMove = (event: MouseEvent) => {
      mouseX = event.clientX;
      mouseY = event.clientY;
      renderCursor();
    };

    const handleMouseOver = (event: MouseEvent) => {
      const target = event.target as Element | null;
      if (target?.closest(INTERACTIVE_SELECTOR)) {
        isInteractive = true;
        renderCursor();
      }
    };

    const handleMouseOut = (event: MouseEvent) => {
      const target = event.target as Element | null;
      if (!target?.closest(INTERACTIVE_SELECTOR)) {
        return;
      }

      const relatedTarget = event.relatedTarget as Element | null;
      if (relatedTarget?.closest(INTERACTIVE_SELECTOR)) {
        return;
      }

      isInteractive = false;
      renderCursor();
    };

    const animateRing = () => {
      ringX += (mouseX - ringX) * 0.12;
      ringY += (mouseY - ringY) * 0.12;
      ring.style.transform = `translate(${ringX}px, ${ringY}px) translate(-50%, -50%)`;
      rafId = requestAnimationFrame(animateRing);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseover", handleMouseOver);
    document.addEventListener("mouseout", handleMouseOut);
    animateRing();

    return () => {
      document.body.classList.remove("has-custom-cursor");
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseover", handleMouseOver);
      document.removeEventListener("mouseout", handleMouseOut);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <>
      <div className="app-cursor" id="appCursor" />
      <div className="app-cursor-ring" id="appCursorRing" />
    </>
  );
}
