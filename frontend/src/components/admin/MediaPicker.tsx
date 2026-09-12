"use client";

import { useEffect, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminFetch } from "@/lib/admin-api";
import { useToast } from "@/lib/toast";
import type { MediaItem } from "@/lib/admin-types";

interface MediaPickerProps {
  open: boolean;
  onSelect: (item: MediaItem) => void;
  onClose: () => void;
}

export function MediaPicker({ open, onSelect, onClose }: MediaPickerProps) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  const { data: media, isLoading } = useQuery({
    queryKey: ["media"],
    queryFn: () => adminFetch<MediaItem[]>("api/media"),
    enabled: open,
  });

  const uploadMutation = useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      return adminFetch<{ id: string; url: string }>("api/media/upload", {
        method: "POST",
        body: formData,
      });
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["media"] });
      onSelect({ id: result.id, url: result.url, filename: "", mime_type: "", size_bytes: 0, alt_text: null, created_at: "" });
      showToast("Файл загружен и выбран");
    },
    onError: (err: Error) => showToast(err.message, "error"),
  });

  if (!open) return null;

  return (
    <div className="md-dialog-scrim fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
      <div
        className="flex max-h-[80vh] w-[640px] flex-col rounded-xl bg-md-surface-container-high p-5"
        style={{ boxShadow: "var(--md-elevation-3)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <p className="m-0 text-sm font-medium text-md-on-surface">Выбрать медиафайл</p>
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".jpg,.jpeg,.png,.webp,.gif,.svg"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) uploadMutation.mutate(file);
                e.target.value = "";
              }}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadMutation.isPending}
              className="rounded-lg bg-md-primary px-3 py-1.5 text-[13px] font-medium text-md-on-primary disabled:opacity-60"
            >
              {uploadMutation.isPending ? "Загрузка..." : "Загрузить"}
            </button>
            <button onClick={onClose} className="rounded-lg px-2 py-1.5 text-md-on-surface-variant hover:bg-md-surface-container-low">
              <i className="ti ti-x" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-3 overflow-y-auto">
          {isLoading && <p className="col-span-4 text-[13px] text-md-on-surface-variant">Загрузка...</p>}
          {(media || []).map((item) => (
            <button
              key={item.id}
              onClick={() => onSelect(item)}
              className="overflow-hidden rounded-lg border border-md-outline-variant hover:border-md-primary"
            >
              <img src={item.url} alt={item.alt_text || item.filename} className="h-24 w-full object-cover" />
            </button>
          ))}
          {media?.length === 0 && !isLoading && (
            <p className="col-span-4 text-[13px] text-md-on-surface-variant">Медиафайлов пока нет.</p>
          )}
        </div>
      </div>
    </div>
  );
}
