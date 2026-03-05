"use client";

import type { SyncStatus } from "@/lib/cv/types";
import { Button } from "@/components/ui/Button";
import { useState } from "react";

export const inputClassName =
  "min-h-[52px] w-full rounded-[10px] border border-[var(--border)] bg-[var(--surface)] px-4 font-display text-base text-[var(--cream)] placeholder:text-[var(--mid)] transition-all duration-200 focus:border-[var(--green)] focus:shadow-[0_0_0_3px_var(--green-glow)]";

export const selectClassName = `${inputClassName} appearance-none bg-no-repeat pr-10`;

export const selectChevronStyle = {
  backgroundImage:
    "url(\"data:image/svg+xml,%3Csvg width='14' height='10' viewBox='0 0 14 10' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M2 2L7 7L12 2' stroke='%23C8C0AC' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E\")",
  backgroundPosition: "right 14px center",
};

export function SyncIndicator({ syncStatus }: { syncStatus: SyncStatus }) {
  return (
    <div className="inline-flex min-h-9 items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 text-[11px] font-mono uppercase tracking-[0.1em] text-[var(--cream-dim)]">
      {syncStatus === "saved" ? (
        <>
          <span className="pulse-green h-2.5 w-2.5 rounded-full bg-[var(--green)]" />
          Saved
        </>
      ) : null}

      {syncStatus === "saving" ? (
        <>
          <span className="h-2.5 w-2.5 animate-spin rounded-full border border-[var(--gold)] border-r-transparent" />
          Saving...
        </>
      ) : null}

      {syncStatus === "offline" ? (
        <>
          <span className="h-2.5 w-2.5 rounded-full bg-[var(--mid)]" />
          Offline
        </>
      ) : null}
    </div>
  );
}

export function StepLabel({ label, error }: { label: string; error?: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <label className="font-body text-sm text-[var(--cream-dim)]">{label}</label>
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
      <p className="text-sm text-[var(--mid)]">{description}</p>
      <div className="grid gap-4">
        {items.map((item, index) => (
          <div
            className="rounded-[12px] border border-[var(--border)] bg-[var(--card)] p-4"
            key={index}
            style={{ borderLeft: "2px solid var(--green)" }}
          >
            {item}
          </div>
        ))}
      </div>
      <Button onClick={onAdd} variant="ghost">
        {addLabel} →
      </Button>
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

  const addTag = () => {
    if (!draftValue.trim()) {
      return;
    }

    onChange(Array.from(new Set([...tags, draftValue.trim()])));
    setDraftValue("");
  };

  return (
    <div className="grid gap-3">
      <StepLabel error={error} label={label} />
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <span
            className="inline-flex min-h-9 items-center gap-2 rounded-full border border-[var(--green)] bg-[var(--green-glow)] px-3 text-sm text-[var(--green)]"
            key={tag}
            style={{ animation: "fade-up 0.2s ease" }}
          >
            {tag}
            <button
              className="text-xs text-[var(--green)]"
              onClick={() => onChange(tags.filter((entry) => entry !== tag))}
              type="button"
            >
              ✕
            </button>
          </span>
        ))}
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          className={inputClassName}
          onChange={(event) => setDraftValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              addTag();
            }
          }}
          placeholder={placeholder}
          type="text"
          value={draftValue}
        />
        <Button onClick={addTag} variant="ghost">
          Add
        </Button>
      </div>
    </div>
  );
}
