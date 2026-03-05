import Link from "next/link";
import { LoginForm } from "@/components/auth/login-form";

const PROOF_CARDS = [
  {
    label: "CV Score",
    value: "94",
  },
  {
    label: "One-time payment",
    value: "₦1,500",
  },
  {
    label: "Average build time",
    value: "8 min",
  },
] as const;

export default function LoginPage({
  searchParams,
}: {
  searchParams?: { email?: string; next?: string };
}) {
  const nextPath = searchParams?.next ?? "/build";
  const initialEmail = searchParams?.email ?? "";

  return (
    <main className="min-h-screen bg-[var(--black)] text-[var(--cream)]">
      <div className="grid min-h-screen lg:grid-cols-[1.05fr_0.95fr]">
        <section className="relative hidden overflow-hidden border-r border-[var(--border)] bg-[var(--off-black)] px-10 py-10 lg:flex lg:flex-col">
          <div
            aria-hidden="true"
            className="absolute -right-24 top-12 h-72 w-72 rounded-full"
            style={{
              animation: "orb-float 12s ease-in-out infinite",
              background: "radial-gradient(circle, rgba(0,230,118,0.08) 0%, transparent 70%)",
              filter: "blur(4px)",
            }}
          />

          <Link className="relative z-10 font-display text-3xl tracking-[-0.03em]" href="/">
            CV<span className="text-[var(--green)]">Padi</span>
          </Link>

          <div className="relative z-10 mt-auto max-w-2xl">
            <p
              className="font-heading text-5xl italic leading-[1.05] text-[var(--cream)]"
              style={{ animation: "fade-up 0.8s ease forwards" }}
            >
              “Your next job starts with the right CV.”
            </p>

            <div className="mt-10 grid gap-4">
              {PROOF_CARDS.map((card, index) => (
                <article
                  className="rounded-[12px] border border-[var(--border)] bg-[var(--card)] px-5 py-4"
                  key={card.label}
                  style={{ animation: `fade-up 0.6s ease ${0.2 + index * 0.2}s forwards`, opacity: 0 }}
                >
                  <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-[var(--mid)]">
                    {card.label}
                  </p>
                  <div className="mt-2 flex items-center gap-3">
                    <span
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[var(--green)] text-xs text-[var(--green)]"
                      style={{ background: "var(--green-glow)" }}
                    >
                      ✓
                    </span>
                    <p className="font-heading text-3xl text-[var(--cream)]">{card.value}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="flex items-center justify-center bg-[var(--black)] px-4 py-10 sm:px-6">
          <div className="w-full max-w-md page-enter">
            <LoginForm initialEmail={initialEmail} nextPath={nextPath} />
            <p className="mt-6 text-center text-sm text-[var(--cream-dim)]">
              Don&apos;t have an account?{" "}
              <Link className="font-display text-[var(--green)]" href="/build">
                Start building free →
              </Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
