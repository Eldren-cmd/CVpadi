"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function forkCvVersionAction(formData: FormData) {
  const sourceCvId = String(formData.get("sourceCvId") || "");

  if (!sourceCvId) {
    throw new Error("CV version is required.");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/dashboard/versions");
  }

  const { data, error } = await supabase.rpc("fork_cv_version", {
    p_source_cv_id: sourceCvId,
  });

  if (error || typeof data !== "string") {
    throw new Error(error?.message ?? "Unable to fork this version right now.");
  }

  redirect(`/build?cv=${encodeURIComponent(data)}`);
}
