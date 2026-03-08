export const REFERRAL_COOKIE_NAME = "cvpadi_referral_code";
export const REFERRAL_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;
export const REFERRAL_CREDIT_KOBO = 50_000;

export function normalizeReferralCode(value?: string | null) {
  if (!value) {
    return "";
  }

  return value.trim().toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8);
}

export function buildReferralUrl(referralCode: string) {
  const origin = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "https://cvpadi.com";
  return `${origin}/ref/${referralCode}`;
}
