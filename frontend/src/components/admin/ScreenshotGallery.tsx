"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { adminFetch } from "@/lib/admin-api";
import { useToast } from "@/lib/toast";
import { useCanEdit } from "@/lib/role-context";
import { MediaPicker } from "@/components/admin/MediaPicker";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import type { AppScreenshot } from "@/lib/admin-types";

interface ScreenshotGalleryProps {
  appId: string;
  screenshots: AppScreenshot[];
}

export function ScreenshotGallery({ appId, screenshots }: ScreenshotGalleryProps) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const canEdit = useCanEdit();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<AppScreenshot | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["app", appId] });

  const addMutation = useMutation({
    mutationFn: (mediaId: string) =>
      adminFetch(`api/apps/${appId}/screenshots`, {
        method: "POST",
        body: { media_id: mediaId, sort_order: screenshots.length },
      }),
    onSuccess: () => {
      invalidate();
      showToast("Скриншот добавлен");
    },
    onError: (err: Error) => showToast(err.message, "error"),
  });

  const deleteMutation = useMutation({
    mutationFn: (screenshotId: string) =>
      adminFetch(`api/apps/${appId}/screenshots/${screenshotId}`, { method: "DELETE" }),
    onSuccess: () => {
      invalidate();
      showToast("Скриншот удалён");
      setPendingDelete(null);
    },
    onError: (err: Error) => showToast(err.message, "error"),
  });

  const reorderMutation = useMutation({
    mutationFn: async (ordered: AppScreenshot[]) => {
      await Promise.all(
        ordered.map((shot, index) =>
          shot.sort_order === index
            ? Promise.resolve()
            : adminFetch(`api/apps/${appId}/screenshots/${shot.id}`, {
                method: "PUT",
                body: { sort_order: index },
              })
        )
      );
    },
    onSuccess: () => invalidate(),
    onError: (err: Error) => showToast(err.message, "error"),
  });

  function handleDrop(targetIndex: number) {
    if (dragIndex === null || dragIndex === targetIndex) return;
    const reordered = [...screenshots];
    const [moved] = reordered.splice(dragIndex, 1);
    reordered.splice(targetIndex, 0, moved);
    setDragIndex(null);
    reorderMutation.mutate(reordered);
  }

  return (
    <fieldset className="rounded-xl border border-md-outline-variant p-4">
      <legend className="px-1 text-[13px] text-md-on-surface-variant">Скриншоты</legend>

      <div className="flex flex-wrap gap-3">
        {screenshots.map((shot, index) => (
          <div
            key={shot.id}
            draggable={canEdit}
            onDragStart={() => setDragIndex(index)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => handleDrop(index)}
            className="group relative h-28 w-20 shrink-0 overflow-hidden rounded-lg border border-md-outline-variant"
          >
            <img src={shot.url} alt="" className="h-full w-full object-cover" />
            {canEdit && (
              <button
                type="button"
                onClick={() => setPendingDelete(shot)}
                className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white"
              >
                <i className="ti ti-trash text-xs" />
              </button>
            )}
          </div>
        ))}

        {canEdit && (
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            className="flex h-28 w-20 shrink-0 items-center justify-center rounded-lg border border-dashed border-md-outline-variant text-md-on-surface-variant hover:border-md-primary"
          >
            <i className="ti ti-plus text-lg" />
          </button>
        )}
      </div>

      {canEdit && screenshots.length > 1 && (
        <p className="mt-2 text-xs text-md-on-surface-variant">Перетащите, чтобы изменить порядок.</p>
      )}

      <MediaPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={(item) => {
          addMutation.mutate(item.id);
          setPickerOpen(false);
        }}
      />

      <ConfirmDialog
        open={!!pendingDelete}
        title="Удалить скриншот?"
        onConfirm={() => pendingDelete && deleteMutation.mutate(pendingDelete.id)}
        onCancel={() => setPendingDelete(null)}
      />
    </fieldset>
  );
}
