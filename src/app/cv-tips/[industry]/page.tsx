import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  INDUSTRY_TIPS,
  getIndustryTip,
  getIndustryTipStaticParams,
} from "@/lib/cv-tips/content";

export const dynamicParams = false;

export function generateStaticParams() {
  return getIndustryTipStaticParams();
}

export function generateMetadata({
  params,
}: {
  params: { industry: string };
}): Metadata {
  const tip = getIndustryTip(params.industry);

  if (!tip) {
    return {
      title: "CV Tips | CVPadi",
    };
  }

  return {
    description: `${tip.title} CV tips for Nigeria: what employers look for, what to include, and how to tailor your CV for interviews.`,
    title: `${tip.title} CV Tips Nigeria | CVPadi`,
  };
}

export default function IndustryTipsPage({
  params,
}: {
  params: { industry: string };
}) {
  const tip = getIndustryTip(params.industry);

  if (!tip) {
    notFound();
  }

  const buildHref = `/build?industry=${encodeURIComponent(tip.buildIndustry)}`;

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 sm:py-8">
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        <section className="rounded-[var(--radius-card)] border border-border bg-surface p-6 shadow-[var(--shadow-elevated)] sm:p-8">
          <p className="font-mono text-sm uppercase tracking-[0.28em] text-[var(--ink-light)]">
            F5 - Industry CV Tips
          </p>
          <h1 className="mt-3 max-w-3xl font-heading text-4xl leading-tight text-foreground sm:text-5xl">
            How to write a stronger {tip.title} CV in Nigeria.
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-[var(--ink-light)] sm:text-lg">
            {tip.intro}
          </p>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <Link
              className="inline-flex min-h-12 items-center justify-center rounded-[var(--radius-input)] bg-[var(--accent)] px-5 text-sm font-medium text-white"
              href={buildHref}
            >
              Build your {tip.title} CV now
            </Link>
            <Link
              className="inline-flex min-h-12 items-center justify-center rounded-[var(--radius-input)] border border-border px-5 text-sm font-medium text-foreground"
              href="/check"
            >
              Check your CV score
            </Link>
          </div>
        </section>

        <ArticleSection title={`What Nigerian ${tip.title.toLowerCase()} employers look for`}>
          <p>
            {tip.nigerianContext} In practice, that means your CV should help the hiring
            team answer three questions quickly: can this person do the work, can this
            person be trusted with the workflow, and can this person communicate outcomes
            without supervision? The first half of the document should answer those
            questions before the recruiter reaches page two.
          </p>
          <p>
            For {tip.title.toLowerCase()} roles, the best summaries do not try to sound
            universally impressive. They name the operating environment, the type of
            responsibility you carried, and the type of result you can repeat. If you are
            early in your career, internships, NYSC placements, volunteering, and student
            projects still count when they are described with specifics.
          </p>
          <p>
            A strong CV in this category also keeps the reader oriented. Use clear job
            titles, recognizable keywords, and short bullets that move from context to
            action to outcome. That style feels more credible than broad corporate language
            because it mirrors the way experienced managers talk about real work.
          </p>
        </ArticleSection>

        <ArticleSection title="Certifications and credibility markers">
          <p>
            Certifications do not replace experience, but they do reduce uncertainty. In
            many Nigerian hiring processes, the recruiter is screening for evidence that
            you already speak the language of the sector and can settle into the workflow
            quickly. If you have passed, are progressing through, or have completed formal
            training in any of the areas below, place them high enough on the page to be seen.
          </p>
          <p>
            The most effective approach is to connect every certificate to the work. Do not
            only list the credential. Show how it supported reporting quality, technical
            execution, compliance, safety, or customer outcomes. That is what turns a short
            line into something a hiring manager actually remembers.
          </p>
          <ul className="grid gap-3 sm:grid-cols-3">
            {tip.certifications.map((item) => (
              <li
                className="rounded-[var(--radius-input)] border border-[var(--border-light)] bg-[var(--bg)] px-4 py-4 text-sm leading-6 text-foreground"
                key={item}
              >
                {item}
              </li>
            ))}
          </ul>
        </ArticleSection>

        <ArticleSection title="Experience bullets that sound real">
          <p>
            Your experience section is where most CVs win or lose. Recruiters want to see
            what you handled, what system or workflow you were inside, and what changed
            because you were there. Even if you were not the final decision-maker, you can
            still show the part of the process that belonged to you and why it mattered.
          </p>
          <p>
            Good bullets often sound smaller than candidates expect because they are
            concrete. They mention a branch, a classroom, a clinic, a donor report, a site,
            a campaign, a reconciliation pack, or a product flow. That is why they feel
            trustworthy. The reader can picture the work instead of guessing.
          </p>
          <p>
            Use action verbs, include relevant tools or controls, and add numbers whenever
            you can defend them. If you do not have obvious commercial metrics yet, use
            turnaround time, accuracy, compliance, patient volume, reporting quality, or
            workflow cleanliness as proof.
          </p>
          <ul className="grid gap-3">
            {tip.exampleBullets.map((item) => (
              <li
                className="rounded-[var(--radius-input)] border border-[var(--border-light)] bg-white/70 px-4 py-3 text-sm leading-6 text-foreground"
                key={item}
              >
                {item}
              </li>
            ))}
          </ul>
        </ArticleSection>

        <ArticleSection title="Mistakes to remove before you apply">
          <p>
            Most weak CVs are not weak because the candidate lacks value. They are weak
            because the evidence is hidden behind vague writing. Review your CV and ask
            whether a recruiter could identify your niche, your level, and your strongest
            proof inside twenty seconds. If not, the document probably needs a tighter
            summary, better bullets, or a more deliberate section order.
          </p>
          <p>
            You also do not need to sound universal. A better CV is not one that fits every
            job. It is one that fits the right jobs well. If you are applying into
            {` ${tip.title.toLowerCase()}`}, the document should feel built for that market
            rather than copied from a generic corporate template.
          </p>
          <p>
            The final edit should remove anything that slows the recruiter down: soft
            adjectives with no proof, duplicated job duties, long objective statements, and
            unrelated details that do not strengthen your case for this exact industry.
          </p>
          <ul className="grid gap-3">
            {tip.mistakes.map((item) => (
              <li
                className="rounded-[var(--radius-input)] border border-[var(--red-light)] bg-[var(--surface)] px-4 py-3 text-sm leading-6 text-foreground"
                key={item}
              >
                {item}
              </li>
            ))}
          </ul>
        </ArticleSection>

        <ArticleSection title={`Build your ${tip.title.toLowerCase()} CV with the right starting point`}>
          <p>
            The easiest way to apply this advice is to start with a CV flow that already
            knows your target industry. That helps you tailor the summary, choose stronger
            language, and keep the document aligned with the kinds of roles you actually want.
          </p>
          <p>
            The link below opens the CV builder with {tip.buildIndustry} already selected so
            you are not starting from a completely generic form. That matters because the
            strongest CVs usually feel intentionally tuned to the market before the recruiter
            even finishes the first screen.
          </p>
          <div className="rounded-[var(--radius-card)] border border-border bg-surface px-5 py-5 shadow-[var(--shadow-card)]">
            <Link
              className="inline-flex min-h-12 items-center justify-center rounded-[var(--radius-input)] bg-[var(--accent)] px-5 text-sm font-medium text-white"
              href={buildHref}
            >
              Build your {tip.title} CV now
            </Link>
          </div>
        </ArticleSection>

        <section className="rounded-[var(--radius-card)] border border-border bg-surface p-5 shadow-[var(--shadow-card)] sm:p-6">
          <h2 className="font-heading text-2xl text-foreground">Explore other industries</h2>
          <div className="mt-4 flex flex-wrap gap-3">
            {INDUSTRY_TIPS.filter((entry) => entry.slug !== tip.slug).map((entry) => (
              <Link
                className="inline-flex min-h-11 items-center rounded-full border border-border bg-white px-4 text-sm font-medium text-foreground"
                href={`/cv-tips/${entry.slug}`}
                key={entry.slug}
              >
                {entry.title}
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
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
