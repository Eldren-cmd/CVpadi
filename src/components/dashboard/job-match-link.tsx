"use client";

interface JobMatchLinkProps {
  jobId: string;
}

export function JobMatchLink({ jobId }: JobMatchLinkProps) {
  return (
    <a
      className="inline-flex min-h-10 items-center justify-center rounded-[var(--radius-input)] bg-[var(--accent)] px-4 text-sm font-medium text-white"
      href={`/jobs/${jobId}`}
      onClick={() => {
        void fetch("/api/job-matches/click", {
          body: JSON.stringify({ jobId }),
          headers: {
            "Content-Type": "application/json",
          },
          keepalive: true,
          method: "POST",
        });
      }}
      rel="noreferrer"
    >
      View job
    </a>
  );
}
