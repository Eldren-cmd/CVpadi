"use client";

import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";
import { magicLinkSchema } from "@/lib/cv/validation";
import { useState } from "react";

export function SalaryMagicLink({
  initialEmail = "",
}: {
  initialEmail?: string;
}) {
  const supabase = createClient();
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || window.location.origin;
  const [email, setEmail] = useState(initialEmail);
  const [statusMessage, setStatusMessage] = useState(
    "Verify your email with a magic link to unlock salary submission.",
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
          emailRedirectTo: `${appUrl}/auth/callback?next=${encodeURIComponent("/salary?submit=1")}`,
        },
      });

      if (error) {
        throw error;
      }

      setStatusMessage("Magic link sent. Open it on this device, then return here.");
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
        className="min-h-11 rounded-[8px] border border-[var(--border)] bg-[var(--surface)] px-4 text-[var(--cream)]"
        onChange={(event) => setEmail(event.target.value)}
        placeholder="name@example.com"
        type="email"
        value={email}
      />
      <Button className="w-full" loading={isPending} type="submit" variant="primary">
        Verify email to submit
      </Button>
      <p className="rounded-[8px] border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-sm leading-6 text-[var(--cream-dim)]">
        {statusMessage}
      </p>
    </form>
  );
}
