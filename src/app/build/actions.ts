"use server";

import { computeCVScore } from "@/lib/cv/score";
import type { CVFormData, DraftSaveResult } from "@/lib/cv/types";
import { isDisposableEmail } from "@/lib/cv/validation";
import { createClient } from "@/lib/supabase/server";

interface SaveDraftInput {
  cvId: string;
  formData: CVFormData;
}

export async function saveCvDraftAction({
  cvId,
  formData,
}: SaveDraftInput): Promise<DraftSaveResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  if (isDisposableEmail(formData.email)) {
    throw new Error("Please use a real email address. We send your CV here.");
  }

  const scoreResult = computeCVScore(formData);

  const { data, error } = await supabase
    .from("cvs")
    .update({
      form_data: formData,
      cv_score: scoreResult.score,
    })
    .eq("id", cvId)
    .eq("user_id", user.id)
    .select("id, updated_at")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  await supabase
    .from("profiles")
    .update({
      email: formData.email || user.email || "",
      full_name: formData.fullName,
      phone: formData.phone,
      location_state: formData.locationState,
      location_city: formData.locationCity,
      industry: formData.industry,
      experience_level: formData.experienceLevel,
      nysc_status: formData.nyscStatus,
    })
    .eq("id", user.id);

  return {
    id: data.id,
    updatedAt: data.updated_at,
    score: scoreResult.score,
    suggestions: scoreResult.suggestions,
  };
}
