"use client";

import {
  DndContext,
  PointerSensor,
  TouchSensor,
  closestCorners,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { startTransition, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  createApplicationAction,
  updateApplicationStatusAction,
} from "@/app/dashboard/tracker/actions";
import { Button } from "@/components/ui/Button";
import { ToastStack, type ToastItem } from "@/components/ui/Toast";
import {
  TRACKER_STATUSES,
  TRACKER_STATUS_META,
  type TrackerApplication,
  type TrackerStatus,
} from "@/lib/tracker/constants";

export function ApplicationTracker({
  initialApplications,
}: {
  initialApplications: TrackerApplication[];
}) {
  const router = useRouter();
  const [applications, setApplications] = useState(initialApplications);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingApplicationId, setPendingApplicationId] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [mobileMoveApplication, setMobileMoveApplication] =
    useState<TrackerApplication | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const groupedApplications = useMemo(() => {
    return TRACKER_STATUSES.reduce(
      (accumulator, status) => {
        accumulator[status] = applications.filter((application) => application.status === status);
        return accumulator;
      },
      {} as Record<TrackerStatus, TrackerApplication[]>,
    );
  }, [applications]);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 767px)");
    const update = () => setIsMobile(media.matches);

    update();
    media.addEventListener("change", update);

    return () => {
      media.removeEventListener("change", update);
    };
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 120, tolerance: 6 },
    }),
  );

  async function handleCreateApplication(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setIsSubmitting(true);

    const form = event.currentTarget;
    const formData = new FormData(form);

    startTransition(async () => {
      const result = await createApplicationAction({
        company: String(formData.get("company") || ""),
        dateApplied: String(formData.get("dateApplied") || ""),
        notes: String(formData.get("notes") || ""),
        role: String(formData.get("role") || ""),
        source: String(formData.get("source") || ""),
      });

      if (result.error) {
        setErrorMessage(result.error);
        setIsSubmitting(false);
        return;
      }

      const createdApplication = result.application;
      if (createdApplication) {
        setApplications((current) => [createdApplication, ...current]);
        setIsAddModalOpen(false);
        form.reset();
        pushToast({
          id: `created-${createdApplication.id}`,
          title: `${createdApplication.company} added to Applied`,
          variant: "success",
        });
      }

      setIsSubmitting(false);
    });
  }

  function handleDragEnd(event: DragEndEvent) {
    if (isMobile) {
      return;
    }

    const rawActiveId = String(event.active.id);
    const rawOverId = event.over?.id ? String(event.over.id) : null;
    const applicationId = rawActiveId.replace("application-", "");

    if (!rawOverId || !TRACKER_STATUSES.includes(rawOverId as TrackerStatus)) {
      return;
    }

    const nextStatus = rawOverId as TrackerStatus;
    const current = applications.find((entry) => entry.id === applicationId);

    if (!current || current.status === nextStatus) {
      return;
    }

    void moveApplication(current, nextStatus);
  }

  async function moveApplication(application: TrackerApplication, status: TrackerStatus) {
    setErrorMessage("");
    setPendingApplicationId(application.id);

    startTransition(async () => {
      const result = await updateApplicationStatusAction({
        id: application.id,
        status,
      });

      if (result.error) {
        setErrorMessage(result.error);
        setPendingApplicationId(null);
        return;
      }

      const updatedApplication = result.application;

      if (updatedApplication) {
        setApplications((current) =>
          current.map((entry) =>
            entry.id === updatedApplication.id ? updatedApplication : entry,
          ),
        );

        pushToast({
          id: `moved-${updatedApplication.id}-${updatedApplication.status}`,
          title: `${updatedApplication.company} moved to ${TRACKER_STATUS_META[updatedApplication.status].label}`,
          variant: "info",
        });

        if (updatedApplication.status === "interview") {
          pushToast({
            actionLabel: "Edit CV →",
            description: "Make sure your CV is updated before the interview.",
            id: `interview-${updatedApplication.id}`,
            onAction: () => router.push("/build"),
            title: `Heading to an interview at ${updatedApplication.company}?`,
            variant: "warning",
          });
        }
      }

      setPendingApplicationId(null);
      setMobileMoveApplication(null);
    });
  }

  function pushToast(toast: ToastItem) {
    setToasts((current) => {
      const withoutDuplicate = current.filter((entry) => entry.id !== toast.id);
      return [...withoutDuplicate, toast];
    });
  }

  function dismissToast(id: string) {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }

  return (
    <div className="relative page-enter">
      <ToastStack onDismiss={dismissToast} toasts={toasts} />

      <section className="rounded-[16px] border border-[var(--border)] bg-[var(--off-black)] p-5 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--mid)]">Application tracker</p>
            <h1 className="mt-2 font-heading text-5xl leading-[1.02] text-[var(--cream)]">Kanban job pipeline</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--cream-dim)]">
              Drag cards across Applied, Interview, Rejected, and Offer. On mobile, use Move to.
            </p>
          </div>
          <Button onClick={() => setIsAddModalOpen(true)} variant="primary">
            Add application
          </Button>
        </div>

        {errorMessage ? (
          <p className="mt-4 rounded-[8px] border border-[var(--red)] bg-[var(--red-glow)] px-4 py-3 text-sm text-[var(--red)]">
            {errorMessage}
          </p>
        ) : null}
      </section>

      <DndContext
        collisionDetection={closestCorners}
        onDragEnd={handleDragEnd}
        sensors={isMobile ? undefined : sensors}
      >
        <section className="mt-6 grid gap-4 xl:grid-cols-4">
          {TRACKER_STATUSES.map((status) => (
            <TrackerColumn
              applications={groupedApplications[status]}
              isMobile={isMobile}
              key={status}
              onMoveMobile={setMobileMoveApplication}
              pendingApplicationId={pendingApplicationId}
              status={status}
            />
          ))}
        </section>
      </DndContext>

      <button
        aria-label="Add application"
        className="fixed bottom-24 right-5 z-40 inline-flex h-14 w-14 items-center justify-center rounded-full bg-[var(--green)] text-3xl text-[var(--black)] shadow-[0_8px_32px_var(--green-glow)] transition-transform duration-200 hover:scale-110"
        onClick={() => setIsAddModalOpen(true)}
        type="button"
      >
        +
      </button>

      {isAddModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-end bg-[rgba(0,0,0,0.6)] p-0 sm:items-center sm:justify-center sm:p-4">
          <div className="w-full rounded-t-[16px] border border-[var(--border)] bg-[var(--off-black)] p-5 sm:max-w-lg sm:rounded-[16px]">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-2xl text-[var(--cream)]">Add application</h2>
              <button
                className="text-[var(--mid)] transition-colors hover:text-[var(--cream)]"
                onClick={() => setIsAddModalOpen(false)}
                type="button"
              >
                ✕
              </button>
            </div>

            <form className="grid gap-3" onSubmit={handleCreateApplication}>
              <input
                className="min-h-11 rounded-[8px] border border-[var(--border)] bg-[var(--surface)] px-4 text-[var(--cream)]"
                name="company"
                placeholder="Company"
                required
                type="text"
              />
              <input
                className="min-h-11 rounded-[8px] border border-[var(--border)] bg-[var(--surface)] px-4 text-[var(--cream)]"
                name="role"
                placeholder="Role"
                required
                type="text"
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  className="min-h-11 rounded-[8px] border border-[var(--border)] bg-[var(--surface)] px-4 text-[var(--cream)]"
                  name="dateApplied"
                  type="date"
                />
                <input
                  className="min-h-11 rounded-[8px] border border-[var(--border)] bg-[var(--surface)] px-4 text-[var(--cream)]"
                  name="source"
                  placeholder="Source"
                  type="text"
                />
              </div>
              <textarea
                className="min-h-24 rounded-[8px] border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-[var(--cream)]"
                name="notes"
                placeholder="Notes"
              />
              <Button className="w-full" loading={isSubmitting} type="submit" variant="primary">
                Save application
              </Button>
            </form>
          </div>
        </div>
      ) : null}

      {mobileMoveApplication ? (
        <div className="fixed inset-0 z-50 flex items-end bg-[rgba(0,0,0,0.58)] p-0 md:hidden">
          <div className="w-full rounded-t-[16px] border border-[var(--border)] bg-[var(--off-black)] p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-xl text-[var(--cream)]">Move to</h3>
              <button
                className="text-[var(--mid)]"
                onClick={() => setMobileMoveApplication(null)}
                type="button"
              >
                ✕
              </button>
            </div>
            <div className="grid gap-2">
              {TRACKER_STATUSES.map((status) => (
                <button
                  className="min-h-12 rounded-[10px] border border-[var(--border)] bg-[var(--surface)] px-4 text-left font-display text-sm text-[var(--cream-dim)]"
                  key={status}
                  onClick={() => void moveApplication(mobileMoveApplication, status)}
                  type="button"
                >
                  {TRACKER_STATUS_META[status].label}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function TrackerColumn({
  status,
  applications,
  pendingApplicationId,
  isMobile,
  onMoveMobile,
}: {
  status: TrackerStatus;
  applications: TrackerApplication[];
  pendingApplicationId: string | null;
  isMobile: boolean;
  onMoveMobile: (application: TrackerApplication) => void;
}) {
  const { isOver, setNodeRef } = useDroppable({ id: status });

  return (
    <div
      className={`min-h-[400px] rounded-[12px] border p-4 transition-colors duration-200 ${isOver ? "border-[var(--green)] bg-[var(--green-glow)]" : "border-[var(--border)] bg-[var(--surface)]"}`.trim()}
      ref={setNodeRef}
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="font-display text-sm uppercase tracking-[0.06em] text-[var(--cream)]">
          {TRACKER_STATUS_META[status].label}
        </h2>
        <span className="rounded-full border border-[var(--border)] bg-[var(--card)] px-2 py-1 font-mono text-[11px] text-[var(--cream-dim)]">
          {applications.length}
        </span>
      </div>

      <div className="grid gap-3">
        {applications.length > 0 ? (
          applications.map((application) => (
            <ApplicationCard
              application={application}
              isMobile={isMobile}
              key={application.id}
              onMoveMobile={onMoveMobile}
              pending={pendingApplicationId === application.id}
            />
          ))
        ) : (
          <p className="text-xs text-[var(--mid)]">{TRACKER_STATUS_META[status].emptyState}</p>
        )}
      </div>
    </div>
  );
}

function ApplicationCard({
  application,
  pending,
  isMobile,
  onMoveMobile,
}: {
  application: TrackerApplication;
  pending: boolean;
  isMobile: boolean;
  onMoveMobile: (application: TrackerApplication) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `application-${application.id}`,
    disabled: isMobile,
  });

  const style = {
    transform: CSS.Translate.toString(transform),
  };

  return (
    <article
      className={`rounded-[10px] border border-[var(--border)] bg-[var(--card)] p-4 transition-all duration-300 ${pending ? "scale-95 opacity-70" : "opacity-100"}`.trim()}
      ref={setNodeRef}
      style={{
        ...style,
        opacity: isDragging ? 0.5 : undefined,
        transform: `${style.transform ?? ""} ${isDragging ? "rotate(2deg) scale(1.05)" : ""}`.trim(),
      }}
      {...attributes}
      {...listeners}
    >
      <p className="font-display text-[15px] text-[var(--cream)]">{application.company}</p>
      <p className="mt-1 text-sm text-[var(--cream-dim)]">{application.role}</p>
      <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--mid)]">
        Applied {formatDate(application.dateApplied, application.createdAt)}
      </p>
      {application.source ? (
        <span className="mt-3 inline-flex rounded-full border border-[var(--border)] bg-[var(--surface)] px-2 py-1 font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--cream-dim)]">
          {application.source}
        </span>
      ) : null}

      {isMobile ? (
        <Button className="mt-3 w-full" onClick={() => onMoveMobile(application)} variant="ghost">
          Move to →
        </Button>
      ) : null}
    </article>
  );
}

function formatDate(dateApplied: string | null, createdAt: string) {
  const value = dateApplied || createdAt;
  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return "Not set";
  }

  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(parsed);
}
