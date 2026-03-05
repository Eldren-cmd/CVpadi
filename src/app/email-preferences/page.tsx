import { updateEmailPreferencesAction } from "./actions";
import { extractEmailPreferences } from "@/lib/email/preferences";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

const options = [
  {
    description: "Important build, payment, and follow-up emails.",
    label: "Normal",
    value: "normal",
  },
  {
    description: "A lighter cadence for non-essential follow-ups.",
    label: "Email me less often",
    value: "less_often",
  },
  {
    description: "Only jobs-style digests and future match alerts.",
    label: "Jobs only",
    value: "jobs_only",
  },
] as const;

export default async function EmailPreferencesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/email-preferences");
  }

  const preferences = extractEmailPreferences(user.user_metadata);

  return (
    <main className="min-h-screen px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-3xl rounded-[var(--radius-card)] border border-border bg-surface p-6 shadow-[var(--shadow-card)] sm:p-8">
        <p className="font-mono text-sm uppercase tracking-[0.28em] text-[var(--ink-light)]">
          Preferences
        </p>
        <h1 className="mt-3 font-heading text-4xl leading-tight text-foreground">
          Choose how often CVPadi emails you.
        </h1>
        <p className="mt-4 text-base leading-7 text-[var(--ink-light)]">
          Transactional download emails still go out when you pay for a CV. These settings
          control the follow-up sequences around saved drafts and post-download nudges.
        </p>

        <form action={updateEmailPreferencesAction} className="mt-8 grid gap-5">
          <fieldset className="grid gap-4">
            <legend className="text-sm font-medium text-foreground">Email cadence</legend>
            {options.map((option) => (
              <label
                className="flex gap-3 rounded-[var(--radius-input)] border border-[var(--border-light)] bg-white/70 px-4 py-4"
                key={option.value}
              >
                <input
                  defaultChecked={preferences.frequency === option.value}
                  name="frequency"
                  type="radio"
                  value={option.value}
                />
                <span className="grid gap-1">
                  <span className="text-sm font-medium text-foreground">{option.label}</span>
                  <span className="text-sm leading-6 text-[var(--ink-light)]">
                    {option.description}
                  </span>
                </span>
              </label>
            ))}
          </fieldset>

          <label className="flex gap-3 rounded-[var(--radius-input)] border border-[var(--border-light)] bg-white/70 px-4 py-4">
            <input
              defaultChecked={preferences.unsubscribeAll}
              name="unsubscribeAll"
              type="checkbox"
            />
            <span className="grid gap-1">
              <span className="text-sm font-medium text-foreground">Unsubscribe from all follow-ups</span>
              <span className="text-sm leading-6 text-[var(--ink-light)]">
                Keep payment download emails, but stop abandoned-draft and post-download follow-ups.
              </span>
            </span>
          </label>

          <button
            className="inline-flex min-h-12 items-center justify-center rounded-[var(--radius-input)] bg-[var(--accent)] px-5 text-sm font-medium text-white"
            type="submit"
          >
            Save preferences
          </button>
        </form>
      </div>
    </main>
  );
}
