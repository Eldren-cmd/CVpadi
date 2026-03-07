import type { Metadata } from "next";
import Link from "next/link";
import { SalaryMagicLink } from "@/components/salary/salary-magic-link";
import { SalarySubmissionForm } from "@/components/salary/salary-submission-form";
import { NIGERIAN_STATES } from "@/lib/cv/constants";
import { formatAnnualNaira, getSalaryAggregates } from "@/lib/salary/aggregates";
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
    <main className="main-content min-h-screen bg-[var(--black)] px-4 py-6 sm:px-6 sm:py-8">
      <div className="mx-auto grid max-w-6xl gap-6 page-enter">
        <section className="rounded-[16px] border border-[var(--border)] bg-[var(--off-black)] p-6 sm:p-8">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--mid)]">Salary database</p>
          <h1 className="mt-3 max-w-4xl font-heading text-5xl leading-[1.02] text-[var(--cream)]">
            Nigerian salary ranges by company, role, and state.
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-[var(--cream-dim)]">
            Salary ranges from verified submissions. Public results appear only when enough people submit the same company, role, and state combination.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a
              className="inline-flex min-h-11 items-center justify-center rounded-[8px] bg-[var(--green)] px-5 font-display text-sm text-[var(--black)] transition-all duration-200 hover:translate-y-[-2px] hover:bg-[#33EE8A]"
              href="#salary-submit"
            >
              Submit salary data
            </a>
            <Link
              className="inline-flex min-h-11 items-center justify-center rounded-[8px] border border-[var(--border)] px-5 font-display text-sm text-[var(--cream-dim)] transition-all duration-200 hover:border-[var(--border-mid)] hover:bg-[var(--card)] hover:text-[var(--cream)]"
              href="/build"
            >
              Build your CV
            </Link>
          </div>
        </section>

        <section className="rounded-[16px] border border-[var(--border)] bg-[var(--off-black)] p-5 sm:p-6">
          <h2 className="font-display text-2xl text-[var(--cream)]">Filter data</h2>
          <form className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_0.8fr_auto]">
            <input
              className="min-h-11 rounded-[8px] border border-[var(--border)] bg-[var(--surface)] px-4 text-[var(--cream)]"
              defaultValue={searchParams?.company ?? ""}
              name="company"
              placeholder="Company"
              type="text"
            />
            <input
              className="min-h-11 rounded-[8px] border border-[var(--border)] bg-[var(--surface)] px-4 text-[var(--cream)]"
              defaultValue={searchParams?.role ?? ""}
              name="role"
              placeholder="Role"
              type="text"
            />
            <select
              className="min-h-11 rounded-[8px] border border-[var(--border)] bg-[var(--surface)] px-4 text-[var(--cream)]"
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
              className="inline-flex min-h-11 items-center justify-center rounded-[8px] border border-[var(--border)] px-4 font-display text-sm text-[var(--cream-dim)] transition-all duration-200 hover:border-[var(--border-mid)] hover:bg-[var(--card)] hover:text-[var(--cream)]"
              type="submit"
            >
              Apply
            </button>
          </form>
        </section>

        <section className="rounded-[16px] border border-[var(--border)] bg-[var(--off-black)] p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-2xl text-[var(--cream)]">Public salary table</h2>
              <p className="mt-1 text-sm text-[var(--mid)]">Rows appear when there are at least 5 submissions.</p>
            </div>
            <span className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.1em] text-[var(--cream-dim)]">
              {aggregates.length} salary ranges
            </span>
          </div>

          {aggregates.length > 0 ? (
            <div className="mt-4 overflow-hidden rounded-[10px] border border-[var(--border)]">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-[var(--surface)]">
                    <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--mid)]">Company</th>
                    <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--mid)]">Role</th>
                    <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--mid)]">State</th>
                    <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--mid)]">Min</th>
                    <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--mid)]">Median</th>
                    <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--mid)]">Max</th>
                    <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--mid)]">Submissions</th>
                  </tr>
                </thead>
                <tbody>
                  {aggregates.map((aggregate) => (
                    <tr className="border-t border-[var(--border)] text-sm text-[var(--cream-dim)] transition-colors duration-150 hover:bg-[var(--card)]" key={`${aggregate.company}-${aggregate.role}-${aggregate.locationState}`}>
                      <td className="px-4 py-3">{aggregate.company}</td>
                      <td className="px-4 py-3">{aggregate.role}</td>
                      <td className="px-4 py-3">{aggregate.locationState}</td>
                      <td className="px-4 py-3 font-mono text-[var(--mid)]">{formatAnnualNaira(aggregate.minAnnualKobo)}</td>
                      <td className="px-4 py-3 font-mono text-[var(--cream)]">{formatAnnualNaira(aggregate.medianAnnualKobo)}</td>
                      <td className="px-4 py-3 font-mono text-[var(--green)]">{formatAnnualNaira(aggregate.maxAnnualKobo)}</td>
                      <td className="px-4 py-3">
                        <span className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-2 py-1 font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--cream-dim)]">
                          {aggregate.count}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="mt-4 rounded-[10px] border border-[var(--gold)] bg-[var(--gold-glow)] px-4 py-4 text-sm text-[var(--gold)]" style={{ borderLeftWidth: "3px" }}>
              <p className="font-mono text-xs uppercase tracking-[0.12em]">No salary data yet for this search</p>
              <p className="mt-2 text-sm normal-case tracking-normal">
                Be the first to submit and help unlock a public salary range for this role.
              </p>
            </div>
          )}
        </section>

        <section
          className={`rounded-[16px] border bg-[var(--off-black)] p-5 sm:p-6 ${submitRequested ? "border-[var(--green)]" : "border-[var(--border)]"}`}
          id="salary-submit"
        >
          <h2 className="font-display text-2xl text-[var(--cream)]">Submit your salary data</h2>
          <p className="mt-2 text-sm text-[var(--cream-dim)]">Email verification is required before submission.</p>

          <div
            className="mt-4 overflow-hidden transition-[max-height] duration-300 ease-out"
            style={{ maxHeight: canSubmit ? "1000px" : "220px" }}
          >
            {canSubmit ? (
              <SalarySubmissionForm />
            ) : (
              <SalaryMagicLink initialEmail={user?.email ?? ""} />
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
