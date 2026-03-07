import type { Metadata } from "next";
import Link from "next/link";
import { DashboardDownloadButton } from "@/components/dashboard/dashboard-download-button";
import { JobMatchLink } from "@/components/dashboard/job-match-link";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { ScoreDial as SharedScoreDial } from "@/components/ui/ScoreDial";
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

interface CvBranchRow {
  id: string;
  updated_at: string;
  version_number: number;
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
      .select("id, updated_at, version_number")
      .eq("user_id", user.id)
      .eq("is_snapshot", false)
      .order("updated_at", { ascending: false }),
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
  const hasStartedCv = hasDraftProgress(cvFormData);
  const scoreResult = cvFormData ? computeCVScore(cvFormData) : null;
  const trackerGroups = groupApplicationsByStatus((applications ?? []) as ApplicationRow[]);
  const topMatches = normalizeJobMatches((jobMatches ?? []) as JobMatchRowFromQuery[]);
  const unreadMatches = topMatches.filter((match) => !match.clicked && !match.applied).length;
  const trackerTotal = (applications ?? []).length;
  const profileStrength = scoreResult?.score ?? 0;
  const missingSkillsNudge = cvFormData && cvFormData.skills.length < 5;
  const welcomeFirstName = getFirstName(profile?.full_name || cvFormData?.fullName || "");
  const cvDisplayName = hasStartedCv
    ? cvFormData?.fullName || "My CV"
    : "My CV — Start building to see your score";
  const cvMeta = buildCvMeta({
    hasStartedCv,
    industry: cvFormData?.industry ?? "",
    updatedAt: currentCv?.updated_at,
    versionNumber: currentCv?.version_number,
  });

  return (
    <div className="grid gap-6">
      <section className="page-enter rounded-[16px] border border-[var(--border)] bg-[var(--off-black)] px-5 py-6 sm:px-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="mt-2 font-heading text-5xl leading-[1] text-[var(--cream)]">
              Welcome back, {welcomeFirstName || "there"}.
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--cream-dim)]">
              Everything you need to manage your CV, job matches, application progress, and profile strength in one place.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <SummaryChip
              label="Current score"
              value={hasStartedCv && scoreResult ? `${scoreResult.score}%` : "—"}
            />
            <SummaryChip label="Open matches" value={topMatches.length > 0 ? String(unreadMatches) : "—"} />
            <SummaryChip label="Tracked roles" value={trackerTotal > 0 ? String(trackerTotal) : "—"} />
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.35fr_0.95fr]" id="cv">
        <Card className="fade-up !rounded-[16px] !border-[var(--border)] !bg-[var(--off-black)] !p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--mid)]">My CV</p>
              <h2 className="mt-2 font-display text-3xl text-[var(--cream)]">{cvDisplayName}</h2>
              {cvMeta ? <p className="mt-2 text-sm leading-6 text-[var(--cream-dim)]">{cvMeta}</p> : null}
            </div>

            <div className="flex flex-wrap gap-2">
              <Link
                className="inline-flex min-h-11 items-center justify-center rounded-[8px] border border-[var(--border)] px-4 font-display text-sm text-[var(--cream-dim)] transition-all duration-200 hover:border-[var(--border-mid)] hover:bg-[var(--card)] hover:text-[var(--cream)]"
                href={currentCv ? `/build?cv=${currentCv.id}` : "/build"}
              >
                Edit CV
              </Link>
              {currentCv?.is_paid ? (
                <DashboardDownloadButton cvId={currentCv.id} />
              ) : (
                <Link
                  className="inline-flex min-h-11 items-center justify-center rounded-[8px] bg-[var(--green)] px-4 font-display text-sm text-[var(--black)] transition-all duration-200 hover:translate-y-[-2px] hover:bg-[#33EE8A]"
                  href={currentCv ? `/build?cv=${currentCv.id}` : "/build"}
                >
                  Unlock ₦{(PAYMENT_PRICES_KOBO.cv_download / 100).toLocaleString("en-NG")}
                </Link>
              )}
            </div>
          </div>

          <div className="mt-6 grid gap-5 md:grid-cols-[auto_1fr]">
            {hasStartedCv ? (
              <SharedScoreDial animate colorMode="auto" label="CV score" score={scoreResult?.score ?? 0} size={96} />
            ) : (
              <div className="inline-flex h-24 w-24 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)]">
                <span className="font-heading text-5xl text-[var(--cream)]">—</span>
              </div>
            )}
            {(cvBranches ?? []).length > 0 ? (
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-[var(--mid)]">Version history</p>
                <div className="mt-3 space-y-3">
                  {((cvBranches ?? []) as CvBranchRow[]).slice(0, 4).map((branch, index) => (
                    <div className="relative pl-6" key={branch.id}>
                      <span
                        className={`absolute left-0 top-1.5 h-2.5 w-2.5 rounded-full border ${index === 0 ? "border-[var(--green)] bg-[var(--green)]" : "border-[var(--border-mid)]"}`}
                      />
                      {index < 3 ? (
                        <span className="absolute left-[4px] top-4 h-6 w-px bg-[var(--border)]" />
                      ) : null}
                      <p className="font-display text-sm text-[var(--cream)]">Version {branch.version_number}</p>
                      <p className="font-mono text-[11px] text-[var(--mid)]">
                        {formatDateTime(branch.updated_at)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-[var(--mid)]">Version history</p>
                <p className="mt-3 text-sm text-[var(--mid)]">Your saved versions will appear here as you edit your CV.</p>
              </div>
            )}
          </div>
        </Card>

        <Card className="fade-up !rounded-[16px] !border-[var(--border)] !bg-[var(--off-black)] !p-6">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--mid)]">Profile strength</p>
          <h2 className="mt-2 font-display text-2xl text-[var(--cream)]">Keep your profile complete</h2>

          <div className="mt-4 flex items-center gap-3">
            <div className="h-3 flex-1 overflow-hidden rounded-full bg-[var(--faint)]">
              <div
                className="h-full rounded-full"
                style={{
                  background: "linear-gradient(90deg, var(--green), var(--green-dim))",
                  transition: "width 0.6s cubic-bezier(0.16, 1, 0.3, 1)",
                  width: `${profileStrength}%`,
                }}
              />
            </div>
            <span className="font-mono text-xs text-[var(--cream-dim)]">{profileStrength}%</span>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {(scoreResult?.suggestions ?? []).slice(0, 3).map((suggestion) => (
              <Link
                className="inline-flex min-h-9 items-center rounded-full border border-[var(--border)] px-3 font-display text-xs text-[var(--cream-dim)] transition-all duration-200 hover:border-[var(--green)] hover:bg-[var(--green-glow)] hover:text-[var(--green)]"
                href={currentCv ? `/build?cv=${currentCv.id}` : "/build"}
                key={suggestion.id}
              >
                {suggestion.message} →
              </Link>
            ))}
          </div>

          {missingSkillsNudge ? (
            <p className="mt-4 rounded-[10px] border border-[var(--green)] bg-[var(--green-glow)] px-3 py-2 text-sm text-[var(--green)]">
              Add more skills to improve job matching quality.
            </p>
          ) : null}

          <div className="mt-5 grid gap-3">
            <InfoRow
              label="Job alerts"
              value={
                preferences.unsubscribeAll
                  ? "Off"
                  : preferences.frequency === "less_often"
                    ? "Weekly digest"
                    : "Daily digest"
              }
            />
            <InfoRow
              label="Platform updates"
              value={
                preferences.unsubscribeAll || preferences.frequency === "jobs_only" ? "Off" : "On"
              }
            />
            <InfoRow
              label="Email verification"
              value={user.email_confirmed_at ? "Verified" : "Pending"}
            />
          </div>
        </Card>
      </section>

      <section id="jobs">
        <Card className="fade-up !rounded-[16px] !border-[var(--border)] !bg-[var(--off-black)] !p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--mid)]">Job matches</p>
              <h2 className="mt-2 font-display text-3xl text-[var(--cream)]">Jobs matched to your profile</h2>
            </div>
          </div>

          {topMatches.length > 0 ? (
            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {topMatches.map((match) => (
                <article
                  className="group relative overflow-hidden rounded-[12px] border border-[var(--border)] bg-[var(--card)] p-4 transition-all duration-200 hover:border-[var(--border-mid)] hover:bg-[var(--card-hover)]"
                  key={match.job_id}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-display text-xl text-[var(--cream)]">{match.jobs?.company}</h3>
                      <p className="mt-1 text-sm text-[var(--cream-dim)]">{match.jobs?.title}</p>
                    </div>
                    <Badge
                      variant={match.match_score >= 70 ? "green" : match.match_score >= 50 ? "gold" : "blue"}
                    >
                      {match.match_score}%
                    </Badge>
                  </div>

                  <p className="mt-3 text-sm text-[var(--mid)]">
                    {formatLocation(match.jobs?.location_city, match.jobs?.location_state)}
                  </p>
                  <p className="text-sm text-[var(--cream-dim)]">
                    {formatSalary(
                      match.jobs?.salary_min ?? null,
                      match.jobs?.salary_max ?? null,
                      match.jobs?.currency ?? null,
                    )}
                  </p>

                  <div className="mt-4 translate-y-2 opacity-0 transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100">
                    {match.jobs?.source_url ? (
                      <JobMatchLink jobId={match.job_id} />
                    ) : (
                      <span className="text-xs text-[var(--mid)]">No source link yet</span>
                    )}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="mt-5 rounded-[12px] border border-dashed border-[var(--border)] bg-[var(--surface)] px-5 py-8 text-center">
              <div className="mx-auto h-10 w-10 rounded-full border border-[var(--green)] bg-[var(--green-glow)]" />
              <p className="mt-4 font-display text-lg text-[var(--cream)]">No matches yet</p>
              <p className="mt-1 text-sm text-[var(--mid)]">Build your CV to start seeing matched jobs.</p>
              <Link
                className="mt-4 inline-flex min-h-11 items-center justify-center rounded-[8px] bg-[var(--green)] px-4 font-display text-sm text-[var(--black)]"
                href={currentCv ? `/build?cv=${currentCv.id}` : "/build"}
              >
                Build your CV
              </Link>
            </div>
          )}
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.25fr_0.95fr]" id="tracker">
        <Card className="fade-up !rounded-[16px] !border-[var(--border)] !bg-[var(--off-black)] !p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--mid)]">Application tracker</p>
              <h2 className="mt-2 font-display text-3xl text-[var(--cream)]">Your applications at a glance</h2>
            </div>
            <Link
              className="inline-flex min-h-11 items-center justify-center rounded-[8px] border border-[var(--border)] px-4 font-display text-sm text-[var(--cream-dim)] transition-all duration-200 hover:border-[var(--border-mid)] hover:bg-[var(--card)] hover:text-[var(--cream)]"
              href="/dashboard/tracker"
            >
              View all applications
            </Link>
          </div>

          <div className="mt-5 grid gap-3 xl:grid-cols-4">
            {TRACKER_STATUSES.map((status) => (
              <div className="rounded-[10px] border border-[var(--border)] bg-[var(--card)] p-3" key={status}>
                <div className="flex items-center justify-between gap-2">
                  <p className="font-display text-sm text-[var(--cream)]">{TRACKER_STATUS_META[status].label}</p>
                  <Badge
                    variant={
                      status === "offer"
                        ? "green"
                        : status === "interview"
                          ? "gold"
                          : status === "rejected"
                            ? "red"
                            : "blue"
                    }
                  >
                    {trackerGroups[status].length}
                  </Badge>
                </div>
                <div className="mt-3 grid gap-2">
                  {trackerGroups[status].slice(0, 2).map((application) => (
                    <div className="rounded-[8px] border border-[var(--border)] bg-[var(--surface)] px-3 py-2" key={application.id}>
                      <p className="text-sm text-[var(--cream)]">{application.company}</p>
                      <p className="text-xs text-[var(--mid)]">{application.role}</p>
                    </div>
                  ))}
                  {trackerGroups[status].length === 0 ? (
                    <p className="text-xs text-[var(--mid)]">{TRACKER_STATUS_META[status].emptyState}</p>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="fade-up !rounded-[16px] !border-[var(--border)] !bg-[var(--off-black)] !p-6">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--mid)]">Interview reminder</p>
          <h2 className="mt-2 font-display text-2xl text-[var(--cream)]">Stay ready for interviews</h2>
          <p className="mt-3 text-sm leading-6 text-[var(--cream-dim)]">
            When you move a card to Interview, update your CV before the call so your proof aligns with the role.
          </p>

          <div className="mt-4 rounded-[10px] border border-[var(--gold)] bg-[var(--gold-glow)] px-4 py-3 text-sm text-[var(--cream)]">
            Heading to an interview? Refresh your CV first.
            <Link className="ml-1 font-display text-[var(--gold)]" href="/build">
              Edit CV →
            </Link>
          </div>

          <div className="mt-4 rounded-[10px] border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-sm text-[var(--cream-dim)]">
            Account credit: {formatKoboToNaira(profile?.account_credit_kobo ?? 0)}
          </div>
        </Card>
      </section>
    </div>
  );
}

function getFirstName(fullName: string) {
  const clean = fullName.trim();
  if (!clean) {
    return "";
  }

  return clean.split(/\s+/)[0] ?? "";
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
    return null;
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(parsed);
}

function buildCvMeta({
  hasStartedCv,
  industry,
  versionNumber,
  updatedAt,
}: {
  hasStartedCv: boolean;
  industry: string;
  updatedAt?: string;
  versionNumber?: number;
}) {
  if (!hasStartedCv) {
    return "";
  }

  const parts: string[] = [];
  const cleanIndustry = industry.trim();
  if (cleanIndustry) {
    parts.push(cleanIndustry);
  }

  if (versionNumber) {
    parts.push(`Version ${versionNumber}`);
  }

  const formattedDate = formatDateTime(updatedAt);
  if (formattedDate) {
    parts.push(`Last edited ${formattedDate}`);
  }

  return parts.join(" · ");
}

function hasDraftProgress(formData: CVFormData | null) {
  if (!formData) {
    return false;
  }

  const education = formData.education ?? [];
  const workExperience = formData.workExperience ?? [];
  const certifications = formData.certifications ?? [];
  const skills = formData.skills ?? [];
  const languages = formData.languages ?? [];
  const refereeOne = formData.refereeOne ?? { name: "" };
  const refereeTwo = formData.refereeTwo ?? { name: "" };

  return Boolean(
    formData.fullName.trim() ||
      formData.phone.trim() ||
      formData.locationState.trim() ||
      formData.locationCity.trim() ||
      formData.dateOfBirth.trim() ||
      formData.industry.trim() ||
      formData.careerObjective.trim() ||
      skills.length > 0 ||
      languages.length > 0 ||
      education.some((item) => item.institution.trim() || item.course.trim() || item.year.trim()) ||
      workExperience.some(
        (item) => item.company.trim() || item.role.trim() || item.responsibilities.trim(),
      ) ||
      certifications.some((item) => item.name.trim() || item.issuer.trim() || item.year.trim()) ||
      refereeOne.name.trim() ||
      refereeTwo.name.trim(),
  );
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

function SummaryChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[10px] border border-[var(--border)] bg-[var(--card)] px-4 py-3">
      <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--mid)]">{label}</p>
      <p className="mt-2 font-heading text-3xl leading-none text-[var(--cream)]">{value}</p>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-[8px] border border-[var(--border)] bg-[var(--surface)] px-3 py-2">
      <p className="text-sm text-[var(--cream)]">{label}</p>
      <span className="font-mono text-xs text-[var(--cream-dim)]">{value}</span>
    </div>
  );
}
