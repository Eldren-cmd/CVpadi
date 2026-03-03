"use client";

import { DEFAULT_PAYMENT_TYPE, PAYMENT_PRICES_KOBO, formatKoboToNaira } from "@/lib/payments/constants";
import type {
  DeliveryLinksResponse,
  InitializePaymentResponse,
  PaymentStatusResponse,
} from "@/lib/payments/types";
import Script from "next/script";
import { useEffect, useMemo, useRef, useState } from "react";

declare global {
  interface Window {
    PaystackPop?: new () => {
      resumeTransaction: (accessCode: string) => void;
    };
  }
}

type CheckoutState = "idle" | "preparing" | "pending" | "paid" | "failed";

export function PaymentPanel({
  cvId,
  initialPaymentReference,
  isPaid,
}: {
  cvId: string;
  initialPaymentReference?: string | null;
  isPaid: boolean;
}) {
  const [checkoutState, setCheckoutState] = useState<CheckoutState>(isPaid ? "paid" : "idle");
  const [statusMessage, setStatusMessage] = useState<string>(
    isPaid
      ? "Payment confirmed. This CV is unlocked."
      : "Cards, bank transfer, and USSD are enabled in the Paystack checkout.",
  );
  const [reference, setReference] = useState<string | null>(initialPaymentReference ?? null);
  const [accessCode, setAccessCode] = useState<string | null>(null);
  const [authorizationUrl, setAuthorizationUrl] = useState<string | null>(null);
  const [gatewayStatus, setGatewayStatus] = useState<string | null>(null);
  const [isScriptReady, setIsScriptReady] = useState(false);
  const [deliveryLinks, setDeliveryLinks] = useState<DeliveryLinksResponse | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const statusCheckRef = useRef<(() => Promise<void>) | null>(null);
  const amountLabel = useMemo(
    () => formatKoboToNaira(PAYMENT_PRICES_KOBO[DEFAULT_PAYMENT_TYPE]),
    [],
  );

  useEffect(() => {
    if (!isPaid) {
      return;
    }

    setCheckoutState("paid");
    setStatusMessage("Payment confirmed. This CV is unlocked.");
    stopPolling();
    if (!deliveryLinks) {
      void fetchDeliveryLinks();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPaid]);

  useEffect(() => {
    if (!initialPaymentReference || isPaid) {
      return;
    }

    setReference(initialPaymentReference);
    setCheckoutState("pending");
    setStatusMessage("Checking the payment reference returned from Paystack.");
    startPolling(initialPaymentReference);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPaymentReference, isPaid]);

  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, []);

  function stopPolling() {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }

  async function checkPaymentStatus(referenceToCheck = reference) {
    if (!referenceToCheck) {
      return;
    }

    const response = await fetch(`/api/paystack/status/${referenceToCheck}`, {
      cache: "no-store",
    });

    if (!response.ok) {
      setCheckoutState("failed");
      setStatusMessage("Unable to read the payment status right now.");
      stopPolling();
      return;
    }

    const payload = (await response.json()) as PaymentStatusResponse;
    setGatewayStatus(payload.gatewayStatus);

    if (payload.cvUnlocked || (payload.paymentStatus === "success" && payload.webhookVerified)) {
      setCheckoutState("paid");
      setStatusMessage("Payment confirmed by the server. Your CV is unlocked.");
      stopPolling();
      void fetchDeliveryLinks();
      return;
    }

    if (payload.gatewayStatus === "failed" || payload.gatewayStatus === "abandoned") {
      setCheckoutState("failed");
      setStatusMessage("Paystack marked this payment attempt as incomplete.");
      stopPolling();
      return;
    }

    if (payload.gatewayStatus === "success") {
      setCheckoutState("pending");
      setStatusMessage(
        "Paystack shows success. Waiting for the verified webhook before unlocking the CV.",
      );
      return;
    }

    setCheckoutState("pending");
    setStatusMessage(
      "Payment is still pending. Keep this page open while Paystack sends the server confirmation.",
    );
  }

  statusCheckRef.current = checkPaymentStatus;

  async function fetchDeliveryLinks() {
    const response = await fetch(`/api/cv-assets/${cvId}`, {
      cache: "no-store",
    });

    if (!response.ok) {
      return;
    }

    const payload = (await response.json()) as DeliveryLinksResponse;
    setDeliveryLinks(payload);
  }

  function startPolling(referenceToCheck: string) {
    stopPolling();
    void checkPaymentStatus(referenceToCheck);
    pollingRef.current = setInterval(() => {
      if (statusCheckRef.current) {
        void statusCheckRef.current();
      }
    }, 5000);
  }

  async function openCheckout() {
    setCheckoutState("preparing");
    setStatusMessage("Preparing the Paystack checkout...");

    const response = await fetch("/api/paystack/initialize", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        cvId,
        paymentType: DEFAULT_PAYMENT_TYPE,
      }),
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      setCheckoutState("failed");
      setStatusMessage(payload?.error ?? "Unable to start the checkout.");
      return;
    }

    const payload = (await response.json()) as InitializePaymentResponse;
    setAccessCode(payload.accessCode);
    setAuthorizationUrl(payload.authorizationUrl);
    setReference(payload.reference);
    setCheckoutState("pending");
    setStatusMessage(
      "Checkout opened. Complete the payment and keep this page open for the webhook confirmation.",
    );

    startPolling(payload.reference);

    if (isScriptReady && window.PaystackPop) {
      const popup = new window.PaystackPop();
      popup.resumeTransaction(payload.accessCode);
      return;
    }

    window.location.assign(payload.authorizationUrl);
  }

  function reopenCheckout() {
    if (isScriptReady && accessCode && window.PaystackPop) {
      const popup = new window.PaystackPop();
      popup.resumeTransaction(accessCode);
      return;
    }

    if (authorizationUrl) {
      window.location.assign(authorizationUrl);
    }
  }

  return (
    <section className="rounded-[var(--radius-card)] border border-border bg-surface p-5 shadow-[var(--shadow-card)]">
      <Script
        src="https://js.paystack.co/v2/inline.js"
        strategy="afterInteractive"
        onLoad={() => setIsScriptReady(true)}
      />

      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.24em] text-[var(--ink-light)]">
            Payment
          </p>
          <h2 className="mt-2 font-heading text-2xl text-foreground">Unlock your CV download</h2>
        </div>
        <span className="rounded-full bg-[var(--accent-light)] px-3 py-2 font-mono text-sm text-[var(--accent)]">
          {amountLabel}
        </span>
      </div>

      <p className="mt-4 text-sm leading-6 text-[var(--ink-light)]">
        Cards, bank transfer, and USSD are enabled in the Paystack modal. The frontend
        does not trust its own success callback. Unlocking waits for the verified webhook.
      </p>

      <div className="mt-5 rounded-[var(--radius-input)] border border-[var(--border-light)] bg-white/70 px-4 py-3 text-sm leading-6 text-[var(--ink-light)]">
        {statusMessage}
      </div>

      {reference ? (
        <div className="mt-4 rounded-[var(--radius-input)] bg-[var(--bg)] px-4 py-3 font-mono text-xs text-foreground">
          Reference: {reference}
        </div>
      ) : null}

      {gatewayStatus ? (
        <p className="mt-3 text-xs uppercase tracking-[0.18em] text-[var(--ink-faint)]">
          Gateway status: {gatewayStatus}
        </p>
      ) : null}

      {checkoutState === "paid" ? (
        <div className="mt-5 grid gap-3">
          <div className="rounded-[var(--radius-input)] border border-[var(--green)] bg-[var(--green-light)] px-4 py-3 text-sm text-[var(--green)]">
            Payment verified. Your PDF and WhatsApp JPG were prepared on the server.
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              className="inline-flex min-h-12 items-center justify-center rounded-[var(--radius-input)] border border-border px-4 text-sm font-medium text-foreground"
              onClick={() => {
                void fetchDeliveryLinks();
              }}
              type="button"
            >
              Refresh download links
            </button>
            {deliveryLinks ? (
              <>
                <a
                  className="inline-flex min-h-12 items-center justify-center rounded-[var(--radius-input)] bg-[var(--accent)] px-4 text-sm font-medium text-white"
                  href={deliveryLinks.pdfUrl}
                  rel="noreferrer"
                  target="_blank"
                >
                  Download PDF
                </a>
                <a
                  className="inline-flex min-h-12 items-center justify-center rounded-[var(--radius-input)] border border-border px-4 text-sm font-medium text-foreground"
                  href={deliveryLinks.jpgUrl}
                  rel="noreferrer"
                  target="_blank"
                >
                  Open JPG
                </a>
              </>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="mt-5 flex flex-col gap-3">
          <button
            className="inline-flex min-h-12 items-center justify-center rounded-[var(--radius-input)] bg-[var(--accent)] px-4 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
            disabled={checkoutState === "preparing"}
            onClick={openCheckout}
            type="button"
          >
            {checkoutState === "preparing" ? "Preparing checkout..." : `Pay ${amountLabel}`}
          </button>

          {checkoutState === "pending" ? (
            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                className="inline-flex min-h-12 items-center justify-center rounded-[var(--radius-input)] border border-border px-4 text-sm font-medium text-foreground"
                onClick={() => {
                  if (statusCheckRef.current) {
                    void statusCheckRef.current();
                  }
                }}
                type="button"
              >
                Check payment status
              </button>
              <button
                className="inline-flex min-h-12 items-center justify-center rounded-[var(--radius-input)] border border-border px-4 text-sm font-medium text-foreground"
                onClick={reopenCheckout}
                type="button"
              >
                Reopen checkout
              </button>
            </div>
          ) : null}

          {checkoutState === "failed" ? (
            <button
              className="inline-flex min-h-12 items-center justify-center rounded-[var(--radius-input)] border border-border px-4 text-sm font-medium text-foreground"
              onClick={openCheckout}
              type="button"
            >
              Start a fresh payment attempt
            </button>
          ) : null}
        </div>
      )}
    </section>
  );
}
