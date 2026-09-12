"use client";

import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { adminFetch } from "@/lib/admin-api";
import { useToast } from "@/lib/toast";
import type { MediaItem } from "@/lib/admin-types";

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function MediaDetailPanel({
  item,
  canEdit,
  onClose,
  onDelete,
}: {
  item: MediaItem | null;
  canEdit: boolean;
  onClose: () => void;
  onDelete: (item: MediaItem) => void;
}) {
  if (!item) return null;
  return <MediaDetailPanelInner key={item.id} item={item} canEdit={canEdit} onClose={onClose} onDelete={onDelete} />;
}

/** Mounted fresh (via `key`) whenever the selected item changes, so per-item local state starts clean without a reset effect. */
function MediaDetailPanelInner({
  item,
  canEdit,
  onClose,
  onDelete,
}: {
  item: MediaItem;
  canEdit: boolean;
  onClose: () => void;
  onDelete: (item: MediaItem) => void;
}) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [altText, setAltText] = useState(item.alt_text || "");
  const [dimensions, setDimensions] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (item.mime_type === "image/svg+xml") return;
    const img = new window.Image();
    img.onload = () => setDimensions(`${img.naturalWidth} × ${img.naturalHeight}`);
    img.src = item.url;
  }, [item]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const updateAltMutation = useMutation({
    mutationFn: (value: string) => adminFetch(`api/media/${item.id}`, { method: "PUT", body: { alt_text: value } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["media"] });
      showToast("Alt text сохранён");
    },
    onError: (err: Error) => showToast(err.message, "error"),
  });

  return (
    <div className="md-dialog-scrim fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div
        className="flex h-full w-full max-w-md flex-col overflow-y-auto bg-md-surface-container-high p-5"
        style={{ boxShadow: "var(--md-elevation-3)", animation: "md-dialog-in var(--md-duration-medium) var(--md-easing-emphasized-decelerate)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <p className="md-title-medium m-0 text-md-on-surface">Детали файла</p>
          <button onClick={onClose} className="text-md-on-surface-variant hover:text-md-on-surface">
            <i className="ti ti-x text-lg" />
          </button>
        </div>

        <div className="mb-4 flex items-center justify-center rounded-lg bg-md-surface-container-low p-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={item.url} alt={item.alt_text || item.filename} className="max-h-64 max-w-full object-contain" />
        </div>

        <dl className="mb-4 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-[13px]">
          <dt className="text-md-on-surface-variant">Файл</dt>
          <dd className="m-0 truncate text-md-on-surface">{item.filename}</dd>
          <dt className="text-md-on-surface-variant">Размер</dt>
          <dd className="m-0 text-md-on-surface">{formatSize(item.size_bytes)}</dd>
          <dt className="text-md-on-surface-variant">Габариты</dt>
          <dd className="m-0 text-md-on-surface">{dimensions || "—"}</dd>
          <dt className="text-md-on-surface-variant">Загружен</dt>
          <dd className="m-0 text-md-on-surface">{new Date(item.created_at).toLocaleString("ru-RU")}</dd>
        </dl>

        <label className="mb-1 block text-[12px] text-md-on-surface-variant">Alt text</label>
        <input
          value={altText}
          onChange={(e) => setAltText(e.target.value)}
          onBlur={() => {
            if (altText !== (item.alt_text || "")) updateAltMutation.mutate(altText);
          }}
          disabled={!canEdit}
          placeholder="Описание изображения для доступности и SEO"
          className="mb-4 block w-full rounded-lg border border-md-outline-variant bg-transparent px-2.5 py-1.5 text-[13px] text-md-on-surface outline-none focus:border-md-primary disabled:bg-transparent"
        />

        <label className="mb-1 block text-[12px] text-md-on-surface-variant">URL</label>
        <div className="mb-6 flex items-center gap-2">
          <input
            readOnly
            value={item.url}
            className="block w-full truncate rounded-lg border border-md-outline-variant bg-transparent px-2.5 py-1.5 text-[12px] text-md-on-surface-variant outline-none"
          />
          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(item.url).then(() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              });
            }}
            className="shrink-0 rounded-lg border border-md-outline-variant px-2.5 py-1.5 text-[12px] text-md-on-surface-variant hover:border-md-primary hover:text-md-on-surface"
          >
            {copied ? "Скопировано" : "Копировать"}
          </button>
        </div>

        {canEdit && (
          <button
            type="button"
            onClick={() => onDelete(item)}
            className="mt-auto flex items-center gap-1.5 self-start text-[13px] text-md-error hover:underline"
          >
            <i className="ti ti-trash text-sm" />
            Удалить файл
          </button>
        )}
      </div>
    </div>
  );
}
