import type { ReviewStatus } from "@/lib/admin-types";

const LABELS: Record<Exclude<ReviewStatus, "none">, { label: string; className: string }> = {
  pending_review: { label: "На проверке", className: "bg-md-tertiary-container text-md-on-tertiary-container" },
  changes_requested: { label: "Нужны правки", className: "bg-md-error-container text-md-error" },
  approved: { label: "Одобрено", className: "bg-md-secondary-container text-md-on-secondary-container" },
};

export function ReviewBadge({ status }: { status?: ReviewStatus }) {
  if (!status || status === "none") return null;
  const cfg = LABELS[status];
  return <span className={`rounded px-1.5 py-0.5 text-[11px] ${cfg.className}`}>{cfg.label}</span>;
}

const NOTE_CONTEXT: Record<Exclude<ReviewStatus, "none">, string> = {
  pending_review: "Комментарий автора при отправке на проверку",
  changes_requested: "Что нужно исправить",
  approved: "Комментарий проверяющего",
};

// Surfaces the actual review_note text — the badge alone only shows the status word, not *why*,
// which is the part an editor actually needs to act on after a "changes requested" decision.
export function ReviewNoteCallout({ status, note }: { status?: ReviewStatus; note?: string | null }) {
  if (!status || status === "none" || !note) return null;
  const isChangesRequested = status === "changes_requested";
  return (
    <div
      className={`rounded-lg border p-3 text-[13px] ${
        isChangesRequested
          ? "border-md-error/30 bg-md-error-container/40 text-md-on-error-container"
          : "border-md-outline-variant bg-md-surface-container-low text-md-on-surface"
      }`}
    >
      <p className="m-0 mb-1 text-[11px] uppercase text-md-on-surface-variant">{NOTE_CONTEXT[status]}</p>
      <p className="m-0 whitespace-pre-wrap">{note}</p>
    </div>
  );
}
