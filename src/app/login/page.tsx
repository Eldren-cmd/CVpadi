import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage({
  searchParams,
}: {
  searchParams?: { next?: string };
}) {
  const nextPath = searchParams?.next ?? "/build";

  return (
    <main className="min-h-screen px-4 py-8 sm:px-6">
      <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-[var(--radius-card)] border border-border bg-surface p-6 shadow-[var(--shadow-card)] sm:p-8">
          <p className="font-mono text-sm uppercase tracking-[0.28em] text-[var(--ink-light)]">
            Login
          </p>
          <h1 className="mt-3 font-heading text-4xl leading-tight text-foreground">
            Sign in the way that works on your connection.
          </h1>
          <p className="mt-4 text-base leading-7 text-[var(--ink-light)]">
            CVPadi supports email and password, magic link, and Google sign-in.
            Returning users should not be forced into a single auth path.
          </p>
        </section>
        <LoginForm nextPath={nextPath} />
      </div>
    </main>
  );
}
