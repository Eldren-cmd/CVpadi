"use client";

import { useEffect, useState } from "react";

type Theme = "dark" | "light";

const STORAGE_KEY = "cvpadi-theme";

function applyTheme(theme: Theme) {
  document.documentElement.setAttribute("data-theme", theme);
}

export function ThemeToggle({ className = "" }: { className?: string }) {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    let initial: Theme = "dark";

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      initial = stored === "light" ? "light" : "dark";
    } catch {
      initial = "dark";
    }

    setTheme(initial);
    applyTheme(initial);
  }, []);

  const nextTheme: Theme = theme === "dark" ? "light" : "dark";

  function handleToggle() {
    setTheme(nextTheme);

    try {
      localStorage.setItem(STORAGE_KEY, nextTheme);
    } catch {
      // Ignore storage write issues (private mode / disabled storage).
    }

    applyTheme(nextTheme);
  }

  return (
    <button
      aria-label={`Switch to ${nextTheme} mode`}
      className={`theme-toggle ${className}`.trim()}
      onClick={handleToggle}
      type="button"
    >
      {theme === "dark" ? "LIGHT" : "DARK"}
    </button>
  );
}
