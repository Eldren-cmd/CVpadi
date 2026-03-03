"use client";

interface JobMatchLinkProps {
  jobId: string;
  sourceUrl: string;
}

export function JobMatchLink({ jobId, sourceUrl }: JobMatchLinkProps) {
  return (
    <a
      className="inline-flex min-h-10 items-center justify-center rounded-[var(--radius-input)] bg-[var(--accent)] px-4 text-sm font-medium text-white"
      href={sourceUrl}
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
      target="_blank"
    >
      View job
    </a>
  );
}
