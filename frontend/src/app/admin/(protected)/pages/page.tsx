"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminFetch } from "@/lib/admin-api";
import { useToast } from "@/lib/toast";
import { useCanEdit } from "@/lib/role-context";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Card } from "@/components/admin/m3/Card";
import { Button } from "@/components/admin/m3/Button";
import { SegmentedButton } from "@/components/admin/m3/SegmentedButton";
import { EmptyState } from "@/components/admin/m3/EmptyState";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { QuickEditRow } from "@/components/admin/QuickEditRow";
import { FilterBar, FilterField, FilterInput } from "@/components/admin/FilterBar";
import { ReviewBadge } from "@/components/admin/ReviewBadge";
import type { ContentStatus, PageListItem } from "@/lib/admin-types";

interface DateFilter {
  from: string;
  to: string;
}
const EMPTY_DATE_FILTER: DateFilter = { from: "", to: "" };

function withinRange(dateStr: string, filter: DateFilter): boolean {
  const date = dateStr.slice(0, 10);
  if (filter.from && date < filter.from) return false;
  if (filter.to && date > filter.to) return false;
  return true;
}

type TabValue = ContentStatus | "all" | "trash";

const TABS: { label: string; value: TabValue }[] = [
  { label: "Все", value: "all" },
  { label: "Опубликовано", value: "published" },
  { label: "Черновики", value: "draft" },
  { label: "Архив", value: "archived" },
  { label: "Корзина", value: "trash" },
];

function initialTab(statusParam: string | null): TabValue {
  return statusParam === "published" || statusParam === "draft" || statusParam === "archived" || statusParam === "trash"
    ? statusParam
    : "all";
}

export default function PagesListPage() {
  return (
    <Suspense fallback={<p className="md-body-medium text-md-on-surface-variant">Загрузка...</p>}>
      <PagesListPageInner />
    </Suspense>
  );
}

function PagesListPageInner() {
  const canEdit = useCanEdit();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<TabValue>(() => initialTab(searchParams.get("status")));
  const [selected, setSelected] = useState<string[]>([]);
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);
  const [pendingPermanentDelete, setPendingPermanentDelete] = useState<PageListItem | null>(null);
  const [quickEditId, setQuickEditId] = useState<string | null>(null);
  const [dateDraft, setDateDraft] = useState<DateFilter>(EMPTY_DATE_FILTER);
  const [dateFilter, setDateFilter] = useState<DateFilter>(EMPTY_DATE_FILTER);

  const { data: allPages, isLoading } = useQuery({
    queryKey: ["pages", tab],
    queryFn: () => adminFetch<PageListItem[]>(tab === "all" ? "api/pages" : `api/pages?status=${tab}`),
  });

  const pages = (allPages || []).filter((p) => withinRange(p.created_at, dateFilter));
  const hasActiveFilters = !!(dateFilter.from || dateFilter.to);

  const quickEditMutation = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: { title: string; slug: string; status: ContentStatus } }) =>
      adminFetch(`api/pages/${id}/quick-edit`, { method: "PATCH", body: patch }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pages"] });
      setQuickEditId(null);
      showToast("Сохранено");
    },
    onError: (err: Error) => showToast(err.message, "error"),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["pages"] });
    setSelected([]);
  };

  const bulkPublishMutation = useMutation({
    mutationFn: (ids: string[]) => Promise.all(ids.map((id) => adminFetch(`api/pages/${id}/publish`, { method: "POST" }))),
    onSuccess: () => {
      invalidate();
      showToast("Опубликовано");
    },
    onError: (err: Error) => showToast(err.message, "error"),
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: (ids: string[]) => Promise.all(ids.map((id) => adminFetch(`api/pages/${id}`, { method: "DELETE" }))),
    onSuccess: () => {
      invalidate();
      setConfirmBulkDelete(false);
      showToast("Перемещено в корзину");
    },
    onError: (err: Error) => showToast(err.message, "error"),
  });

  const restoreMutation = useMutation({
    mutationFn: (id: string) => adminFetch(`api/pages/${id}/restore`, { method: "POST" }),
    onSuccess: () => {
      invalidate();
      showToast("Восстановлено");
    },
    onError: (err: Error) => showToast(err.message, "error"),
  });

  const permanentDeleteMutation = useMutation({
    mutationFn: (id: string) => adminFetch(`api/pages/${id}/permanent`, { method: "DELETE" }),
    onSuccess: () => {
      invalidate();
      setPendingPermanentDelete(null);
      showToast("Удалено безвозвратно");
    },
    onError: (err: Error) => showToast(err.message, "error"),
  });

  function toggle(id: string) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  const allSelected = pages.length > 0 && selected.length === pages.length;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="md-headline-small m-0 text-md-on-surface">Страницы</h1>
        {canEdit && <Button href="/admin/pages/new">+ Новая страница</Button>}
      </div>

      <div className="mb-4">
        <SegmentedButton segments={TABS} value={tab} onChange={setTab} />
      </div>

      <FilterBar
        hasActiveFilters={hasActiveFilters}
        onApply={() => setDateFilter(dateDraft)}
        onClear={() => {
          setDateDraft(EMPTY_DATE_FILTER);
          setDateFilter(EMPTY_DATE_FILTER);
        }}
      >
        <FilterField label="Создано с">
          <FilterInput type="date" value={dateDraft.from} onChange={(e) => setDateDraft((d) => ({ ...d, from: e.target.value }))} />
        </FilterField>
        <FilterField label="по">
          <FilterInput type="date" value={dateDraft.to} onChange={(e) => setDateDraft((d) => ({ ...d, to: e.target.value }))} />
        </FilterField>
      </FilterBar>

      {isLoading && <p className="md-body-medium text-md-on-surface-variant">Загрузка...</p>}

      {selected.length > 0 && canEdit && (
        <div className="mb-3 flex items-center justify-between rounded-lg bg-md-secondary-container px-4 py-2.5">
          <span className="md-body-medium text-md-on-secondary-container">Выбрано: {selected.length}</span>
          <div className="flex items-center gap-2">
            <Button variant="text" onClick={() => bulkPublishMutation.mutate(selected)} disabled={bulkPublishMutation.isPending}>
              Опубликовать
            </Button>
            <Button variant="text" onClick={() => setConfirmBulkDelete(true)} className="text-md-error">
              Удалить
            </Button>
          </div>
        </div>
      )}

      {pages.length === 0 && !isLoading && hasActiveFilters ? (
        <p className="md-body-medium text-md-on-surface-variant">Ничего не найдено по текущим фильтрам.</p>
      ) : pages.length === 0 && !isLoading ? (
        tab === "trash" ? (
          <EmptyState icon="ti-trash" title="Корзина пуста" description="Удалённые страницы появятся здесь." />
        ) : (
          <EmptyState
            icon="ti-file-text"
            title="Страниц пока нет"
            description="Статичные страницы вроде About, Contact или Privacy Policy редактируются здесь блочным редактором и выбором шаблона."
            actionLabel={canEdit ? "+ Новая страница" : undefined}
            actionHref={canEdit ? "/admin/pages/new" : undefined}
          />
        )
      ) : (
        <Card elevation={1} className="overflow-hidden">
          {canEdit && pages.length > 0 && tab !== "trash" && (
            <div className="flex items-center gap-3 border-b border-md-outline-variant px-4 py-2">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={() => setSelected(allSelected ? [] : pages.map((p) => p.id))}
              />
              <span className="md-body-small text-md-on-surface-variant">Выбрать все</span>
            </div>
          )}
          {pages.map((page) =>
            tab === "trash" ? (
              <div
                key={page.id}
                className="flex items-center gap-3 border-b border-md-outline-variant px-4 py-3 last:border-0"
              >
                <div className="flex-1">
                  <p className="md-body-medium m-0 text-md-on-surface">{page.title}</p>
                  <p className="md-body-small m-0 text-md-on-surface-variant">/{page.slug}</p>
                </div>
                {canEdit && (
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => restoreMutation.mutate(page.id)}
                      className="md-body-small text-md-primary hover:underline"
                    >
                      Восстановить
                    </button>
                    <button
                      onClick={() => setPendingPermanentDelete(page)}
                      className="text-md-on-surface-variant hover:text-md-error"
                      title="Удалить навсегда"
                    >
                      <i className="ti ti-trash-x text-sm" />
                    </button>
                  </div>
                )}
              </div>
            ) : quickEditId === page.id ? (
              <QuickEditRow
                key={page.id}
                title={page.title}
                slug={page.slug}
                status={page.status}
                saving={quickEditMutation.isPending}
                onSave={(patch) => quickEditMutation.mutate({ id: page.id, patch })}
                onCancel={() => setQuickEditId(null)}
              />
            ) : (
              <div
                key={page.id}
                className="md-motion group flex items-center gap-3 border-b border-md-outline-variant px-4 py-3 last:border-0 hover:bg-md-surface-container-high"
              >
                {canEdit && <input type="checkbox" checked={selected.includes(page.id)} onChange={() => toggle(page.id)} />}
                <Link href={`/admin/pages/${page.id}`} className="flex flex-1 items-center justify-between">
                  <div>
                    <p className="md-body-medium m-0 text-md-on-surface">{page.title}</p>
                    <div className="flex items-center gap-2">
                      <p className="md-body-small m-0 text-md-on-surface-variant">/{page.slug}</p>
                      {canEdit && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setQuickEditId(page.id);
                          }}
                          className="md-body-small hidden text-md-primary group-hover:inline hover:underline"
                        >
                          Quick Edit
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="md-body-small text-md-on-surface-variant">
                      {page.updated_at ? new Date(page.updated_at).toLocaleDateString("ru-RU") : ""}
                    </span>
                    <ReviewBadge status={page.review_status} />
                    <StatusBadge status={page.status} />
                  </div>
                </Link>
              </div>
            )
          )}
        </Card>
      )}

      <ConfirmDialog
        open={confirmBulkDelete}
        title={`Переместить в корзину ${selected.length} страниц${selected.length === 1 ? "у" : "ы"}?`}
        confirmLabel="Удалить"
        onConfirm={() => bulkDeleteMutation.mutate(selected)}
        onCancel={() => setConfirmBulkDelete(false)}
      />
      <ConfirmDialog
        open={!!pendingPermanentDelete}
        title={`Удалить «${pendingPermanentDelete?.title}» безвозвратно?`}
        description="Это действие нельзя отменить."
        confirmLabel="Удалить навсегда"
        onConfirm={() => pendingPermanentDelete && permanentDeleteMutation.mutate(pendingPermanentDelete.id)}
        onCancel={() => setPendingPermanentDelete(null)}
      />
    </div>
  );
}
