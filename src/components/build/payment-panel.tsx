"use client";

import { DEFAULT_PAYMENT_TYPE, PAYMENT_PRICES_KOBO, formatKoboToNaira } from "@/lib/payments/constants";
import type {
  DeliveryLinksResponse,
  InitializePaymentResponse,
  PaymentStatusResponse,
} from "@/lib/payments/types";
import { Button } from "@/components/ui/Button";
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

const MAX_POLL_ATTEMPTS = 60;
const POLL_INTERVAL_MS = 3000;

export function PaymentPanel({
  availableCreditKobo,
  cvId,
  initialPaymentReference,
  isPaid,
  onPaid,
}: {
  availableCreditKobo: number;
  cvId: string;
  initialPaymentReference?: string | null;
  isPaid: boolean;
  onPaid?: () => void;
}) {
  const [checkoutState, setCheckoutState] = useState<CheckoutState>(isPaid ? "paid" : "idle");
  const [statusMessage, setStatusMessage] = useState<string>(
    isPaid
      ? "Payment confirmed. This CV is unlocked."
      : "",
  );
  const [reference, setReference] = useState<string | null>(initialPaymentReference ?? null);
  const [accessCode, setAccessCode] = useState<string | null>(null);
  const [authorizationUrl, setAuthorizationUrl] = useState<string | null>(null);
  const [gatewayStatus, setGatewayStatus] = useState<string | null>(null);
  const [isScriptReady, setIsScriptReady] = useState(false);
  const [deliveryLinks, setDeliveryLinks] = useState<DeliveryLinksResponse | null>(null);
  const [creditAppliedKobo, setCreditAppliedKobo] = useState(
    Math.min(availableCreditKobo, PAYMENT_PRICES_KOBO[DEFAULT_PAYMENT_TYPE]),
  );
  const [payableAmountKobo, setPayableAmountKobo] = useState(
    PAYMENT_PRICES_KOBO[DEFAULT_PAYMENT_TYPE]
      - Math.min(availableCreditKobo, PAYMENT_PRICES_KOBO[DEFAULT_PAYMENT_TYPE]),
  );
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollingAttemptRef = useRef(0);
  const isStatusCheckInFlightRef = useRef(false);
  const statusCheckRef = useRef<(() => Promise<void>) | null>(null);
  const [attemptCount, setAttemptCount] = useState(0);
  const [pollingTimedOut, setPollingTimedOut] = useState(false);
  const baseAmountLabel = useMemo(
    () => formatKoboToNaira(PAYMENT_PRICES_KOBO[DEFAULT_PAYMENT_TYPE]),
    [],
  );
  const amountLabel = useMemo(() => formatKoboToNaira(payableAmountKobo), [payableAmountKobo]);
  const creditAppliedLabel = useMemo(
    () => formatKoboToNaira(creditAppliedKobo),
    [creditAppliedKobo],
  );

  useEffect(() => {
    if (!isPaid) {
      return;
    }

    setCheckoutState("paid");
    setStatusMessage("Payment confirmed. This CV is unlocked.");
    onPaid?.();
    stopPolling();
    if (!deliveryLinks) {
      void fetchDeliveryLinks();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPaid, onPaid]);

  useEffect(() => {
    if (!initialPaymentReference || isPaid) {
      return;
    }

    setReference(initialPaymentReference);
    setCheckoutState("pending");
    setStatusMessage("Checking your payment now.");
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
      if (response.status === 401) {
        setCheckoutState("failed");
        setStatusMessage("Your session expired. Please sign in and check payment status again.");
        stopPolling();
        return;
      }

      setCheckoutState("pending");
      setStatusMessage("Still confirming payment. Retrying automatically...");
      setGatewayStatus(null);
      return;
    }

    const payload = (await response.json()) as PaymentStatusResponse;
    setCreditAppliedKobo(payload.creditAppliedKobo);
    setGatewayStatus(payload.gatewayStatus);
    setPayableAmountKobo(payload.amountKobo);

    if (payload.cvUnlocked || (payload.paymentStatus === "success" && payload.webhookVerified)) {
      setCheckoutState("paid");
      setStatusMessage("Payment confirmed. Your CV is unlocked.");
      onPaid?.();
      stopPolling();
      void fetchDeliveryLinks();
      return;
    }

    if (payload.gatewayStatus === "failed") {
      setCheckoutState("failed");
      setStatusMessage("This payment attempt was not completed.");
      stopPolling();
      return;
    }

    if (payload.gatewayStatus === "abandoned") {
      setCheckoutState("pending");
      setStatusMessage("Checkout was closed. Complete payment to unlock your CV.");
      return;
    }

    if (payload.gatewayStatus === "success") {
      setCheckoutState("pending");
      setStatusMessage(
        "Payment was successful. Confirming your CV unlock now.",
      );
      return;
    }

    setCheckoutState("pending");
    setStatusMessage(
      "Payment is still pending. Keep this page open while confirmation completes.",
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
    pollingAttemptRef.current = 0;
    setAttemptCount(0);
    setPollingTimedOut(false);

    const tick = async () => {
      if (isStatusCheckInFlightRef.current) {
        return;
      }

      if (pollingAttemptRef.current >= MAX_POLL_ATTEMPTS) {
        stopPolling();
        setPollingTimedOut(true);
        setStatusMessage(
          "Payment received. Still confirming. Click below to check again.",
        );
        return;
      }

      pollingAttemptRef.current += 1;
      setAttemptCount(pollingAttemptRef.current);

      isStatusCheckInFlightRef.current = true;
      try {
        await checkPaymentStatus(referenceToCheck);
      } finally {
        isStatusCheckInFlightRef.current = false;
      }
    };

    void tick();
    pollingRef.current = setInterval(() => {
      void tick();
    }, POLL_INTERVAL_MS);
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
    setCreditAppliedKobo(payload.creditAppliedKobo);
    setAuthorizationUrl(payload.authorizationUrl);
    setPayableAmountKobo(payload.amountKobo);
    setReference(payload.reference);
    if (payload.amountKobo === 0) {
      setCheckoutState("paid");
      setStatusMessage("Your account credit covered this purchase. The CV is unlocked.");
      onPaid?.();
      void fetchDeliveryLinks();
      return;
    }

    setCheckoutState("pending");
    setStatusMessage(
      "Checkout opened. Complete payment and keep this page open for confirmation.",
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
    <section
      className="relative rounded-[16px] border border-[var(--border)] bg-[var(--off-black)] p-5 shadow-[0_24px_70px_rgba(0,0,0,0.42)]"
      id="payment-panel"
    >
      <Script
        src="https://js.paystack.co/v2/inline.js"
        strategy="afterInteractive"
        onLoad={() => setIsScriptReady(true)}
      />

      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-[var(--mid)]">
            Your CV is ready
          </p>
          <h2 className="mt-2 font-heading text-4xl leading-none text-[var(--cream)]">
            {"\u20A6"}1,500
          </h2>
          <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--cream-dim)]">
            One-time / No subscription
          </p>
        </div>
        <span className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-2 font-mono text-[11px] uppercase tracking-[0.1em] text-[var(--cream-dim)]">
          {amountLabel}
        </span>
      </div>

      <p className="mt-4 text-sm leading-6 text-[var(--cream-dim)]">
        Pay once and download your CV instantly. Your PDF and WhatsApp-ready image will be
        sent to your email as soon as payment confirms.
      </p>

      {creditAppliedKobo > 0 ? (
        <p className="mt-3 text-sm leading-6 text-[var(--cream-dim)]">
          Account credit auto-applies before checkout. Base price {baseAmountLabel}, credit
          used {creditAppliedLabel}, payable now {amountLabel}.
        </p>
      ) : null}

      {statusMessage ? (
        <div className="mt-5 rounded-[10px] border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-sm leading-6 text-[var(--cream-dim)]">
          {statusMessage}
        </div>
      ) : null}

      {reference ? (
        <div className="mt-4 rounded-[10px] border border-[var(--border)] bg-[var(--surface)] px-4 py-3 font-mono text-xs text-[var(--cream)]">
          Reference: {reference}
        </div>
      ) : null}

      {gatewayStatus ? (
        <p className="mt-3 text-xs uppercase tracking-[0.18em] text-[var(--mid)]">
          Payment status: {gatewayStatus}
        </p>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        <span className="rounded-full border border-[var(--border)] bg-[var(--card)] px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--cream-dim)]">
          Card
        </span>
        <span className="rounded-full border border-[var(--border)] bg-[var(--card)] px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--cream-dim)]">
          Bank transfer
        </span>
        <span className="rounded-full border border-[var(--border)] bg-[var(--card)] px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--cream-dim)]">
          USSD
        </span>
        <span className="rounded-full border border-[var(--border)] bg-[var(--card)] px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--cream-dim)]">
          Paystack secured
        </span>
      </div>

      {checkoutState === "paid" ? (
        <div className="mt-5 grid gap-3">
          <div className="rounded-[10px] border border-[var(--green)] bg-[var(--green-glow)] px-4 py-3 text-sm text-[var(--green)]">
            Payment confirmed. Your PDF and WhatsApp image are ready.
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              onClick={() => {
                void fetchDeliveryLinks();
              }}
              variant="ghost"
            >
              Refresh download links
            </Button>
            {deliveryLinks ? (
              <>
                <a
                  className="inline-flex min-h-11 items-center justify-center rounded-[8px] bg-[var(--green)] px-4 font-display text-sm text-[var(--black)] transition-all duration-200 hover:translate-y-[-2px] hover:bg-[#33EE8A]"
                  href={deliveryLinks.pdfUrl}
                  rel="noreferrer"
                  target="_blank"
                >
                  Download PDF
                </a>
                <a
                  className="inline-flex min-h-11 items-center justify-center rounded-[8px] border border-[var(--border)] px-4 font-display text-sm text-[var(--cream-dim)] transition-all duration-200 hover:border-[var(--border-mid)] hover:bg-[var(--card)] hover:text-[var(--cream)]"
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
          <Button
            disabled={checkoutState === "preparing"}
            loading={checkoutState === "preparing"}
            onClick={openCheckout}
            variant="primary"
          >
            {checkoutState === "preparing" ? "Preparing checkout..." : `Pay ${amountLabel}`}
          </Button>

          {checkoutState === "pending" ? (
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                onClick={() => {
                  setPollingTimedOut(false);
                  if (statusCheckRef.current) {
                    void statusCheckRef.current();
                  }
                }}
                variant="ghost"
              >
                Check payment status
              </Button>
              <Button
                onClick={reopenCheckout}
                variant="ghost"
              >
                Reopen checkout
              </Button>
            </div>
          ) : null}

          {checkoutState === "pending" && pollingTimedOut ? (
            <div className="rounded-[12px] border border-[var(--gold)] bg-[var(--gold-glow)] px-6 py-5 text-center">
              <p className="font-display text-base text-[var(--cream)]">
                Payment received. Still confirming
              </p>
              <p className="mt-2 text-sm text-[var(--cream-dim)]">
                Your payment was successful. If this page has not unlocked yet, click below to
                check again.
              </p>
              <button
                className="mt-4 inline-flex min-h-11 items-center justify-center rounded-[8px] bg-[var(--gold)] px-6 font-display text-sm text-[var(--black)] transition-all duration-200 hover:translate-y-[-2px]"
                onClick={() => window.location.reload()}
                type="button"
              >
                Check payment status -&gt;
              </button>
              <p className="mt-3 font-mono text-[11px] text-[var(--mid)]">
                Your CV will not be lost. Check your email. It may have already arrived.
              </p>
            </div>
          ) : null}

          {checkoutState === "failed" ? (
            <Button
              onClick={openCheckout}
              variant="danger"
            >
              Start a fresh payment attempt
            </Button>
          ) : null}
        </div>
      )}

      {checkoutState === "pending" && !pollingTimedOut ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-[16px] bg-[rgba(10,10,8,0.74)]">
          <div className="rounded-[12px] border border-[var(--border)] bg-[var(--off-black)] px-6 py-6 text-center">
            <span className="mx-auto mb-4 block h-12 w-12 animate-spin rounded-full border-[3px] border-[var(--faint)] border-t-[var(--green)]" />
            <p className="font-display text-lg text-[var(--cream)]">Confirming your payment...</p>
            <p className="mt-2 text-sm text-[var(--mid)]">
              This usually takes a few seconds. Do not refresh the page.
            </p>
            <p className="mt-3 font-mono text-[11px] text-[var(--faint)]">
              {attemptCount} / {MAX_POLL_ATTEMPTS} checks completed
            </p>
          </div>
        </div>
      ) : null}
    </section>
  );
}

