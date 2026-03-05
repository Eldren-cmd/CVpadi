import type { HTMLAttributes } from "react";

type CardProps = HTMLAttributes<HTMLDivElement>;

export function Card({ children, className = "", ...props }: CardProps) {
  return (
    <div
      className={`rounded-[12px] border border-[var(--border)] bg-[var(--card)] p-6 transition-all duration-200 hover:translate-y-[-2px] hover:border-[var(--border-mid)] hover:bg-[var(--card-hover)] ${className}`.trim()}
      {...props}
    >
      {children}
    </div>
  );
}
