"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const DASHBOARD_NAV_ITEMS = [
  {
    href: "/dashboard#cv",
    label: "CV",
    icon: (
      <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24">
        <path
          d="M7 3.75h7.5L19 8.25v12A1.75 1.75 0 0 1 17.25 22h-10.5A1.75 1.75 0 0 1 5 20.25V5.5A1.75 1.75 0 0 1 6.75 3.75Z"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.8"
        />
        <path
          d="M14 3.75v4a.5.5 0 0 0 .5.5h4"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.8"
        />
        <path
          d="M8.5 12.5h7M8.5 16h7"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="1.8"
        />
      </svg>
    ),
    match: (pathname: string) => pathname === "/dashboard" || pathname === "/dashboard/versions",
  },
  {
    href: "/dashboard#jobs",
    label: "Jobs",
    icon: (
      <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24">
        <path
          d="M8 6.75V5.5A1.5 1.5 0 0 1 9.5 4h5A1.5 1.5 0 0 1 16 5.5v1.25"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.8"
        />
        <path
          d="M4.75 8h14.5A1.75 1.75 0 0 1 21 9.75v7.5A1.75 1.75 0 0 1 19.25 19h-14.5A1.75 1.75 0 0 1 3 17.25v-7.5A1.75 1.75 0 0 1 4.75 8Z"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.8"
        />
        <path
          d="M3.5 12.5h17"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="1.8"
        />
      </svg>
    ),
    match: (pathname: string) => pathname === "/dashboard",
  },
  {
    href: "/dashboard/tracker",
    label: "Tracker",
    icon: (
      <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24">
        <path
          d="M5.75 5.75h5.5v5.5h-5.5Zm7 0h5.5v5.5h-5.5Zm-7 7h5.5v5.5h-5.5Zm7 7h5.5v-5.5h-5.5Z"
          stroke="currentColor"
          strokeLinejoin="round"
          strokeWidth="1.8"
        />
      </svg>
    ),
    match: (pathname: string) => pathname === "/dashboard/tracker",
  },
  {
    href: "/dashboard#profile",
    label: "Profile",
    icon: (
      <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24">
        <path
          d="M12 12.25A3.25 3.25 0 1 0 12 5.75a3.25 3.25 0 0 0 0 6.5Z"
          stroke="currentColor"
          strokeWidth="1.8"
        />
        <path
          d="M5 19.5a7 7 0 0 1 14 0"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="1.8"
        />
      </svg>
    ),
    match: (pathname: string) => pathname === "/dashboard" || pathname === "/email-preferences",
  },
] as const;

export function DashboardNav() {
  const pathname = usePathname();

  return (
    <>
      <aside className="hidden w-72 shrink-0 lg:block">
        <div className="sticky top-6 rounded-[var(--radius-card)] border border-border bg-surface p-5 shadow-[var(--shadow-card)]">
          <p className="font-mono text-xs uppercase tracking-[0.24em] text-[var(--ink-light)]">
            Phase 2.3
          </p>
          <h2 className="mt-3 font-heading text-3xl text-foreground">Dashboard</h2>
          <p className="mt-3 text-sm leading-6 text-[var(--ink-light)]">
            Keep your CV, matches, tracker, and profile nudges in one authenticated workspace.
          </p>

          <nav aria-label="Dashboard sections" className="mt-6 grid gap-2">
            {DASHBOARD_NAV_ITEMS.map((item) => {
              const isActive = item.match(pathname);

              return (
                <Link
                  className={`flex min-h-12 items-center gap-3 rounded-[var(--radius-input)] px-4 text-sm font-medium transition ${
                    isActive
                      ? "bg-[var(--accent)] text-white"
                      : "bg-[var(--bg)] text-foreground hover:bg-[var(--accent-light)]"
                  }`}
                  href={item.href}
                  key={item.label}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="mt-6 rounded-[var(--radius-input)] border border-[var(--border-light)] bg-white/70 px-4 py-4 text-sm leading-6 text-[var(--ink-light)]">
            Need more control over job alerts and follow-ups?
            <Link className="ml-1 font-medium text-[var(--accent)]" href="/email-preferences">
              Edit notification settings
            </Link>
          </div>
        </div>
      </aside>

      <nav
        aria-label="Dashboard mobile navigation"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 px-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] pt-2 shadow-[0_-10px_30px_rgba(15,23,42,0.08)] backdrop-blur lg:hidden"
      >
        <div className="mx-auto grid max-w-3xl grid-cols-4 gap-2">
          {DASHBOARD_NAV_ITEMS.map((item) => {
            const isActive = item.match(pathname);

            return (
              <Link
                className={`flex min-h-14 flex-col items-center justify-center rounded-[var(--radius-input)] px-2 text-[11px] font-medium ${
                  isActive
                    ? "bg-[var(--accent)] text-white"
                    : "text-[var(--ink-light)]"
                }`}
                href={item.href}
                key={item.label}
              >
                {item.icon}
                <span className="mt-1">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
