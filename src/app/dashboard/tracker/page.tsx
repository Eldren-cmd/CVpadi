import type { Metadata } from "next";
import { ApplicationTracker } from "@/components/tracker/application-tracker";
import {
  TRACKER_STATUSES,
  type TrackerApplication,
  type TrackerStatus,
} from "@/lib/tracker/constants";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

interface ApplicationRow {
  company: string;
  created_at: string;
  date_applied: string | null;
  id: string;
  notes: string | null;
  role: string;
  source: string | null;
  status: string;
}

export const metadata: Metadata = {
  description:
    "Track job applications across Applied, Interview, Rejected, and Offer without leaving CVPadi.",
  title: "Application Tracker | CVPadi",
};

export default async function TrackerPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/dashboard/tracker");
  }

  const { data, error } = await supabase
    .from("applications")
    .select("id, company, role, date_applied, source, status, notes, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const applications = (data ?? [])
    .map(normalizeApplication)
    .filter((application) => TRACKER_STATUSES.includes(application.status));

  return <ApplicationTracker initialApplications={applications} />;
}

function normalizeApplication(row: ApplicationRow): TrackerApplication {
  return {
    company: row.company,
    createdAt: row.created_at,
    dateApplied: row.date_applied,
    id: row.id,
    notes: row.notes ?? "",
    role: row.role,
    source: row.source ?? "",
    status: isTrackerStatus(row.status) ? row.status : "applied",
  };
}

function isTrackerStatus(value: string): value is TrackerStatus {
  return TRACKER_STATUSES.includes(value as TrackerStatus);
}
