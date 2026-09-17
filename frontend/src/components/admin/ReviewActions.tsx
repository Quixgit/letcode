"use client";

import { useState } from "react";
import { ReviewBadge } from "@/components/admin/ReviewBadge";
import type { ReviewStatus } from "@/lib/admin-types";

interface ReviewActionsProps {
  reviewStatus?: ReviewStatus;
  isAdmin: boolean;
  canEdit: boolean;
  onSubmitReview: (note: string) => void;
  onApprove: () => void;
  onRequestChanges: (note: string) => void;
  submitting?: boolean;
}

// Simple editor-submits / admin-decides workflow layered on top of the existing draft/published
// status — orthogonal to it, so an editor can request review on a draft before it's ever
// published, or on a live page before a follow-up edit goes out.
export function ReviewActions({
  reviewStatus,
  isAdmin,
  canEdit,
  onSubmitReview,
  onApprove,
  onRequestChanges,
  submitting,
}: ReviewActionsProps) {
  const [notePrompt, setNotePrompt] = useState<"submit" | "request_changes" | null>(null);
  const [note, setNote] = useState("");

  if (!canEdit) return null;

  const status = reviewStatus || "none";

  return (
    <div className="flex items-center gap-2">
      <ReviewBadge status={reviewStatus} />

      {isAdmin && status === "pending_review" && (
        <>
          <button
            onClick={onApprove}
            disabled={submitting}
            className="rounded-lg border border-md-outline-variant px-3 py-1.5 text-[13px] text-md-on-surface hover:border-md-primary"
          >
            Одобрить
          </button>
          <button
            onClick={() => setNotePrompt("request_changes")}
            disabled={submitting}
            className="rounded-lg px-3 py-1.5 text-[13px] text-md-on-surface-variant hover:text-md-error"
          >
            Запросить правки
          </button>
        </>
      )}

      {(status === "none" || status === "changes_requested") && (
        <button
          onClick={() => setNotePrompt("submit")}
          disabled={submitting}
          className="rounded-lg border border-md-outline-variant px-3 py-1.5 text-[13px] text-md-on-surface hover:border-md-primary"
        >
          Отправить на проверку
        </button>
      )}

      {notePrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setNotePrompt(null)}>
          <div
            className="w-full max-w-md rounded-xl bg-md-surface-container-high p-4"
            style={{ boxShadow: "var(--md-elevation-3)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <p className="md-title-small mb-2 text-md-on-surface">
              {notePrompt === "submit" ? "Отправить на проверку" : "Запросить правки"}
            </p>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder="Комментарий (опционально)"
              className="block w-full rounded-lg border border-md-outline-variant bg-transparent px-2.5 py-2 text-sm text-md-on-surface outline-none focus:border-md-primary"
            />
            <div className="mt-3 flex justify-end gap-2">
              <button
                onClick={() => {
                  setNotePrompt(null);
                  setNote("");
                }}
                className="rounded-lg px-3 py-1.5 text-[13px] text-md-on-surface-variant"
              >
                Отмена
              </button>
              <button
                onClick={() => {
                  if (notePrompt === "submit") onSubmitReview(note);
                  else onRequestChanges(note);
                  setNotePrompt(null);
                  setNote("");
                }}
                className="rounded-lg bg-md-primary px-3 py-1.5 text-[13px] text-md-on-primary"
              >
                Отправить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
