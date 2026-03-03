import * as Sentry from "@sentry/nextjs";
import type { CVFormData } from "@/lib/cv/types";
import { createAdminClient } from "@/lib/supabase/admin";
import { enhanceCvFormData } from "./claude";
import { generateAndDeliverCvAssets } from "@/lib/delivery/cv-delivery";

interface AiQueueRow {
  attempts: number;
  cv_id: string;
  id: string;
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
    .select("id, cv_id, user_id, attempts, status")
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
