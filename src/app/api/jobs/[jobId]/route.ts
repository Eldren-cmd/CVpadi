import { createAdminClient } from "@/lib/supabase/admin";
import { consumeRateLimit, getClientIp } from "@/lib/security/rate-limit";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: { jobId: string } },
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const headers = request.headers;
  const ipAddress = getClientIp(headers);
  const rateLimit = consumeRateLimit({
    key: `job-detail:${ipAddress}`,
    limit: 10,
    windowMs: 60 * 1000,
  });

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many job detail requests. Try again shortly." },
      {
        headers: {
          "Retry-After": String(Math.ceil((rateLimit.resetAt - Date.now()) / 1000)),
        },
        status: 429,
      },
    );
  }

  const [{ data: match, error: matchError }, { data: job, error: jobError }] = await Promise.all([
    supabase
      .from("job_matches")
      .select("job_id")
      .eq("user_id", user.id)
      .eq("job_id", params.jobId)
      .maybeSingle(),
    supabase
      .from("jobs")
      .select(
        "id, title, company, location_city, location_state, industry, experience_level, description, required_skills, salary_min, salary_max, currency, source_url, is_honeypot",
      )
      .eq("id", params.jobId)
      .maybeSingle(),
  ]);

  if (matchError) {
    return NextResponse.json({ error: matchError.message }, { status: 500 });
  }

  if (jobError) {
    return NextResponse.json({ error: jobError.message }, { status: 500 });
  }

  if (!match || !job) {
    return NextResponse.json({ error: "Job not found." }, { status: 404 });
  }

  if (job.is_honeypot) {
    await flagSuspiciousJobAccess({
      jobId: job.id,
      reason: "honeypot_job_clicked",
      userId: user.id,
    });

    return NextResponse.json({ error: "Job not found." }, { status: 404 });
  }

  return NextResponse.json({
    company: job.company,
    currency: job.currency ?? "NGN",
    description: job.description ?? "",
    experienceLevel: job.experience_level ?? "",
    id: job.id,
    industry: job.industry ?? "",
    locationCity: job.location_city ?? "",
    locationState: job.location_state ?? "",
    requiredSkills: Array.isArray(job.required_skills)
      ? job.required_skills.filter((value): value is string => typeof value === "string")
      : [],
    salaryMax: job.salary_max,
    salaryMin: job.salary_min,
    sourceUrl: job.source_url,
    title: job.title,
  });
}

async function flagSuspiciousJobAccess({
  jobId,
  reason,
  userId,
}: {
  jobId: string;
  reason: string;
  userId: string;
}) {
  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("job_access_flag_count")
    .eq("id", userId)
    .maybeSingle();

  await admin
    .from("profiles")
    .update({
      job_access_flag_count: (profile?.job_access_flag_count ?? 0) + 1,
      job_access_flag_reason: reason,
      job_access_flagged_at: new Date().toISOString(),
      job_access_last_flagged_job_id: jobId,
    })
    .eq("id", userId);
}
