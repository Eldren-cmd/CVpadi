import { createPaymentReference, getPaymentAmount, initializePaystackTransaction } from "@/lib/payments/paystack";
import type { PaymentType } from "@/lib/payments/types";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

function isPaymentType(value: unknown): value is PaymentType {
  return value === "cv_download"
    || value === "cv_redownload"
    || value === "cover_letter"
    || value === "premium_template";
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as
    | { cvId?: string; paymentType?: PaymentType }
    | null;

  if (!body?.cvId || !isPaymentType(body.paymentType)) {
    return NextResponse.json({ error: "Invalid payment request." }, { status: 400 });
  }

  const { data: cv, error: cvError } = await supabase
    .from("cvs")
    .select("id, is_paid")
    .eq("id", body.cvId)
    .eq("user_id", user.id)
    .single();

  if (cvError || !cv) {
    return NextResponse.json({ error: "CV draft not found." }, { status: 404 });
  }

  if (cv.is_paid) {
    return NextResponse.json({ error: "This CV is already unlocked." }, { status: 409 });
  }

  const amountKobo = getPaymentAmount(body.paymentType);
  const reference = createPaymentReference();

  const { error: paymentError } = await supabase.from("payments").insert({
    amount_kobo: amountKobo,
    currency: "NGN",
    cv_id: cv.id,
    paystack_reference: reference,
    payment_type: body.paymentType,
    status: "pending",
    user_id: user.id,
    webhook_verified: false,
  });

  if (paymentError) {
    return NextResponse.json({ error: paymentError.message }, { status: 500 });
  }

  try {
    const transaction = await initializePaystackTransaction({
      amountKobo,
      callbackUrl: `${process.env.NEXT_PUBLIC_APP_URL}/build`,
      email: user.email ?? "",
      metadata: {
        cvId: cv.id,
        paymentType: body.paymentType,
        userId: user.id,
      },
      reference,
    });

    return NextResponse.json({
      accessCode: transaction.access_code,
      amountKobo,
      authorizationUrl: transaction.authorization_url,
      currency: "NGN",
      paymentType: body.paymentType,
      reference: transaction.reference,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to start the Paystack checkout.",
      },
      { status: 500 },
    );
  }
}
