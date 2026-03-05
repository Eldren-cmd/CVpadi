"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "ghost" | "danger";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  variant?: ButtonVariant;
}

const VARIANT_CLASSNAMES: Record<ButtonVariant, string> = {
  danger:
    "border border-[var(--red)] bg-transparent text-[var(--red)] hover:bg-[var(--red-glow)] hover:shadow-[0_10px_30px_rgba(255,82,82,0.15)]",
  ghost:
    "border border-[var(--border)] bg-transparent text-[var(--cream-dim)] hover:border-[var(--border-mid)] hover:bg-[var(--card)] hover:text-[var(--cream)]",
  primary:
    "border border-transparent bg-[var(--green)] text-[var(--black)] hover:translate-y-[-2px] hover:bg-[#33EE8A] hover:shadow-[0_16px_40px_var(--green-glow)]",
};

export function Button({
  children,
  className = "",
  disabled,
  leftIcon,
  loading = false,
  rightIcon,
  type = "button",
  variant = "primary",
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex min-h-11 w-auto items-center justify-center gap-2 rounded-[8px] px-4 font-display text-sm tracking-[0.01em] transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 ${VARIANT_CLASSNAMES[variant]} ${className}`.trim()}
      disabled={disabled || loading}
      type={type}
      {...props}
    >
      {loading ? (
        <span
          aria-hidden="true"
          className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent"
        />
      ) : (
        leftIcon
      )}
      <span>{children}</span>
      {!loading ? rightIcon : null}
    </button>
  );
}
