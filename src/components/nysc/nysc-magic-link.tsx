"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { magicLinkSchema } from "@/lib/cv/validation";

export function NyscMagicLink({
  initialEmail = "",
}: {
  initialEmail?: string;
}) {
  const supabase = createClient();
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || window.location.origin;
  const [email, setEmail] = useState(initialEmail);
  const [statusMessage, setStatusMessage] = useState(
    "Verify your email with a magic link. That unlocks NYSC community submissions without creating a password.",
  );
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validation = magicLinkSchema.safeParse({ email });
    if (!validation.success) {
      setStatusMessage(validation.error.issues[0]?.message ?? "Enter a valid email address.");
      return;
    }

    setIsPending(true);
    setStatusMessage("Sending your magic link...");

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${appUrl}/auth/callback?next=${encodeURIComponent("/nysc/ppa-companies?submit=1")}`,
        },
      });

      if (error) {
        throw error;
      }

      setStatusMessage("Magic link sent. Open it on this device, then come back here to submit.");
    } catch (error) {
      setStatusMessage(
        error instanceof Error ? error.message : "Unable to send the magic link right now.",
      );
    } finally {
      setIsPending(false);
    }
  }

  return (
    <form className="grid gap-3" onSubmit={handleSubmit}>
      <input
        className="min-h-12 rounded-[var(--radius-input)] border border-border bg-white px-4"
        onChange={(event) => setEmail(event.target.value)}
        placeholder="name@example.com"
        type="email"
        value={email}
      />
      <button
        className="inline-flex min-h-12 items-center justify-center rounded-[var(--radius-input)] bg-[var(--accent)] px-4 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
        disabled={isPending}
        type="submit"
      >
        {isPending ? "Sending link..." : "Verify email to submit"}
      </button>
      <p className="rounded-[var(--radius-input)] border border-[var(--border-light)] bg-white/70 px-4 py-3 text-sm leading-6 text-[var(--ink-light)]">
        {statusMessage}
      </p>
    </form>
  );
}
