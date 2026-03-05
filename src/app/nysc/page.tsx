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
    <main className="main-content min-h-screen bg-[var(--black)] px-4 py-6 sm:px-6 sm:py-8">
      <div className="mx-auto grid max-w-6xl gap-6 page-enter">
        <section className="rounded-[16px] border border-[var(--border)] bg-[var(--off-black)] p-6 sm:p-8">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--gold)]">NYSC GUIDE HUB</p>
          <h1 className="mt-3 max-w-4xl font-heading text-5xl leading-[1.02] text-[var(--cream)]">
            NYSC guidance designed for Nigerian early-career realities.
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-[var(--cream-dim)]">
            Warm but practical. Everything here is tuned for what corps members and recent graduates actually need to move faster.
          </p>
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          {NYSC_LINKS.map((link) => (
            <article
              className="group relative overflow-hidden rounded-[14px] border border-[var(--border)] bg-[var(--off-black)] p-5 transition-all duration-300 hover:border-[var(--gold)] hover:bg-[var(--card)]"
              key={link.href}
            >
              <span className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-[10px] border border-[var(--gold)] bg-[var(--gold-glow)] text-sm text-[var(--gold)]">
                ✦
              </span>
              <h2 className="font-display text-2xl text-[var(--cream)]">{link.title}</h2>
              <p className="mt-3 text-sm leading-6 text-[var(--cream-dim)]">{link.body}</p>
              <Link
                className="mt-5 inline-flex min-h-11 items-center justify-center rounded-[8px] border border-[var(--border)] px-4 font-display text-sm text-[var(--cream-dim)] transition-all duration-200 hover:border-[var(--gold)] hover:bg-[var(--gold-glow)] hover:text-[var(--gold)]"
                href={link.href}
              >
                Open page
              </Link>
              <span className="absolute bottom-0 left-0 h-[2px] w-full origin-left scale-x-0 bg-[var(--gold)] transition-transform duration-300 group-hover:scale-x-100" />
            </article>
          ))}
        </section>

        <section className="rounded-[16px] border border-[var(--border)] bg-[var(--off-black)] p-5 sm:p-6">
          <h2 className="font-display text-2xl text-[var(--cream)]">Why this matters</h2>
          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            <InfoCard
              body="Most corps members don't know how to present SIWES, volunteer work, or school projects on a CV. We show you exactly how to make it work for you."
              title="Start strong from day one"
            />
            <InfoCard
              body="Real reviews of PPA companies from corps members who've been there. Submitted anonymously, aggregated honestly - so you know what you're walking into."
              title="Know where you're serving"
            />
            <InfoCard
              body="NYSC ends. Your job search shouldn't pause. We cover graduate trainee applications, skill gaps, and how to position your service year as experience."
              title="Don't lose momentum after service"
            />
          </div>
        </section>
      </div>
    </main>
  );
}

function InfoCard({ body, title }: { body: string; title: string }) {
  return (
    <article className="fade-up rounded-[12px] border border-[var(--border)] bg-[var(--card)] p-4" style={{ borderLeft: "2px solid var(--gold)" }}>
      <h3 className="font-display text-xl text-[var(--cream)]">{title}</h3>
      <p className="mt-3 text-sm leading-6 text-[var(--cream-dim)]">{body}</p>
    </article>
  );
}
