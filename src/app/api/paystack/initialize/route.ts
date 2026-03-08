import * as Sentry from "@sentry/nextjs";
import { enqueueAiEnhancement } from "@/lib/ai/queue";
import { generateAndDeliverCvAssets } from "@/lib/delivery/cv-delivery";
import { getAppliedCreditKobo } from "@/lib/payments/constants";
import { createPaymentReference, getPaymentAmount, initializePaystackTransaction } from "@/lib/payments/paystack";
import type { PaymentType } from "@/lib/payments/types";
import { REFERRAL_CREDIT_KOBO } from "@/lib/referrals/constants";
import { createAdminClient } from "@/lib/supabase/admin";
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

  const adminSupabase = createAdminClient();
  const { data: profile, error: profileError } = await adminSupabase
    .from("profiles")
    .select("account_credit_kobo, referred_by")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return NextResponse.json({ error: profileError?.message ?? "Profile not found." }, { status: 404 });
  }

  const baseAmountKobo = getPaymentAmount(body.paymentType);
  const creditAppliedKobo = getAppliedCreditKobo({
    accountCreditKobo: profile.account_credit_kobo,
    amountKobo: baseAmountKobo,
  });
  const amountKobo = baseAmountKobo - creditAppliedKobo;
  const reference = createPaymentReference();
  let referralCodeUsed: string | null = null;
  const referrerUserId = profile.referred_by ?? null;

  if (referrerUserId) {
    const { data: referrer } = await adminSupabase
      .from("profiles")
      .select("referral_code")
      .eq("id", referrerUserId)
      .maybeSingle();

    if (referrer) {
      referralCodeUsed = referrer.referral_code;
    }
  }

  const paymentRecord = {
    amount_kobo: amountKobo,
    base_amount_kobo: baseAmountKobo,
    credit_applied_kobo: creditAppliedKobo,
    currency: "NGN",
    cv_id: cv.id,
    paystack_reference: reference,
    payment_type: body.paymentType,
    referral_code_used: referralCodeUsed,
    referral_credit_kobo: referrerUserId ? REFERRAL_CREDIT_KOBO : 0,
    referrer_user_id: referrerUserId,
    status: "pending",
    user_id: user.id,
    webhook_verified: false,
  };

  if (amountKobo === 0) {
    const { error: paymentError } = await adminSupabase.from("payments").insert({
      ...paymentRecord,
      status: "success",
      webhook_verified: true,
    });

    if (paymentError) {
      return NextResponse.json({ error: paymentError.message }, { status: 500 });
    }

    if (creditAppliedKobo > 0) {
      const { error: creditError } = await adminSupabase
        .from("profiles")
        .update({ account_credit_kobo: Math.max(0, profile.account_credit_kobo - creditAppliedKobo) })
        .eq("id", user.id);

      if (creditError) {
        return NextResponse.json({ error: creditError.message }, { status: 500 });
      }
    }

    const { error: cvUnlockError } = await adminSupabase
      .from("cvs")
      .update({ is_paid: true })
      .eq("id", cv.id)
      .eq("user_id", user.id);

    if (cvUnlockError) {
      return NextResponse.json({ error: cvUnlockError.message }, { status: 500 });
    }

    if (referrerUserId) {
      const { data: referrerProfile, error: referrerProfileError } = await adminSupabase
        .from("profiles")
        .select("account_credit_kobo")
        .eq("id", referrerUserId)
        .maybeSingle();

      if (referrerProfileError) {
        return NextResponse.json({ error: referrerProfileError.message }, { status: 500 });
      }

      if (referrerProfile) {
        const { error: referrerCreditError } = await adminSupabase
          .from("profiles")
          .update({
            account_credit_kobo: referrerProfile.account_credit_kobo + REFERRAL_CREDIT_KOBO,
          })
          .eq("id", referrerUserId);

        if (referrerCreditError) {
          return NextResponse.json({ error: referrerCreditError.message }, { status: 500 });
        }
      }
    }

    await generateAndDeliverCvAssets({ cvId: cv.id, userId: user.id });
    try {
      await enqueueAiEnhancement({ cvId: cv.id, userId: user.id });
    } catch (queueError) {
      Sentry.withScope((scope) => {
        scope.setTag("cv_id", cv.id);
        scope.setTag("user_id", user.id);
        scope.setTag("payment_reference", reference);
        Sentry.captureException(queueError);
      });
    }

    return NextResponse.json({
      accessCode: "",
      amountKobo,
      authorizationUrl: "",
      baseAmountKobo,
      creditAppliedKobo,
      currency: "NGN",
      paymentType: body.paymentType,
      reference,
    });
  }

  const { error: paymentError } = await adminSupabase.from("payments").insert(paymentRecord);

  if (paymentError) {
    return NextResponse.json({ error: paymentError.message }, { status: 500 });
  }

  try {
    const transaction = await initializePaystackTransaction({
      amountKobo,
      callbackUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? "https://cvpadi.com"}/build`,
      email: user.email ?? "",
      metadata: {
        creditAppliedKobo,
        cvId: cv.id,
        paymentType: body.paymentType,
        referralCodeUsed,
        userId: user.id,
      },
      reference,
    });

    return NextResponse.json({
      accessCode: transaction.access_code,
      amountKobo,
      authorizationUrl: transaction.authorization_url,
      baseAmountKobo,
      creditAppliedKobo,
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

