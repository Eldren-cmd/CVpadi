export const PAYMENT_PRICES_KOBO = {
  cv_download: 150_000,
  cv_redownload: 50_000,
  cover_letter: 80_000,
  premium_template: 50_000,
} as const;

export const PAYMENT_CURRENCY = "NGN";

export const CHECKOUT_CHANNELS = [
  "card",
  "bank",
  "ussd",
  "bank_transfer",
] as const;

export const DEFAULT_PAYMENT_TYPE = "cv_download";

export function formatKoboToNaira(amountKobo: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: PAYMENT_CURRENCY,
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(amountKobo / 100);
}

export function getAppliedCreditKobo({
  accountCreditKobo,
  amountKobo,
}: {
  accountCreditKobo: number;
  amountKobo: number;
}) {
  return Math.max(0, Math.min(accountCreditKobo, amountKobo));
}
