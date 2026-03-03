"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { createClient } from "@/lib/supabase/client";
import { loginSchema, magicLinkSchema } from "@/lib/cv/validation";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

type PasswordValues = z.infer<typeof loginSchema>;
type MagicLinkValues = z.infer<typeof magicLinkSchema>;

export function LoginForm({ nextPath }: { nextPath: string }) {
  const router = useRouter();
  const [mode, setMode] = useState<"password" | "magic">("password");
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [isPending, startTransition] = useTransition();
  const supabase = createClient();

  const passwordForm = useForm<PasswordValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const magicLinkForm = useForm<MagicLinkValues>({
    resolver: zodResolver(magicLinkSchema),
    defaultValues: {
      email: "",
    },
  });

  const handlePasswordSubmit = passwordForm.handleSubmit((values) => {
    setStatusMessage("");
    startTransition(async () => {
      const { error } = await supabase.auth.signInWithPassword(values);

      if (error) {
        setStatusMessage(error.message);
        return;
      }

      router.push(nextPath);
      router.refresh();
    });
  });

  const handleSignup = passwordForm.handleSubmit((values) => {
    setStatusMessage("");
    startTransition(async () => {
      const { error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?next=${encodeURIComponent(nextPath)}`,
        },
      });

      if (error) {
        setStatusMessage(error.message);
        return;
      }

      setStatusMessage("Account created. Check your email to confirm or use a magic link.");
    });
  });

  const handleMagicLinkSubmit = magicLinkForm.handleSubmit((values) => {
    setStatusMessage("");
    startTransition(async () => {
      const { error } = await supabase.auth.signInWithOtp({
        email: values.email,
        options: {
          emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?next=${encodeURIComponent(nextPath)}`,
        },
      });

      if (error) {
        setStatusMessage(error.message);
        return;
      }

      setStatusMessage("Magic link sent. Open it on this device to continue.");
    });
  });

  const handleGoogle = async () => {
    setStatusMessage("");
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?next=${encodeURIComponent(nextPath)}`,
      },
    });

    if (error) {
      setStatusMessage(error.message);
      return;
    }

    if (data.url) {
      router.push(data.url);
    }
  };

  return (
    <div className="rounded-[var(--radius-card)] border border-border bg-surface p-6 shadow-[var(--shadow-card)] sm:p-8">
      <div className="flex flex-wrap gap-3">
        <button
          className={`min-h-11 rounded-full px-4 text-sm font-medium ${
            mode === "password"
              ? "bg-[var(--accent)] text-white"
              : "border border-border text-foreground"
          }`}
          onClick={() => setMode("password")}
          type="button"
        >
          Email + password
        </button>
        <button
          className={`min-h-11 rounded-full px-4 text-sm font-medium ${
            mode === "magic"
              ? "bg-[var(--accent)] text-white"
              : "border border-border text-foreground"
          }`}
          onClick={() => setMode("magic")}
          type="button"
        >
          Magic link
        </button>
      </div>

      {mode === "password" ? (
        <form className="mt-6 grid gap-4" onSubmit={handlePasswordSubmit}>
          <label className="grid gap-2 text-sm">
            <span>Email</span>
            <input
              className="min-h-12 rounded-[var(--radius-input)] border border-border bg-white px-4"
              type="email"
              {...passwordForm.register("email")}
            />
            <span className="text-xs text-[var(--red)]">
              {passwordForm.formState.errors.email?.message}
            </span>
          </label>
          <label className="grid gap-2 text-sm">
            <span>Password</span>
            <input
              className="min-h-12 rounded-[var(--radius-input)] border border-border bg-white px-4"
              type="password"
              {...passwordForm.register("password")}
            />
            <span className="text-xs text-[var(--red)]">
              {passwordForm.formState.errors.password?.message}
            </span>
          </label>
          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              className="inline-flex min-h-12 items-center justify-center rounded-[var(--radius-input)] bg-[var(--accent)] px-4 text-sm font-medium text-white"
              disabled={isPending}
              type="submit"
            >
              Sign in
            </button>
            <button
              className="inline-flex min-h-12 items-center justify-center rounded-[var(--radius-input)] border border-border px-4 text-sm font-medium text-foreground"
              disabled={isPending}
              onClick={handleSignup}
              type="button"
            >
              Create account
            </button>
          </div>
        </form>
      ) : (
        <form className="mt-6 grid gap-4" onSubmit={handleMagicLinkSubmit}>
          <label className="grid gap-2 text-sm">
            <span>Email</span>
            <input
              className="min-h-12 rounded-[var(--radius-input)] border border-border bg-white px-4"
              type="email"
              {...magicLinkForm.register("email")}
            />
            <span className="text-xs text-[var(--red)]">
              {magicLinkForm.formState.errors.email?.message}
            </span>
          </label>
          <button
            className="inline-flex min-h-12 items-center justify-center rounded-[var(--radius-input)] bg-[var(--accent)] px-4 text-sm font-medium text-white"
            disabled={isPending}
            type="submit"
          >
            Send me a login link instead
          </button>
        </form>
      )}

      <div className="mt-6">
        <button
          className="inline-flex min-h-12 w-full items-center justify-center rounded-[var(--radius-input)] border border-border bg-white px-4 text-sm font-medium text-foreground"
          onClick={handleGoogle}
          type="button"
        >
          Continue with Google
        </button>
      </div>

      {statusMessage ? (
        <p className="mt-4 text-sm leading-6 text-[var(--ink-light)]">{statusMessage}</p>
      ) : null}
    </div>
  );
}
