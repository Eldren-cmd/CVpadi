import type { DEFAULT_PAYMENT_TYPE, PAYMENT_PRICES_KOBO } from "./constants";

export type PaymentType = keyof typeof PAYMENT_PRICES_KOBO;

export type PaymentRowStatus = "pending" | "success" | "failed";

export interface InitializePaymentResponse {
  accessCode: string;
  amountKobo: number;
  authorizationUrl: string;
  currency: string;
  paymentType: PaymentType;
  reference: string;
}

export interface PaymentStatusResponse {
  amountKobo: number;
  cvUnlocked: boolean;
  currency: string;
  gatewayStatus: string | null;
  paymentStatus: PaymentRowStatus;
  paymentType: PaymentType;
  reference: string;
  webhookVerified: boolean;
}

export interface DeliveryLinksResponse {
  jpgUrl: string;
  pdfUrl: string;
}

export interface PaystackInitializeApiResponse {
  data: {
    access_code: string;
    authorization_url: string;
    reference: string;
  };
  message: string;
  status: boolean;
}

export interface PaystackVerifyApiResponse {
  data: {
    amount: number;
    currency: string;
    gateway_response?: string;
    metadata?: Record<string, unknown> | string | null;
    reference: string;
    status: string;
  };
  message: string;
  status: boolean;
}

export interface PaystackChargeSuccessEvent {
  data: {
    amount: number;
    currency?: string;
    metadata?: Record<string, unknown> | string | null;
    reference: string;
    status: string;
  };
  event: string;
}

export type DefaultPaymentType = typeof DEFAULT_PAYMENT_TYPE;
