"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";
import { loginSchema, magicLinkSchema } from "@/lib/cv/validation";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

type PasswordValues = z.infer<typeof loginSchema>;
type MagicLinkValues = z.infer<typeof magicLinkSchema>;

type MessageTone = "error" | "success" | "neutral";

export function LoginForm({
  initialEmail,
  nextPath,
}: {
  initialEmail?: string;
  nextPath: string;
}) {
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "https://cvpadi.com").replace(/\/$/, "");
  const router = useRouter();
  const [mode, setMode] = useState<"password" | "magic">("password");
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<MessageTone>("neutral");
  const [isPending, startTransition] = useTransition();
  const [isGooglePending, setIsGooglePending] = useState(false);
  const supabase = createClient();

  const passwordForm = useForm<PasswordValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: initialEmail ?? "",
      password: "",
    },
  });

  const magicLinkForm = useForm<MagicLinkValues>({
    resolver: zodResolver(magicLinkSchema),
    defaultValues: {
      email: initialEmail ?? "",
    },
  });

  const handlePasswordSubmit = passwordForm.handleSubmit((values) => {
    setMessage("");
    startTransition(async () => {
      const { error } = await supabase.auth.signInWithPassword(values);

      if (error) {
        setMessageTone("error");
        setMessage(error.message);
        return;
      }

      router.push(nextPath);
      router.refresh();
    });
  });

  const handleSignup = passwordForm.handleSubmit((values) => {
    setMessage("");
    startTransition(async () => {
      const { error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          emailRedirectTo: `${appUrl}/auth/callback?next=${encodeURIComponent(nextPath)}`,
        },
      });

      if (error) {
        setMessageTone("error");
        setMessage(error.message);
        return;
      }

      setMessageTone("success");
      setMessage("Account created. Check your email to confirm.");
    });
  });

  const handleMagicLinkSubmit = magicLinkForm.handleSubmit((values) => {
    setMessage("");
    startTransition(async () => {
      const { error } = await supabase.auth.signInWithOtp({
        email: values.email,
        options: {
          emailRedirectTo: `${appUrl}/auth/callback?next=${encodeURIComponent(nextPath)}`,
        },
      });

      if (error) {
        setMessageTone("error");
        setMessage(error.message);
        return;
      }

      setMessageTone("success");
      setMessage("Magic link sent. Open it on this device to continue.");
    });
  });

  const handleGoogle = async () => {
    setMessage("");
    setIsGooglePending(true);

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${appUrl}/auth/callback?next=${encodeURIComponent(nextPath)}`,
      },
    });

    if (error) {
      setMessageTone("error");
      setMessage(error.message);
      setIsGooglePending(false);
      return;
    }

    if (data.url) {
      router.push(data.url);
    }

    setIsGooglePending(false);
  };

  return (
    <div className="rounded-[16px] border border-[var(--border)] bg-[var(--off-black)] p-6 shadow-[0_24px_64px_rgba(0,0,0,0.4)] sm:p-8">
      <h1 className="font-display text-[28px] leading-tight text-[var(--cream)]">Sign in to CVPadi</h1>
      <p className="mt-2 text-sm text-[var(--cream-dim)]">
        Continue where you stopped in your Nigerian CV build.
      </p>

      <div className="relative mt-6 grid grid-cols-2 rounded-full border border-[var(--border)] bg-[var(--surface)] p-1">
        <span
          aria-hidden="true"
          className={`pointer-events-none absolute bottom-1 top-1 w-[calc(50%-4px)] rounded-full bg-[var(--green)] transition-transform duration-300 ${mode === "password" ? "translate-x-0" : "translate-x-full"}`.trim()}
        />
        <button
          className={`relative z-10 min-h-10 rounded-full px-3 font-display text-sm transition-colors ${mode === "password" ? "text-[var(--black)]" : "text-[var(--cream-dim)]"}`.trim()}
          onClick={() => setMode("password")}
          type="button"
        >
          Email + password
        </button>
        <button
          className={`relative z-10 min-h-10 rounded-full px-3 font-display text-sm transition-colors ${mode === "magic" ? "text-[var(--black)]" : "text-[var(--cream-dim)]"}`.trim()}
          onClick={() => setMode("magic")}
          type="button"
        >
          Magic link
        </button>
      </div>

      {mode === "password" ? (
        <form className="mt-6 grid gap-4" onSubmit={handlePasswordSubmit}>
          <label className="fade-up grid gap-2 text-sm text-[var(--cream-dim)]">
            <span>Email</span>
            <input
              className="min-h-12 rounded-[8px] border border-[var(--border)] bg-[var(--surface)] px-4 text-[var(--cream)]"
              type="email"
              {...passwordForm.register("email")}
            />
            {passwordForm.formState.errors.email?.message ? (
              <span className="text-xs text-[var(--red)]">{passwordForm.formState.errors.email.message}</span>
            ) : null}
          </label>

          <label className="fade-up grid gap-2 text-sm text-[var(--cream-dim)]">
            <span>Password</span>
            <input
              className="min-h-12 rounded-[8px] border border-[var(--border)] bg-[var(--surface)] px-4 text-[var(--cream)]"
              type="password"
              {...passwordForm.register("password")}
            />
            {passwordForm.formState.errors.password?.message ? (
              <span className="text-xs text-[var(--red)]">{passwordForm.formState.errors.password.message}</span>
            ) : null}
          </label>

          <Button className="fade-up mt-2 w-full" loading={isPending} type="submit" variant="primary">
            Sign in
          </Button>

          <Button
            className="fade-up w-full"
            disabled={isPending}
            onClick={handleSignup}
            type="button"
            variant="ghost"
          >
            Create account
          </Button>
        </form>
      ) : (
        <form className="mt-6 grid gap-4" onSubmit={handleMagicLinkSubmit}>
          <label className="fade-up grid gap-2 text-sm text-[var(--cream-dim)]">
            <span>Email</span>
            <input
              className="min-h-12 rounded-[8px] border border-[var(--border)] bg-[var(--surface)] px-4 text-[var(--cream)]"
              type="email"
              {...magicLinkForm.register("email")}
            />
            {magicLinkForm.formState.errors.email?.message ? (
              <span className="text-xs text-[var(--red)]">{magicLinkForm.formState.errors.email.message}</span>
            ) : null}
          </label>

          <Button className="fade-up w-full" loading={isPending} type="submit" variant="primary">
            Send magic link
          </Button>
        </form>
      )}

      <button
        className="mt-4 inline-flex min-h-12 w-full items-center justify-center gap-3 rounded-[8px] border border-[var(--border)] bg-transparent px-4 font-display text-sm text-[var(--cream-dim)] transition-all duration-200 hover:border-[var(--border-mid)] hover:bg-[var(--card)] hover:text-[var(--cream)]"
        disabled={isGooglePending}
        onClick={handleGoogle}
        type="button"
      >
        {isGooglePending ? (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent" />
        ) : (
          <svg aria-hidden="true" height="18" viewBox="0 0 24 24" width="18">
            <path
              d="M23.5 12.3c0-.8-.1-1.6-.3-2.3H12v4.4h6.4a5.5 5.5 0 0 1-2.4 3.6v3h3.9c2.3-2.1 3.6-5.1 3.6-8.7Z"
              fill="#4285F4"
            />
            <path
              d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-3.9-3c-1.1.8-2.5 1.3-4 1.3-3 0-5.6-2-6.5-4.8H1.4v3.1A12 12 0 0 0 12 24Z"
              fill="#34A853"
            />
            <path
              d="M5.5 14.6a7.2 7.2 0 0 1 0-4.6V7H1.4a12 12 0 0 0 0 10.6l4.1-3Z"
              fill="#FBBC04"
            />
            <path
              d="M12 4.8c1.7 0 3.2.6 4.4 1.7l3.3-3.3A12 12 0 0 0 1.4 7l4.1 3a7 7 0 0 1 6.5-5.2Z"
              fill="#EA4335"
            />
          </svg>
        )}
        Continue with Google
      </button>

      {message ? (
        <div
          className={`mt-4 slide-down rounded-[8px] border px-4 py-3 text-sm ${messageTone === "error" ? "border-[var(--red)] bg-[var(--red-glow)] text-[var(--red)]" : messageTone === "success" ? "border-[var(--green)] bg-[var(--green-glow)] text-[var(--green)]" : "border-[var(--border)] bg-[var(--card)] text-[var(--cream-dim)]"}`.trim()}
          style={messageTone === "error" ? { borderLeftWidth: "3px" } : undefined}
        >
          {messageTone === "success" ? (
            <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full border border-[var(--green)] check-bounce">
              ?
            </span>
          ) : null}
          {message}
        </div>
      ) : null}
    </div>
  );
}

