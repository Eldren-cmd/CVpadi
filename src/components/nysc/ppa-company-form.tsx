"use client";

import { useFormState, useFormStatus } from "react-dom";
import { NIGERIAN_STATES } from "@/lib/cv/constants";
import {
  submitPpaReviewAction,
  type PpaReviewSubmissionState,
} from "@/app/nysc/ppa-companies/actions";

const initialState: PpaReviewSubmissionState = {};

export function PpaCompanyForm() {
  const [state, formAction] = useFormState(submitPpaReviewAction, initialState);

  return (
    <form action={formAction} className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2 text-sm">
          <span>PPA company</span>
          <input
            className="min-h-12 rounded-[var(--radius-input)] border border-border bg-white px-4"
            name="companyName"
            placeholder="e.g. Ministry of Budget and Planning"
            type="text"
          />
        </label>
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
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2 text-sm">
          <span>Role or team</span>
          <input
            className="min-h-12 rounded-[var(--radius-input)] border border-border bg-white px-4"
            name="roleTitle"
            placeholder="e.g. Admin unit, classroom support, media desk"
            type="text"
          />
        </label>
        <label className="grid gap-2 text-sm">
          <span>Overall rating</span>
          <select
            className="min-h-12 rounded-[var(--radius-input)] border border-border bg-white px-4"
            defaultValue="4"
            name="rating"
          >
            <option value="5">5 - Excellent</option>
            <option value="4">4 - Good</option>
            <option value="3">3 - Fair</option>
            <option value="2">2 - Poor</option>
            <option value="1">1 - Avoid if possible</option>
          </select>
        </label>
      </div>

      <label className="grid gap-2 text-sm">
        <span>Would you recommend this PPA?</span>
        <select
          className="min-h-12 rounded-[var(--radius-input)] border border-border bg-white px-4"
          defaultValue="yes"
          name="wouldRecommend"
        >
          <option value="yes">Yes</option>
          <option value="no">No</option>
        </select>
      </label>

      <label className="grid gap-2 text-sm">
        <span>Useful notes</span>
        <textarea
          className="min-h-32 rounded-[var(--radius-input)] border border-border bg-white px-4 py-3"
          name="notes"
          placeholder="Explain workload, culture, commute, flexibility, or the kind of projects corps members actually handle."
        />
      </label>

      <div className="rounded-[var(--radius-input)] border border-[var(--border-light)] bg-[var(--bg)] px-4 py-3 text-sm leading-6 text-[var(--ink-light)]">
        We only show public aggregates once at least five people review the same PPA company
        in the same state.
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
      {pending ? "Submitting..." : "Submit PPA review"}
    </button>
  );
}
