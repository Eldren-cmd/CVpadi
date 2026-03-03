"use client";

import type { SyncStatus } from "@/lib/cv/types";
import { useState } from "react";

export const inputClassName =
  "min-h-12 rounded-[var(--radius-input)] border border-border bg-white px-4 text-sm text-foreground";

export function SyncIndicator({ syncStatus }: { syncStatus: SyncStatus }) {
  const styles: Record<SyncStatus, { label: string; dot: string }> = {
    saved: { label: "Saved", dot: "bg-[var(--green)]" },
    saving: { label: "Saving...", dot: "bg-[var(--gold)]" },
    offline: { label: "Saved locally", dot: "bg-[var(--ink-faint)]" },
  };

  const current = styles[syncStatus];

  return (
    <div className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border bg-white px-4 text-sm text-[var(--ink-light)]">
      <span className={`h-2.5 w-2.5 rounded-full ${current.dot}`} />
      {current.label}
    </div>
  );
}

export function StepLabel({ label, error }: { label: string; error?: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <label className="text-sm font-medium text-foreground">{label}</label>
      {error ? <span className="text-xs text-[var(--red)]">{error}</span> : null}
    </div>
  );
}

export function Field({
  label,
  error,
  renderInput,
}: {
  label: string;
  error?: string;
  renderInput: React.ReactNode;
}) {
  return (
    <div className="grid gap-2">
      <StepLabel error={error} label={label} />
      {renderInput}
    </div>
  );
}

export function RepeaterStep({
  label,
  description,
  error,
  items,
  onAdd,
  addLabel,
}: {
  label: string;
  description: string;
  error?: string;
  items: React.ReactNode[];
  onAdd: () => void;
  addLabel: string;
}) {
  return (
    <div className="grid gap-4">
      <StepLabel error={error} label={label} />
      <p className="text-sm text-[var(--ink-light)]">{description}</p>
      <div className="grid gap-4">{items}</div>
      <button
        className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-input)] border border-border px-4 text-sm font-medium text-foreground"
        onClick={onAdd}
        type="button"
      >
        {addLabel}
      </button>
    </div>
  );
}

export function TagStep({
  label,
  tags,
  placeholder,
  error,
  onChange,
}: {
  label: string;
  tags: string[];
  placeholder: string;
  error?: string;
  onChange: (value: string[]) => void;
}) {
  const [draftValue, setDraftValue] = useState("");

  return (
    <div className="grid gap-3">
      <StepLabel error={error} label={label} />
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <span
            className="inline-flex min-h-10 items-center rounded-full bg-[var(--accent-light)] px-3 text-sm text-foreground"
            key={tag}
          >
            {tag}
          </span>
        ))}
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          className={inputClassName}
          onChange={(event) => setDraftValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && draftValue.trim()) {
              event.preventDefault();
              onChange(Array.from(new Set([...tags, draftValue.trim()])));
              setDraftValue("");
            }
          }}
          placeholder={placeholder}
          type="text"
          value={draftValue}
        />
        <button
          className="inline-flex min-h-12 items-center justify-center rounded-[var(--radius-input)] border border-border px-4 text-sm font-medium text-foreground"
          onClick={() => {
            if (!draftValue.trim()) return;
            onChange(Array.from(new Set([...tags, draftValue.trim()])));
            setDraftValue("");
          }}
          type="button"
        >
          Add
        </button>
      </div>
    </div>
  );
}
