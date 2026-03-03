import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  description:
    "How NYSC members and fresh graduates in Nigeria should shape their CV when experience is still limited.",
  title: "NYSC CV Guide | CVPadi",
};

export default function NyscCvGuidePage() {
  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 sm:py-8">
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        <Hero
          body="If your strongest evidence is school, SIWES, volunteering, leadership roles, or your service-year posting, that is enough to build a credible CV. The mistake is hiding that evidence under generic objective statements."
          eyebrow="NYSC CV Guide"
          title="Build a stronger CV when you are early in your career."
        />

        <ArticleSection title="Lead with proof, not apology">
          <p>
            A lot of NYSC members open their CV with language that apologises for being
            early-career. That is the wrong frame. Recruiters already know you are at the
            beginning of your path. What they want is a fast answer to a better question:
            what evidence do you already have that this person can learn quickly, work
            reliably, and represent the organisation well?
          </p>
          <p>
            Your summary should therefore sound direct and grounded. Mention your discipline,
            the kind of role you want, and the strongest proof you already have. That proof
            might be SIWES, student leadership, campus projects, volunteering, or the parts
            of NYSC service where you handled real responsibility.
          </p>
        </ArticleSection>

        <ArticleSection title="What to include if experience is still limited">
          <ul className="grid gap-3">
            {[
              "Relevant coursework or projects only if they support the role you want.",
              "Volunteer work or campus leadership if it involved coordination, teaching, communication, or execution.",
              "SIWES, internships, or NYSC tasks described with concrete outcomes rather than only duties.",
              "Relevant certifications, portfolio links, and tool familiarity that shorten recruiter doubt.",
            ].map((item) => (
              <li
                className="rounded-[var(--radius-input)] border border-[var(--border-light)] bg-white/70 px-4 py-3 text-sm leading-6 text-foreground"
                key={item}
              >
                {item}
              </li>
            ))}
          </ul>
        </ArticleSection>

        <ArticleSection title="How to talk about NYSC itself">
          <p>
            Service year becomes a strength when you write about it like work. Name the unit,
            the type of support you gave, and the value of the work. If you taught classes,
            supported admin, worked in media, helped with operations, or handled front desk
            responsibilities, describe that directly.
          </p>
          <p>
            You do not need to oversell. You need to be concrete. Replace assisted with what
            you actually handled. Replace worked with what changed. That single shift makes a
            fresh-graduate CV feel much more credible.
          </p>
        </ArticleSection>

        <ArticleSection title="Common CV mistakes during NYSC">
          <ul className="grid gap-3">
            {[
              "Using a long objective statement full of hardworking, motivated, and dedicated without evidence.",
              "Leaving the CV generic instead of tailoring it to the sector or role you want after service.",
              "Listing every school activity equally and burying the strongest proof.",
              "Ignoring numbers, tools, and workflow details that make even small experience feel real.",
            ].map((item) => (
              <li
                className="rounded-[var(--radius-input)] border border-[var(--red-light)] bg-[var(--surface)] px-4 py-3 text-sm leading-6 text-foreground"
                key={item}
              >
                {item}
              </li>
            ))}
          </ul>
        </ArticleSection>

        <CTA
          body="Use the builder to turn school, SIWES, and service-year evidence into a cleaner CV structure."
          href="/build"
          label="Build your CV now"
          title="Ready to apply this?"
        />
      </div>
    </main>
  );
}

function Hero({
  body,
  eyebrow,
  title,
}: {
  body: string;
  eyebrow: string;
  title: string;
}) {
  return (
    <section className="rounded-[var(--radius-card)] border border-border bg-surface p-6 shadow-[var(--shadow-elevated)] sm:p-8">
      <p className="font-mono text-sm uppercase tracking-[0.28em] text-[var(--ink-light)]">
        {eyebrow}
      </p>
      <h1 className="mt-3 max-w-3xl font-heading text-4xl leading-tight text-foreground sm:text-5xl">
        {title}
      </h1>
      <p className="mt-4 max-w-3xl text-base leading-7 text-[var(--ink-light)] sm:text-lg">
        {body}
      </p>
    </section>
  );
}

function ArticleSection({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) {
  return (
    <section className="rounded-[var(--radius-card)] border border-border bg-surface p-5 shadow-[var(--shadow-card)] sm:p-6">
      <h2 className="font-heading text-3xl text-foreground">{title}</h2>
      <div className="mt-4 grid gap-4 text-base leading-7 text-[var(--ink-light)]">
        {children}
      </div>
    </section>
  );
}

function CTA({
  body,
  href,
  label,
  title,
}: {
  body: string;
  href: string;
  label: string;
  title: string;
}) {
  return (
    <section className="rounded-[var(--radius-card)] border border-border bg-surface p-5 shadow-[var(--shadow-card)] sm:p-6">
      <h2 className="font-heading text-2xl text-foreground">{title}</h2>
      <p className="mt-3 text-sm leading-6 text-[var(--ink-light)]">{body}</p>
      <Link
        className="mt-5 inline-flex min-h-12 items-center justify-center rounded-[var(--radius-input)] bg-[var(--accent)] px-5 text-sm font-medium text-white"
        href={href}
      >
        {label}
      </Link>
    </section>
  );
}
