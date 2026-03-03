"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface JobDetails {
  company: string;
  currency: string;
  description: string;
  experienceLevel: string;
  id: string;
  industry: string;
  locationCity: string;
  locationState: string;
  requiredSkills: string[];
  salaryMax: number | null;
  salaryMin: number | null;
  sourceUrl: string | null;
  title: string;
}

export function JobDetailsPanel({ jobId }: { jobId: string }) {
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [job, setJob] = useState<JobDetails | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadJob() {
      setIsLoading(true);
      setErrorMessage("");

      const response = await fetch(`/api/jobs/${jobId}`, {
        cache: "no-store",
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;

        if (!cancelled) {
          setErrorMessage(payload?.error ?? "Unable to load this job right now.");
          setIsLoading(false);
        }
        return;
      }

      const payload = (await response.json()) as JobDetails;

      if (!cancelled) {
        setJob(payload);
        setIsLoading(false);
      }
    }

    void loadJob();

    return () => {
      cancelled = true;
    };
  }, [jobId]);

  if (isLoading) {
    return (
      <section className="rounded-[var(--radius-card)] border border-border bg-surface p-6 shadow-[var(--shadow-card)]">
        <p className="text-sm leading-6 text-[var(--ink-light)]">Loading job details...</p>
      </section>
    );
  }

  if (!job) {
    return (
      <section className="rounded-[var(--radius-card)] border border-border bg-surface p-6 shadow-[var(--shadow-card)]">
        <p className="text-sm leading-6 text-[var(--red)]">{errorMessage || "Job not found."}</p>
        <Link className="mt-4 inline-flex text-sm font-medium text-[var(--accent)]" href="/dashboard#jobs">
          Back to job matches
        </Link>
      </section>
    );
  }

  return (
    <div className="grid gap-6">
      <section className="rounded-[var(--radius-card)] border border-border bg-surface p-6 shadow-[var(--shadow-elevated)] sm:p-8">
        <p className="font-mono text-sm uppercase tracking-[0.28em] text-[var(--ink-light)]">
          Authenticated job details
        </p>
        <h1 className="mt-3 font-heading text-4xl leading-tight text-foreground sm:text-5xl">
          {job.title}
        </h1>
        <p className="mt-4 text-base leading-7 text-[var(--ink-light)] sm:text-lg">
          {job.company} • {formatLocation(job.locationCity, job.locationState)}
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <InfoBadge label={job.industry || "Industry not listed"} />
          <InfoBadge label={job.experienceLevel || "Level not listed"} />
          <InfoBadge label={formatSalary(job.salaryMin, job.salaryMax, job.currency)} />
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <article className="rounded-[var(--radius-card)] border border-border bg-surface p-6 shadow-[var(--shadow-card)]">
          <h2 className="font-heading text-3xl text-foreground">Role summary</h2>
          <p className="mt-4 whitespace-pre-line text-sm leading-7 text-[var(--ink-light)]">
            {job.description || "The source page did not expose a detailed description yet."}
          </p>
        </article>

        <article className="rounded-[var(--radius-card)] border border-border bg-surface p-6 shadow-[var(--shadow-card)]">
          <h2 className="font-heading text-3xl text-foreground">Required skills</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {job.requiredSkills.length > 0 ? (
              job.requiredSkills.map((skill) => (
                <span
                  className="inline-flex min-h-10 items-center rounded-full bg-[var(--blue-light)] px-3 text-sm font-medium text-[var(--blue)]"
                  key={skill}
                >
                  {skill}
                </span>
              ))
            ) : (
              <p className="text-sm leading-6 text-[var(--ink-light)]">
                No skill list was exposed by the source page.
              </p>
            )}
          </div>

          <div className="mt-6 flex flex-col gap-3">
            {job.sourceUrl ? (
              <a
                className="inline-flex min-h-12 items-center justify-center rounded-[var(--radius-input)] bg-[var(--accent)] px-5 text-sm font-medium text-white"
                href={job.sourceUrl}
                rel="noreferrer"
                target="_blank"
              >
                Continue to employer source
              </a>
            ) : null}
            <Link
              className="inline-flex min-h-12 items-center justify-center rounded-[var(--radius-input)] border border-border px-5 text-sm font-medium text-foreground"
              href="/dashboard#jobs"
            >
              Back to dashboard
            </Link>
          </div>
        </article>
      </section>
    </div>
  );
}

function formatLocation(city: string, state: string) {
  return [city, state].filter(Boolean).join(", ") || "Location not listed";
}

function formatSalary(min: number | null, max: number | null, currency: string) {
  const formatter = new Intl.NumberFormat("en-NG", {
    currency,
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

function InfoBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex min-h-10 items-center rounded-full bg-[var(--accent-light)] px-3 text-sm font-medium text-[var(--accent)]">
      {label}
    </span>
  );
}
