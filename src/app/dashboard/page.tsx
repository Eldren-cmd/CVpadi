import type { Metadata } from "next";
import Link from "next/link";
import { DashboardDownloadButton } from "@/components/dashboard/dashboard-download-button";
import { JobMatchLink } from "@/components/dashboard/job-match-link";
import { computeCVScore } from "@/lib/cv/score";
import type { CVFormData } from "@/lib/cv/types";
import { extractEmailPreferences } from "@/lib/email/preferences";
import { formatKoboToNaira, PAYMENT_PRICES_KOBO } from "@/lib/payments/constants";
import {
  TRACKER_STATUSES,
  TRACKER_STATUS_META,
  type TrackerStatus,
} from "@/lib/tracker/constants";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

interface JobMatchRow {
  applied: boolean;
  clicked: boolean;
  job_id: string;
  jobs: {
    company: string;
    currency: string | null;
    location_city: string | null;
    location_state: string | null;
    salary_max: number | null;
    salary_min: number | null;
    source_url: string | null;
    title: string;
  } | null;
  match_score: number;
  notified: boolean;
}

interface JobMatchRowFromQuery {
  applied: boolean;
  clicked: boolean;
  job_id: string;
  jobs:
    | {
        company: string;
        currency: string | null;
        location_city: string | null;
        location_state: string | null;
        salary_max: number | null;
        salary_min: number | null;
        source_url: string | null;
        title: string;
      }[]
    | null;
  match_score: number;
  notified: boolean;
}

interface ApplicationRow {
  company: string;
  id: string;
  role: string;
  status: string;
}

export const metadata: Metadata = {
  description:
    "Open your CV, job matches, tracker board, and profile-strength nudges in one mobile-first dashboard.",
  title: "Dashboard | CVPadi",
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/dashboard");
  }

  const [
    { data: profile, error: profileError },
    { data: currentCv, error: cvError },
    { data: cvBranches, error: branchesError },
    { data: jobMatches, error: matchesError },
    { data: applications, error: applicationsError },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name, account_credit_kobo")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("cvs")
      .select("id, branch_id, form_data, is_paid, updated_at, version_number")
      .eq("user_id", user.id)
      .eq("is_snapshot", false)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("cvs")
      .select("id")
      .eq("user_id", user.id)
      .eq("is_snapshot", false),
    supabase
      .from("job_matches")
      .select(
        "job_id, match_score, clicked, applied, notified, jobs(title, company, location_city, location_state, salary_min, salary_max, currency, source_url)",
      )
      .eq("user_id", user.id)
      .order("match_score", { ascending: false })
      .limit(6),
    supabase
      .from("applications")
      .select("id, company, role, status")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
  ]);

  if (profileError) {
    throw new Error(profileError.message);
  }

  if (cvError) {
    throw new Error(cvError.message);
  }

  if (branchesError) {
    throw new Error(branchesError.message);
  }

  if (matchesError) {
    throw new Error(matchesError.message);
  }

  if (applicationsError) {
    throw new Error(applicationsError.message);
  }

  const preferences = extractEmailPreferences(user.user_metadata);
  const cvFormData = (currentCv?.form_data ?? null) as CVFormData | null;
  const scoreResult = cvFormData ? computeCVScore(cvFormData) : null;
  const trackerGroups = groupApplicationsByStatus((applications ?? []) as ApplicationRow[]);
  const topMatches = normalizeJobMatches((jobMatches ?? []) as JobMatchRowFromQuery[]);
  const unreadMatches = topMatches.filter((match) => !match.clicked && !match.applied).length;
  const trackerTotal = (applications ?? []).length;
  const profileStrength = scoreResult?.score ?? 0;
  const missingSkillsNudge = cvFormData && cvFormData.skills.length < 5;

  return (
    <div className="grid gap-6">
      <section className="rounded-[var(--radius-card)] border border-border bg-surface p-6 shadow-[var(--shadow-elevated)] sm:p-8">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="font-mono text-sm uppercase tracking-[0.28em] text-[var(--ink-light)]">
              Phase 2.3 - User Dashboard
            </p>
            <h1 className="mt-3 max-w-3xl font-heading text-4xl leading-tight text-foreground sm:text-5xl">
              Welcome back, {profile?.full_name || cvFormData?.fullName || "there"}.
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-[var(--ink-light)] sm:text-lg">
              This dashboard keeps your latest CV branch, top job matches, tracker board,
              and profile nudges visible in one place so you can move faster.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <SummaryPill
              label="Current score"
              value={scoreResult ? `${scoreResult.score}%` : "0%"}
            />
            <SummaryPill label="Open matches" value={String(unreadMatches)} />
            <SummaryPill label="Tracked roles" value={String(trackerTotal)} />
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.4fr_1fr]" id="cv">
        <article className="rounded-[var(--radius-card)] border border-border bg-surface p-5 shadow-[var(--shadow-card)] sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.24em] text-[var(--ink-light)]">
                My CV
              </p>
              <h2 className="mt-2 font-heading text-3xl text-foreground">
                {cvFormData?.fullName || "Untitled CV draft"}
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--ink-light)]">
                {cvFormData?.industry || "General"} CV branch, version {currentCv?.version_number ?? 1}.
                Last updated {formatDateTime(currentCv?.updated_at)}.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                className="inline-flex min-h-12 items-center justify-center rounded-[var(--radius-input)] bg-[var(--accent)] px-5 text-sm font-medium text-white"
                href={currentCv ? `/build?cv=${currentCv.id}` : "/build"}
              >
                Edit CV
              </Link>
              {currentCv?.is_paid ? (
                <DashboardDownloadButton cvId={currentCv.id} />
              ) : (
                <div className="grid gap-2">
                  <Link
                    className="inline-flex min-h-12 items-center justify-center rounded-[var(--radius-input)] border border-border px-5 text-sm font-medium text-foreground"
                    href={currentCv ? `/build?cv=${currentCv.id}` : "/build"}
                  >
                    Pay {formatKoboToNaira(PAYMENT_PRICES_KOBO.cv_download)}
                  </Link>
                  <p className="text-xs leading-5 text-[var(--ink-light)]">
                    Paid users can download directly from this dashboard.
                  </p>
                </div>
              )}
              <Link
                className="inline-flex min-h-12 items-center justify-center rounded-[var(--radius-input)] border border-border px-5 text-sm font-medium text-foreground"
                href="/dashboard/versions"
              >
                Version history
              </Link>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <MetricCard
              label="Status"
              value={currentCv?.is_paid ? "Paid branch" : "Draft branch"}
            />
            <MetricCard label="Branches" value={String((cvBranches ?? []).length || 0)} />
            <MetricCard
              label="Account credit"
              value={formatKoboToNaira(profile?.account_credit_kobo ?? 0)}
            />
          </div>
        </article>

        <article className="rounded-[var(--radius-card)] border border-border bg-surface p-5 shadow-[var(--shadow-card)] sm:p-6">
          <p className="font-mono text-xs uppercase tracking-[0.24em] text-[var(--ink-light)]">
            Score dial
          </p>
          <div className="mt-4 flex items-center gap-4">
            <StaticScoreDial score={scoreResult?.score ?? 0} />
            <div>
              <h2 className="font-heading text-2xl text-foreground">Current CV score</h2>
              <p className="mt-2 text-sm leading-6 text-[var(--ink-light)]">
                The dashboard mirrors the same scoring logic from the builder so you always
                know whether your current branch is recruiter-ready.
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-3">
            {(scoreResult?.suggestions ?? []).slice(0, 3).map((suggestion) => (
              <div
                className="rounded-[var(--radius-input)] border border-[var(--border-light)] bg-white/70 px-4 py-3"
                key={suggestion.id}
              >
                <p className="text-sm leading-6 text-[var(--ink-light)]">{suggestion.message}</p>
              </div>
            ))}
            {scoreResult && scoreResult.suggestions.length === 0 ? (
              <div className="rounded-[var(--radius-input)] border border-[var(--green)] bg-[var(--green-light)] px-4 py-3 text-sm text-[var(--green)]">
                All core CV sections are in place.
              </div>
            ) : null}
          </div>
        </article>
      </section>

      <section className="grid gap-6" id="jobs">
        <article className="rounded-[var(--radius-card)] border border-border bg-surface p-5 shadow-[var(--shadow-card)] sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.24em] text-[var(--ink-light)]">
                Job matches
              </p>
              <h2 className="mt-2 font-heading text-3xl text-foreground">
                Daily top matches for your current CV
              </h2>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--ink-light)]">
                Matching currently weights industry, location, experience level, and skills.
                Only jobs scoring 40% and above are stored.
              </p>
            </div>

            <div className="rounded-full bg-[var(--accent-light)] px-4 py-2 text-sm font-medium text-[var(--accent)]">
              {topMatches.length} visible matches
            </div>
          </div>

          {topMatches.length > 0 ? (
            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {topMatches.map((match) => (
                <article
                  className="rounded-[var(--radius-input)] border border-[var(--border-light)] bg-white/80 p-4"
                  key={match.job_id}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-heading text-2xl text-foreground">
                        {match.jobs?.company}
                      </h3>
                      <p className="mt-1 text-sm leading-6 text-[var(--ink-light)]">
                        {match.jobs?.title}
                      </p>
                    </div>
                    <span className="inline-flex min-h-10 items-center rounded-full bg-[var(--blue-light)] px-3 text-sm font-medium text-[var(--blue)]">
                      {match.match_score}%
                    </span>
                  </div>

                  <dl className="mt-4 grid gap-2 text-sm leading-6 text-[var(--ink-light)]">
                    <div>
                      <dt className="font-medium text-foreground">Location</dt>
                      <dd>{formatLocation(match.jobs?.location_city, match.jobs?.location_state)}</dd>
                    </div>
                    <div>
                      <dt className="font-medium text-foreground">Salary</dt>
                      <dd>{formatSalary(match.jobs?.salary_min ?? null, match.jobs?.salary_max ?? null, match.jobs?.currency ?? null)}</dd>
                    </div>
                  </dl>

                  <div className="mt-4 flex items-center justify-between gap-3">
                    <span className="text-xs uppercase tracking-[0.18em] text-[var(--ink-faint)]">
                      {match.clicked ? "clicked" : match.notified ? "emailed" : "new"}
                    </span>
                    {match.jobs?.source_url ? (
                      <JobMatchLink jobId={match.job_id} sourceUrl={match.jobs.source_url} />
                    ) : (
                      <span className="text-xs text-[var(--ink-light)]">No source link yet</span>
                    )}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="mt-6 rounded-[var(--radius-input)] border border-dashed border-[var(--border-light)] bg-[var(--bg)] px-4 py-5 text-sm leading-6 text-[var(--ink-light)]">
              No stored matches yet. Keep your CV profile complete and wait for the next daily
              matcher run at 8:00 AM WAT.
            </div>
          )}
        </article>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.3fr_0.9fr]" id="tracker">
        <article className="rounded-[var(--radius-card)] border border-border bg-surface p-5 shadow-[var(--shadow-card)] sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.24em] text-[var(--ink-light)]">
                Application tracker
              </p>
              <h2 className="mt-2 font-heading text-3xl text-foreground">
                Kanban view for active applications
              </h2>
            </div>
            <Link
              className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-input)] border border-border px-4 text-sm font-medium text-foreground"
              href="/dashboard/tracker"
            >
              Open full tracker
            </Link>
          </div>

          <div className="mt-6 grid gap-4 xl:grid-cols-4">
            {TRACKER_STATUSES.map((status) => (
              <div
                className="rounded-[var(--radius-input)] border border-[var(--border-light)] bg-white/70 p-4"
                key={status}
              >
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-heading text-xl text-foreground">
                    {TRACKER_STATUS_META[status].label}
                  </h3>
                  <span
                    className={`inline-flex min-h-9 items-center rounded-full px-3 text-xs font-medium ${TRACKER_STATUS_META[status].accentClassName}`}
                  >
                    {trackerGroups[status].length}
                  </span>
                </div>

                <div className="mt-4 grid gap-3">
                  {trackerGroups[status].slice(0, 2).map((application) => (
                    <div
                      className="rounded-[var(--radius-input)] border border-[var(--border-light)] bg-[var(--bg)] px-3 py-3"
                      key={application.id}
                    >
                      <p className="font-medium text-foreground">{application.company}</p>
                      <p className="mt-1 text-sm leading-6 text-[var(--ink-light)]">
                        {application.role}
                      </p>
                    </div>
                  ))}
                  {trackerGroups[status].length === 0 ? (
                    <div className="rounded-[var(--radius-input)] border border-dashed border-[var(--border-light)] bg-[var(--bg)] px-3 py-4 text-sm leading-6 text-[var(--ink-light)]">
                      {TRACKER_STATUS_META[status].emptyState}
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-[var(--radius-card)] border border-border bg-surface p-5 shadow-[var(--shadow-card)] sm:p-6">
          <p className="font-mono text-xs uppercase tracking-[0.24em] text-[var(--ink-light)]">
            Interview nudge
          </p>
          <h2 className="mt-2 font-heading text-3xl text-foreground">
            Keep the interview reminder visible
          </h2>
          <p className="mt-3 text-sm leading-6 text-[var(--ink-light)]">
            When a tracker card moves into Interview, the dedicated tracker page already
            prompts the user to refresh the CV before the conversation.
          </p>
          <div className="mt-5 rounded-[var(--radius-input)] border border-[var(--gold)] bg-[var(--gold-light)] px-4 py-4 text-sm leading-6 text-foreground">
            Heading to an interview? Make sure your CV is updated.
            <Link className="ml-2 font-medium text-[var(--accent)]" href="/build">
              Edit CV
            </Link>
          </div>
        </article>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]" id="profile">
        <article className="rounded-[var(--radius-card)] border border-border bg-surface p-5 shadow-[var(--shadow-card)] sm:p-6">
          <p className="font-mono text-xs uppercase tracking-[0.24em] text-[var(--ink-light)]">
            Profile strength
          </p>
          <h2 className="mt-2 font-heading text-3xl text-foreground">
            Matching improves when the profile is complete
          </h2>

          <div className="mt-5 overflow-hidden rounded-full bg-[var(--bg)]">
            <div
              aria-label={`Profile strength ${profileStrength}%`}
              className="min-h-4 rounded-full bg-[var(--accent)]"
              style={{ width: `${profileStrength}%` }}
            />
          </div>

          <p className="mt-3 text-sm leading-6 text-[var(--ink-light)]">
            Current strength is {profileStrength}%. Stronger completion gives the matcher more
            useful location, experience, and skills signals.
          </p>

          <div className="mt-5 grid gap-3">
            {(scoreResult?.suggestions ?? []).slice(0, 3).map((suggestion) => (
              <div
                className="rounded-[var(--radius-input)] border border-[var(--border-light)] bg-white/70 px-4 py-3"
                key={suggestion.id}
              >
                <p className="text-sm leading-6 text-[var(--ink-light)]">{suggestion.message}</p>
              </div>
            ))}
            {missingSkillsNudge ? (
              <div className="rounded-[var(--radius-input)] border border-[var(--blue)] bg-[var(--blue-light)] px-4 py-3 text-sm text-[var(--blue)]">
                Add at least five skills to strengthen matching quality.
              </div>
            ) : null}
          </div>
        </article>

        <article className="rounded-[var(--radius-card)] border border-border bg-surface p-5 shadow-[var(--shadow-card)] sm:p-6">
          <p className="font-mono text-xs uppercase tracking-[0.24em] text-[var(--ink-light)]">
            Notifications
          </p>
          <h2 className="mt-2 font-heading text-3xl text-foreground">Alerts and platform updates</h2>

          <div className="mt-5 grid gap-3">
            <NotificationRow
              label="Job alerts"
              value={
                preferences.unsubscribeAll
                  ? "Off"
                  : preferences.frequency === "less_often"
                    ? "Weekly digest"
                    : "Daily digest"
              }
            />
            <NotificationRow
              label="Platform updates"
              value={
                preferences.unsubscribeAll || preferences.frequency === "jobs_only"
                  ? "Off"
                  : "On"
              }
            />
            <NotificationRow
              label="Builder follow-ups"
              value={
                preferences.unsubscribeAll || preferences.frequency === "jobs_only"
                  ? "Off"
                  : preferences.frequency === "less_often"
                    ? "Reduced"
                    : "On"
              }
            />
          </div>

          <div className="mt-5 rounded-[var(--radius-input)] border border-[var(--border-light)] bg-[var(--bg)] px-4 py-4 text-sm leading-6 text-[var(--ink-light)]">
            Want fewer nudges? The preference centre lets you keep job alerts while muting
            abandoned-draft and post-download follow-ups.
            <Link className="ml-1 font-medium text-[var(--accent)]" href="/email-preferences">
              Open preferences
            </Link>
          </div>
        </article>
      </section>
    </div>
  );
}

function groupApplicationsByStatus(applications: ApplicationRow[]) {
  return TRACKER_STATUSES.reduce(
    (accumulator, status) => {
      accumulator[status] = applications.filter((application) => application.status === status);
      return accumulator;
    },
    {} as Record<TrackerStatus, ApplicationRow[]>,
  );
}

function normalizeJobMatches(rows: JobMatchRowFromQuery[]) {
  return rows
    .map((row) => ({
      ...row,
      jobs: row.jobs?.[0] ?? null,
    }))
    .filter((row): row is JobMatchRow => Boolean(row.jobs));
}

function formatDateTime(value?: string) {
  if (!value) {
    return "just now";
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return "recently";
  }

  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(parsed);
}

function formatLocation(city?: string | null, state?: string | null) {
  return [city, state].filter(Boolean).join(", ") || "Location not listed";
}

function formatSalary(min: number | null, max: number | null, currency: string | null) {
  const formatter = new Intl.NumberFormat("en-NG", {
    currency: currency || "NGN",
    maximumFractionDigits: 0,
    style: "currency",
  });

  if (min && max) {
    return `${formatter.format(min)} - ${formatter.format(max)}`;
  }

  if (min) {
    return `From ${formatter.format(min)}`;
  }

  if (max) {
    return `Up to ${formatter.format(max)}`;
  }

  return "Salary not listed";
}

function StaticScoreDial({ score }: { score: number }) {
  const radius = 48;
  const circumference = 2 * Math.PI * radius;
  const progress = circumference - (score / 100) * circumference;

  return (
    <div className="relative h-28 w-28 shrink-0">
      <svg className="h-28 w-28 -rotate-90" viewBox="0 0 120 120">
        <circle
          cx="60"
          cy="60"
          fill="none"
          r={radius}
          stroke="var(--border-light)"
          strokeWidth="12"
        />
        <circle
          cx="60"
          cy="60"
          fill="none"
          r={radius}
          stroke="var(--accent)"
          strokeDasharray={circumference}
          strokeDashoffset={progress}
          strokeLinecap="round"
          strokeWidth="12"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-heading text-3xl text-foreground">{score}</span>
        <span className="text-[10px] uppercase tracking-[0.2em] text-[var(--ink-light)]">
          score
        </span>
      </div>
    </div>
  );
}

function SummaryPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[var(--radius-input)] border border-[var(--border-light)] bg-white/70 px-4 py-3">
      <p className="text-xs uppercase tracking-[0.18em] text-[var(--ink-faint)]">{label}</p>
      <p className="mt-2 font-heading text-2xl text-foreground">{value}</p>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[var(--radius-input)] border border-[var(--border-light)] bg-white/70 px-4 py-4">
      <p className="text-xs uppercase tracking-[0.18em] text-[var(--ink-faint)]">{label}</p>
      <p className="mt-2 text-base font-medium text-foreground">{value}</p>
    </div>
  );
}

function NotificationRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-[var(--radius-input)] border border-[var(--border-light)] bg-white/70 px-4 py-3">
      <p className="text-sm font-medium text-foreground">{label}</p>
      <span className="text-sm text-[var(--ink-light)]">{value}</span>
    </div>
  );
}
