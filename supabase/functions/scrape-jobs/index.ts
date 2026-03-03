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

type HtmlSourceConfig = {
  category?: "company" | "government" | "ngo" | "startup";
  company: string;
  experienceLevel?: ExperienceLevel;
  industry?: string;
  locationState?: string;
  name: string;
  url: string;
};

const SUPABASE_URL =
  Deno.env.get("SUPABASE_URL") || Deno.env.get("NEXT_PUBLIC_SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const RELIEFWEB_APPNAME = Deno.env.get("RELIEFWEB_APPNAME");
const JOB_SCRAPER_SOURCES_JSON = Deno.env.get("JOB_SCRAPER_SOURCES_JSON");
const RELIEFWEB_LIMIT = Number.parseInt(Deno.env.get("RELIEFWEB_JOB_LIMIT") ?? "25", 10);
const USER_AGENT = "cvpadi-job-scraper/1.0";

const BANNED_DOMAIN_SUFFIXES = [
  "jobberman.com",
  "linkedin.com",
  "indeed.com",
];

const APPROVED_DOMAIN_SUFFIXES = [
  "gtbank.com",
  "mtn.ng",
  "airtel.com",
  "dangote.com",
  "accessbankplc.com",
  "firstbanknigeria.com",
  "pwc.com",
  "kpmg.com",
  "deloitte.com",
  "ey.com",
  "nestle.com",
  "unilever.com",
  "shell.com",
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
  "Abuja (FCT)",
];

Deno.serve(async () => {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return jsonResponse(
      { error: "NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing." },
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
  const importedJobs: ScrapedJobRow[] = [];
  const skippedSources: Array<{ name: string; reason: string }> = [];

  if (RELIEFWEB_APPNAME) {
    try {
      importedJobs.push(...await fetchReliefWebJobs({ appname: RELIEFWEB_APPNAME }));
    } catch (error) {
      skippedSources.push({
        name: "ReliefWeb",
        reason: error instanceof Error ? error.message : "ReliefWeb import failed.",
      });
    }
  } else {
    skippedSources.push({
      name: "ReliefWeb",
      reason: "RELIEFWEB_APPNAME is missing, so the official jobs API was skipped.",
    });
  }

  for (const source of getConfiguredHtmlSources()) {
    try {
      importedJobs.push(...await fetchHtmlSourceJobs(source));
    } catch (error) {
      skippedSources.push({
        name: source.name,
        reason: error instanceof Error ? error.message : "HTML source import failed.",
      });
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

async function fetchReliefWebJobs({
  appname,
}: {
  appname: string;
}) {
  const url = new URL("https://api.reliefweb.int/v2/jobs");
  url.searchParams.set("appname", appname);
  url.searchParams.set("limit", String(Math.max(1, Math.min(RELIEFWEB_LIMIT, 100))));

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": USER_AGENT,
    },
  });

  if (!response.ok) {
    throw new Error(`ReliefWeb API failed with status ${response.status}.`);
  }

  const payload = (await response.json()) as {
    data?: Array<{
      fields?: Record<string, unknown>;
      id?: number | string;
    }>;
  };

  const now = new Date().toISOString();

  return (payload.data ?? [])
    .map((item) => mapReliefWebJob(item, now))
    .filter((job): job is ScrapedJobRow => job !== null);
}

function mapReliefWebJob(
  item: {
    fields?: Record<string, unknown>;
    id?: number | string;
  },
  now: string,
) {
  const fields = item.fields ?? {};
  const title = readString(fields.title);
  if (!title) {
    return null;
  }

  const description = sanitizeHtml(readString(fields["body-html"]) || readString(fields.body));
  const sourceUrl =
    readString(fields.url)
    || normalizeReliefWebAlias(readNestedString(fields, "url_alias"))
    || `https://reliefweb.int/job/${item.id ?? crypto.randomUUID()}`;
  const company =
    readNestedStringArray(fields, "source", "shortname")[0]
    || readNestedStringArray(fields, "source", "name")[0]
    || "ReliefWeb partner";
  const locationText = [
    ...readNestedStringArray(fields, "country", "name"),
    ...readNestedStringArray(fields, "city", "name"),
  ].join(", ");
  const { city, state } = inferNigerianLocation(locationText);

  if (!looksRelevantToNigeria(locationText) && !looksRelevantToNigeria(description || "")) {
    return null;
  }

  return {
    company,
    currency: "NGN",
    description,
    experience_level: inferExperienceLevel(
      `${title} ${readNestedStringArray(fields, "career_categories", "name").join(" ")}`,
    ),
    expires_at: readString(fields["date.closing"]) || null,
    industry: inferIndustry(`${title} ${description ?? ""}`),
    is_active: true,
    is_verified: true,
    location_city: city,
    location_state: state,
    required_skills: [],
    salary_max: null,
    salary_min: null,
    scraped_at: now,
    source_type: "scraped",
    source_url: normalizeUrl(sourceUrl),
    title,
  };
}

async function fetchHtmlSourceJobs(source: HtmlSourceConfig) {
  validateSourceUrl(source);

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
  source: HtmlSourceConfig;
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
  const state = addressRegion || source.locationState || inferNigerianLocation(description || "").state;
  const salary = readRecord(job.baseSalary);
  const salaryValue = readRecord(salary.value);
  const salaryMin = readNumericValue(salaryValue.minValue);
  const salaryMax = readNumericValue(salaryValue.maxValue);

  return {
    company: readString(organization.name) || source.company,
    currency: readString(salary.currency) || "NGN",
    description,
    experience_level:
      source.experienceLevel || inferExperienceLevel(`${title} ${description ?? ""}`),
    expires_at: readString(job.validThrough) || null,
    industry: source.industry || inferIndustry(`${title} ${description ?? ""}`),
    is_active: true,
    is_verified: true,
    location_city: city,
    location_state: state,
    required_skills: collectSkills(job.skills),
    salary_max: salaryMax,
    salary_min: salaryMin,
    scraped_at: now,
    source_type: "scraped",
    source_url: jobUrl,
    title,
  };
}

function validateSourceUrl(source: HtmlSourceConfig) {
  const url = new URL(source.url);
  const host = url.hostname.toLowerCase();

  if (BANNED_DOMAIN_SUFFIXES.some((suffix) => host === suffix || host.endsWith(`.${suffix}`))) {
    throw new Error(`The domain ${host} is explicitly disallowed by the build rules.`);
  }

  const approvedHost = APPROVED_DOMAIN_SUFFIXES.some(
    (suffix) => host === suffix || host.endsWith(`.${suffix}`),
  );

  if (!approvedHost && source.category !== "startup") {
    throw new Error(
      `The domain ${host} is not on the legal-source allowlist. Use startup category only for explicitly approved startup career pages.`,
    );
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
      // Skip malformed JSON-LD blocks.
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

function looksRelevantToNigeria(value: string) {
  const normalized = value.toLowerCase();

  return (
    normalized.includes("nigeria")
    || normalized.includes("lagos")
    || normalized.includes("abuja")
    || NIGERIAN_STATES.some((state) => normalized.includes(state.toLowerCase()))
  );
}

function inferExperienceLevel(value: string): ExperienceLevel | null {
  const normalized = value.toLowerCase();

  if (
    /\b(head|director|chief|principal|vp|vice president|executive)\b/.test(normalized)
  ) {
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

function normalizeReliefWebAlias(value: string) {
  if (!value) {
    return "";
  }

  if (value.startsWith("/")) {
    return `https://reliefweb.int${value}`;
  }

  return value;
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

function readNestedString(record: Record<string, unknown>, key: string) {
  return readString(record[key]);
}

function readNestedStringArray(
  record: Record<string, unknown>,
  key: string,
  nestedKey: string,
) {
  const collection = record[key];
  if (!Array.isArray(collection)) {
    return [];
  }

  return collection
    .map((item) => (isRecord(item) ? readString(item[nestedKey]) : ""))
    .filter(Boolean);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getConfiguredHtmlSources() {
  if (!JOB_SCRAPER_SOURCES_JSON) {
    return [] as HtmlSourceConfig[];
  }

  try {
    const parsed = JSON.parse(JOB_SCRAPER_SOURCES_JSON) as HtmlSourceConfig[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
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
