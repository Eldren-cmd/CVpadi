"use client";

import { useEffect, useMemo, useState } from "react";

type ScoreDialTone = "auto" | "green";

interface ScoreDialProps {
  animate?: boolean;
  className?: string;
  colorMode?: ScoreDialTone;
  durationMs?: number;
  label?: string;
  score: number;
  size?: number;
  strokeWidth?: number;
}

export function ScoreDial({
  animate = true,
  className = "",
  colorMode = "auto",
  durationMs = 1200,
  label = "CV score",
  score,
  size = 168,
  strokeWidth = 12,
}: ScoreDialProps) {
  const safeScore = Math.max(0, Math.min(100, score));
  const [animatedScore, setAnimatedScore] = useState(animate ? 0 : safeScore);
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;

  const toneColor = useMemo(() => {
    if (colorMode === "green") {
      return "var(--green)";
    }

    if (safeScore <= 49) {
      return "var(--red)";
    }

    if (safeScore <= 74) {
      return "var(--gold)";
    }

    return "var(--green)";
  }, [colorMode, safeScore]);

  useEffect(() => {
    if (!animate) {
      setAnimatedScore(safeScore);
      return;
    }

    let frame = 0;
    const start = performance.now();

    const tick = (time: number) => {
      const elapsed = time - start;
      const progress = Math.min(1, elapsed / durationMs);
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedScore(Math.round(safeScore * eased));

      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      }
    };

    frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
    };
  }, [animate, durationMs, safeScore]);

  const offset = circumference - (animatedScore / 100) * circumference;

  return (
    <div
      className={`relative inline-flex items-center justify-center ${className}`.trim()}
      style={{ height: size, width: size }}
    >
      <svg className="-rotate-90" height={size} viewBox={`0 0 ${size} ${size}`} width={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          fill="none"
          r={radius}
          stroke="var(--faint)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          fill="none"
          r={radius}
          stroke={toneColor}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          strokeWidth={strokeWidth}
          style={{ transition: animate ? `stroke-dashoffset ${durationMs}ms cubic-bezier(0.16, 1, 0.3, 1)` : undefined }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-heading text-5xl leading-none text-[var(--cream)]">{animatedScore}</span>
        <span className="mt-1 font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--mid)]">
          {label}
        </span>
      </div>
    </div>
  );
}
