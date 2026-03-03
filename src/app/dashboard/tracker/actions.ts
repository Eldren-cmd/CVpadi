"use server";

import { revalidatePath } from "next/cache";
import {
  TRACKER_STATUSES,
  type TrackerApplication,
  type TrackerStatus,
} from "@/lib/tracker/constants";
import { createClient } from "@/lib/supabase/server";

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

interface CreateApplicationInput {
  company: string;
  dateApplied?: string;
  notes?: string;
  role: string;
  source?: string;
}

interface TrackerActionResult {
  application?: TrackerApplication;
  error?: string;
}

export async function createApplicationAction(
  input: CreateApplicationInput,
): Promise<TrackerActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Login required." };
  }

  const company = input.company.trim();
  const role = input.role.trim();
  const source = input.source?.trim() ?? "";
  const notes = input.notes?.trim() ?? "";
  const dateApplied = input.dateApplied?.trim() ?? "";

  if (company.length < 2 || role.length < 2) {
    return { error: "Company and role are required." };
  }

  if (dateApplied && Number.isNaN(Date.parse(dateApplied))) {
    return { error: "Use a valid application date." };
  }

  const { data, error } = await supabase
    .from("applications")
    .insert({
      company,
      date_applied: dateApplied || null,
      notes: notes || null,
      role,
      source: source || null,
      status: "applied",
      user_id: user.id,
    })
    .select("id, company, role, date_applied, source, status, notes, created_at")
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/tracker");

  return { application: normalizeApplication(data) };
}

export async function updateApplicationStatusAction(input: {
  id: string;
  status: TrackerStatus;
}): Promise<TrackerActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Login required." };
  }

  if (!TRACKER_STATUSES.includes(input.status)) {
    return { error: "Invalid application status." };
  }

  const { data, error } = await supabase
    .from("applications")
    .update({ status: input.status })
    .eq("id", input.id)
    .eq("user_id", user.id)
    .select("id, company, role, date_applied, source, status, notes, created_at")
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/tracker");

  return { application: normalizeApplication(data) };
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
