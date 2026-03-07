"use server";

import { enqueueAiEnhancement } from "@/lib/ai/queue";
import { computeCVScore } from "@/lib/cv/score";
import type { CVFormData, DraftSaveResult } from "@/lib/cv/types";
import { isDisposableEmail } from "@/lib/cv/validation";
import { scheduleBuildEmailSequences } from "@/lib/email/sequences";
import { verifyRecaptchaToken } from "@/lib/security/recaptcha";
import { createClient } from "@/lib/supabase/server";

interface SaveDraftInput {
  cvId: string;
  deviceFingerprint?: string | null;
  formData: CVFormData;
  honeypot?: string;
  recaptchaToken?: string | null;
  requireRecaptcha?: boolean;
}

export async function saveCvDraftAction({
  cvId,
  deviceFingerprint,
  formData,
  honeypot,
  recaptchaToken,
  requireRecaptcha,
}: SaveDraftInput): Promise<DraftSaveResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  if (honeypot?.trim()) {
    throw new Error("Unable to save this draft right now.");
  }

  if (requireRecaptcha) {
    const recaptchaCheck = await verifyRecaptchaToken({
      expectedAction: "build_step_one",
      token: recaptchaToken,
    });

    if (!recaptchaCheck.ok) {
      throw new Error("The security check expired. Please try that step again.");
    }
  }

  if (isDisposableEmail(formData.email)) {
    throw new Error("Please use a real email address. We send your CV here.");
  }

  const scoreResult = computeCVScore(formData);

  const { data, error } = await supabase.rpc("save_cv_version_snapshot", {
    p_cv_id: cvId,
    p_cv_score: scoreResult.score,
    p_form_data: formData,
  });

  const savedVersion = Array.isArray(data) ? data[0] : null;

  if (error || !savedVersion) {
    throw new Error(error?.message ?? "Unable to save this CV version right now.");
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
      ...(deviceFingerprint
        ? { device_fingerprint: deviceFingerprint.slice(0, 255) }
        : {}),
    })
    .eq("id", user.id);

  try {
    await scheduleBuildEmailSequences({
      email: formData.email || user.email || "",
      fullName: formData.fullName,
      furthestStepIndex: formData.furthestStepIndex,
      userId: user.id,
    });
  } catch {
    // Email sequence scheduling should not block draft saves.
  }

  try {
    const { data: cv } = await supabase
      .from("cvs")
      .select("is_paid")
      .eq("id", cvId)
      .eq("user_id", user.id)
      .single();

    if (cv?.is_paid) {
      await enqueueAiEnhancement({ cvId, userId: user.id });
    }
  } catch {
    // Enhancement queueing should not block draft saves.
  }

  return {
    id: savedVersion.id,
    updatedAt: savedVersion.updated_at,
    score: scoreResult.score,
    suggestions: scoreResult.suggestions,
  };
}
