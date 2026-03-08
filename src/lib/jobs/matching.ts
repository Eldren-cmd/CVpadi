import * as Sentry from "@sentry/nextjs";
import type { CVFormData } from "@/lib/cv/types";
import { extractEmailPreferences } from "@/lib/email/preferences";
import { sendJobsDigestEmail } from "@/lib/email/sequences";
import { createAdminClient } from "@/lib/supabase/admin";

const MINIMUM_MATCH_SCORE = 40;

interface ProfileRow {
  email: string;
  experience_level: string | null;
  full_name: string | null;
  id: string;
  industry: string | null;
  location_city: string | null;
  location_state: string | null;
}

interface CvRow {
  form_data: CVFormData;
  updated_at: string;
  user_id: string;
}

interface JobRow {
  company: string;
  currency: string | null;
  description: string | null;
  expires_at: string | null;
  experience_level: string | null;
  id: string;
  industry: string | null;
  location_city: string | null;
  location_state: string | null;
  required_skills: unknown;
  salary_max: number | null;
  salary_min: number | null;
  source_url: string | null;
  title: string;
}

interface ExistingMatchRow {
  applied: boolean;
  clicked: boolean;
  job_id: string;
  notified: boolean;
  user_id: string;
}

interface UserMatchProfile {
  email: string;
  experienceLevel: string;
  fullName: string;
  industry: string;
  locationCity: string;
  locationState: string;
  skills: string[];
  userId: string;
}

export interface JobDigestItem {
  company: string;
  locationLabel: string;
  matchScore: number;
  salaryLabel: string;
  sourceUrl: string | null;
  title: string;
}

export interface JobMatchSummary {
  emailsSent: number;
  matchesUpserted: number;
  usersProcessed: number;
  usersSkipped: number;
}

export async function processDailyJobMatches(limitUsers?: number): Promise<JobMatchSummary> {
  const supabase = createAdminClient();
  const summary: JobMatchSummary = {
    emailsSent: 0,
    matchesUpserted: 0,
    usersProcessed: 0,
    usersSkipped: 0,
  };
  const nowIso = new Date().toISOString();

  let profilesQuery = supabase
    .from("profiles")
    .select("id, email, full_name, industry, experience_level, location_city, location_state")
    .order("created_at", { ascending: true });

  if (limitUsers) {
    profilesQuery = profilesQuery.limit(limitUsers);
  }

  const [
    { data: profiles, error: profilesError },
    { data: cvs, error: cvsError },
    { data: jobs, error: jobsError },
    { data: existingMatches, error: existingMatchesError },
  ] = await Promise.all([
    profilesQuery,
    supabase
      .from("cvs")
      .select("user_id, form_data, updated_at")
      .order("updated_at", { ascending: false }),
    supabase
      .from("jobs")
      .select(
        "id, title, company, location_city, location_state, industry, experience_level, description, required_skills, salary_min, salary_max, currency, source_url, expires_at",
      )
      .eq("is_active", true)
      .order("created_at", { ascending: false }),
    supabase
      .from("job_matches")
      .select("user_id, job_id, notified, clicked, applied"),
  ]);

  if (profilesError) {
    throw new Error(profilesError.message);
  }

  if (cvsError) {
    throw new Error(cvsError.message);
  }

  if (jobsError) {
    throw new Error(jobsError.message);
  }

  if (existingMatchesError) {
    throw new Error(existingMatchesError.message);
  }

  const latestCvByUser = new Map<string, CvRow>();
  for (const cv of (cvs ?? []) as CvRow[]) {
    if (!latestCvByUser.has(cv.user_id)) {
      latestCvByUser.set(cv.user_id, cv);
    }
  }

  const existingMatchesByUser = new Map<string, ExistingMatchRow[]>();
  for (const match of (existingMatches ?? []) as ExistingMatchRow[]) {
    const group = existingMatchesByUser.get(match.user_id) ?? [];
    group.push(match);
    existingMatchesByUser.set(match.user_id, group);
  }

  for (const profile of (profiles ?? []) as ProfileRow[]) {
    summary.usersProcessed += 1;

    const latestCv = latestCvByUser.get(profile.id);
    const userProfile = buildUserMatchProfile(profile, latestCv?.form_data);
    const scoredMatches = ((jobs ?? []) as JobRow[])
      .filter((job) => isJobStillActive(job, nowIso))
      .map((job) => createScoredMatch(job, userProfile))
      .filter((match) => match.matchScore >= MINIMUM_MATCH_SCORE)
      .sort((left, right) => right.matchScore - left.matchScore);

    const existingRows = existingMatchesByUser.get(profile.id) ?? [];
    const existingRowMap = new Map(existingRows.map((row) => [row.job_id, row]));

    if (scoredMatches.length > 0) {
      const rows = scoredMatches.map((match) => {
        const existing = existingRowMap.get(match.jobId);

        return {
          applied: existing?.applied ?? false,
          clicked: existing?.clicked ?? false,
          job_id: match.jobId,
          match_score: match.matchScore,
          notified: existing?.notified ?? false,
          user_id: profile.id,
        };
      });

      const { error: upsertError } = await supabase
        .from("job_matches")
        .upsert(rows, { onConflict: "user_id,job_id" });

      if (upsertError) {
        throw new Error(upsertError.message);
      }

      summary.matchesUpserted += rows.length;
    }

    const activeJobIds = new Set(scoredMatches.map((match) => match.jobId));
    const staleMatchIds = existingRows
      .filter((row) => !row.applied && !row.clicked && !activeJobIds.has(row.job_id))
      .map((row) => row.job_id);

    if (staleMatchIds.length > 0) {
      const { error: deleteError } = await supabase
        .from("job_matches")
        .delete()
        .eq("user_id", profile.id)
        .in("job_id", staleMatchIds);

      if (deleteError) {
        throw new Error(deleteError.message);
      }
    }

    if (!profile.email || scoredMatches.length === 0) {
      summary.usersSkipped += 1;
      continue;
    }

    try {
      const authResult = await supabase.auth.admin.getUserById(profile.id);
      const preferences = extractEmailPreferences(authResult.data.user?.user_metadata);

      if (!shouldSendDailyDigest(preferences, new Date())) {
        summary.usersSkipped += 1;
        continue;
      }

      const topMatches = scoredMatches.slice(0, 3);

      await sendJobsDigestEmail({
        buildUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? "https://cvpadi.com"}/build`,
        email: profile.email,
        fullName: profile.full_name ?? userProfile.fullName,
        jobs: topMatches.map((match) => match.digestItem),
      });

      const { error: notifyError } = await supabase
        .from("job_matches")
        .update({ notified: true })
        .eq("user_id", profile.id)
        .in(
          "job_id",
          topMatches.map((match) => match.jobId),
        );

      if (notifyError) {
        throw new Error(notifyError.message);
      }

      summary.emailsSent += 1;
    } catch (error) {
      Sentry.withScope((scope) => {
        scope.setTag("user_id", profile.id);
        scope.setTag("jobs_digest", "send_failed");
        Sentry.captureException(error);
      });
      summary.usersSkipped += 1;
    }
  }

  return summary;
}

function buildUserMatchProfile(profile: ProfileRow, formData?: CVFormData): UserMatchProfile {
  const mergedSkills = dedupeValues([
    ...(formData?.aiSuggestedSkills ?? []),
    ...(formData?.skills ?? []),
  ]);

  return {
    email: profile.email,
    experienceLevel: normalizeValue(formData?.experienceLevel || profile.experience_level || ""),
    fullName: formData?.fullName || profile.full_name || "",
    industry: normalizeValue(formData?.industry || profile.industry || ""),
    locationCity: normalizeValue(formData?.locationCity || profile.location_city || ""),
    locationState: normalizeValue(formData?.locationState || profile.location_state || ""),
    skills: mergedSkills.map((skill) => normalizeValue(skill)).filter(Boolean),
    userId: profile.id,
  };
}

function createScoredMatch(job: JobRow, userProfile: UserMatchProfile) {
  const industryMatch = exactMatch(userProfile.industry, job.industry) ? 30 : 0;
  const locationMatch = getLocationMatchScore(userProfile, job);
  const experienceMatch = exactMatch(userProfile.experienceLevel, job.experience_level) ? 25 : 0;
  const skillsMatch = getSkillsMatchScore(userProfile.skills, parseSkills(job.required_skills));
  const matchScore = industryMatch + locationMatch + experienceMatch + skillsMatch;

  return {
    digestItem: {
      company: job.company,
      locationLabel: compactLocation(job.location_city, job.location_state),
      matchScore,
      salaryLabel: formatSalary(job.salary_min, job.salary_max, job.currency),
      sourceUrl: job.source_url,
      title: job.title,
    } satisfies JobDigestItem,
    jobId: job.id,
    matchScore,
  };
}

function getLocationMatchScore(userProfile: UserMatchProfile, job: JobRow) {
  if (
    exactMatch(userProfile.locationState, job.location_state)
    || exactMatch(userProfile.locationCity, job.location_city)
  ) {
    return 25;
  }

  return 0;
}

function getSkillsMatchScore(userSkills: string[], requiredSkills: string[]) {
  if (userSkills.length === 0 || requiredSkills.length === 0) {
    return 0;
  }

  const userSkillSet = new Set(userSkills);
  const overlapCount = requiredSkills.filter((skill) => userSkillSet.has(skill)).length;

  if (overlapCount === 0) {
    return 0;
  }

  return Math.min(20, Math.round((overlapCount / requiredSkills.length) * 20));
}

function parseSkills(raw: unknown) {
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw
    .map((value) => normalizeValue(String(value)))
    .filter(Boolean);
}

function dedupeValues(values: string[]) {
  const seen = new Set<string>();
  const deduped: string[] = [];

  for (const value of values) {
    const trimmed = value.trim();
    const key = trimmed.toLowerCase();

    if (!trimmed || seen.has(key)) {
      continue;
    }

    seen.add(key);
    deduped.push(trimmed);
  }

  return deduped;
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

function compactLocation(city: string | null, state: string | null) {
  return [city, state].filter(Boolean).join(", ") || "Location not listed";
}

function isJobStillActive(job: JobRow, nowIso: string) {
  return !job.expires_at || job.expires_at > nowIso;
}

function exactMatch(left: string, right: string | null) {
  return Boolean(left) && Boolean(right) && normalizeValue(left) === normalizeValue(right || "");
}

function normalizeValue(value: string) {
  return value.trim().toLowerCase();
}

function shouldSendDailyDigest(
  preferences: ReturnType<typeof extractEmailPreferences>,
  now: Date,
) {
  if (preferences.unsubscribeAll) {
    return false;
  }

  if (preferences.frequency === "less_often") {
    // A lightweight weekly compromise until the dashboard-level notification controls land.
    return now.getUTCDay() === 1;
  }

  return true;
}

