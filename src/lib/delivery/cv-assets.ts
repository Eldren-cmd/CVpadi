import { createAdminClient } from "@/lib/supabase/admin";

function getAssetPaths(userId: string, cvId: string) {
  return {
    jpgPath: `jpgs/${userId}/${cvId}.jpg`,
    pdfPath: `pdfs/${userId}/${cvId}.pdf`,
  };
}

export function getCvAssetPaths(userId: string, cvId: string) {
  return getAssetPaths(userId, cvId);
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
