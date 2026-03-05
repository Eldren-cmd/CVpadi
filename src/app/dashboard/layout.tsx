import type { ReactNode } from "react";
import { PageShell } from "@/components/ui/PageShell";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <PageShell title="Dashboard">{children}</PageShell>;
}
