import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import {
  CHECKOUT_CHANNELS,
  DEFAULT_PAYMENT_TYPE,
  PAYMENT_CURRENCY,
  PAYMENT_PRICES_KOBO,
} from "./constants";
import type {
  PaymentType,
  PaystackInitializeApiResponse,
  PaystackVerifyApiResponse,
} from "./types";

const PAYSTACK_BASE_URL = "https://api.paystack.co";

function getSecretKey() {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;

  if (!secretKey) {
    throw new Error("PAYSTACK_SECRET_KEY is missing.");
  }

  return secretKey;
}

export function getPaymentAmount(paymentType: PaymentType = DEFAULT_PAYMENT_TYPE) {
  return PAYMENT_PRICES_KOBO[paymentType];
}

export function createPaymentReference() {
  return `cvpadi_${randomUUID().replace(/-/g, "")}`;
}

export async function initializePaystackTransaction({
  amountKobo,
  callbackUrl,
  email,
  metadata,
  reference,
}: {
  amountKobo: number;
  callbackUrl: string;
  email: string;
  metadata: Record<string, unknown>;
  reference: string;
}) {
  const response = await fetch(`${PAYSTACK_BASE_URL}/transaction/initialize`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getSecretKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: String(amountKobo),
      callback_url: callbackUrl,
      channels: CHECKOUT_CHANNELS,
      currency: PAYMENT_CURRENCY,
      email,
      metadata: JSON.stringify(metadata),
      reference,
    }),
    cache: "no-store",
  });

  const payload = (await response.json()) as PaystackInitializeApiResponse;

  if (!response.ok || !payload.status) {
    throw new Error(payload.message || "Paystack transaction initialization failed.");
  }

  return payload.data;
}

export async function verifyPaystackTransaction(reference: string) {
  const response = await fetch(`${PAYSTACK_BASE_URL}/transaction/verify/${reference}`, {
    headers: {
      Authorization: `Bearer ${getSecretKey()}`,
    },
    cache: "no-store",
  });

  const payload = (await response.json()) as PaystackVerifyApiResponse;

  if (!response.ok || !payload.status) {
    throw new Error(payload.message || "Paystack transaction verification failed.");
  }

  return payload.data;
}

export function verifyPaystackSignature(rawBody: string, signature: string | null) {
  if (!signature) {
    return false;
  }

  const expected = createHmac("sha512", getSecretKey()).update(rawBody).digest("hex");
  const expectedBuffer = Buffer.from(expected, "utf8");
  const receivedBuffer = Buffer.from(signature, "utf8");

  if (expectedBuffer.length !== receivedBuffer.length) {
    return false;
  }

  return timingSafeEqual(expectedBuffer, receivedBuffer);
}

export function parsePaymentMetadata(
  metadata: Record<string, unknown> | string | null | undefined,
) {
  if (!metadata) {
    return {};
  }

  if (typeof metadata === "string") {
    try {
      return (JSON.parse(metadata) as Record<string, unknown>) ?? {};
    } catch {
      return {};
    }
  }

  return metadata;
}
