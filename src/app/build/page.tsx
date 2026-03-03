import { FormErrorBoundary } from "@/components/build/form-error-boundary";
import { FormWizard } from "@/components/build/form-wizard";
import { createDefaultCVFormData } from "@/lib/cv/constants";
import type { CVFormData } from "@/lib/cv/types";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function BuildPage({
  searchParams,
}: {
  searchParams?: { reference?: string };
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/build");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("free_generations_used")
    .eq("id", user.id)
    .maybeSingle();

  const { data: existingDraft } = await supabase
    .from("cvs")
    .select("id, form_data, is_paid, updated_at")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let draft = existingDraft;

  if (!draft) {
    const { data: createdDraft, error } = await supabase
      .from("cvs")
      .insert({
        user_id: user.id,
        form_data: createDefaultCVFormData(user.email ?? ""),
      })
      .select("id, form_data, is_paid, updated_at")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    draft = createdDraft;
  }

  const initialDraft = {
    ...createDefaultCVFormData(user.email ?? ""),
    ...(draft.form_data as Partial<CVFormData>),
  };

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 sm:py-8">
      <div className="mx-auto max-w-6xl">
        <FormErrorBoundary>
          <FormWizard
            initialCvId={draft.id}
            initialDraft={initialDraft}
            initialPaymentReference={searchParams?.reference ?? null}
            initialFreePreviewsUsed={profile?.free_generations_used ?? 0}
            initialUpdatedAt={draft.updated_at}
            isPaid={draft.is_paid}
            userEmail={user.email ?? ""}
            userId={user.id}
          />
        </FormErrorBoundary>
      </div>
    </main>
  );
}
