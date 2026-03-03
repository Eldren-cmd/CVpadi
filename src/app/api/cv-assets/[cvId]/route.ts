import { getSignedCvAssetLinks } from "@/lib/delivery/cv-delivery";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: { cvId: string } },
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: cv, error } = await supabase
    .from("cvs")
    .select("id, is_paid, pdf_fingerprint")
    .eq("id", params.cvId)
    .eq("user_id", user.id)
    .single();

  if (error || !cv) {
    return NextResponse.json({ error: "CV not found." }, { status: 404 });
  }

  if (!cv.is_paid || !cv.pdf_fingerprint) {
    return NextResponse.json(
      { error: "Delivery assets are not ready yet." },
      { status: 409 },
    );
  }

  try {
    const links = await getSignedCvAssetLinks({
      cvId: params.cvId,
      userId: user.id,
    });

    return NextResponse.json(links);
  } catch (deliveryError) {
    return NextResponse.json(
      {
        error:
          deliveryError instanceof Error
            ? deliveryError.message
            : "Unable to create signed URLs.",
      },
      { status: 500 },
    );
  }
}
