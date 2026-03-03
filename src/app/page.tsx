const foundationChecklist = [
  "Sentry instrumentation is wired for app, server, edge, and global form failures.",
  "Supabase browser/server clients and auth-refresh middleware are in place.",
  "Login supports email and password, magic link, and Google sign-in.",
  "The /build wizard saves drafts to Supabase on step transitions and keeps a local recovery copy.",
  "CV score suggestions, restore-banner logic, and visible sync-state feedback are active.",
];

const paystackCheckpointSteps = [
  "Create the Paystack account and open API Keys and Webhooks.",
  "Copy the public key into NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY in .env.local.",
  "Copy the secret key into PAYSTACK_SECRET_KEY in .env.local.",
  "Leave the secret key server-only and do not write payment code before those values exist.",
  "Resume implementation only after Setup Checkpoint 2 is complete.",
];

const envVars = [
  "NEXT_PUBLIC_SENTRY_DSN",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY",
  "PAYSTACK_SECRET_KEY",
  "NEXT_PUBLIC_APP_URL",
];

export default function Home() {
  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 sm:py-8">
      <div className="mx-auto flex max-w-5xl flex-col gap-4 sm:gap-6">
        <section className="rounded-[var(--radius-card)] border border-border bg-surface p-5 shadow-[var(--shadow-elevated)] sm:p-8">
          <div className="mb-4 inline-flex min-h-11 items-center rounded-full border border-border bg-[var(--accent-light)] px-4 text-sm font-medium text-foreground">
            Phase 1 foundation complete
          </div>
          <p className="font-mono text-sm uppercase tracking-[0.28em] text-[var(--ink-light)]">
            CVPadi
          </p>
          <h1 className="mt-3 max-w-2xl font-heading text-4xl leading-tight text-foreground sm:text-5xl">
            Auth and the CV builder core are in place. Payments are paused at Checkpoint 2.
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-[var(--ink-light)] sm:text-lg">
            The app now has Sentry, Supabase auth, a protected conversational builder,
            local recovery logic, and CV scoring. Payment and delivery flows have not been
            started yet because the next blocker is Paystack setup.
          </p>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <a
              className="inline-flex min-h-12 items-center justify-center rounded-[var(--radius-input)] bg-[var(--accent)] px-5 text-sm font-medium text-white"
              href="/login"
            >
              Open login
            </a>
            <a
              className="inline-flex min-h-12 items-center justify-center rounded-[var(--radius-input)] border border-border px-5 text-sm font-medium text-foreground"
              href="/build"
            >
              Open builder
            </a>
          </div>
        </section>

        <div className="grid gap-4 lg:grid-cols-[1.25fr_0.95fr]">
          <section className="rounded-[var(--radius-card)] border border-border bg-surface p-5 shadow-[var(--shadow-card)] sm:p-6">
            <h2 className="font-heading text-2xl text-foreground">Included in this milestone</h2>
            <ul className="mt-4 grid gap-3 text-sm leading-6 text-[var(--ink-light)] sm:text-base">
              {foundationChecklist.map((item) => (
                <li
                  key={item}
                  className="rounded-[var(--radius-input)] border border-[var(--border-light)] bg-white/70 px-4 py-3"
                >
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-[var(--radius-card)] border border-border bg-surface p-5 shadow-[var(--shadow-card)] sm:p-6">
            <h2 className="font-heading text-2xl text-foreground">Stop line</h2>
            <p className="mt-4 text-sm leading-6 text-[var(--ink-light)] sm:text-base">
              Resume only after the Paystack keys exist locally. No payment modal, webhook,
              or unlock logic should be added before Setup Checkpoint 2 is complete.
            </p>
            <ol className="mt-4 grid gap-3 text-sm leading-6 text-[var(--ink-light)] sm:text-base">
              {paystackCheckpointSteps.map((item, index) => (
                <li
                  key={item}
                  className="rounded-[var(--radius-input)] border border-[var(--border-light)] bg-white/70 px-4 py-3"
                >
                  <span className="font-mono text-[var(--accent)]">0{index + 1}.</span> {item}
                </li>
              ))}
            </ol>
          </section>
        </div>

        <section className="rounded-[var(--radius-card)] border border-border bg-surface p-5 shadow-[var(--shadow-card)] sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="font-heading text-2xl text-foreground">Current env surface</h2>
              <p className="mt-2 text-sm leading-6 text-[var(--ink-light)] sm:text-base">
                These variables are expected by the current foundation. Paystack stays as the
                next unfulfilled checkpoint.
              </p>
            </div>
            <span className="inline-flex min-h-11 items-center rounded-full bg-[var(--gold-light)] px-4 text-sm font-medium text-[var(--gold)]">
              Waiting on Paystack
            </span>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {envVars.map((envVar) => (
              <div
                key={envVar}
                className="rounded-[var(--radius-input)] border border-[var(--border-light)] bg-[var(--bg)] px-4 py-3 font-mono text-sm text-foreground"
              >
                {envVar}
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
