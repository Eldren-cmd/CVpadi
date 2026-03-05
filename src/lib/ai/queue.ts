import * as Sentry from "@sentry/nextjs";
import type { CVFormData } from "@/lib/cv/types";
import { createAdminClient } from "@/lib/supabase/admin";
import { enhanceCvFormData } from "./claude";
import { getCvAssetPaths } from "@/lib/delivery/cv-assets";
import { generateAndDeliverCvAssets } from "@/lib/delivery/cv-delivery";

interface AiQueueRow {
  attempts: number;
  cvs?: unknown;
  cv_id: string;
  id: string;
  profiles?: { email: string | null; full_name: string | null } | Array<{
    email: string | null;
    full_name: string | null;
  }> | null;
  status: "pending" | "processing" | "done" | "failed";
  user_id: string;
}

export async function enqueueAiEnhancement({
  cvId,
  userId,
}: {
  cvId: string;
  userId: string;
}) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return;
  }

  const supabase = createAdminClient();
  const { data: existing } = await supabase
    .from("ai_enhancement_queue")
    .select("id, status")
    .eq("cv_id", cvId)
    .maybeSingle();

  if (existing && existing.status !== "failed") {
    return;
  }

  if (existing && existing.status === "failed") {
    const { error } = await supabase
      .from("ai_enhancement_queue")
      .update({
        attempts: 0,
        created_at: new Date().toISOString(),
        last_attempted_at: null,
        status: "pending",
      })
      .eq("id", existing.id);

    if (error) {
      throw error;
    }

    return;
  }

  const { error } = await supabase
    .from("ai_enhancement_queue")
    .insert({
      cv_id: cvId,
      status: "pending",
      user_id: userId,
    });

  if (error) {
    throw error;
  }
}

export async function processAiEnhancementQueue(limit = 10) {
  const summary = {
    failed: 0,
    processed: 0,
    skipped: 0,
  };

  if (!process.env.ANTHROPIC_API_KEY) {
    return summary;
  }

  const supabase = createAdminClient();

  const { data: rows, error } = await supabase
    .from("ai_enhancement_queue")
    .select("*, cvs(*), profiles(email, full_name)")
    .eq("status", "pending")
    .lt("attempts", 3)
    .order("created_at", { ascending: true })
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  for (const row of (rows ?? []) as AiQueueRow[]) {
    const nextAttempt = row.attempts + 1;

    const { data: claimedRow, error: claimError } = await supabase
      .from("ai_enhancement_queue")
      .update({
        attempts: nextAttempt,
        last_attempted_at: new Date().toISOString(),
        status: "processing",
      })
      .eq("id", row.id)
      .eq("status", "pending")
      .select("id")
      .maybeSingle();

    if (claimError) {
      throw new Error(claimError.message);
    }

    if (!claimedRow) {
      summary.skipped += 1;
      continue;
    }

    try {
      const { data: cv, error: cvError } = await supabase
        .from("cvs")
        .select("form_data, id, user_id")
        .eq("id", row.cv_id)
        .eq("user_id", row.user_id)
        .single();

      if (cvError || !cv) {
        throw new Error(cvError?.message ?? "CV not found for AI enhancement.");
      }

      const enhancedFields = await enhanceCvFormData(cv.form_data as CVFormData);
      const nextFormData = {
        ...(cv.form_data as CVFormData),
        ...enhancedFields,
      };

      const { error: updateError } = await supabase
        .from("cvs")
        .update({
          form_data: nextFormData,
        })
        .eq("id", row.cv_id)
        .eq("user_id", row.user_id);

      if (updateError) {
        throw updateError;
      }

      await generateAndDeliverCvAssets({
        cvId: row.cv_id,
        isEnhancement: true,
        userId: row.user_id,
      });
      await sendEnhancementFollowUpEmail({
        item: row,
        supabase,
      });

      const { error: doneError } = await supabase
        .from("ai_enhancement_queue")
        .update({ status: "done" })
        .eq("id", row.id);

      if (doneError) {
        throw doneError;
      }

      summary.processed += 1;
    } catch (error) {
      const nextStatus = nextAttempt >= 3 ? "failed" : "pending";

      await supabase
        .from("ai_enhancement_queue")
        .update({ status: nextStatus })
        .eq("id", row.id);

      Sentry.withScope((scope) => {
        scope.setTag("cv_id", row.cv_id);
        scope.setTag("user_id", row.user_id);
        scope.setTag("queue_id", row.id);
        scope.setTag("queue_status", nextStatus);
        Sentry.captureException(error);
      });

      summary.failed += 1;
    }
  }

  return summary;
}

function extractProfile(row: AiQueueRow) {
  if (!row.profiles) {
    return null;
  }

  if (Array.isArray(row.profiles)) {
    return row.profiles[0] ?? null;
  }

  return row.profiles;
}

async function sendEnhancementFollowUpEmail({
  item,
  supabase,
}: {
  item: AiQueueRow;
  supabase: ReturnType<typeof createAdminClient>;
}) {
  const profile = extractProfile(item);
  const recipientEmail = profile?.email?.trim() ?? "";
  if (!recipientEmail) {
    console.error("Enhancement email skipped: missing recipient email", item.id);
    return;
  }

  const { pdfPath } = getCvAssetPaths(item.user_id, item.cv_id);
  const { data: signedUrlData, error: signedUrlError } = await supabase.storage
    .from("cv-assets")
    .createSignedUrl(pdfPath, 60 * 60 * 2);

  if (signedUrlError) {
    console.error("Enhancement email skipped: unable to sign PDF URL", signedUrlError.message);
    return;
  }

  const downloadUrl = signedUrlData?.signedUrl ?? "";
  const firstName = profile?.full_name?.split(" ")[0] || "there";
  const resendKey = process.env.RESEND_API_KEY;

  if (!resendKey) {
    console.error("Enhancement email skipped: RESEND_API_KEY missing");
    return;
  }

  const emailRes = await fetch("https://api.resend.com/emails", {
    body: JSON.stringify({
      from: "CVPadi <hello@cvpadi.com>",
      html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#1A1410;">
        <div style="margin-bottom:24px;">
          <span style="font-size:20px;font-weight:700;">CV<span style="color:#D4501A;">Padi</span></span>
        </div>
        <h2 style="font-size:22px;font-weight:700;margin:0 0 12px;">Your CV has been enhanced.</h2>
        <p style="color:#5C4F3D;line-height:1.6;margin:0 0 16px;">
          Hi ${firstName}, we've used AI to polish your career objective and suggest additional skills
          that match your industry. Your CV is stronger now than when you first downloaded it.
        </p>
        <p style="color:#5C4F3D;line-height:1.6;margin:0 0 32px;">
          This is the same CV you paid for - the enhanced version replaces the original.
          No extra charge, no action needed from you.
        </p>
        <a href="${downloadUrl}"
          style="display:inline-block;background:#00C853;color:#000000;padding:14px 28px;
                border-radius:8px;text-decoration:none;font-weight:700;font-size:15px;margin-bottom:32px;">
          Download enhanced CV ->
        </a>
        <p style="color:#A89880;font-size:12px;margin:24px 0;">
          This download link expires in 2 hours. Log back into CVPadi anytime to regenerate it.
        </p>
        <hr style="border:none;border-top:1px solid #EDE8DC;margin:24px 0;" />
        <p style="color:#A89880;font-size:12px;margin:0;">CVPadi - Nigerian CVs that get you hired</p>
      </div>
      `,
      subject: `Your enhanced CV is ready, ${firstName}`,
      to: recipientEmail,
    }),
    headers: {
      Authorization: `Bearer ${resendKey}`,
      "Content-Type": "application/json",
    },
    method: "POST",
  });

  if (!emailRes.ok) {
    const emailError = await emailRes.text();
    console.error("Enhancement email failed:", emailError);
  }
}
