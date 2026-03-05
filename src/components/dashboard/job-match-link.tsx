"use client";

interface JobMatchLinkProps {
  jobId: string;
}

export function JobMatchLink({ jobId }: JobMatchLinkProps) {
  return (
    <a
      className="inline-flex min-h-10 items-center justify-center rounded-[8px] bg-[var(--green)] px-4 font-display text-sm text-[var(--black)] transition-all duration-200 hover:translate-y-[-2px] hover:bg-[#33EE8A]"
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
