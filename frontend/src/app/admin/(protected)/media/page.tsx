"use client";

import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminFetch } from "@/lib/admin-api";
import { useToast } from "@/lib/toast";
import { useCanEdit } from "@/lib/role-context";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { Card } from "@/components/admin/m3/Card";
import { Button } from "@/components/admin/m3/Button";
import { EmptyState } from "@/components/admin/m3/EmptyState";
import { SegmentedButton } from "@/components/admin/m3/SegmentedButton";
import { MediaDetailPanel } from "@/components/admin/MediaDetailPanel";
import { FilterBar, FilterField, FilterInput, FilterSelect } from "@/components/admin/FilterBar";
import type { MediaItem, MediaUsageItem } from "@/lib/admin-types";

const USAGE_LABELS: Record<MediaUsageItem["kind"], string> = {
  app_icon: "иконка приложения",
  app_hero: "hero-изображение приложения",
  app_screenshot: "скриншот приложения",
  blog_cover: "обложка поста блога",
};

interface MediaFilter {
  mimeType: string;
  dateFrom: string;
  dateTo: string;
}
const EMPTY_FILTER: MediaFilter = { mimeType: "", dateFrom: "", dateTo: "" };

function matchesFilter(item: MediaItem, filter: MediaFilter): boolean {
  if (filter.mimeType && item.mime_type !== filter.mimeType) return false;
  const date = item.created_at.slice(0, 10);
  if (filter.dateFrom && date < filter.dateFrom) return false;
  if (filter.dateTo && date > filter.dateTo) return false;
  return true;
}

function AltInput({ item, canEdit }: { item: MediaItem; canEdit: boolean }) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [altText, setAltText] = useState(item.alt_text || "");

  const updateAltMutation = useMutation({
    mutationFn: (value: string) => adminFetch(`api/media/${item.id}`, { method: "PUT", body: { alt_text: value } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["media"] });
      showToast("Alt text сохранён");
    },
    onError: (err: Error) => showToast(err.message, "error"),
  });

  return (
    <input
      value={altText}
      onChange={(e) => setAltText(e.target.value)}
      onBlur={() => {
        if (altText !== (item.alt_text || "")) updateAltMutation.mutate(altText);
      }}
      disabled={!canEdit}
      placeholder="Alt text"
      className="block w-full rounded-md border border-md-outline-variant bg-transparent px-1.5 py-1 text-[11px] text-md-on-surface outline-none focus:border-md-primary disabled:bg-transparent"
    />
  );
}

function MediaCard({
  item,
  canEdit,
  onDelete,
  onOpen,
}: {
  item: MediaItem;
  canEdit: boolean;
  onDelete: () => void;
  onOpen: () => void;
}) {
  return (
    <Card elevation={1} className="group relative overflow-hidden">
      <button type="button" onClick={onOpen} className="block w-full cursor-zoom-in">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={item.url} alt={item.alt_text || item.filename} className="h-32 w-full object-cover" />
      </button>
      <div className="p-2">
        <p className="m-0 truncate text-xs text-md-on-surface">{item.filename}</p>
        <p className="m-0 mb-1.5 text-[11px] text-md-on-surface-variant">{(item.size_bytes / 1024).toFixed(0)} KB</p>
        <AltInput item={item} canEdit={canEdit} />
      </div>
      {canEdit && (
        <button
          onClick={onDelete}
          className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white"
          aria-label="Удалить"
        >
          <i className="ti ti-trash text-sm" />
        </button>
      )}
    </Card>
  );
}

function MediaRow({
  item,
  canEdit,
  onDelete,
  onOpen,
}: {
  item: MediaItem;
  canEdit: boolean;
  onDelete: () => void;
  onOpen: () => void;
}) {
  return (
    <div className="flex items-center gap-3 border-b border-md-outline-variant px-3 py-2 last:border-0">
      <button type="button" onClick={onOpen} className="shrink-0 cursor-zoom-in">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={item.url} alt={item.alt_text || item.filename} className="h-10 w-10 rounded-md object-cover" />
      </button>
      <div className="min-w-0 flex-1">
        <p className="m-0 truncate text-xs text-md-on-surface">{item.filename}</p>
        <p className="m-0 text-[11px] text-md-on-surface-variant">{(item.size_bytes / 1024).toFixed(0)} KB</p>
      </div>
      <div className="w-48 shrink-0">
        <AltInput item={item} canEdit={canEdit} />
      </div>
      {canEdit && (
        <button
          onClick={onDelete}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-md-on-surface-variant hover:bg-md-error-container hover:text-md-on-error-container"
          aria-label="Удалить"
        >
          <i className="ti ti-trash text-sm" />
        </button>
      )}
    </div>
  );
}

export default function MediaPage() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const canEdit = useCanEdit();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingDelete, setPendingDelete] = useState<MediaItem | null>(null);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [detailItem, setDetailItem] = useState<MediaItem | null>(null);
  const [filterDraft, setFilterDraft] = useState<MediaFilter>(EMPTY_FILTER);
  const [filter, setFilter] = useState<MediaFilter>(EMPTY_FILTER);

  const { data: allMedia, isLoading } = useQuery({
    queryKey: ["media"],
    queryFn: () => adminFetch<MediaItem[]>("api/media"),
  });

  const mimeTypes = Array.from(new Set((allMedia || []).map((m) => m.mime_type)));
  const media = (allMedia || []).filter((m) => matchesFilter(m, filter));
  const hasActiveFilters = !!(filter.mimeType || filter.dateFrom || filter.dateTo);

  const uploadMutation = useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      return adminFetch<{ id: string; url: string }>("api/media/upload", {
        method: "POST",
        body: formData,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["media"] });
      showToast("Файл загружен");
    },
    onError: (err: Error) => showToast(err.message, "error"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminFetch(`api/media/${id}?force=true`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["media"] });
      showToast("Файл удалён");
      setPendingDelete(null);
    },
    onError: (err: Error) => showToast(err.message, "error"),
  });

  const usageQuery = useQuery({
    queryKey: ["media-usage", pendingDelete?.id],
    queryFn: () => adminFetch<MediaUsageItem[]>(`api/media/${pendingDelete!.id}/usage`),
    enabled: !!pendingDelete,
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="md-headline-small m-0 text-md-on-surface">Медиатека</h1>
        <div className="flex items-center gap-3">
          <SegmentedButton
            segments={[
              { value: "grid", label: "Сетка", icon: "ti-layout-grid" },
              { value: "list", label: "Список", icon: "ti-list" },
            ]}
            value={view}
            onChange={setView}
          />
          {canEdit && (
            <Button onClick={() => fileInputRef.current?.click()} disabled={uploadMutation.isPending}>
              {uploadMutation.isPending ? "Загрузка..." : "Загрузить файл"}
            </Button>
          )}
        </div>
      </div>

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

      <FilterBar
        hasActiveFilters={hasActiveFilters}
        onApply={() => setFilter(filterDraft)}
        onClear={() => {
          setFilterDraft(EMPTY_FILTER);
          setFilter(EMPTY_FILTER);
        }}
      >
        <FilterField label="Тип файла">
          <FilterSelect
            value={filterDraft.mimeType}
            onChange={(e) => setFilterDraft((f) => ({ ...f, mimeType: e.target.value }))}
          >
            <option value="">Все</option>
            {mimeTypes.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </FilterSelect>
        </FilterField>
        <FilterField label="Загружено с">
          <FilterInput
            type="date"
            value={filterDraft.dateFrom}
            onChange={(e) => setFilterDraft((f) => ({ ...f, dateFrom: e.target.value }))}
          />
        </FilterField>
        <FilterField label="по">
          <FilterInput
            type="date"
            value={filterDraft.dateTo}
            onChange={(e) => setFilterDraft((f) => ({ ...f, dateTo: e.target.value }))}
          />
        </FilterField>
      </FilterBar>

      {isLoading && <p className="md-body-medium text-md-on-surface-variant">Загрузка...</p>}

      {media.length === 0 && !isLoading && hasActiveFilters ? (
        <p className="md-body-medium text-md-on-surface-variant">Ничего не найдено по текущим фильтрам.</p>
      ) : media.length === 0 && !isLoading ? (
        <EmptyState
          icon="ti-photo"
          title="Медиафайлов пока нет"
          description="Загрузите изображения для иконок приложений, обложек блога и картинок в блочном редакторе — все они хранятся здесь."
          actionLabel={canEdit ? "Загрузить файл" : undefined}
          onAction={canEdit ? () => fileInputRef.current?.click() : undefined}
        />
      ) : view === "grid" ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {media.map((item) => (
            <MediaCard
              key={item.id}
              item={item}
              canEdit={canEdit}
              onDelete={() => setPendingDelete(item)}
              onOpen={() => setDetailItem(item)}
            />
          ))}
        </div>
      ) : (
        <Card elevation={1} className="overflow-hidden">
          {media.map((item) => (
            <MediaRow
              key={item.id}
              item={item}
              canEdit={canEdit}
              onDelete={() => setPendingDelete(item)}
              onOpen={() => setDetailItem(item)}
            />
          ))}
        </Card>
      )}

      <MediaDetailPanel
        item={detailItem}
        canEdit={canEdit}
        onClose={() => setDetailItem(null)}
        onDelete={(item) => {
          setDetailItem(null);
          setPendingDelete(item);
        }}
      />

      <ConfirmDialog
        open={!!pendingDelete}
        title={`Удалить «${pendingDelete?.filename}»?`}
        description={
          usageQuery.data && usageQuery.data.length > 0
            ? `Внимание: используется в ${usageQuery.data.length} мест${usageQuery.data.length === 1 ? "е" : "ах"} — ${usageQuery.data
                .map((u) => `${USAGE_LABELS[u.kind]} «${u.title}»`)
                .join(", ")}. Удаление сломает эти места. Файл будет удалён с диска и из базы данных без возможности восстановления.`
            : "Файл будет удалён с диска и из базы данных без возможности восстановления."
        }
        confirmLabel={usageQuery.data && usageQuery.data.length > 0 ? "Удалить всё равно" : "Удалить"}
        onConfirm={() => pendingDelete && deleteMutation.mutate(pendingDelete.id)}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
