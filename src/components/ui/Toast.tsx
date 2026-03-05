"use client";

import { useEffect, useMemo, useState } from "react";

export type ToastVariant = "success" | "warning" | "error" | "info";

export interface ToastItem {
  actionLabel?: string;
  description?: string;
  id: string;
  onAction?: () => void;
  title: string;
  variant?: ToastVariant;
}

interface ToastStackProps {
  onDismiss: (id: string) => void;
  toasts: ToastItem[];
}

const TOAST_VARIANTS: Record<ToastVariant, { bar: string; border: string; text: string }> = {
  error: {
    bar: "bg-[var(--red)]",
    border: "border-[var(--red)]",
    text: "text-[var(--red)]",
  },
  info: {
    bar: "bg-[var(--blue)]",
    border: "border-[var(--blue)]",
    text: "text-[var(--blue)]",
  },
  success: {
    bar: "bg-[var(--green)]",
    border: "border-[var(--green)]",
    text: "text-[var(--green)]",
  },
  warning: {
    bar: "bg-[var(--gold)]",
    border: "border-[var(--gold)]",
    text: "text-[var(--gold)]",
  },
};

export function ToastStack({ onDismiss, toasts }: ToastStackProps) {
  if (toasts.length === 0) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[120] flex w-[min(92vw,380px)] flex-col gap-3">
      {toasts.map((toast) => (
        <ToastCard key={toast.id} onDismiss={onDismiss} toast={toast} />
      ))}
    </div>
  );
}

function ToastCard({
  onDismiss,
  toast,
}: {
  onDismiss: (id: string) => void;
  toast: ToastItem;
}) {
  const [isVisible, setIsVisible] = useState(false);
  const [progressFull, setProgressFull] = useState(true);
  const style = useMemo(
    () => TOAST_VARIANTS[toast.variant ?? "info"],
    [toast.variant],
  );

  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      setIsVisible(true);
      setProgressFull(false);
    });

    const timeout = window.setTimeout(() => {
      onDismiss(toast.id);
    }, 5000);

    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(timeout);
    };
  }, [onDismiss, toast.id]);

  return (
    <article
      className={`pointer-events-auto overflow-hidden rounded-[12px] border bg-[var(--off-black)] shadow-[0_24px_48px_rgba(0,0,0,0.45)] transition-all duration-300 ${style.border} ${isVisible ? "translate-y-0 opacity-100" : "translate-y-[-12px] opacity-0"}`.trim()}
      role="status"
    >
      <div className="flex items-start gap-3 px-4 py-3">
        <div className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${style.bar}`} />
        <div className="min-w-0 flex-1">
          <p className="font-display text-sm text-[var(--cream)]">{toast.title}</p>
          {toast.description ? (
            <p className="mt-1 text-sm leading-6 text-[var(--cream-dim)]">{toast.description}</p>
          ) : null}
          {toast.actionLabel ? (
            <button
              className={`mt-2 text-xs uppercase tracking-[0.12em] ${style.text}`}
              onClick={toast.onAction}
              type="button"
            >
              {toast.actionLabel}
            </button>
          ) : null}
        </div>
        <button
          aria-label="Dismiss"
          className="text-sm text-[var(--mid)] transition-colors hover:text-[var(--cream)]"
          onClick={() => onDismiss(toast.id)}
          type="button"
        >
          ✕
        </button>
      </div>
      <div className="h-1 w-full bg-[var(--faint)]">
        <div
          className={`h-1 ${style.bar}`}
          style={{
            transition: "width 5s linear",
            width: progressFull ? "100%" : "0%",
          }}
        />
      </div>
    </article>
  );
}
