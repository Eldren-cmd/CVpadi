"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getDefaultEmailPreferences, type EmailFrequency } from "@/lib/email/preferences";

function isEmailFrequency(value: string): value is EmailFrequency {
  return value === "normal" || value === "less_often" || value === "jobs_only";
}

export async function updateEmailPreferencesAction(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const nextFrequency = formData.get("frequency");
  const unsubscribeAll = formData.get("unsubscribeAll") === "on";
  const current = getDefaultEmailPreferences();

  const { error } = await supabase.auth.updateUser({
    data: {
      email_preferences: {
        frequency: typeof nextFrequency === "string" && isEmailFrequency(nextFrequency)
          ? nextFrequency
          : current.frequency,
        unsubscribeAll,
      },
    },
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/email-preferences");
}
