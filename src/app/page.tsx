const setupChecklist = [
  "Next.js 14 App Router scaffolded with TypeScript, Tailwind CSS, and ESLint.",
  "CVPadi design tokens and font stack wired into the global app shell.",
  "Checkpoint 1 environment template added without any live Supabase runtime code.",
  "Initial Supabase schema prepared as a migration with RLS, policies, and helper functions.",
];

const checkpointSteps = [
  "Create the Supabase project and keep the region aligned with the build prompt.",
  "Populate .env.local with the three Checkpoint 1 Supabase keys.",
  "Run the SQL migration in the Supabase SQL Editor.",
  "Enable Email auth, magic links, Google OAuth, and create the private cv-assets bucket.",
  "Verify RLS before moving past Checkpoint 1.",
];

const envVars = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "NEXT_PUBLIC_APP_URL",
];

export default function Home() {
  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 sm:py-8">
      <div className="mx-auto flex max-w-5xl flex-col gap-4 sm:gap-6">
        <section className="rounded-[var(--radius-card)] border border-border bg-surface p-5 shadow-[var(--shadow-elevated)] sm:p-8">
          <div className="mb-4 inline-flex min-h-11 items-center rounded-full border border-border bg-[var(--accent-light)] px-4 text-sm font-medium text-foreground">
            Setup checkpoint 1 only
          </div>
          <p className="font-mono text-sm uppercase tracking-[0.28em] text-[var(--ink-light)]">
            CVPadi
          </p>
          <h1 className="mt-3 max-w-2xl font-heading text-4xl leading-tight text-foreground sm:text-5xl">
            Next.js baseline ready. Supabase schema prepared. Waiting at the first checkpoint.
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-[var(--ink-light)] sm:text-lg">
            This workspace is intentionally limited to project setup and the database
            foundation. No live Supabase client, auth, storage, or feature code has been
            added yet.
          </p>
        </section>

        <div className="grid gap-4 lg:grid-cols-[1.25fr_0.95fr]">
          <section className="rounded-[var(--radius-card)] border border-border bg-surface p-5 shadow-[var(--shadow-card)] sm:p-6">
            <h2 className="font-heading text-2xl text-foreground">Included in this milestone</h2>
            <ul className="mt-4 grid gap-3 text-sm leading-6 text-[var(--ink-light)] sm:text-base">
              {setupChecklist.map((item) => (
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
              Resume only after the Supabase project exists, the migration has been run,
              authentication providers are configured, the private storage bucket exists, and
              RLS has been verified.
            </p>
            <ol className="mt-4 grid gap-3 text-sm leading-6 text-[var(--ink-light)] sm:text-base">
              {checkpointSteps.map((item, index) => (
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
              <h2 className="font-heading text-2xl text-foreground">Checkpoint 1 variables</h2>
              <p className="mt-2 text-sm leading-6 text-[var(--ink-light)] sm:text-base">
                Add these to <code className="font-mono text-[var(--ink)]">.env.local</code> before
                any Supabase runtime integration is written.
              </p>
            </div>
            <span className="inline-flex min-h-11 items-center rounded-full bg-[var(--green-light)] px-4 text-sm font-medium text-[var(--green)]">
              No runtime integration yet
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
