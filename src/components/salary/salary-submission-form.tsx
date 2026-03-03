"use client";

import { useFormState, useFormStatus } from "react-dom";
import { NIGERIAN_STATES } from "@/lib/cv/constants";
import {
  submitSalaryAction,
  type SalarySubmissionState,
} from "@/app/salary/actions";

const initialState: SalarySubmissionState = {};

export function SalarySubmissionForm() {
  const [state, formAction] = useFormState(submitSalaryAction, initialState);

  return (
    <form action={formAction} className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2 text-sm">
          <span>Company</span>
          <input
            className="min-h-12 rounded-[var(--radius-input)] border border-border bg-white px-4"
            name="company"
            placeholder="e.g. GTBank"
            type="text"
          />
        </label>
        <label className="grid gap-2 text-sm">
          <span>Role</span>
          <input
            className="min-h-12 rounded-[var(--radius-input)] border border-border bg-white px-4"
            name="role"
            placeholder="e.g. Relationship Officer"
            type="text"
          />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2 text-sm">
          <span>State</span>
          <select
            className="min-h-12 rounded-[var(--radius-input)] border border-border bg-white px-4"
            defaultValue=""
            name="locationState"
          >
            <option disabled value="">
              Select state
            </option>
            {NIGERIAN_STATES.map((stateName) => (
              <option key={stateName} value={stateName}>
                {stateName}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-2 text-sm">
          <span>Annual salary (naira)</span>
          <input
            className="min-h-12 rounded-[var(--radius-input)] border border-border bg-white px-4"
            inputMode="numeric"
            name="annualSalaryNaira"
            placeholder="e.g. 4200000"
            type="number"
          />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <label className="grid gap-2 text-sm">
          <span>Years experience</span>
          <input
            className="min-h-12 rounded-[var(--radius-input)] border border-border bg-white px-4"
            name="yearsExperience"
            placeholder="e.g. 3"
            type="number"
          />
        </label>
        <label className="grid gap-2 text-sm">
          <span>Employment type</span>
          <select
            className="min-h-12 rounded-[var(--radius-input)] border border-border bg-white px-4"
            defaultValue="full_time"
            name="employmentType"
          >
            <option value="full_time">Full time</option>
            <option value="contract">Contract</option>
            <option value="part_time">Part time</option>
          </select>
        </label>
        <label className="grid gap-2 text-sm">
          <span>Submission year</span>
          <input
            className="min-h-12 rounded-[var(--radius-input)] border border-border bg-white px-4"
            defaultValue={new Date().getFullYear()}
            name="submissionYear"
            type="number"
          />
        </label>
      </div>

      <div className="rounded-[var(--radius-input)] border border-[var(--border-light)] bg-[var(--bg)] px-4 py-3 text-sm leading-6 text-[var(--ink-light)]">
        Minimum five submissions are required before any aggregate becomes public for a company,
        role, and state combination.
      </div>

      {state.error ? (
        <p className="rounded-[var(--radius-input)] border border-[var(--red)] bg-[var(--red-light)] px-4 py-3 text-sm text-[var(--red)]">
          {state.error}
        </p>
      ) : null}

      {state.success ? (
        <p className="rounded-[var(--radius-input)] border border-[var(--green)] bg-[var(--green-light)] px-4 py-3 text-sm text-[var(--green)]">
          {state.success}
        </p>
      ) : null}

      <SubmitButton />
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      className="inline-flex min-h-12 items-center justify-center rounded-[var(--radius-input)] bg-[var(--accent)] px-4 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
      disabled={pending}
      type="submit"
    >
      {pending ? "Submitting..." : "Submit salary"}
    </button>
  );
}
