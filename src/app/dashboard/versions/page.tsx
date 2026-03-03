import type { Metadata } from "next";
import Link from "next/link";
import { forkCvVersionAction } from "@/app/dashboard/versions/actions";
import type { CVFormData } from "@/lib/cv/types";
import { formatKoboToNaira, PAYMENT_PRICES_KOBO } from "@/lib/payments/constants";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

interface CvRow {
  branch_id: string;
  created_at: string;
  form_data: CVFormData | null;
  id: string;
  is_paid: boolean;
  is_snapshot: boolean;
  source_cv_id: string | null;
  updated_at: string;
  version_number: number;
}

interface BranchTimeline {
  current: CvRow;
  versions: CvRow[];
}

export const metadata: Metadata = {
  description:
    "See CV version history, compare current branches, and fork older versions into new payable CV branches.",
  title: "CV Versions | CVPadi",
};

export default async function VersionsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/dashboard/versions");
  }

  const { data, error } = await supabase
    .from("cvs")
    .select("id, branch_id, source_cv_id, version_number, is_snapshot, is_paid, form_data, updated_at, created_at")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data ?? []) as CvRow[];
  const timelines = buildTimelines(rows);

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 sm:py-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <section className="rounded-[var(--radius-card)] border border-border bg-surface p-6 shadow-[var(--shadow-elevated)] sm:p-8">
          <p className="font-mono text-sm uppercase tracking-[0.28em] text-[var(--ink-light)]">
            F7 - CV Version History and Forking
          </p>
          <h1 className="mt-3 max-w-3xl font-heading text-4xl leading-tight text-foreground sm:text-5xl">
            Version history turns one CV into multiple monetizable branches.
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-[var(--ink-light)] sm:text-lg">
            Every builder save now writes an immutable version snapshot. You can fork any
            saved version into a new CV branch for a different industry or employer, and each
            fork still follows the {formatKoboToNaira(PAYMENT_PRICES_KOBO.cv_redownload)} download model.
          </p>
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          <InfoCard
            body="The active branch stays stable for payment and delivery while older states remain visible in the timeline."
            title="Stable builder flow"
          />
          <InfoCard
            body="Forking is free because it only creates a new draft branch. The monetization point remains the paid download."
            title="Zero-cost branching"
          />
          <InfoCard
            body="This is useful for tailoring one CV toward different industries, employers, or seniority levels."
            title="Tailoring leverage"
          />
        </section>

        {timelines.length > 0 ? (
          <section className="grid gap-4">
            {timelines.map((timeline) => (
              <article
                className="rounded-[var(--radius-card)] border border-border bg-surface p-5 shadow-[var(--shadow-card)] sm:p-6"
                key={timeline.current.id}
              >
                <div className="flex flex-col gap-4 border-b border-[var(--border-light)] pb-5 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="font-heading text-3xl text-foreground">
                        {timeline.current.form_data?.fullName || "Untitled CV branch"}
                      </h2>
                      <span className="inline-flex min-h-10 items-center rounded-full bg-[var(--accent-light)] px-3 text-sm font-medium text-[var(--accent)]">
                        Current branch
                      </span>
                      <span
                        className={`inline-flex min-h-10 items-center rounded-full px-3 text-sm font-medium ${
                          timeline.current.is_paid
                            ? "bg-[var(--green-light)] text-[var(--green)]"
                            : "bg-[var(--gold-light)] text-[var(--gold)]"
                        }`}
                      >
                        {timeline.current.is_paid ? "Paid" : "Unpaid"}
                      </span>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-[var(--ink-light)]">
                      {timeline.current.form_data?.industry || "General"} CV branch. Current version is v
                      {timeline.current.version_number}. Last updated {formatDate(timeline.current.updated_at)}.
                    </p>
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Link
                      className="inline-flex min-h-12 items-center justify-center rounded-[var(--radius-input)] bg-[var(--accent)] px-5 text-sm font-medium text-white"
                      href={`/build?cv=${timeline.current.id}`}
                    >
                      Open current branch
                    </Link>
                    <form action={forkCvVersionAction}>
                      <input name="sourceCvId" type="hidden" value={timeline.current.id} />
                      <button
                        className="inline-flex min-h-12 items-center justify-center rounded-[var(--radius-input)] border border-border px-5 text-sm font-medium text-foreground"
                        type="submit"
                      >
                        Fork current version
                      </button>
                    </form>
                  </div>
                </div>

                <div className="mt-5 grid gap-3">
                  {timeline.versions.map((version) => (
                    <div
                      className="rounded-[var(--radius-input)] border border-[var(--border-light)] bg-white/70 p-4"
                      key={version.id}
                    >
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-3">
                            <p className="font-heading text-2xl text-foreground">
                              Version {version.version_number}
                            </p>
                            {version.is_snapshot ? (
                              <span className="inline-flex min-h-9 items-center rounded-full bg-[var(--bg)] px-3 text-xs font-medium text-[var(--ink-light)]">
                                Snapshot
                              </span>
                            ) : (
                              <span className="inline-flex min-h-9 items-center rounded-full bg-[var(--accent-light)] px-3 text-xs font-medium text-[var(--accent)]">
                                Current
                              </span>
                            )}
                            {version.source_cv_id ? (
                              <span className="inline-flex min-h-9 items-center rounded-full bg-[var(--blue-light)] px-3 text-xs font-medium text-[var(--blue)]">
                                Derived branch
                              </span>
                            ) : null}
                          </div>
                          <p className="mt-2 text-sm leading-6 text-[var(--ink-light)]">
                            {version.form_data?.industry || "General"} - {formatDate(version.updated_at)}
                          </p>
                          <p className="mt-2 text-sm leading-6 text-[var(--ink-light)]">
                            Score-ready role framing, summary, and data for this version remain preserved.
                          </p>
                        </div>

                        <div className="flex flex-col gap-3 sm:flex-row">
                          {!version.is_snapshot ? (
                            <Link
                              className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-input)] border border-border px-4 text-sm font-medium text-foreground"
                              href={`/build?cv=${version.id}`}
                            >
                              Open branch
                            </Link>
                          ) : null}
                          <form action={forkCvVersionAction}>
                            <input name="sourceCvId" type="hidden" value={version.id} />
                            <button
                              className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-input)] border border-border px-4 text-sm font-medium text-foreground"
                              type="submit"
                            >
                              Fork this version
                            </button>
                          </form>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </section>
        ) : (
          <section className="rounded-[var(--radius-card)] border border-border bg-surface p-5 shadow-[var(--shadow-card)] sm:p-6">
            <p className="text-sm leading-6 text-[var(--ink-light)]">
              No CV branches yet. Start in the builder and the version timeline will appear here.
            </p>
          </section>
        )}
      </div>
    </main>
  );
}

function buildTimelines(rows: CvRow[]) {
  const currentRows = rows
    .filter((row) => !row.is_snapshot)
    .sort((left, right) => compareDates(right.updated_at, left.updated_at));

  return currentRows.map((current) => {
    const versions = rows
      .filter((row) => row.branch_id === current.branch_id)
      .sort((left, right) => right.version_number - left.version_number);

    return {
      current,
      versions,
    } satisfies BranchTimeline;
  });
}

function compareDates(left: string, right: string) {
  return new Date(left).getTime() - new Date(right).getTime();
}

function formatDate(value: string) {
  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return "Unknown date";
  }

  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(parsed);
}

function InfoCard({ body, title }: { body: string; title: string }) {
  return (
    <article className="rounded-[var(--radius-card)] border border-border bg-surface p-5 shadow-[var(--shadow-card)]">
      <h2 className="font-heading text-2xl text-foreground">{title}</h2>
      <p className="mt-3 text-sm leading-6 text-[var(--ink-light)]">{body}</p>
    </article>
  );
}
