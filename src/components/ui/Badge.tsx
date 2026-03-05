import type { HTMLAttributes } from "react";

type BadgeVariant = "green" | "orange" | "red" | "gold" | "blue";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const BADGE_VARIANTS: Record<BadgeVariant, string> = {
  blue: "bg-[var(--blue-glow)] text-[var(--blue)]",
  gold: "bg-[var(--gold-glow)] text-[var(--gold)]",
  green: "bg-[var(--green-glow)] text-[var(--green)]",
  orange: "bg-[var(--orange-glow)] text-[var(--orange)]",
  red: "bg-[var(--red-glow)] text-[var(--red)]",
};

export function Badge({ children, className = "", variant = "blue", ...props }: BadgeProps) {
  return (
    <span
      className={`inline-flex min-h-7 items-center rounded-full px-3 font-mono text-[11px] uppercase tracking-[0.1em] ${BADGE_VARIANTS[variant]} ${className}`.trim()}
      {...props}
    >
      {children}
    </span>
  );
}
