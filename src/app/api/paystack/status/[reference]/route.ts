import { verifyPaystackTransaction } from "@/lib/payments/paystack";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: { reference: string } },
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: payment, error: paymentError } = await supabase
    .from("payments")
    .select(
      "amount_kobo, base_amount_kobo, credit_applied_kobo, currency, cv_id, payment_type, status, webhook_verified",
    )
    .eq("paystack_reference", params.reference)
    .eq("user_id", user.id)
    .single();

  if (paymentError || !payment) {
    return NextResponse.json({ error: "Payment record not found." }, { status: 404 });
  }

  let gatewayStatus: string | null = null;

  if (!payment.webhook_verified) {
    try {
      const verified = await verifyPaystackTransaction(params.reference);
      gatewayStatus = verified.status;
    } catch {
      gatewayStatus = null;
    }
  }

  const { data: cv } = await supabase
    .from("cvs")
    .select("is_paid")
    .eq("id", payment.cv_id)
    .eq("user_id", user.id)
    .maybeSingle();

  return NextResponse.json({
    amountKobo: payment.amount_kobo,
    baseAmountKobo: payment.base_amount_kobo,
    creditAppliedKobo: payment.credit_applied_kobo,
    currency: payment.currency,
    cvUnlocked: Boolean(cv?.is_paid),
    gatewayStatus,
    paymentStatus: payment.status,
    paymentType: payment.payment_type,
    reference: params.reference,
    webhookVerified: payment.webhook_verified,
  });
}
