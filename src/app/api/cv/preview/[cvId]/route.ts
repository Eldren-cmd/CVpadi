import { NextResponse } from "next/server";
import { FREE_PREVIEW_LIMIT } from "@/lib/cv/constants";
import { computeCVScore } from "@/lib/cv/score";
import type { CVFormData } from "@/lib/cv/types";
import { isDisposableEmail } from "@/lib/cv/validation";
import { renderCvPreviewJpeg } from "@/lib/delivery/cv-preview";
import { verifyRecaptchaToken } from "@/lib/security/recaptcha";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

interface PreviewRequestBody {
  deviceFingerprint?: string | null;
  formData?: CVFormData;
  honeypot?: string;
  recaptchaToken?: string | null;
}

export async function POST(
  request: Request,
  { params }: { params: { cvId: string } },
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as PreviewRequestBody | null;

  if (!body?.formData) {
    return NextResponse.json({ error: "Preview data is missing." }, { status: 400 });
  }

  if (body.honeypot?.trim()) {
    return NextResponse.json(
      { error: "Unable to generate a preview right now." },
      { status: 400 },
    );
  }

  const recaptchaCheck = await verifyRecaptchaToken({
    expectedAction: "free_preview",
    token: body.recaptchaToken,
  });

  if (!recaptchaCheck.ok) {
    return NextResponse.json(
      { error: "The security check expired. Refresh and try again." },
      { status: 400 },
    );
  }

  if (isDisposableEmail(body.formData.email || user.email || "")) {
    return NextResponse.json(
      { error: "Please use a real email address before generating a free preview." },
      { status: 400 },
    );
  }

  const admin = createAdminClient();
  const safeFingerprint = body.deviceFingerprint?.trim().slice(0, 255) || null;

  const { data: cv, error: cvError } = await admin
    .from("cvs")
    .select("id, is_paid, user_id")
    .eq("id", params.cvId)
    .eq("user_id", user.id)
    .single();

  if (cvError || !cv) {
    return NextResponse.json({ error: "Draft not found." }, { status: 404 });
  }

  if (!cv.is_paid && safeFingerprint) {
    const { data: matchingProfiles } = await admin
      .from("profiles")
      .select("id, free_generations_used")
      .eq("device_fingerprint", safeFingerprint)
      .neq("id", user.id);

    const priorAllowanceExhausted = (matchingProfiles ?? []).some(
      (profile) => profile.free_generations_used >= FREE_PREVIEW_LIMIT,
    );

    if (priorAllowanceExhausted) {
      return NextResponse.json(
        {
          error:
            "This device has already used its free preview allowance. Sign in to the original account or continue with payment.",
        },
        { status: 429 },
      );
    }
  }

  let claimedGeneration: unknown = true;
  if (!cv.is_paid) {
    const { data: claimed, error: claimError } = await admin.rpc(
      "increment_generation_if_allowed",
      {
        p_limit: FREE_PREVIEW_LIMIT,
        p_user_id: user.id,
      },
    );

    if (claimError) {
      return NextResponse.json({ error: claimError.message }, { status: 500 });
    }

    claimedGeneration = claimed;
  }

  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .update({
      email: body.formData.email || user.email || "",
      full_name: body.formData.fullName,
      industry: body.formData.industry,
      location_city: body.formData.locationCity,
      location_state: body.formData.locationState,
      nysc_status: body.formData.nyscStatus,
      phone: body.formData.phone,
      ...(safeFingerprint ? { device_fingerprint: safeFingerprint } : {}),
    })
    .eq("id", user.id)
    .select("free_generations_used")
    .single();

  if (profileError || !profile) {
    return NextResponse.json(
      { error: profileError?.message ?? "Profile not found." },
      { status: 500 },
    );
  }

  if (
    !cv.is_paid
    && claimedGeneration === null
    && profile.free_generations_used >= FREE_PREVIEW_LIMIT
  ) {
    return NextResponse.json(
      {
        error:
          "You have used all free preview attempts on this account. Continue with payment to unlock the final file.",
      },
      { status: 429 },
    );
  }

  const score = computeCVScore(body.formData);

  const { error: updateError } = await admin
    .from("cvs")
    .update({
      cv_score: score.score,
      form_data: body.formData,
    })
    .eq("id", cv.id)
    .eq("user_id", user.id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  const previewBuffer = await renderCvPreviewJpeg({
    fingerprint: `preview:${user.id.slice(0, 8)}:${Date.now()}`,
    formData: body.formData,
    score: score.score,
  });

  return new NextResponse(new Uint8Array(previewBuffer), {
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate",
      "Content-Type": "image/jpeg",
      "X-Free-Preview-Remaining": cv.is_paid
        ? "unlimited"
        : String(Math.max(0, FREE_PREVIEW_LIMIT - profile.free_generations_used)),
    },
    status: 200,
  });
}
