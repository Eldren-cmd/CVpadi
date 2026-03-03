import { createHash } from "node:crypto";
import { renderToBuffer } from "@react-pdf/renderer";
import * as Sentry from "@sentry/nextjs";
import { Resend } from "resend";
import sharp from "sharp";
import type { CVFormData } from "@/lib/cv/types";
import { createAdminClient } from "@/lib/supabase/admin";
import { CVPdfDocument } from "./cv-pdf-document";

const resend = new Resend(process.env.RESEND_API_KEY);

function getAssetPaths(userId: string, cvId: string) {
  return {
    jpgPath: `jpgs/${userId}/${cvId}.jpg`,
    pdfPath: `pdfs/${userId}/${cvId}.pdf`,
  };
}

function createFingerprint(email: string, cvId: string) {
  const rawFingerprint = `${email}|${cvId}|${Date.now()}`;

  return {
    fingerprintHash: createHash("sha256").update(rawFingerprint).digest("hex"),
    rawFingerprint,
  };
}

function createDeliveryEmailHtml({
  jpgUrl,
  name,
  pdfUrl,
}: {
  jpgUrl: string;
  name: string;
  pdfUrl: string;
}) {
  return `
    <div style="background:#F5F0E8;padding:32px;font-family:Arial,sans-serif;color:#1A1410;">
      <div style="max-width:640px;margin:0 auto;background:#FDFAF4;border:1px solid #DDD5C4;border-radius:8px;padding:32px;">
        <p style="font-size:12px;letter-spacing:0.24em;text-transform:uppercase;color:#5C4F3D;margin:0 0 12px;">CVPadi</p>
        <h1 style="font-size:28px;line-height:1.2;margin:0 0 16px;">Your CV is ready, ${name || "there"}.</h1>
        <p style="font-size:15px;line-height:1.7;color:#5C4F3D;margin:0 0 24px;">
          Your PDF and WhatsApp-ready JPG are attached as secure download links. These signed links expire in 2 hours.
        </p>
        <div style="display:flex;flex-direction:column;gap:12px;">
          <a href="${pdfUrl}" style="display:inline-block;background:#D4501A;color:#fff;text-decoration:none;padding:14px 18px;border-radius:6px;font-weight:600;">Download PDF</a>
          <a href="${jpgUrl}" style="display:inline-block;border:1px solid #DDD5C4;color:#1A1410;text-decoration:none;padding:14px 18px;border-radius:6px;font-weight:600;">Open WhatsApp JPG</a>
        </div>
        <p style="font-size:13px;line-height:1.7;color:#5C4F3D;margin:24px 0 0;">
          Development note: if you are still using Resend's test sender, delivery will only work for the verified Resend account inbox.
        </p>
      </div>
    </div>
  `;
}

export async function getSignedCvAssetLinks({
  cvId,
  userId,
}: {
  cvId: string;
  userId: string;
}) {
  const supabase = createAdminClient();
  const { jpgPath, pdfPath } = getAssetPaths(userId, cvId);

  const [
    { data: pdfData, error: pdfError },
    { data: jpgData, error: jpgError },
  ] = await Promise.all([
    supabase.storage.from("cv-assets").createSignedUrl(pdfPath, 7200),
    supabase.storage.from("cv-assets").createSignedUrl(jpgPath, 7200),
  ]);

  if (pdfError) {
    throw pdfError;
  }

  if (jpgError) {
    throw jpgError;
  }

  return {
    jpgUrl: jpgData.signedUrl,
    pdfUrl: pdfData.signedUrl,
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
    const jpgBuffer = await sharp(pdfBuffer, { density: 144, page: 0 })
      .resize({ width: 1240 })
      .jpeg({ quality: 92 })
      .toBuffer();

    const { jpgPath, pdfPath } = getAssetPaths(userId, cvId);

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
      await resend.emails.send({
        from: process.env.EMAIL_FROM!,
        html: createDeliveryEmailHtml({
          jpgUrl: links.jpgUrl,
          name: profile.full_name || formData.fullName,
          pdfUrl: links.pdfUrl,
        }),
        subject: "Your CV is ready - PDF and WhatsApp image included",
        to: profile.email,
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
