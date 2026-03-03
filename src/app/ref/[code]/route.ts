import { NextResponse } from "next/server";
import {
  REFERRAL_COOKIE_MAX_AGE_SECONDS,
  REFERRAL_COOKIE_NAME,
  normalizeReferralCode,
} from "@/lib/referrals/constants";

export function GET(
  request: Request,
  { params }: { params: { code: string } },
) {
  const requestUrl = new URL(request.url);
  const referralCode = normalizeReferralCode(params.code);
  const redirectUrl = new URL("/build", requestUrl.origin);

  if (!referralCode) {
    return NextResponse.redirect(new URL("/", requestUrl.origin));
  }

  const response = NextResponse.redirect(redirectUrl);
  response.cookies.set({
    httpOnly: true,
    maxAge: REFERRAL_COOKIE_MAX_AGE_SECONDS,
    name: REFERRAL_COOKIE_NAME,
    path: "/",
    sameSite: "lax",
    secure: requestUrl.protocol === "https:",
    value: referralCode,
  });

  return response;
}
