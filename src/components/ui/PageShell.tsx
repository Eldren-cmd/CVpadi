"use client";

import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface PageShellProps {
  children: React.ReactNode;
  title?: string;
}

const NAV_ITEMS = [
  {
    href: "/dashboard",
    icon: "CV",
    isActive: (pathname: string, hash: string) =>
      pathname === "/dashboard/versions" || (pathname === "/dashboard" && hash !== "#jobs"),
    label: "My CV",
  },
  {
    href: "/dashboard#jobs",
    icon: "JB",
    isActive: (pathname: string, hash: string) => pathname === "/dashboard" && hash === "#jobs",
    label: "Job Matches",
  },
  {
    href: "/dashboard/tracker",
    icon: "AP",
    isActive: (pathname: string, hash: string) => {
      void hash;
      return pathname === "/dashboard/tracker";
    },
    label: "App Tracker",
  },
  {
    href: "/salary",
    icon: "SL",
    isActive: (pathname: string, hash: string) => {
      void hash;
      return pathname === "/salary";
    },
    label: "Salary DB",
  },
  {
    href: "/nysc",
    icon: "NY",
    isActive: (pathname: string, hash: string) => {
      void hash;
      return pathname === "/nysc";
    },
    label: "NYSC Hub",
  },
] as const;

const BOTTOM_ITEMS = [
  {
    href: "/dashboard",
    icon: "CV",
    isActive: (pathname: string) => pathname === "/dashboard" || pathname === "/dashboard/versions",
    label: "CV",
  },
  {
    href: "/dashboard/tracker",
    icon: "AP",
    isActive: (pathname: string) => pathname === "/dashboard/tracker",
    label: "Tracker",
  },
  {
    href: "/salary",
    icon: "SL",
    isActive: (pathname: string) => pathname === "/salary",
    label: "Salary",
  },
  {
    href: "/email-preferences",
    icon: "ME",
    isActive: (pathname: string) => pathname === "/email-preferences",
    label: "Profile",
  },
] as const;

export function PageShell({ children, title }: PageShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [hash, setHash] = useState("");

  useEffect(() => {
    const updateHash = () => {
      setHash(window.location.hash || "");
    };

    updateHash();
    window.addEventListener("hashchange", updateHash);

    return () => {
      window.removeEventListener("hashchange", updateHash);
    };
  }, [pathname]);

  async function handleSignOut() {
    setIsSigningOut(true);

    try {
      await supabase.auth.signOut();
      router.replace("/login");
      router.refresh();
    } finally {
      setIsSigningOut(false);
    }
  }

  return (
    <div className="min-h-screen bg-[var(--black)] text-[var(--cream)]">
      <div className="mx-auto flex min-h-screen w-full max-w-[1440px] flex-col gap-6 px-4 py-6 sm:px-6 lg:flex-row">
        <aside className="sticky top-4 hidden h-[calc(100vh-2rem)] w-[280px] shrink-0 flex-col rounded-[12px] border border-[var(--border)] bg-[var(--off-black)] p-4 lg:flex">
          <div className="border-b border-[var(--border)] pb-4">
            <Link className="font-display text-2xl tracking-[-0.02em]" href="/dashboard">
              CV<span className="text-[var(--green)]">Padi</span>
            </Link>
          </div>

          <nav aria-label="Primary" className="mt-4 grid gap-1.5">
            {NAV_ITEMS.map((item) => {
              const active = item.isActive(pathname, hash);
              return (
                <Link
                  className={`flex min-h-11 items-center gap-3 rounded-[8px] border-l-[3px] px-3 text-sm font-display transition-all duration-150 ${active ? "border-l-[var(--green)] bg-[var(--green-glow)] text-[var(--green)]" : "border-l-transparent text-[var(--mid)] hover:bg-[var(--card)] hover:text-[var(--cream-dim)]"}`.trim()}
                  href={item.href}
                  key={item.label}
                >
                  <span aria-hidden="true" className="font-mono text-[11px] uppercase tracking-[0.08em]">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto grid gap-1.5 border-t border-[var(--border)] pt-4">
            <ThemeToggle />
            <Link
              className={`flex min-h-11 items-center gap-3 rounded-[8px] border-l-[3px] px-3 text-sm font-display transition-all duration-150 ${pathname === "/email-preferences" ? "border-l-[var(--green)] bg-[var(--green-glow)] text-[var(--green)]" : "border-l-transparent text-[var(--mid)] hover:bg-[var(--card)] hover:text-[var(--cream-dim)]"}`.trim()}
              href="/email-preferences"
            >
              <span aria-hidden="true" className="font-mono text-[11px] uppercase tracking-[0.08em]">ME</span>
              <span>Profile</span>
            </Link>
            <button
              className="flex min-h-11 items-center gap-3 rounded-[8px] border-l-[3px] border-l-transparent px-3 text-left text-sm font-display text-[var(--mid)] transition-all duration-150 hover:bg-[var(--card)] hover:text-[var(--cream-dim)]"
              disabled={isSigningOut}
              onClick={handleSignOut}
              type="button"
            >
              <span aria-hidden="true" className="font-mono text-[11px] uppercase tracking-[0.08em]">OUT</span>
              <span>{isSigningOut ? "Signing out..." : "Sign out"}</span>
            </button>
          </div>
        </aside>

        <main className="main-content min-w-0 flex-1 overflow-auto pb-20 lg:pb-0">
          {title ? (
            <header className="mb-4 rounded-[12px] border border-[var(--border)] bg-[var(--off-black)] px-4 py-4 sm:px-5">
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--mid)]">CVPadi</p>
              <h1 className="mt-2 font-display text-2xl text-[var(--cream)] sm:text-[30px]">{title}</h1>
            </header>
          ) : null}

          <div className="page-enter">{children}</div>
        </main>
      </div>

      <nav
        aria-label="Mobile"
        className="fixed inset-x-0 bottom-0 z-50 border-t border-[var(--border)] bg-[var(--off-black)] px-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] pt-2 backdrop-blur lg:hidden"
      >
        <div className="mx-auto grid max-w-md grid-cols-4 gap-1">
          {BOTTOM_ITEMS.map((item) => {
            const active = item.isActive(pathname);
            return (
              <Link
                className={`relative flex min-h-12 flex-col items-center justify-center rounded-[8px] px-1 text-[11px] font-display transition-colors ${active ? "text-[var(--green)]" : "text-[var(--mid)]"}`.trim()}
                href={item.href}
                key={item.label}
              >
                <span aria-hidden="true" className="font-mono text-[11px] uppercase tracking-[0.08em]">
                  {item.icon}
                </span>
                <span className="mt-1">{item.label}</span>
                {active ? <span className="mt-1 h-1 w-1 rounded-full bg-[var(--green)]" /> : null}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
