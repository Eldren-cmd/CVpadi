import { createAdminClient } from "@/lib/supabase/admin";

export interface PpaCompanyAggregate {
  averageRating: number;
  companyName: string;
  count: number;
  locationState: string;
  recommendRate: number;
  roleTitle: string;
}

export interface PpaCompanyFilters {
  companyName?: string;
  locationState?: string;
}

interface PpaCompanyRow {
  company_name: string;
  location_state: string | null;
  rating: number;
  role_title: string | null;
  would_recommend: boolean;
}

export async function getPpaCompanyAggregates(filters: PpaCompanyFilters = {}) {
  const supabase = createAdminClient();
  let query = supabase
    .from("nysc_ppa_reviews")
    .select("company_name, location_state, role_title, rating, would_recommend")
    .order("created_at", { ascending: false })
    .limit(5000);

  if (filters.companyName) {
    query = query.ilike("company_name", `%${filters.companyName}%`);
  }

  if (filters.locationState) {
    query = query.eq("location_state", filters.locationState);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return Array.from(buildPpaCompanyBuckets(data ?? []).values())
    .filter((bucket) => bucket.count >= 5)
    .map((bucket) => ({
      averageRating: roundToOneDecimal(bucket.totalRating / bucket.count),
      companyName: bucket.companyName,
      count: bucket.count,
      locationState: bucket.locationState,
      recommendRate: Math.round((bucket.recommendCount / bucket.count) * 100),
      roleTitle: bucket.roleTitle,
    }))
    .sort((left, right) => {
      if (right.count !== left.count) {
        return right.count - left.count;
      }

      return left.companyName.localeCompare(right.companyName);
    });
}

function buildPpaCompanyBuckets(rows: PpaCompanyRow[]) {
  const buckets = new Map<
    string,
    PpaCompanyAggregate & { recommendCount: number; totalRating: number }
  >();

  for (const row of rows) {
    const companyName = row.company_name.trim();
    const locationState = row.location_state?.trim() || "Not specified";
    const roleTitle = row.role_title?.trim() || "Mixed roles";
    const key = `${companyName.toLowerCase()}|${locationState.toLowerCase()}`;
    const existing = buckets.get(key);

    if (!existing) {
      buckets.set(key, {
        averageRating: row.rating,
        companyName,
        count: 1,
        locationState,
        recommendCount: row.would_recommend ? 1 : 0,
        recommendRate: row.would_recommend ? 100 : 0,
        roleTitle,
        totalRating: row.rating,
      });
      continue;
    }

    existing.count += 1;
    existing.totalRating += row.rating;
    existing.recommendCount += row.would_recommend ? 1 : 0;
    if (existing.roleTitle === "Mixed roles" && roleTitle !== "Mixed roles") {
      existing.roleTitle = roleTitle;
    } else if (existing.roleTitle !== roleTitle && roleTitle !== "Mixed roles") {
      existing.roleTitle = "Mixed roles";
    }
  }

  return buckets;
}

function roundToOneDecimal(value: number) {
  return Math.round(value * 10) / 10;
}
