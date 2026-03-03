import { createClient } from "jsr:@supabase/supabase-js@2";

type ExperienceLevel = "entry" | "mid" | "senior" | "executive";

type ScrapedJobRow = {
  company: string;
  created_at?: string;
  currency: string;
  description: string | null;
  experience_level: ExperienceLevel | null;
  expires_at: string | null;
  industry: string | null;
  is_active: boolean;
  is_verified: boolean;
  location_city: string | null;
  location_state: string | null;
  required_skills: string[];
  salary_max: number | null;
  salary_min: number | null;
  scraped_at: string;
  source_type: "scraped";
  source_url: string;
  title: string;
};

type JobSourceRow = {
  careers_url: string;
  company: string;
  consecutive_failures: number | null;
  id: string;
  industry: string | null;
  is_active: boolean;
  last_scrape_status: "success" | "failed" | "url_changed" | "pending" | null;
  location_state: string | null;
  scrape_selector: string | null;
  source_tier: "stable" | "corporate" | "ngo" | "startup";
};

type CorporateSourceConfig = {
  company: string;
  industry?: string;
  locationState?: string;
  url: string;
};

type UnifiedSource = {
  company: string;
  consecutiveFailures: number;
  id: string | null;
  industry: string | null;
  locationState: string | null;
  name: string;
  scrapeSelector: string | null;
  sourceTier: "stable" | "corporate" | "ngo" | "startup";
  url: string;
};

const SUPABASE_URL =
  Deno.env.get("SUPABASE_URL") || Deno.env.get("NEXT_PUBLIC_SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const JOB_SCRAPER_SOURCES_JSON = Deno.env.get("JOB_SCRAPER_SOURCES_JSON");
const SENTRY_DSN = Deno.env.get("SENTRY_DSN");
const USER_AGENT = "cvpadi-job-scraper/2.0";

const BANNED_DOMAIN_SUFFIXES = [
  "jobberman.com",
  "linkedin.com",
  "indeed.com",
];

const APPROVED_DOMAIN_SUFFIXES = [
  "gtbank.com",
  "mtn.ng",
  "firstbanknigeria.com",
  "dangote.com",
  "pwc.com",
  "kpmg.com",
  "deloitte.com",
  "ey.com",
  "nestle-cwa.com",
  "shell.com.ng",
  "totalenergies.com",
  "cbn.gov.ng",
  "firs.gov.ng",
  "nnpcgroup.com",
  "reliefweb.int",
  "devjobsafrica.org",
  "cvpadi.com",
];

const NIGERIAN_STATES = [
  "Abia",
  "Adamawa",
  "Akwa Ibom",
  "Anambra",
  "Bauchi",
  "Bayelsa",
  "Benue",
  "Borno",
  "Cross River",
  "Delta",
  "Ebonyi",
  "Edo",
  "Ekiti",
  "Enugu",
  "Gombe",
  "Imo",
  "Jigawa",
  "Kaduna",
  "Kano",
  "Katsina",
  "Kebbi",
  "Kogi",
  "Kwara",
  "Lagos",
  "Nasarawa",
  "Niger",
  "Ogun",
  "Ondo",
  "Osun",
  "Oyo",
  "Plateau",
  "Rivers",
  "Sokoto",
  "Taraba",
  "Yobe",
  "Zamfara",
  "Abuja",
  "Abuja (FCT)",
];

Deno.serve(async () => {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return jsonResponse(
      { error: "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required." },
      500,
    );
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const scrapeStartedAt = new Date().toISOString();
  const skippedSources: Array<{ name: string; reason: string }> = [];
  const importedJobs: ScrapedJobRow[] = [];

  const stableSources = await loadStableSources(supabase);
  const corporateSources = getCorporateSources();
  const allSources = [...stableSources, ...corporateSources];

  for (const source of allSources) {
    const url = source.url;

    try {
      validateSourceUrl(url);

      const isAlive = await verifyUrl(url);
      if (!isAlive) {
        skippedSources.push({
          name: source.name,
          reason: "URL verification failed or no longer looks like a careers page.",
        });
        await recordSourceFailure(supabase, source, "url_changed", url);
        continue;
      }

      const jobs = await fetchHtmlSourceJobs(source);
      importedJobs.push(...jobs);

      await recordSourceSuccess(supabase, source);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Source import failed.";
      skippedSources.push({
        name: source.name,
        reason: message,
      });
      await recordSourceFailure(supabase, source, "failed", url, error);
    }
  }

  const dedupedJobs = Array.from(
    new Map(
      importedJobs
        .filter((job) => Boolean(job.source_url))
        .map((job) => [job.source_url, job]),
    ).values(),
  );

  if (dedupedJobs.length === 0) {
    return jsonResponse({
      imported: 0,
      message: "No jobs were imported.",
      skippedSources,
      startedAt: scrapeStartedAt,
    });
  }

  const { data, error } = await supabase
    .from("jobs")
    .upsert(dedupedJobs, { ignoreDuplicates: false, onConflict: "source_url" })
    .select("id");

  if (error) {
    await captureSentryException(new Error(error.message), {
      importedAttemptCount: dedupedJobs.length,
      stage: "jobs_upsert",
    });

    return jsonResponse(
      {
        error: error.message,
        skippedSources,
        startedAt: scrapeStartedAt,
      },
      500,
    );
  }

  return jsonResponse({
    imported: data?.length ?? dedupedJobs.length,
    skippedSources,
    startedAt: scrapeStartedAt,
  });
});

async function loadStableSources(supabase: ReturnType<typeof createClient>) {
  const { data, error } = await supabase
    .from("job_sources")
    .select(
      "id, company, careers_url, industry, location_state, source_tier, scrape_selector, is_active, last_scrape_status, consecutive_failures",
    )
    .eq("is_active", true)
    .order("company", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((source) => normalizeStableSource(source as JobSourceRow));
}

function normalizeStableSource(source: JobSourceRow): UnifiedSource {
  return {
    company: source.company,
    consecutiveFailures: source.consecutive_failures ?? 0,
    id: source.id,
    industry: source.industry,
    locationState: source.location_state,
    name: source.company,
    scrapeSelector: source.scrape_selector,
    sourceTier: source.source_tier,
    url: source.careers_url,
  };
}

function getCorporateSources() {
  if (!JOB_SCRAPER_SOURCES_JSON) {
    return [] as UnifiedSource[];
  }

  try {
    const parsed = JSON.parse(JOB_SCRAPER_SOURCES_JSON) as CorporateSourceConfig[];
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .filter((item) =>
        typeof item?.company === "string" && typeof item?.url === "string"
      )
      .map((item) => ({
        company: item.company.trim(),
        consecutiveFailures: 0,
        id: null,
        industry: item.industry?.trim() || null,
        locationState: item.locationState?.trim() || null,
        name: item.company.trim(),
        scrapeSelector: null,
        sourceTier: "corporate" as const,
        url: item.url.trim(),
      }));
  } catch {
    return [];
  }
}

async function verifyUrl(url: string) {
  try {
    const response = await fetch(url, {
      method: "HEAD",
      redirect: "follow",
      headers: {
        "User-Agent": USER_AGENT,
      },
    });

    if (!response.ok) {
      return false;
    }

    const resolvedUrl = response.url.toLowerCase();
    return (
      resolvedUrl.includes("career")
      || resolvedUrl.includes("job")
      || resolvedUrl.includes("vacancies")
      || resolvedUrl.includes("work-with-us")
    );
  } catch {
    return false;
  }
}

async function recordSourceSuccess(
  supabase: ReturnType<typeof createClient>,
  source: UnifiedSource,
) {
  if (!source.id) {
    return;
  }

  await supabase
    .from("job_sources")
    .update({
      consecutive_failures: 0,
      last_scraped_at: new Date().toISOString(),
      last_scrape_status: "success",
    })
    .eq("id", source.id);
}

async function recordSourceFailure(
  supabase: ReturnType<typeof createClient>,
  source: UnifiedSource,
  status: "failed" | "url_changed",
  url: string,
  error?: unknown,
) {
  if (!source.id) {
    if (error) {
      await captureSentryException(error, { company: source.company, status, url });
    }
    return;
  }

  const failures = source.consecutiveFailures + 1;
  const isActive = failures < 3;

  await supabase
    .from("job_sources")
    .update({
      consecutive_failures: failures,
      is_active: isActive,
      last_scraped_at: new Date().toISOString(),
      last_scrape_status: status,
    })
    .eq("id", source.id);

  if (failures >= 3) {
    await captureSentryMessage(`Job source auto-disabled: ${source.company}`, "warning", {
      failures,
      sourceId: source.id,
      status,
      url,
    });
  } else if (error) {
    await captureSentryException(error, {
      company: source.company,
      failures,
      sourceId: source.id,
      status,
      url,
    });
  }
}

async function fetchHtmlSourceJobs(source: UnifiedSource) {
  const crawlRules = await getRobotsRules(source.url);
  if (!crawlRules.allowed) {
    throw new Error(`robots.txt disallows scraping ${source.url}.`);
  }

  if (crawlRules.crawlDelayMs > 0) {
    await delay(crawlRules.crawlDelayMs);
  }

  const response = await fetch(source.url, {
    headers: {
      Accept: "text/html,application/xhtml+xml",
      "User-Agent": USER_AGENT,
    },
  });

  if (!response.ok) {
    throw new Error(`Source returned status ${response.status}.`);
  }

  const html = await response.text();
  const sourceUrl = normalizeUrl(source.url);
  const now = new Date().toISOString();

  return extractJsonLdBlocks(html)
    .flatMap((block) => flattenJsonLd(block))
    .filter((item) => isJobPosting(item))
    .map((job) => mapJsonLdJob({ job, now, source, sourceUrl }))
    .filter((job): job is ScrapedJobRow => job !== null);
}

function mapJsonLdJob({
  job,
  now,
  source,
  sourceUrl,
}: {
  job: Record<string, unknown>;
  now: string;
  source: UnifiedSource;
  sourceUrl: string;
}) {
  const title = readString(job.title) || readString(job.name);
  if (!title) {
    return null;
  }

  const jobUrl = normalizeUrl(readString(job.url) || sourceUrl);
  const description = sanitizeHtml(
    readString(job.description)
    || readString(job.qualifications)
    || readString(job.responsibilities),
  );
  const organization = readRecord(job.hiringOrganization);
  const location = readRecord(job.jobLocation);
  const address = readRecord(location.address);
  const city = readString(address.addressLocality);
  const addressRegion = readString(address.addressRegion);
  const inferredLocation = inferNigerianLocation(description || "");
  const salary = readRecord(job.baseSalary);
  const salaryValue = readRecord(salary.value);
  const salaryMin = readNumericValue(salaryValue.minValue);
  const salaryMax = readNumericValue(salaryValue.maxValue);

  return {
    company: readString(organization.name) || source.company,
    currency: readString(salary.currency) || "NGN",
    description,
    experience_level: inferExperienceLevel(`${title} ${description ?? ""}`),
    expires_at: readString(job.validThrough) || null,
    industry: source.industry || inferIndustry(`${title} ${description ?? ""}`),
    is_active: true,
    is_verified: true,
    location_city: city || inferredLocation.city,
    location_state: addressRegion || source.locationState || inferredLocation.state,
    required_skills: collectSkills(job.skills),
    salary_max: salaryMax,
    salary_min: salaryMin,
    scraped_at: now,
    source_type: "scraped",
    source_url: jobUrl,
    title,
  };
}

function validateSourceUrl(rawUrl: string) {
  const url = new URL(rawUrl);
  const host = url.hostname.toLowerCase();

  if (BANNED_DOMAIN_SUFFIXES.some((suffix) => host === suffix || host.endsWith(`.${suffix}`))) {
    throw new Error(`The domain ${host} is explicitly disallowed by the build rules.`);
  }

  const approved = APPROVED_DOMAIN_SUFFIXES.some(
    (suffix) => host === suffix || host.endsWith(`.${suffix}`),
  );

  if (!approved) {
    throw new Error(`The domain ${host} is not on the v4 legal-source allowlist.`);
  }
}

async function getRobotsRules(sourceUrl: string) {
  const url = new URL(sourceUrl);
  const robotsUrl = new URL("/robots.txt", url.origin);
  const response = await fetch(robotsUrl, {
    headers: {
      Accept: "text/plain",
      "User-Agent": USER_AGENT,
    },
  });

  if (!response.ok) {
    return { allowed: false, crawlDelayMs: 0 };
  }

  const text = await response.text();
  return parseRobots(text, url.pathname);
}

function parseRobots(robotsText: string, path: string) {
  const lines = robotsText
    .split(/\r?\n/)
    .map((line) => line.replace(/#.*$/, "").trim())
    .filter(Boolean);
  let applies = false;
  let allowRules: string[] = [];
  let disallowRules: string[] = [];
  let crawlDelayMs = 0;

  for (const line of lines) {
    const [rawField, ...rest] = line.split(":");
    const field = rawField.toLowerCase();
    const value = rest.join(":").trim();

    if (field === "user-agent") {
      applies = value === "*" || value.toLowerCase() === USER_AGENT.toLowerCase();
      continue;
    }

    if (!applies) {
      continue;
    }

    if (field === "allow" && value) {
      allowRules.push(value);
    } else if (field === "disallow" && value) {
      disallowRules.push(value);
    } else if (field === "crawl-delay" && value) {
      const seconds = Number.parseFloat(value);
      if (Number.isFinite(seconds) && seconds > 0) {
        crawlDelayMs = seconds * 1000;
      }
    }
  }

  const matchingAllow = allowRules.filter((rule) => path.startsWith(rule)).sort(byLongestMatch)[0];
  const matchingDisallow = disallowRules.filter((rule) => path.startsWith(rule)).sort(byLongestMatch)[0];
  const allowed =
    !matchingDisallow
    || (matchingAllow ? matchingAllow.length >= matchingDisallow.length : false);

  return { allowed, crawlDelayMs };
}

function byLongestMatch(a: string, b: string) {
  return b.length - a.length;
}

function extractJsonLdBlocks(html: string) {
  const blocks: unknown[] = [];
  const pattern = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match: RegExpExecArray | null = null;

  while ((match = pattern.exec(html)) !== null) {
    try {
      blocks.push(JSON.parse(match[1]));
    } catch {
      // Ignore malformed JSON-LD.
    }
  }

  return blocks;
}

function flattenJsonLd(value: unknown): Record<string, unknown>[] {
  if (Array.isArray(value)) {
    return value.flatMap((item) => flattenJsonLd(item));
  }

  if (!isRecord(value)) {
    return [];
  }

  const graph = value["@graph"];
  if (Array.isArray(graph)) {
    return graph.flatMap((item) => flattenJsonLd(item));
  }

  return [value];
}

function isJobPosting(value: Record<string, unknown>) {
  const typeValue = value["@type"];

  if (Array.isArray(typeValue)) {
    return typeValue.some((item) => String(item).toLowerCase() === "jobposting");
  }

  return String(typeValue || "").toLowerCase() === "jobposting";
}

function sanitizeHtml(value: string | null) {
  if (!value) {
    return null;
  }

  return value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 6000);
}

function inferNigerianLocation(value: string) {
  const normalized = value.toLowerCase();
  const state = NIGERIAN_STATES.find((candidate) =>
    normalized.includes(candidate.toLowerCase()),
  );

  if (!state) {
    return { city: null, state: null };
  }

  const parts = value
    .split(",")
    .map((segment) => segment.trim())
    .filter(Boolean);
  const city = parts.find((segment) => segment.toLowerCase() !== state.toLowerCase()) || null;

  return { city, state };
}

function inferExperienceLevel(value: string): ExperienceLevel | null {
  const normalized = value.toLowerCase();

  if (/\b(head|director|chief|principal|vp|vice president|executive)\b/.test(normalized)) {
    return "executive";
  }

  if (/\b(manager|lead|senior|specialist)\b/.test(normalized)) {
    return "senior";
  }

  if (/\b(associate|officer|analyst|coordinator|mid)\b/.test(normalized)) {
    return "mid";
  }

  if (/\b(intern|graduate|trainee|junior|assistant|entry)\b/.test(normalized)) {
    return "entry";
  }

  return null;
}

function inferIndustry(value: string) {
  const normalized = value.toLowerCase();

  if (/\b(bank|treasury|credit|loan|finance)\b/.test(normalized)) {
    return "Banking";
  }

  if (/\b(engineer|engineering|maintenance|plant)\b/.test(normalized)) {
    return "Engineering";
  }

  if (/\b(software|developer|data|product|technology|tech)\b/.test(normalized)) {
    return "Technology";
  }

  if (/\b(teacher|education|school|learning)\b/.test(normalized)) {
    return "Education";
  }

  if (/\b(nurse|doctor|medical|health)\b/.test(normalized)) {
    return "Healthcare";
  }

  return null;
}

function collectSkills(value: unknown) {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean).slice(0, 20);
  }

  return String(value)
    .split(/[,/|]/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 20);
}

function normalizeUrl(value: string) {
  try {
    return new URL(value).toString();
  } catch {
    return value;
  }
}

function readString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function readNumericValue(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const numericValue = Number.parseInt(value.replace(/[^\d]/g, ""), 10);
    return Number.isFinite(numericValue) ? numericValue : null;
  }

  return null;
}

function readRecord(value: unknown) {
  return isRecord(value) ? value : {};
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body, null, 2), {
    headers: {
      "Content-Type": "application/json",
    },
    status,
  });
}

async function captureSentryMessage(
  message: string,
  level: "warning" | "error",
  extra: Record<string, unknown>,
) {
  await sendSentryEvent({
    extra,
    level,
    logger: "cvpadi.scrape-jobs",
    message,
  });
}

async function captureSentryException(error: unknown, extra: Record<string, unknown>) {
  const normalizedError =
    error instanceof Error ? error : new Error(typeof error === "string" ? error : "Unknown error");

  await sendSentryEvent({
    exception: {
      values: [
        {
          type: normalizedError.name,
          value: normalizedError.message,
        },
      ],
    },
    extra,
    level: "error",
    logger: "cvpadi.scrape-jobs",
    message: normalizedError.message,
  });
}

async function sendSentryEvent(event: Record<string, unknown>) {
  if (!SENTRY_DSN) {
    return;
  }

  try {
    const dsn = new URL(SENTRY_DSN);
    const publicKey = dsn.username;
    const projectId = dsn.pathname.replace(/^\/+/, "");

    if (!publicKey || !projectId) {
      return;
    }

    const envelopeUrl = `${dsn.protocol}//${dsn.host}/api/${projectId}/envelope/`;
    const envelopeHeader = {
      dsn: SENTRY_DSN,
      sent_at: new Date().toISOString(),
    };
    const itemHeader = {
      type: "event",
    };
    const payload = {
      environment: Deno.env.get("SUPABASE_ENV") || "production",
      event_id: crypto.randomUUID().replace(/-/g, ""),
      platform: "javascript",
      timestamp: new Date().toISOString(),
      ...event,
    };

    await fetch(envelopeUrl, {
      body: `${JSON.stringify(envelopeHeader)}\n${JSON.stringify(itemHeader)}\n${JSON.stringify(payload)}`,
      headers: {
        "Content-Type": "application/x-sentry-envelope",
        "User-Agent": USER_AGENT,
      },
      method: "POST",
    });
  } catch {
    // Do not block the scraper if Sentry transport fails.
  }
}
