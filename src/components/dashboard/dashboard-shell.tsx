import type { ReactNode } from "react";
import { DashboardNav } from "./dashboard-nav";

export function DashboardShell({ children }: { children: ReactNode }) {
  return (
    <div className="px-4 py-6 sm:px-6 sm:py-8">
      <div className="mx-auto flex max-w-7xl gap-6 pb-24 lg:pb-0">
        <DashboardNav />
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
