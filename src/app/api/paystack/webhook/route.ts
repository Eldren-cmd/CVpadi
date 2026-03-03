import * as Sentry from "@sentry/nextjs";
import { generateAndDeliverCvAssets } from "@/lib/delivery/cv-delivery";
import { getPaymentAmount, parsePaymentMetadata, verifyPaystackSignature } from "@/lib/payments/paystack";
import type { PaymentType, PaystackChargeSuccessEvent } from "@/lib/payments/types";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

function isPaymentType(value: unknown): value is PaymentType {
  return value === "cv_download"
    || value === "cv_redownload"
    || value === "cover_letter"
    || value === "premium_template";
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-paystack-signature");

  if (!verifyPaystackSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature." }, { status: 401 });
  }

  const event = JSON.parse(rawBody) as PaystackChargeSuccessEvent;

  if (event.event !== "charge.success") {
    return NextResponse.json({ received: true });
  }

  const metadata = parsePaymentMetadata(event.data.metadata);
  const reference = event.data.reference;
  const cvId = typeof metadata.cvId === "string" ? metadata.cvId : null;
  const userId = typeof metadata.userId === "string" ? metadata.userId : null;
  const paymentType = isPaymentType(metadata.paymentType) ? metadata.paymentType : null;

  if (!reference || !cvId || !userId || !paymentType) {
    Sentry.captureMessage("Paystack webhook missing required metadata.", "warning");
    return NextResponse.json({ received: true });
  }

  const expectedAmount = getPaymentAmount(paymentType);

  if (event.data.amount !== expectedAmount) {
    Sentry.withScope((scope) => {
      scope.setTag("paystack_reference", reference);
      scope.setTag("cv_id", cvId);
      scope.setTag("user_id", userId);
      Sentry.captureMessage("Paystack webhook amount mismatch.", "warning");
    });

    return NextResponse.json({ received: true });
  }

  const supabase = createAdminClient();

  try {
    const { data: existingPayment } = await supabase
      .from("payments")
      .select("status, webhook_verified")
      .eq("paystack_reference", reference)
      .maybeSingle();

    const { data: existingCv } = await supabase
      .from("cvs")
      .select("is_paid, pdf_fingerprint")
      .eq("id", cvId)
      .eq("user_id", userId)
      .maybeSingle();

    if (
      existingPayment?.status === "success"
      && existingPayment.webhook_verified
      && existingCv?.is_paid
      && existingCv.pdf_fingerprint
    ) {
      return NextResponse.json({ received: true });
    }

    const { error: paymentError } = await supabase.from("payments").upsert(
      {
        amount_kobo: event.data.amount,
        currency: event.data.currency ?? "NGN",
        cv_id: cvId,
        paystack_reference: reference,
        payment_type: paymentType,
        status: "success",
        user_id: userId,
        webhook_verified: true,
      },
      {
        ignoreDuplicates: false,
        onConflict: "paystack_reference",
      },
    );

    if (paymentError) {
      throw paymentError;
    }

    const { error: cvError } = await supabase
      .from("cvs")
      .update({ is_paid: true })
      .eq("id", cvId)
      .eq("user_id", userId);

    if (cvError) {
      throw cvError;
    }

    await generateAndDeliverCvAssets({ cvId, userId });

    return NextResponse.json({ received: true });
  } catch (error) {
    Sentry.withScope((scope) => {
      scope.setTag("paystack_reference", reference);
      scope.setTag("cv_id", cvId);
      scope.setTag("user_id", userId);
      Sentry.captureException(error);
    });

    return NextResponse.json({ error: "Webhook processing failed." }, { status: 500 });
  }
}
