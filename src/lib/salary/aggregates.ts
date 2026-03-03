import { createAdminClient } from "@/lib/supabase/admin";

export interface SalaryAggregate {
  company: string;
  count: number;
  locationState: string;
  maxAnnualKobo: number;
  medianAnnualKobo: number;
  minAnnualKobo: number;
  role: string;
}

export interface SalaryFilters {
  company?: string;
  locationState?: string;
  role?: string;
}

interface SalarySubmissionRow {
  company: string;
  location_state: string | null;
  role: string;
  salary_annual_kobo: number;
}

export async function getSalaryAggregates(filters: SalaryFilters = {}) {
  const supabase = createAdminClient();
  let query = supabase
    .from("salary_submissions")
    .select("company, role, location_state, salary_annual_kobo")
    .order("created_at", { ascending: false })
    .limit(5000);

  if (filters.company) {
    query = query.ilike("company", `%${filters.company}%`);
  }

  if (filters.role) {
    query = query.ilike("role", `%${filters.role}%`);
  }

  if (filters.locationState) {
    query = query.eq("location_state", filters.locationState);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return buildSalaryAggregates(data ?? []);
}

export function formatAnnualNaira(amountKobo: number) {
  return new Intl.NumberFormat("en-NG", {
    currency: "NGN",
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
    style: "currency",
  }).format(amountKobo / 100);
}

function buildSalaryAggregates(rows: SalarySubmissionRow[]) {
  const buckets = new Map<string, SalaryAggregate & { samples: number[] }>();

  for (const row of rows) {
    const company = row.company.trim();
    const role = row.role.trim();
    const locationState = row.location_state?.trim() || "Not specified";
    const key = `${company.toLowerCase()}|${role.toLowerCase()}|${locationState.toLowerCase()}`;
    const existing = buckets.get(key);

    if (!existing) {
      buckets.set(key, {
        company,
        count: 1,
        locationState,
        maxAnnualKobo: row.salary_annual_kobo,
        medianAnnualKobo: row.salary_annual_kobo,
        minAnnualKobo: row.salary_annual_kobo,
        role,
        samples: [row.salary_annual_kobo],
      });
      continue;
    }

    existing.count += 1;
    existing.samples.push(row.salary_annual_kobo);
    existing.maxAnnualKobo = Math.max(existing.maxAnnualKobo, row.salary_annual_kobo);
    existing.minAnnualKobo = Math.min(existing.minAnnualKobo, row.salary_annual_kobo);
  }

  return Array.from(buckets.values())
    .filter((bucket) => bucket.count >= 5)
    .map((bucket) => ({
      company: bucket.company,
      count: bucket.count,
      locationState: bucket.locationState,
      maxAnnualKobo: bucket.maxAnnualKobo,
      medianAnnualKobo: calculateMedian(bucket.samples),
      minAnnualKobo: bucket.minAnnualKobo,
      role: bucket.role,
    }))
    .sort((left, right) => {
      if (right.count !== left.count) {
        return right.count - left.count;
      }

      return left.company.localeCompare(right.company);
    });
}

function calculateMedian(values: number[]) {
  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 0) {
    return Math.round((sorted[middle - 1] + sorted[middle]) / 2);
  }

  return sorted[middle];
}
