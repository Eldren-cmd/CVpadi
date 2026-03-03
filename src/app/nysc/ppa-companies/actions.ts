"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface PpaReviewSubmissionState {
  error?: string;
  success?: string;
}

export async function submitPpaReviewAction(
  _previousState: PpaReviewSubmissionState,
  formData: FormData,
): Promise<PpaReviewSubmissionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      error: "Verify your email with a magic link before submitting a PPA review.",
    };
  }

  if (!user.email_confirmed_at) {
    return {
      error: "Your email still needs verification before we can accept PPA reviews.",
    };
  }

  const companyName = String(formData.get("companyName") || "").trim();
  const locationState = String(formData.get("locationState") || "").trim();
  const roleTitle = String(formData.get("roleTitle") || "").trim();
  const notes = String(formData.get("notes") || "").trim();
  const rating = Number(String(formData.get("rating") || "0"));
  const wouldRecommendValue = String(formData.get("wouldRecommend") || "yes");
  const wouldRecommend = wouldRecommendValue === "yes";

  if (companyName.length < 2) {
    return {
      error: "PPA company name is required.",
    };
  }

  if (locationState.length < 2) {
    return {
      error: "State is required.",
    };
  }

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return {
      error: "Choose a rating between 1 and 5.",
    };
  }

  if (notes && notes.length < 20) {
    return {
      error: "If you include notes, make them useful and at least 20 characters long.",
    };
  }

  const { error } = await supabase.from("nysc_ppa_reviews").insert({
    company_name: companyName,
    location_state: locationState,
    notes: notes || null,
    rating,
    role_title: roleTitle || null,
    user_id: user.id,
    would_recommend: wouldRecommend,
  });

  if (error) {
    return {
      error: error.message,
    };
  }

  revalidatePath("/nysc/ppa-companies");

  return {
    success:
      "PPA review submitted. It becomes public once at least five people review that company in the same state.",
  };
}
