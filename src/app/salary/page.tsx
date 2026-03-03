import type { Metadata } from "next";
import { SalaryMagicLink } from "@/components/salary/salary-magic-link";
import { SalarySubmissionForm } from "@/components/salary/salary-submission-form";
import { NIGERIAN_STATES } from "@/lib/cv/constants";
import {
  formatAnnualNaira,
  getSalaryAggregates,
} from "@/lib/salary/aggregates";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  description:
    "See Nigerian salary ranges by company, role, and state. Aggregates unlock after five submissions.",
  keywords: [
    "Dangote salary Nigeria",
    "GTBank pay",
    "Nigeria salary database",
    "Lagos salary range",
    "CVPadi salary",
  ],
  title: "Nigerian Salary Database | CVPadi",
};

export default async function SalaryPage({
  searchParams,
}: {
  searchParams?: {
    company?: string;
    role?: string;
    state?: string;
    submit?: string;
  };
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const aggregates = await getSalaryAggregates({
    company: searchParams?.company?.trim(),
    locationState: searchParams?.state?.trim(),
    role: searchParams?.role?.trim(),
  });

  const canSubmit = Boolean(user?.email_confirmed_at);
  const submitRequested = searchParams?.submit === "1";

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 sm:py-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <section className="rounded-[var(--radius-card)] border border-border bg-surface p-6 shadow-[var(--shadow-elevated)] sm:p-8">
          <p className="font-mono text-sm uppercase tracking-[0.28em] text-[var(--ink-light)]">
            F3 - Nigerian Salary Database
          </p>
          <h1 className="mt-3 max-w-3xl font-heading text-4xl leading-tight text-foreground sm:text-5xl">
            Nigerian salary ranges by company, role, and state.
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-[var(--ink-light)] sm:text-lg">
            This page is public and indexable from Phase 1. Aggregates only appear once at
            least five people submit the same company, role, and state combination.
          </p>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <a
              className="inline-flex min-h-12 items-center justify-center rounded-[var(--radius-input)] bg-[var(--accent)] px-5 text-sm font-medium text-white"
              href="#salary-submit"
            >
              Submit salary data
            </a>
            <a
              className="inline-flex min-h-12 items-center justify-center rounded-[var(--radius-input)] border border-border px-5 text-sm font-medium text-foreground"
              href="/build"
            >
              Build your CV
            </a>
          </div>
        </section>

        <section className="rounded-[var(--radius-card)] border border-border bg-surface p-5 shadow-[var(--shadow-card)] sm:p-6">
          <h2 className="font-heading text-2xl text-foreground">Filter the public ranges</h2>
          <form className="mt-4 grid gap-4 sm:grid-cols-[1fr_1fr_0.8fr_auto]">
            <input
              className="min-h-12 rounded-[var(--radius-input)] border border-border bg-white px-4"
              defaultValue={searchParams?.company ?? ""}
              name="company"
              placeholder="Company"
              type="text"
            />
            <input
              className="min-h-12 rounded-[var(--radius-input)] border border-border bg-white px-4"
              defaultValue={searchParams?.role ?? ""}
              name="role"
              placeholder="Role"
              type="text"
            />
            <select
              className="min-h-12 rounded-[var(--radius-input)] border border-border bg-white px-4"
              defaultValue={searchParams?.state ?? ""}
              name="state"
            >
              <option value="">All states</option>
              {NIGERIAN_STATES.map((stateName) => (
                <option key={stateName} value={stateName}>
                  {stateName}
                </option>
              ))}
            </select>
            <button
              className="inline-flex min-h-12 items-center justify-center rounded-[var(--radius-input)] border border-border px-5 text-sm font-medium text-foreground"
              type="submit"
            >
              Apply
            </button>
          </form>
        </section>

        <section className="rounded-[var(--radius-card)] border border-border bg-surface p-5 shadow-[var(--shadow-card)] sm:p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-heading text-2xl text-foreground">Public salary table</h2>
              <p className="mt-2 text-sm leading-6 text-[var(--ink-light)] sm:text-base">
                We only display combinations with at least five submissions.
              </p>
            </div>
            <span className="inline-flex min-h-11 items-center rounded-full bg-[var(--blue-light)] px-4 text-sm font-medium text-[var(--blue)]">
              {aggregates.length} visible groups
            </span>
          </div>

          {aggregates.length > 0 ? (
            <div className="mt-5 grid gap-4">
              {aggregates.map((aggregate) => (
                <article
                  className="rounded-[var(--radius-input)] border border-[var(--border-light)] bg-white/70 p-4"
                  key={`${aggregate.company}-${aggregate.role}-${aggregate.locationState}`}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h3 className="font-heading text-2xl text-foreground">{aggregate.company}</h3>
                      <p className="mt-1 text-sm leading-6 text-[var(--ink-light)]">
                        {aggregate.role} - {aggregate.locationState}
                      </p>
                    </div>
                    <span className="inline-flex min-h-11 items-center rounded-full bg-[var(--accent-light)] px-4 text-sm font-medium text-[var(--accent)]">
                      {aggregate.count} submissions
                    </span>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <StatCard label="Min" value={formatAnnualNaira(aggregate.minAnnualKobo)} />
                    <StatCard label="Median" value={formatAnnualNaira(aggregate.medianAnnualKobo)} />
                    <StatCard label="Max" value={formatAnnualNaira(aggregate.maxAnnualKobo)} />
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="mt-5 rounded-[var(--radius-input)] border border-[var(--gold)] bg-[var(--gold-light)] px-4 py-4 text-sm leading-6 text-foreground">
              No salary group is public yet for this filter. That is expected early on.
              The page is live now so search indexing starts before the data fills in.
            </div>
          )}
        </section>

        <section
          className={`rounded-[var(--radius-card)] border bg-surface p-5 shadow-[var(--shadow-card)] sm:p-6 ${
            submitRequested ? "border-[var(--accent)]" : "border-border"
          }`}
          id="salary-submit"
        >
          <h2 className="font-heading text-2xl text-foreground">Submit your salary</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--ink-light)] sm:text-base">
            Email verification is required to submit, but we do not force a password flow here.
          </p>

          <div className="mt-5">
            {canSubmit ? (
              <SalarySubmissionForm />
            ) : (
              <SalaryMagicLink initialEmail={user?.email ?? ""} />
            )}
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          <InfoCard
            body="Dangote salary Nigeria, GTBank pay, and Access Bank Lagos salary are the early keyword targets."
            title="SEO angle"
          />
          <InfoCard
            body="Five-submission minimum keeps the public numbers from being noisy or easy to game."
            title="Safety rule"
          />
          <InfoCard
            body="Salary submission is free and keeps CVPadi useful after the first CV purchase."
            title="Retention angle"
          />
        </section>
      </div>
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[var(--radius-input)] border border-[var(--border-light)] bg-[var(--bg)] px-4 py-4">
      <p className="font-mono text-xs uppercase tracking-[0.24em] text-[var(--ink-light)]">
        {label}
      </p>
      <p className="mt-2 font-heading text-2xl text-foreground">{value}</p>
    </div>
  );
}

function InfoCard({ body, title }: { body: string; title: string }) {
  return (
    <article className="rounded-[var(--radius-card)] border border-border bg-surface p-5 shadow-[var(--shadow-card)]">
      <h3 className="font-heading text-2xl text-foreground">{title}</h3>
      <p className="mt-3 text-sm leading-6 text-[var(--ink-light)]">{body}</p>
    </article>
  );
}
