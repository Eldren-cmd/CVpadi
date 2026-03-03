import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  description:
    "NYSC career hub for CV guidance, PPA company research, and what to do after service year.",
  title: "NYSC Guide Hub | CVPadi",
};

const NYSC_LINKS = [
  {
    body:
      "How to structure a CV when your strongest proof is school, SIWES, volunteering, or service-year work.",
    href: "/nysc/cv-guide",
    title: "NYSC CV Guide",
  },
  {
    body:
      "Community reviews of PPA companies by state, with email-verified submissions and aggregate visibility.",
    href: "/nysc/ppa-companies",
    title: "PPA Companies",
  },
  {
    body:
      "Practical next moves for jobs, graduate trainee applications, skills, and positioning after service year.",
    href: "/nysc/after-nysc",
    title: "After NYSC",
  },
];

export default function NyscHubPage() {
  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 sm:py-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <section className="rounded-[var(--radius-card)] border border-border bg-surface p-6 shadow-[var(--shadow-elevated)] sm:p-8">
          <p className="font-mono text-sm uppercase tracking-[0.28em] text-[var(--ink-light)]">
            F6 - NYSC Guide Hub
          </p>
          <h1 className="mt-3 max-w-3xl font-heading text-4xl leading-tight text-foreground sm:text-5xl">
            NYSC career guidance that keeps working long after the first CV sale.
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-[var(--ink-light)] sm:text-lg">
            NYSC questions are constantly searched in Nigeria. This hub gives CVPadi
            evergreen authority beyond the builder by covering CV prep, PPA company research,
            and the transition after service year.
          </p>
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          {NYSC_LINKS.map((link) => (
            <article
              className="rounded-[var(--radius-card)] border border-border bg-surface p-5 shadow-[var(--shadow-card)]"
              key={link.href}
            >
              <h2 className="font-heading text-2xl text-foreground">{link.title}</h2>
              <p className="mt-3 text-sm leading-6 text-[var(--ink-light)]">{link.body}</p>
              <Link
                className="mt-5 inline-flex min-h-12 items-center justify-center rounded-[var(--radius-input)] border border-border px-4 text-sm font-medium text-foreground"
                href={link.href}
              >
                Open page
              </Link>
            </article>
          ))}
        </section>

        <section className="rounded-[var(--radius-card)] border border-border bg-surface p-5 shadow-[var(--shadow-card)] sm:p-6">
          <h2 className="font-heading text-2xl text-foreground">Why this matters in Phase 1</h2>
          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            <InfoCard
              body="NYSC search intent stays high all year. These pages keep bringing first-time users into the product."
              title="Evergreen search demand"
            />
            <InfoCard
              body="The PPA page brings community submissions into the product without needing a full social platform yet."
              title="Community proof"
            />
            <InfoCard
              body="The hub makes CVPadi look like a Nigerian career authority, not only a single-purpose CV generator."
              title="Brand positioning"
            />
          </div>
        </section>
      </div>
    </main>
  );
}

function InfoCard({ body, title }: { body: string; title: string }) {
  return (
    <article className="rounded-[var(--radius-input)] border border-[var(--border-light)] bg-white/70 p-4">
      <h3 className="font-heading text-xl text-foreground">{title}</h3>
      <p className="mt-3 text-sm leading-6 text-[var(--ink-light)]">{body}</p>
    </article>
  );
}
