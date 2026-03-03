import * as Sentry from "@sentry/nextjs";
import { enqueueAiEnhancement } from "@/lib/ai/queue";
import { generateAndDeliverCvAssets } from "@/lib/delivery/cv-delivery";
import { parsePaymentMetadata, verifyPaystackSignature } from "@/lib/payments/paystack";
import type { PaymentType, PaystackChargeSuccessEvent } from "@/lib/payments/types";
import { REFERRAL_CREDIT_KOBO } from "@/lib/referrals/constants";
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
  const creditAppliedKobo =
    typeof metadata.creditAppliedKobo === "number"
      ? metadata.creditAppliedKobo
      : Number.parseInt(String(metadata.creditAppliedKobo ?? "0"), 10) || 0;
  const referralCodeUsed =
    typeof metadata.referralCodeUsed === "string" && metadata.referralCodeUsed.trim()
      ? metadata.referralCodeUsed.trim().toUpperCase()
      : null;

  if (!reference || !cvId || !userId || !paymentType) {
    Sentry.captureMessage("Paystack webhook missing required metadata.", "warning");
    return NextResponse.json({ received: true });
  }

  const supabase = createAdminClient();
  let { data: existingPayment } = await supabase
    .from("payments")
    .select(
      "amount_kobo, credit_applied_kobo, referral_credit_kobo, referrer_user_id, status, webhook_verified",
    )
    .eq("paystack_reference", reference)
    .maybeSingle();

  if (!existingPayment) {
    let referrerUserId: string | null = null;

    if (referralCodeUsed) {
      const { data: referrer } = await supabase
        .from("profiles")
        .select("id")
        .eq("referral_code", referralCodeUsed)
        .neq("id", userId)
        .maybeSingle();

      referrerUserId = referrer?.id ?? null;
    }

    const { data: upsertedPayment, error: upsertError } = await supabase
      .from("payments")
      .upsert(
        {
          amount_kobo: event.data.amount,
          base_amount_kobo: event.data.amount + creditAppliedKobo,
          credit_applied_kobo: creditAppliedKobo,
          currency: event.data.currency ?? "NGN",
          cv_id: cvId,
          payment_type: paymentType,
          paystack_reference: reference,
          referral_code_used: referralCodeUsed,
          referral_credit_kobo: referrerUserId ? REFERRAL_CREDIT_KOBO : 0,
          referrer_user_id: referrerUserId,
          status: "success",
          user_id: userId,
          webhook_verified: true,
        },
        { onConflict: "paystack_reference" },
      )
      .select(
        "amount_kobo, credit_applied_kobo, referral_credit_kobo, referrer_user_id, status, webhook_verified",
      )
      .single();

    if (upsertError || !upsertedPayment) {
      Sentry.withScope((scope) => {
        scope.setTag("paystack_reference", reference);
        scope.setTag("cv_id", cvId);
        scope.setTag("user_id", userId);
        Sentry.captureException(upsertError ?? new Error("Webhook upsert failed."));
      });

      return NextResponse.json({ error: "Webhook processing failed." }, { status: 500 });
    }

    Sentry.withScope((scope) => {
      scope.setTag("paystack_reference", reference);
      scope.setTag("cv_id", cvId);
      scope.setTag("user_id", userId);
      Sentry.captureMessage("Paystack webhook created a missing payment row via upsert.", "warning");
    });

    existingPayment = upsertedPayment;
  }

  if (event.data.amount !== existingPayment.amount_kobo) {
    Sentry.withScope((scope) => {
      scope.setTag("paystack_reference", reference);
      scope.setTag("cv_id", cvId);
      scope.setTag("user_id", userId);
      Sentry.captureMessage("Paystack webhook amount mismatch.", "warning");
    });

    return NextResponse.json({ received: true });
  }

  try {
    const { data: existingCv } = await supabase
      .from("cvs")
      .select("is_paid, pdf_fingerprint")
      .eq("id", cvId)
      .eq("user_id", userId)
      .maybeSingle();
    const paymentAlreadyVerified =
      existingPayment.status === "success" && existingPayment.webhook_verified;

    if (
      paymentAlreadyVerified
      && existingCv?.is_paid
      && existingCv.pdf_fingerprint
    ) {
      return NextResponse.json({ received: true });
    }

    if (!paymentAlreadyVerified) {
      const { error: paymentError } = await supabase
        .from("payments")
        .update({
          currency: event.data.currency ?? "NGN",
          status: "success",
          webhook_verified: true,
        })
        .eq("paystack_reference", reference);

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

      if (existingPayment.credit_applied_kobo > 0) {
        const { data: payerProfile, error: payerProfileError } = await supabase
          .from("profiles")
          .select("account_credit_kobo")
          .eq("id", userId)
          .single();

        if (payerProfileError || !payerProfile) {
          throw new Error(payerProfileError?.message ?? "Payer profile not found.");
        }

        const { error: payerCreditError } = await supabase
          .from("profiles")
          .update({
            account_credit_kobo: Math.max(
              0,
              payerProfile.account_credit_kobo - existingPayment.credit_applied_kobo,
            ),
          })
          .eq("id", userId);

        if (payerCreditError) {
          throw payerCreditError;
        }
      }

      if (
        existingPayment.referrer_user_id
        && existingPayment.referral_credit_kobo > 0
        && existingPayment.referrer_user_id !== userId
      ) {
        const { data: referrerProfile, error: referrerProfileError } = await supabase
          .from("profiles")
          .select("account_credit_kobo")
          .eq("id", existingPayment.referrer_user_id)
          .single();

        if (referrerProfileError || !referrerProfile) {
          throw new Error(referrerProfileError?.message ?? "Referrer profile not found.");
        }

        const { error: referralCreditError } = await supabase
          .from("profiles")
          .update({
            account_credit_kobo:
              referrerProfile.account_credit_kobo + existingPayment.referral_credit_kobo,
          })
          .eq("id", existingPayment.referrer_user_id);

        if (referralCreditError) {
          throw referralCreditError;
        }
      }
    }

    await generateAndDeliverCvAssets({ cvId, userId });

    try {
      await enqueueAiEnhancement({ cvId, userId });
    } catch (queueError) {
      Sentry.withScope((scope) => {
        scope.setTag("paystack_reference", reference);
        scope.setTag("cv_id", cvId);
        scope.setTag("user_id", userId);
        scope.setTag("ai_queue", "enqueue_failed");
        Sentry.captureException(queueError);
      });
    }

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
