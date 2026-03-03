"use client";

import { startTransition, useMemo, useState } from "react";
import {
  createApplicationAction,
  updateApplicationStatusAction,
} from "@/app/dashboard/tracker/actions";
import { formatKoboToNaira, PAYMENT_PRICES_KOBO } from "@/lib/payments/constants";
import {
  TRACKER_STATUSES,
  TRACKER_STATUS_META,
  type TrackerApplication,
  type TrackerStatus,
} from "@/lib/tracker/constants";

export function ApplicationTracker({
  initialApplications,
}: {
  initialApplications: TrackerApplication[];
}) {
  const [applications, setApplications] = useState(initialApplications);
  const [errorMessage, setErrorMessage] = useState("");
  const [infoMessage, setInfoMessage] = useState("");
  const [interviewCompany, setInterviewCompany] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingApplicationId, setPendingApplicationId] = useState<string | null>(null);

  const groupedApplications = useMemo(() => {
    return TRACKER_STATUSES.reduce(
      (accumulator, status) => {
        accumulator[status] = applications.filter((application) => application.status === status);
        return accumulator;
      },
      {} as Record<TrackerStatus, TrackerApplication[]>,
    );
  }, [applications]);

  async function handleCreateApplication(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setInfoMessage("");
    setIsSubmitting(true);

    const form = event.currentTarget;
    const formData = new FormData(form);

    startTransition(async () => {
      const result = await createApplicationAction({
        company: String(formData.get("company") || ""),
        dateApplied: String(formData.get("dateApplied") || ""),
        notes: String(formData.get("notes") || ""),
        role: String(formData.get("role") || ""),
        source: String(formData.get("source") || ""),
      });

      if (result.error) {
        setErrorMessage(result.error);
        setIsSubmitting(false);
        return;
      }

      const createdApplication = result.application;

      if (createdApplication) {
        setApplications((current) => [createdApplication, ...current]);
        setInfoMessage("Application added to Applied.");
        form.reset();
      }

      setIsSubmitting(false);
    });
  }

  function handleMoveApplication(application: TrackerApplication, status: TrackerStatus) {
    setErrorMessage("");
    setInfoMessage("");
    setPendingApplicationId(application.id);

    startTransition(async () => {
      const result = await updateApplicationStatusAction({
        id: application.id,
        status,
      });

      if (result.error) {
        setErrorMessage(result.error);
        setPendingApplicationId(null);
        return;
      }

      const updatedApplication = result.application;

      if (updatedApplication) {
        setApplications((current) =>
          current.map((entry) =>
            entry.id === updatedApplication.id ? updatedApplication : entry,
          ),
        );
        setInfoMessage(
          `${updatedApplication.company} moved to ${TRACKER_STATUS_META[updatedApplication.status].label}.`,
        );
        if (updatedApplication.status === "interview") {
          setInterviewCompany(updatedApplication.company);
        } else if (application.status === "interview") {
          setInterviewCompany(null);
        }
      }

      setPendingApplicationId(null);
    });
  }

  const activeInterviewCompany =
    interviewCompany ?? groupedApplications.interview[0]?.company ?? null;

  return (
    <div className="grid gap-6">
      <section className="rounded-[var(--radius-card)] border border-border bg-surface p-5 shadow-[var(--shadow-card)] sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="font-mono text-sm uppercase tracking-[0.28em] text-[var(--ink-light)]">
              F4 - Application Tracker
            </p>
            <h1 className="mt-2 font-heading text-4xl leading-tight text-foreground sm:text-5xl">
              Track job applications without leaving CVPadi.
            </h1>
          </div>
          <span className="inline-flex min-h-11 items-center rounded-full bg-[var(--accent-light)] px-4 text-sm font-medium text-[var(--accent)]">
            Free for registered users
          </span>
        </div>

        <p className="mt-4 max-w-3xl text-base leading-7 text-[var(--ink-light)] sm:text-lg">
          Manual entry is enough for Phase 1. Log where you applied, move cards across the
          board, and use the interview moment as the cue to refresh your CV.
        </p>

        {activeInterviewCompany ? (
          <div className="mt-5 rounded-[var(--radius-input)] border border-[var(--gold)] bg-[var(--gold-light)] px-4 py-4 text-sm leading-6 text-foreground">
            Heading to an interview at {activeInterviewCompany}? Is your CV up to date?
            <a className="ml-2 font-medium text-[var(--accent)]" href="/build">
              Edit CV
            </a>
            <span className="block pt-2 text-[var(--ink-light)]">
              This is the highest-intent moment for the {formatKoboToNaira(PAYMENT_PRICES_KOBO.cv_redownload)} re-download.
            </span>
          </div>
        ) : null}

        {errorMessage ? (
          <p className="mt-5 rounded-[var(--radius-input)] border border-[var(--red)] bg-[var(--red-light)] px-4 py-3 text-sm text-[var(--red)]">
            {errorMessage}
          </p>
        ) : null}

        {infoMessage ? (
          <p className="mt-5 rounded-[var(--radius-input)] border border-[var(--green)] bg-[var(--green-light)] px-4 py-3 text-sm text-[var(--green)]">
            {infoMessage}
          </p>
        ) : null}
      </section>

      <section className="rounded-[var(--radius-card)] border border-border bg-surface p-5 shadow-[var(--shadow-card)] sm:p-6">
        <h2 className="font-heading text-2xl text-foreground">Add an application</h2>
        <form className="mt-4 grid gap-4" onSubmit={handleCreateApplication}>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2 text-sm text-foreground">
              <span>Company</span>
              <input
                className="min-h-12 rounded-[var(--radius-input)] border border-border bg-white px-4"
                name="company"
                placeholder="e.g. Dangote Group"
                required
                type="text"
              />
            </label>
            <label className="grid gap-2 text-sm text-foreground">
              <span>Role</span>
              <input
                className="min-h-12 rounded-[var(--radius-input)] border border-border bg-white px-4"
                name="role"
                placeholder="e.g. Marketing Associate"
                required
                type="text"
              />
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2 text-sm text-foreground">
              <span>Date applied</span>
              <input
                className="min-h-12 rounded-[var(--radius-input)] border border-border bg-white px-4"
                name="dateApplied"
                type="date"
              />
            </label>
            <label className="grid gap-2 text-sm text-foreground">
              <span>Source</span>
              <input
                className="min-h-12 rounded-[var(--radius-input)] border border-border bg-white px-4"
                name="source"
                placeholder="LinkedIn, referral, careers page"
                type="text"
              />
            </label>
          </div>

          <label className="grid gap-2 text-sm text-foreground">
            <span>Notes</span>
            <textarea
              className="min-h-32 rounded-[var(--radius-input)] border border-border bg-white px-4 py-3"
              name="notes"
              placeholder="Recruiter name, interview time, salary range, or follow-up notes."
            />
          </label>

          <button
            className="inline-flex min-h-12 items-center justify-center rounded-[var(--radius-input)] bg-[var(--accent)] px-5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? "Saving..." : "Add to Applied"}
          </button>
        </form>
      </section>

      <section className="grid gap-4 xl:grid-cols-4">
        {TRACKER_STATUSES.map((status) => (
          <div
            className="rounded-[var(--radius-card)] border border-border bg-surface p-4 shadow-[var(--shadow-card)]"
            key={status}
          >
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-heading text-2xl text-foreground">
                {TRACKER_STATUS_META[status].label}
              </h2>
              <span
                className={`inline-flex min-h-10 items-center rounded-full px-3 text-sm font-medium ${TRACKER_STATUS_META[status].accentClassName}`}
              >
                {groupedApplications[status].length}
              </span>
            </div>

            <div className="mt-4 grid gap-3">
              {groupedApplications[status].length > 0 ? (
                groupedApplications[status].map((application) => (
                  <article
                    className="rounded-[var(--radius-input)] border border-[var(--border-light)] bg-white/80 p-4"
                    key={application.id}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-heading text-xl text-foreground">
                          {application.company}
                        </h3>
                        <p className="mt-1 text-sm leading-6 text-[var(--ink-light)]">
                          {application.role}
                        </p>
                      </div>
                      <span
                        className={`inline-flex min-h-9 items-center rounded-full px-3 text-xs font-medium ${TRACKER_STATUS_META[application.status].accentClassName}`}
                      >
                        {TRACKER_STATUS_META[application.status].label}
                      </span>
                    </div>

                    <dl className="mt-3 grid gap-2 text-sm leading-6 text-[var(--ink-light)]">
                      <div>
                        <dt className="font-medium text-foreground">Date applied</dt>
                        <dd>{formatDate(application.dateApplied, application.createdAt)}</dd>
                      </div>
                      <div>
                        <dt className="font-medium text-foreground">Source</dt>
                        <dd>{application.source || "Manual entry"}</dd>
                      </div>
                      {application.notes ? (
                        <div>
                          <dt className="font-medium text-foreground">Notes</dt>
                          <dd>{application.notes}</dd>
                        </div>
                      ) : null}
                    </dl>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {getStatusActions(application.status).map((nextStatus) => (
                        <button
                          className="inline-flex min-h-10 items-center justify-center rounded-[var(--radius-input)] border border-border px-3 text-xs font-medium text-foreground disabled:cursor-not-allowed disabled:opacity-60"
                          disabled={pendingApplicationId === application.id}
                          key={nextStatus}
                          onClick={() => handleMoveApplication(application, nextStatus)}
                          type="button"
                        >
                          Move to {TRACKER_STATUS_META[nextStatus].label}
                        </button>
                      ))}
                    </div>
                  </article>
                ))
              ) : (
                <div className="rounded-[var(--radius-input)] border border-dashed border-[var(--border-light)] bg-[var(--bg)] px-4 py-5 text-sm leading-6 text-[var(--ink-light)]">
                  {TRACKER_STATUS_META[status].emptyState}
                </div>
              )}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}

function getStatusActions(status: TrackerStatus) {
  switch (status) {
    case "applied":
      return ["interview", "rejected"] satisfies TrackerStatus[];
    case "interview":
      return ["offer", "rejected"] satisfies TrackerStatus[];
    case "rejected":
      return ["applied"] satisfies TrackerStatus[];
    case "offer":
      return ["interview"] satisfies TrackerStatus[];
    default:
      return [] satisfies TrackerStatus[];
  }
}

function formatDate(dateApplied: string | null, createdAt: string) {
  const value = dateApplied || createdAt;
  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return "Not set";
  }

  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(parsed);
}
