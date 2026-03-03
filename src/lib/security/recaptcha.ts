const GOOGLE_RECAPTCHA_VERIFY_URL = "https://www.google.com/recaptcha/api/siteverify";
const MINIMUM_RECAPTCHA_SCORE = 0.5;

export async function verifyRecaptchaToken({
  expectedAction,
  token,
}: {
  expectedAction: string;
  token?: string | null;
}) {
  const secretKey = process.env.RECAPTCHA_SECRET_KEY;

  if (!secretKey) {
    return {
      ok: true,
      reason: "missing_server_secret",
      skipped: true,
    };
  }

  if (!token) {
    return {
      ok: false,
      reason: "missing_token",
      skipped: false,
    };
  }

  const body = new URLSearchParams({
    response: token,
    secret: secretKey,
  });

  const response = await fetch(GOOGLE_RECAPTCHA_VERIFY_URL, {
    body,
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    method: "POST",
  });

  if (!response.ok) {
    return {
      ok: false,
      reason: "verification_request_failed",
      skipped: false,
    };
  }

  const payload = (await response.json()) as {
    action?: string;
    score?: number;
    success?: boolean;
  };

  if (!payload.success) {
    return {
      ok: false,
      reason: "provider_rejected",
      skipped: false,
    };
  }

  if (payload.action && payload.action !== expectedAction) {
    return {
      ok: false,
      reason: "action_mismatch",
      skipped: false,
    };
  }

  if (typeof payload.score === "number" && payload.score < MINIMUM_RECAPTCHA_SCORE) {
    return {
      ok: false,
      reason: "low_score",
      skipped: false,
    };
  }

  return {
    ok: true,
    reason: "verified",
    skipped: false,
  };
}
