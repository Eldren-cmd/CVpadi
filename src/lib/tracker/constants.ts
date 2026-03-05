export const TRACKER_STATUSES = [
  "applied",
  "interview",
  "rejected",
  "offer",
] as const;

export type TrackerStatus = (typeof TRACKER_STATUSES)[number];

export interface TrackerApplication {
  company: string;
  createdAt: string;
  dateApplied: string | null;
  id: string;
  notes: string;
  role: string;
  source: string;
  status: TrackerStatus;
}

export const TRACKER_STATUS_META: Record<
  TrackerStatus,
  {
    accentClassName: string;
    emptyState: string;
    label: string;
  }
> = {
  applied: {
    accentClassName: "bg-[var(--blue-light)] text-[var(--blue)]",
    emptyState: "Jobs you've applied to will appear here.",
    label: "Applied",
  },
  interview: {
    accentClassName: "bg-[var(--gold-light)] text-[var(--gold)]",
    emptyState: "Interview invitations you're preparing for.",
    label: "Interview",
  },
  offer: {
    accentClassName: "bg-[var(--green-light)] text-[var(--green)]",
    emptyState: "Roles you've received an offer for.",
    label: "Offer",
  },
  rejected: {
    accentClassName: "bg-[var(--red-light)] text-[var(--red)]",
    emptyState: "Applications that didn't move forward.",
    label: "Rejected",
  },
};
