"use client";

import { useFormState, useFormStatus } from "react-dom";
import { Button } from "@/components/ui/Button";
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
        <label className="grid gap-2 text-sm text-[var(--cream-dim)]">
          <span>Company</span>
          <input
            className="min-h-11 rounded-[8px] border border-[var(--border)] bg-[var(--surface)] px-4 text-[var(--cream)]"
            name="company"
            placeholder="e.g. GTBank"
            type="text"
          />
        </label>
        <label className="grid gap-2 text-sm text-[var(--cream-dim)]">
          <span>Role</span>
          <input
            className="min-h-11 rounded-[8px] border border-[var(--border)] bg-[var(--surface)] px-4 text-[var(--cream)]"
            name="role"
            placeholder="e.g. Relationship Officer"
            type="text"
          />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2 text-sm text-[var(--cream-dim)]">
          <span>State</span>
          <select
            className="min-h-11 rounded-[8px] border border-[var(--border)] bg-[var(--surface)] px-4 text-[var(--cream)]"
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
        <label className="grid gap-2 text-sm text-[var(--cream-dim)]">
          <span>Annual salary (naira)</span>
          <input
            className="min-h-11 rounded-[8px] border border-[var(--border)] bg-[var(--surface)] px-4 text-[var(--cream)]"
            inputMode="numeric"
            name="annualSalaryNaira"
            placeholder="e.g. 4200000"
            type="number"
          />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <label className="grid gap-2 text-sm text-[var(--cream-dim)]">
          <span>Years experience</span>
          <input
            className="min-h-11 rounded-[8px] border border-[var(--border)] bg-[var(--surface)] px-4 text-[var(--cream)]"
            name="yearsExperience"
            placeholder="e.g. 3"
            type="number"
          />
        </label>
        <label className="grid gap-2 text-sm text-[var(--cream-dim)]">
          <span>Employment type</span>
          <select
            className="min-h-11 rounded-[8px] border border-[var(--border)] bg-[var(--surface)] px-4 text-[var(--cream)]"
            defaultValue="full_time"
            name="employmentType"
          >
            <option value="full_time">Full time</option>
            <option value="contract">Contract</option>
            <option value="part_time">Part time</option>
          </select>
        </label>
        <label className="grid gap-2 text-sm text-[var(--cream-dim)]">
          <span>Submission year</span>
          <input
            className="min-h-11 rounded-[8px] border border-[var(--border)] bg-[var(--surface)] px-4 text-[var(--cream)]"
            defaultValue={new Date().getFullYear()}
            name="submissionYear"
            type="number"
          />
        </label>
      </div>

      <div className="rounded-[8px] border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-sm leading-6 text-[var(--cream-dim)]">
        Minimum five submissions are required before any aggregate becomes public for a company,
        role, and state combination.
      </div>

      {state.error ? (
        <p className="rounded-[8px] border border-[var(--red)] bg-[var(--red-glow)] px-4 py-3 text-sm text-[var(--red)]">
          {state.error}
        </p>
      ) : null}

      {state.success ? (
        <p className="rounded-[8px] border border-[var(--green)] bg-[var(--green-glow)] px-4 py-3 text-sm text-[var(--green)]">
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
    <Button className="w-full" loading={pending} type="submit" variant="primary">
      Submit salary
    </Button>
  );
}
