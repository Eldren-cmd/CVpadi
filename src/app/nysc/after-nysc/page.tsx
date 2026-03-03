import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  description:
    "Practical next steps after NYSC for jobs, graduate trainee roles, skill-building, and CV positioning.",
  title: "After NYSC | CVPadi",
};

export default function AfterNyscPage() {
  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 sm:py-8">
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        <section className="rounded-[var(--radius-card)] border border-border bg-surface p-6 shadow-[var(--shadow-elevated)] sm:p-8">
          <p className="font-mono text-sm uppercase tracking-[0.28em] text-[var(--ink-light)]">
            After NYSC
          </p>
          <h1 className="mt-3 max-w-3xl font-heading text-4xl leading-tight text-foreground sm:text-5xl">
            What to do after NYSC if you want faster career momentum.
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-[var(--ink-light)] sm:text-lg">
            The period immediately after service year is one of the highest-leverage moments
            in a Nigerian career. Good decisions here compound quickly: your CV positioning,
            the roles you target, the skills you sharpen, and how deliberately you track
            applications all matter.
          </p>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          {[
            {
              body:
                "Do not spray applications blindly. Pick role families you can explain credibly and tailor your CV to those paths.",
              title: "Choose a lane early",
            },
            {
              body:
                "Graduate trainee roles can be useful, but they are not the only route. Also target internships, analyst roles, coordinators, assistants, and field positions with growth headroom.",
              title: "Broaden the target list",
            },
            {
              body:
                "Use short skill-building sprints. One certificate or project tied to your chosen sector is more useful than random general learning.",
              title: "Build relevant proof",
            },
            {
              body:
                "Track applications, follow-up notes, and interview movement so you learn from the process instead of repeating the same mistakes.",
              title: "Operate like a professional",
            },
          ].map((item) => (
            <article
              className="rounded-[var(--radius-card)] border border-border bg-surface p-5 shadow-[var(--shadow-card)]"
              key={item.title}
            >
              <h2 className="font-heading text-2xl text-foreground">{item.title}</h2>
              <p className="mt-3 text-sm leading-6 text-[var(--ink-light)]">{item.body}</p>
            </article>
          ))}
        </section>

        <section className="rounded-[var(--radius-card)] border border-border bg-surface p-5 shadow-[var(--shadow-card)] sm:p-6">
          <h2 className="font-heading text-3xl text-foreground">A practical 30-day plan</h2>
          <ol className="mt-4 grid gap-3 text-sm leading-6 text-[var(--ink-light)]">
            {[
              "Week 1: tighten your CV, headline, and job-search focus.",
              "Week 2: build one concrete proof asset such as a certificate, project, or case sample.",
              "Week 3: apply consistently to better-fit roles and track every application.",
              "Week 4: review interviews, rejection patterns, and where the CV still needs sharper positioning.",
            ].map((item, index) => (
              <li
                className="rounded-[var(--radius-input)] border border-[var(--border-light)] bg-white/70 px-4 py-3"
                key={item}
              >
                <span className="font-mono text-[var(--accent)]">0{index + 1}.</span> {item}
              </li>
            ))}
          </ol>
        </section>

        <section className="rounded-[var(--radius-card)] border border-border bg-surface p-5 shadow-[var(--shadow-card)] sm:p-6">
          <h2 className="font-heading text-2xl text-foreground">Use CVPadi for the next move</h2>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <Link
              className="inline-flex min-h-12 items-center justify-center rounded-[var(--radius-input)] bg-[var(--accent)] px-5 text-sm font-medium text-white"
              href="/build"
            >
              Build or update your CV
            </Link>
            <Link
              className="inline-flex min-h-12 items-center justify-center rounded-[var(--radius-input)] border border-border px-5 text-sm font-medium text-foreground"
              href="/dashboard/tracker"
            >
              Track applications
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
