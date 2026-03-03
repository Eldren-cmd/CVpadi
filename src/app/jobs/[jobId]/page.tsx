import type { Metadata } from "next";
import { JobDetailsPanel } from "@/components/jobs/job-details-panel";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  description:
    "Authenticated job details for your matched CVPadi opportunities, with scraping guardrails in place.",
  title: "Job Details | CVPadi",
};

export default async function JobDetailsPage({
  params,
}: {
  params: { jobId: string };
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(`/jobs/${params.jobId}`)}`);
  }

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 sm:py-8">
      <div className="mx-auto max-w-6xl">
        <JobDetailsPanel jobId={params.jobId} />
      </div>
    </main>
  );
}
