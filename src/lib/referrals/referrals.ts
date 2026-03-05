import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { REFERRAL_COOKIE_NAME, normalizeReferralCode } from "./constants";

export async function applyPendingReferralAttribution({
  userId,
}: {
  userId: string;
}) {
  const cookieStore = await cookies();
  const referralCode = normalizeReferralCode(
    cookieStore.get(REFERRAL_COOKIE_NAME)?.value,
  );

  if (!referralCode) {
    return null;
  }

  const supabase = createAdminClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, referred_by, referral_code")
    .eq("id", userId)
    .maybeSingle();

  if (!profile || profile.referred_by || profile.referral_code === referralCode) {
    return null;
  }

  const { data: referrer } = await supabase
    .from("profiles")
    .select("id, referral_code")
    .eq("referral_code", referralCode)
    .maybeSingle();

  if (!referrer || referrer.id === userId) {
    return null;
  }

  const { error } = await supabase
    .from("profiles")
    .update({ referred_by: referrer.id })
    .eq("id", userId)
    .is("referred_by", null);

  if (error) {
    throw new Error(error.message);
  }

  return referrer;
}
