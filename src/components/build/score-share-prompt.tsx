"use client";

import { formatKoboToNaira } from "@/lib/payments/constants";
import { REFERRAL_CREDIT_KOBO, buildReferralUrl } from "@/lib/referrals/constants";
import { useMemo, useState } from "react";

export function ScoreSharePrompt({
  accountCreditKobo,
  name,
  onDismiss,
  referralCode,
  score,
}: {
  accountCreditKobo: number;
  name: string;
  onDismiss: () => void;
  referralCode: string;
  score: number;
}) {
  const [statusMessage, setStatusMessage] = useState("");
  const shareUrl = useMemo(() => {
    const origin =
      process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || window.location.origin;
    const params = new URLSearchParams({
      name,
      score: String(score),
    });

    return `${origin}/api/og/cv-score?${params.toString()}`;
  }, [name, score]);
  const referralUrl = useMemo(
    () => (referralCode ? buildReferralUrl(referralCode) : ""),
    [referralCode],
  );
  const rewardLabel = useMemo(
    () => formatKoboToNaira(REFERRAL_CREDIT_KOBO),
    [],
  );
  const creditBalanceLabel = useMemo(
    () => formatKoboToNaira(accountCreditKobo),
    [accountCreditKobo],
  );

  async function handleShare() {
    setStatusMessage("");

    const shareText = `My Nigerian CV score is ${score}. Check yours on CVPadi.`;

    if (navigator.share) {
      try {
        await navigator.share({
          text: shareText,
          title: "My Nigerian CV Score",
          url: shareUrl,
        });
        setStatusMessage("Shared.");
        return;
      } catch {
        // fall through to clipboard copy
      }
    }

    await handleCopy();
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setStatusMessage("Share link copied.");
    } catch {
      setStatusMessage("Copy failed. Open the card and copy the URL manually.");
    }
  }

  async function handleCopyReferralLink() {
    if (!referralUrl) {
      setStatusMessage("Referral link is not ready yet.");
      return;
    }

    try {
      await navigator.clipboard.writeText(referralUrl);
      setStatusMessage("Referral link copied.");
    } catch {
      setStatusMessage("Copy failed. Open the referral link and copy it manually.");
    }
  }

  async function handleShareReferralLink() {
    if (!referralUrl) {
      setStatusMessage("Referral link is not ready yet.");
      return;
    }

    const shareText = `I used CVPadi to sharpen my CV. Use my link and when your payment clears, I earn ${rewardLabel} credit toward my next CV update.`;

    if (navigator.share) {
      try {
        await navigator.share({
          text: shareText,
          title: "Use my CVPadi referral link",
          url: referralUrl,
        });
        setStatusMessage("Referral link shared.");
        return;
      } catch {
        // fall through to clipboard copy
      }
    }

    await handleCopyReferralLink();
  }

  return (
    <div className="rounded-[var(--radius-input)] border border-[var(--gold)] bg-[var(--card)] px-4 py-4 text-sm">
      <p className="font-medium text-[var(--cream)]">
        Looking good. Share your score now while the result still feels fresh.
      </p>
      <p className="mt-2 leading-6 text-[var(--cream-dim)]">
        Your CV score is ready. Share it while the momentum is fresh.
      </p>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <button
          className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-input)] bg-[var(--accent)] px-4 text-sm font-medium text-white"
          onClick={() => {
            void handleShare();
          }}
          type="button"
        >
          Share score
        </button>
        <button
          className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-input)] border border-border px-4 text-sm font-medium text-foreground"
          onClick={() => {
            void handleCopy();
          }}
          type="button"
        >
          Copy link
        </button>
        <a
          className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-input)] border border-border px-4 text-sm font-medium text-foreground"
          href={shareUrl}
          rel="noreferrer"
          target="_blank"
        >
          Open card
        </a>
      </div>

      <div className="mt-5 rounded-[var(--radius-input)] border border-[var(--border)] bg-[var(--surface)] px-4 py-4">
        <p className="font-medium text-[var(--cream)]">
          Know someone job hunting? Send them your referral link.
        </p>
        <p className="mt-2 leading-6 text-[var(--cream-dim)]">
          When someone signs up through your link and pays for their CV,
          you earn {rewardLabel} toward your next CV purchase. Your current credit
          balance is {creditBalanceLabel}.
        </p>
        {referralUrl ? (
          <>
            <div className="mt-4 rounded-[var(--radius-input)] border border-[var(--border)] bg-[var(--off-black)] px-4 py-3 font-mono text-xs text-[var(--cream)]">
              {referralUrl}
            </div>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <button
                className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-input)] bg-[var(--accent)] px-4 text-sm font-medium text-white"
                onClick={() => {
                  void handleShareReferralLink();
                }}
                type="button"
              >
                Share referral link
              </button>
              <button
                className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-input)] border border-border px-4 text-sm font-medium text-foreground"
                onClick={() => {
                  void handleCopyReferralLink();
                }}
                type="button"
              >
                Copy referral link
              </button>
              <a
                className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-input)] border border-border px-4 text-sm font-medium text-foreground"
                href={referralUrl}
                rel="noreferrer"
                target="_blank"
              >
                Open referral page
              </a>
            </div>
          </>
        ) : (
          <p className="mt-4 text-xs uppercase tracking-[0.14em] text-[var(--cream-dim)]">
            Referral code still loading.
          </p>
        )}
      </div>

      {statusMessage ? (
        <p className="mt-3 text-xs uppercase tracking-[0.14em] text-[var(--cream-dim)]">
          {statusMessage}
        </p>
      ) : null}

      <button
        className="mt-4 text-sm font-medium text-[var(--accent)]"
        onClick={onDismiss}
        type="button"
      >
        Dismiss
      </button>
    </div>
  );
}
