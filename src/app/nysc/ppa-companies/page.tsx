import type { Metadata } from "next";
import { NyscMagicLink } from "@/components/nysc/nysc-magic-link";
import { PpaCompanyForm } from "@/components/nysc/ppa-company-form";
import { NIGERIAN_STATES } from "@/lib/cv/constants";
import { getPpaCompanyAggregates } from "@/lib/nysc/ppa-companies";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  description:
    "Email-verified NYSC PPA company reviews by state, with public aggregates once enough corps members submit.",
  title: "NYSC PPA Companies | CVPadi",
};

export default async function PpaCompaniesPage({
  searchParams,
}: {
  searchParams?: {
    company?: string;
    state?: string;
    submit?: string;
  };
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const aggregates = await getPpaCompanyAggregates({
    companyName: searchParams?.company?.trim(),
    locationState: searchParams?.state?.trim(),
  });

  const canSubmit = Boolean(user?.email_confirmed_at);
  const submitRequested = searchParams?.submit === "1";

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 sm:py-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <section className="rounded-[var(--radius-card)] border border-border bg-surface p-6 shadow-[var(--shadow-elevated)] sm:p-8">
          <p className="font-mono text-sm uppercase tracking-[0.28em] text-[var(--ink-light)]">
            NYSC PPA Companies
          </p>
          <h1 className="mt-3 max-w-3xl font-heading text-4xl leading-tight text-foreground sm:text-5xl">
            Which PPA companies are worth your service year?
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-[var(--ink-light)] sm:text-lg">
            This page uses email-verified community submissions to show which NYSC PPA
            companies corps members would actually recommend. Results appear only after
            enough people report the same company in the same state.
          </p>
        </section>

        <section className="rounded-[var(--radius-card)] border border-border bg-surface p-5 shadow-[var(--shadow-card)] sm:p-6">
          <h2 className="font-heading text-2xl text-foreground">Filter the visible company groups</h2>
          <form className="mt-4 grid gap-4 sm:grid-cols-[1fr_0.8fr_auto]">
            <input
              className="min-h-12 rounded-[var(--radius-input)] border border-border bg-white px-4"
              defaultValue={searchParams?.company ?? ""}
              name="company"
              placeholder="Company or organisation"
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
              <h2 className="font-heading text-2xl text-foreground">Public PPA company table</h2>
              <p className="mt-2 text-sm leading-6 text-[var(--ink-light)] sm:text-base">
                We only show public results once there are at least five submissions for the
                same company and state.
              </p>
            </div>
            <span className="inline-flex min-h-11 items-center rounded-full bg-[var(--blue-light)] px-4 text-sm font-medium text-[var(--blue)]">
              {aggregates.length} visible results
            </span>
          </div>

          {aggregates.length > 0 ? (
            <div className="mt-5 grid gap-4">
              {aggregates.map((aggregate) => (
                <article
                  className="rounded-[var(--radius-input)] border border-[var(--border-light)] bg-white/70 p-4"
                  key={`${aggregate.companyName}-${aggregate.locationState}`}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h3 className="font-heading text-2xl text-foreground">
                        {aggregate.companyName}
                      </h3>
                      <p className="mt-1 text-sm leading-6 text-[var(--ink-light)]">
                        {aggregate.locationState} - {aggregate.roleTitle}
                      </p>
                    </div>
                    <span className="inline-flex min-h-11 items-center rounded-full bg-[var(--accent-light)] px-4 text-sm font-medium text-[var(--accent)]">
                      {aggregate.count} submissions
                    </span>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <StatCard label="Average rating" value={`${aggregate.averageRating}/5`} />
                    <StatCard label="Recommend rate" value={`${aggregate.recommendRate}%`} />
                    <StatCard label="Coverage" value={aggregate.locationState} />
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="mt-5 rounded-[var(--radius-input)] border border-[var(--gold)] bg-[var(--gold-light)] px-4 py-4 text-sm leading-6 text-foreground">
              No PPA company reviews are visible for this search yet. That is normal early on.
              Be the first to submit a review and help other corps members.
            </div>
          )}
        </section>

        <section
          className={`rounded-[var(--radius-card)] border bg-surface p-5 shadow-[var(--shadow-card)] sm:p-6 ${
            submitRequested ? "border-[var(--accent)]" : "border-border"
          }`}
          id="ppa-submit"
        >
          <h2 className="font-heading text-2xl text-foreground">Submit your PPA review</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--ink-light)] sm:text-base">
            Email verification is required before you can submit.
          </p>

          <div className="mt-5">
            {canSubmit ? (
              <PpaCompanyForm />
            ) : (
              <NyscMagicLink initialEmail={user?.email ?? ""} />
            )}
          </div>
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
