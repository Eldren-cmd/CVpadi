import { createHash } from "node:crypto";
import { renderToBuffer } from "@react-pdf/renderer";
import * as Sentry from "@sentry/nextjs";
import type { CVFormData } from "@/lib/cv/types";
import { schedulePostPaymentEmailSequences } from "@/lib/email/sequences";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCvAssetPaths, getSignedCvAssetLinks } from "./cv-assets";
import { renderCvJpgBuffer } from "./cv-jpg-template";
import { CVPdfDocument } from "./cv-pdf-document";

function createFingerprint(email: string, cvId: string) {
  const rawFingerprint = `${email}|${cvId}|${Date.now()}`;

  return {
    fingerprintHash: createHash("sha256").update(rawFingerprint).digest("hex"),
    rawFingerprint,
  };
}

export async function generateAndDeliverCvAssets({
  cvId,
  userId,
}: {
  cvId: string;
  userId: string;
}) {
  const supabase = createAdminClient();

  const { data: cv, error: cvError } = await supabase
    .from("cvs")
    .select("id, form_data, pdf_fingerprint, template_id, user_id")
    .eq("id", cvId)
    .eq("user_id", userId)
    .single();

  if (cvError || !cv) {
    throw new Error(cvError?.message ?? "CV not found for delivery.");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("email, full_name")
    .eq("id", userId)
    .single();

  if (profileError || !profile) {
    throw new Error(profileError?.message ?? "Profile not found for delivery.");
  }

  const formData = cv.form_data as CVFormData;
  const { fingerprintHash, rawFingerprint } = createFingerprint(profile.email, cv.id);

  try {
    const pdfBuffer = await renderToBuffer(
      <CVPdfDocument fingerprint={rawFingerprint} formData={formData} />,
    );
    const jpgBuffer = await renderCvJpgBuffer({
      fingerprint: rawFingerprint,
      formData,
    });

    const { jpgPath, pdfPath } = getCvAssetPaths(userId, cvId);

    const [
      { error: pdfUploadError },
      { error: jpgUploadError },
      { error: updateError },
    ] = await Promise.all([
      supabase.storage.from("cv-assets").upload(pdfPath, pdfBuffer, {
        contentType: "application/pdf",
        upsert: true,
      }),
      supabase.storage.from("cv-assets").upload(jpgPath, jpgBuffer, {
        contentType: "image/jpeg",
        upsert: true,
      }),
      supabase
        .from("cvs")
        .update({ pdf_fingerprint: fingerprintHash })
        .eq("id", cvId)
        .eq("user_id", userId),
    ]);

    if (pdfUploadError) {
      throw pdfUploadError;
    }

    if (jpgUploadError) {
      throw jpgUploadError;
    }

    if (updateError) {
      throw updateError;
    }

    const links = await getSignedCvAssetLinks({ cvId, userId });

    try {
      await schedulePostPaymentEmailSequences({
        email: profile.email,
        fullName: profile.full_name || formData.fullName,
        jpgUrl: links.jpgUrl,
        pdfUrl: links.pdfUrl,
        sendImmediate: true,
        userId,
      });
    } catch (error) {
      Sentry.withScope((scope) => {
        scope.setTag("cv_id", cvId);
        scope.setTag("user_id", userId);
        scope.setTag("delivery_channel", "resend");
        Sentry.captureException(error);
      });
    }

    return links;
  } catch (error) {
    Sentry.withScope((scope) => {
      scope.setTag("cv_id", cvId);
      scope.setTag("user_id", userId);
      scope.setTag("delivery_channel", "pdf_generation");
      Sentry.captureException(error);
    });

    throw error;
  }
}
