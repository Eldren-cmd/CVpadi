const foundationChecklist = [
  "Sentry instrumentation is wired for app, server, edge, and global form failures.",
  "Supabase browser/server clients and auth-refresh middleware are in place.",
  "Login supports email and password, magic link, and Google sign-in.",
  "The /build wizard saves drafts to Supabase on step transitions and keeps a local recovery copy.",
  "CV score suggestions, restore-banner logic, and visible sync-state feedback are active.",
  "Paystack initialize, status, and webhook routes are wired with server-side amount checks and missing-row webhook upserts.",
  "The builder waits for verified webhook confirmation before treating a payment as unlocked.",
  "Verified payments now trigger server-side PDF and WhatsApp JPG generation into the private cv-assets bucket.",
  "Paid users receive 2-hour signed delivery links in the builder and by email through Resend.",
  "Phase 1 email sequences now schedule abandoned-draft follow-ups and post-download reminders.",
  "A preference centre and hourly email-sequence processor route are scaffolded for the next cron step.",
  "Phase 1 loophole fixes now include a server-rendered free preview canvas, FingerprintJS soft-signal tracking, and atomic free-preview limits.",
  "Free feature F1 is live: CV score share cards now render through a server OG route and trigger after the first completed preview.",
  "Free feature F2 is live: a public CV checker now scores pasted text or uploaded PDFs and hands captured email into the free build flow.",
  "Free feature F3 is live: the public salary page now enforces the five-submission rule and uses magic-link email verification for submissions.",
  "Free feature F4 is live: registered users now get a kanban application tracker with an interview-stage CV update prompt.",
  "Free feature F5 is live: static industry CV tips pages now pre-select the build flow via URL params.",
  "Free feature F6 is live: the NYSC hub now covers CV guidance, PPA company research, and after-service career planning.",
  "Free feature F7 is live: every builder save now writes a timeline snapshot and older versions can be forked into new CV branches.",
  "Free feature F8 is live: the first completed CV view now combines share and referral prompts, and verified referred payments credit the referrer automatically.",
  "Phase 2.1 is now aligned to v4: the scraper loads stable sources from job_sources, corporate sources from JOB_SCRAPER_SOURCES_JSON, checks robots.txt, and auto-disables failing stable sources.",
  "Checkpoint 5 is now wired: verified payments enqueue a Claude Haiku enhancement pass that regenerates updated assets and emails the refreshed files off the payment critical path.",
  "Phase 2.2 is live on the backend: daily weighted job matching now persists only scores >= 40 and sends one top-3 digest at 8am WAT.",
];

const deploymentReminders = [
  "Replace the Resend test sender with a verified production sender before launch.",
  "If you migrate Paystack to the v4 Edge Function webhook path, update the dashboard webhook URL before taking live payments.",
  "Do not keep test Paystack keys in production.",
  "Set NEXT_PUBLIC_RECAPTCHA_SITE_KEY and RECAPTCHA_SECRET_KEY before public launch.",
  "Monitor Anthropic credits and move up only after the queued enhancement worker proves stable in production.",
  "Before switching Paystack live, replace the test keys while keeping the same webhook path on cvpadi.vercel.app.",
];

const envVars = [
  "NEXT_PUBLIC_SENTRY_DSN",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY",
  "PAYSTACK_SECRET_KEY",
  "RESEND_API_KEY",
  "EMAIL_FROM",
  "EMAIL_SEQUENCE_CRON_SECRET",
  "NEXT_PUBLIC_RECAPTCHA_SITE_KEY",
  "RECAPTCHA_SECRET_KEY",
  "ANTHROPIC_API_KEY",
  "SENTRY_DSN",
  "JOB_SCRAPER_SOURCES_JSON",
  "NEXT_PUBLIC_APP_URL",
];

export default function Home() {
  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 sm:py-8">
      <div className="mx-auto flex max-w-5xl flex-col gap-4 sm:gap-6">
        <section className="rounded-[var(--radius-card)] border border-border bg-surface p-5 shadow-[var(--shadow-elevated)] sm:p-8">
          <div className="mb-4 inline-flex min-h-11 items-center rounded-full border border-border bg-[var(--accent-light)] px-4 text-sm font-medium text-foreground">
            Phase 1 delivery slice complete
          </div>
          <p className="font-mono text-sm uppercase tracking-[0.28em] text-[var(--ink-light)]">
            CVPadi
          </p>
          <h1 className="mt-3 max-w-2xl font-heading text-4xl leading-tight text-foreground sm:text-5xl">
            Auth, the CV builder, delivery, the queued Claude worker, and the first v4 Phase 2 matching slice are now wired.
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-[var(--ink-light)] sm:text-lg">
            The app now has Sentry, Supabase auth, a protected conversational builder,
            local recovery logic, CV scoring, public free-feature surfaces, a hardened
            Paystack payment flow, private delivery assets, a queued Claude enhancement
            path that stays off the webhook critical path, the two-tier legal-source
            job scraper, and the weighted daily top-3 matching digest required by v4.
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
              href="/check"
            >
              Check a CV
            </a>
            <a
              className="inline-flex min-h-12 items-center justify-center rounded-[var(--radius-input)] border border-border px-5 text-sm font-medium text-foreground"
              href="/salary"
            >
              Salary database
            </a>
            <a
              className="inline-flex min-h-12 items-center justify-center rounded-[var(--radius-input)] border border-border px-5 text-sm font-medium text-foreground"
              href="/dashboard/tracker"
            >
              Application tracker
            </a>
            <a
              className="inline-flex min-h-12 items-center justify-center rounded-[var(--radius-input)] border border-border px-5 text-sm font-medium text-foreground"
              href="/nysc"
            >
              NYSC hub
            </a>
            <a
              className="inline-flex min-h-12 items-center justify-center rounded-[var(--radius-input)] border border-border px-5 text-sm font-medium text-foreground"
              href="/dashboard/versions"
            >
              CV versions
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
            <h2 className="font-heading text-2xl text-foreground">Deployment reminders</h2>
            <p className="mt-4 text-sm leading-6 text-[var(--ink-light)] sm:text-base">
              Development is using the temporary Resend sender and Paystack test mode.
              Switch these before the first production deployment.
            </p>
            <ol className="mt-4 grid gap-3 text-sm leading-6 text-[var(--ink-light)] sm:text-base">
              {deploymentReminders.map((item, index) => (
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
                These variables and Supabase function secrets are expected by the current
                implementation, including test-mode email delivery.
              </p>
            </div>
            <span className="inline-flex min-h-11 items-center rounded-full bg-[var(--green-light)] px-4 text-sm font-medium text-[var(--green)]">
              Delivery enabled
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
