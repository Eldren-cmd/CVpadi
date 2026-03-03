import { FormErrorBoundary } from "@/components/build/form-error-boundary";
import { FormWizard } from "@/components/build/form-wizard";
import { createDefaultCVFormData, INDUSTRIES } from "@/lib/cv/constants";
import type { CVFormData } from "@/lib/cv/types";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function BuildPage({
  searchParams,
}: {
  searchParams?: { cv?: string; industry?: string; reference?: string };
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const nextPath = searchParams?.cv
      ? `/build?cv=${encodeURIComponent(searchParams.cv)}`
      : "/build";
    redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("free_generations_used")
    .eq("id", user.id)
    .maybeSingle();

  const existingDraft = searchParams?.cv
    ? await getRequestedCv({ cvId: searchParams.cv, userId: user.id })
    : await getLatestActiveCv({ userId: user.id });

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

  const requestedIndustry = normalizeIndustryPrefill(searchParams?.industry);
  const initialDraft = {
    ...createDefaultCVFormData(user.email ?? ""),
    ...(draft.form_data as Partial<CVFormData>),
    industry:
      (requestedIndustry
        || (draft.form_data as Partial<CVFormData>)?.industry
        || "") as CVFormData["industry"],
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

async function getLatestActiveCv({ userId }: { userId: string }) {
  const supabase = await createClient();

  const { data } = await supabase
    .from("cvs")
    .select("id, form_data, is_paid, updated_at")
    .eq("user_id", userId)
    .eq("is_snapshot", false)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return data;
}

async function getRequestedCv({
  cvId,
  userId,
}: {
  cvId: string;
  userId: string;
}) {
  const supabase = await createClient();

  const { data } = await supabase
    .from("cvs")
    .select("id, form_data, is_paid, updated_at")
    .eq("id", cvId)
    .eq("user_id", userId)
    .eq("is_snapshot", false)
    .maybeSingle();

  return data;
}

function normalizeIndustryPrefill(value?: string) {
  if (!value) {
    return "";
  }

  return INDUSTRIES.find(
    (industry) => industry.toLowerCase() === value.trim().toLowerCase(),
  ) ?? "";
}
