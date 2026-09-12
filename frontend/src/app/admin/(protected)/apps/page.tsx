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
import { FilterBar, FilterField, FilterInput, FilterSelect } from "@/components/admin/FilterBar";
import type { AppListItem, ContentStatus } from "@/lib/admin-types";

const TABS: { label: string; value: ContentStatus | "all" }[] = [
  { label: "Все", value: "all" },
  { label: "Опубликовано", value: "published" },
  { label: "Черновики", value: "draft" },
  { label: "Архив", value: "archived" },
];

function initialTab(statusParam: string | null): ContentStatus | "all" {
  return statusParam === "published" || statusParam === "draft" || statusParam === "archived" ? statusParam : "all";
}

interface AppFilter {
  category: string;
  dateFrom: string;
  dateTo: string;
}
const EMPTY_FILTER: AppFilter = { category: "", dateFrom: "", dateTo: "" };

function matchesFilter(app: AppListItem, filter: AppFilter): boolean {
  if (filter.category && app.category !== filter.category) return false;
  const date = app.created_at.slice(0, 10);
  if (filter.dateFrom && date < filter.dateFrom) return false;
  if (filter.dateTo && date > filter.dateTo) return false;
  return true;
}

export default function AppsListPage() {
  return (
    <Suspense fallback={<p className="md-body-medium text-md-on-surface-variant">Загрузка...</p>}>
      <AppsListPageInner />
    </Suspense>
  );
}

function AppsListPageInner() {
  const canEdit = useCanEdit();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<ContentStatus | "all">(() => initialTab(searchParams.get("status")));
  const [selected, setSelected] = useState<string[]>([]);
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);
  const [quickEditId, setQuickEditId] = useState<string | null>(null);
  const [filterDraft, setFilterDraft] = useState<AppFilter>(EMPTY_FILTER);
  const [filter, setFilter] = useState<AppFilter>(EMPTY_FILTER);

  const { data: allApps, isLoading } = useQuery({
    queryKey: ["apps", tab],
    queryFn: () => adminFetch<AppListItem[]>(tab === "all" ? "api/apps" : `api/apps?status=${tab}`),
  });

  const { data: categories } = useQuery({
    queryKey: ["app-categories"],
    queryFn: () => adminFetch<string[]>("api/apps/categories"),
  });

  const apps = (allApps || []).filter((a) => matchesFilter(a, filter));
  const hasActiveFilters = !!(filter.category || filter.dateFrom || filter.dateTo);

  const quickEditMutation = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: { title: string; slug: string; status: ContentStatus } }) =>
      adminFetch(`api/apps/${id}/quick-edit`, {
        method: "PATCH",
        body: { name: patch.title, slug: patch.slug, status: patch.status },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["apps"] });
      setQuickEditId(null);
      showToast("Сохранено");
    },
    onError: (err: Error) => showToast(err.message, "error"),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["apps"] });
    setSelected([]);
  };

  const bulkPublishMutation = useMutation({
    mutationFn: (ids: string[]) => Promise.all(ids.map((id) => adminFetch(`api/apps/${id}/publish`, { method: "POST" }))),
    onSuccess: () => {
      invalidate();
      showToast("Опубликовано");
    },
    onError: (err: Error) => showToast(err.message, "error"),
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: (ids: string[]) => Promise.all(ids.map((id) => adminFetch(`api/apps/${id}`, { method: "DELETE" }))),
    onSuccess: () => {
      invalidate();
      setConfirmBulkDelete(false);
      showToast("Удалено");
    },
    onError: (err: Error) => showToast(err.message, "error"),
  });

  function toggle(id: string) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  const allSelected = apps.length > 0 && selected.length === apps.length;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="md-headline-small m-0 text-md-on-surface">Приложения</h1>
        {canEdit && <Button href="/admin/apps/new">+ Новое приложение</Button>}
      </div>

      <div className="mb-4">
        <SegmentedButton segments={TABS} value={tab} onChange={setTab} />
      </div>

      <FilterBar
        hasActiveFilters={hasActiveFilters}
        onApply={() => setFilter(filterDraft)}
        onClear={() => {
          setFilterDraft(EMPTY_FILTER);
          setFilter(EMPTY_FILTER);
        }}
      >
        <FilterField label="Категория">
          <FilterSelect
            value={filterDraft.category}
            onChange={(e) => setFilterDraft((f) => ({ ...f, category: e.target.value }))}
          >
            <option value="">Все</option>
            {(categories || []).map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </FilterSelect>
        </FilterField>
        <FilterField label="Создано с">
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

      {apps.length === 0 && !isLoading && hasActiveFilters ? (
        <p className="md-body-medium text-md-on-surface-variant">Ничего не найдено по текущим фильтрам.</p>
      ) : apps.length === 0 && !isLoading ? (
        <EmptyState
          icon="ti-app-window"
          title="Приложений пока нет"
          description="Добавьте первое приложение из вашего портфолио — иконка, описание, скриншоты и магазины появятся на его публичной странице."
          actionLabel={canEdit ? "+ Новое приложение" : undefined}
          actionHref={canEdit ? "/admin/apps/new" : undefined}
        />
      ) : (
        <Card elevation={1} className="overflow-hidden">
          {canEdit && apps.length > 0 && (
            <div className="flex items-center gap-3 border-b border-md-outline-variant px-4 py-2">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={() => setSelected(allSelected ? [] : apps.map((a) => a.id))}
              />
              <span className="md-body-small text-md-on-surface-variant">Выбрать все</span>
            </div>
          )}
          {apps.map((app) =>
            quickEditId === app.id ? (
              <QuickEditRow
                key={app.id}
                titleLabel="Название"
                title={app.name}
                slug={app.slug}
                status={app.status}
                saving={quickEditMutation.isPending}
                onSave={(patch) => quickEditMutation.mutate({ id: app.id, patch })}
                onCancel={() => setQuickEditId(null)}
              />
            ) : (
              <div
                key={app.id}
                className="md-motion group flex items-center gap-3 border-b border-md-outline-variant px-4 py-3 last:border-0 hover:bg-md-surface-container-high"
              >
                {canEdit && (
                  <input type="checkbox" checked={selected.includes(app.id)} onChange={() => toggle(app.id)} />
                )}
                <Link href={`/admin/apps/${app.id}`} className="flex flex-1 items-center justify-between">
                  <div>
                    <p className="md-body-medium m-0 text-md-on-surface">{app.name}</p>
                    <div className="flex items-center gap-2">
                      <p className="md-body-small m-0 text-md-on-surface-variant">/{app.slug}</p>
                      {canEdit && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setQuickEditId(app.id);
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
                      {app.updated_at ? new Date(app.updated_at).toLocaleDateString("ru-RU") : ""}
                    </span>
                    <StatusBadge status={app.status} />
                  </div>
                </Link>
              </div>
            )
          )}
        </Card>
      )}

      <ConfirmDialog
        open={confirmBulkDelete}
        title={`Удалить ${selected.length} приложени${selected.length === 1 ? "е" : "я"}?`}
        confirmLabel="Удалить"
        onConfirm={() => bulkDeleteMutation.mutate(selected)}
        onCancel={() => setConfirmBulkDelete(false)}
      />
    </div>
  );
}
