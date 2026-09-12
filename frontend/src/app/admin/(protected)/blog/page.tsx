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
import { Chip } from "@/components/admin/m3/Chip";
import { EmptyState } from "@/components/admin/m3/EmptyState";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { QuickEditRow } from "@/components/admin/QuickEditRow";
import { FilterBar, FilterField, FilterInput, FilterSelect } from "@/components/admin/FilterBar";
import type { BlogPostListItem, ContentStatus } from "@/lib/admin-types";

const TABS: { label: string; value: ContentStatus | "all" }[] = [
  { label: "Все", value: "all" },
  { label: "Опубликовано", value: "published" },
  { label: "Черновики", value: "draft" },
  { label: "Архив", value: "archived" },
];

function initialTab(statusParam: string | null): ContentStatus | "all" {
  return statusParam === "published" || statusParam === "draft" || statusParam === "archived" ? statusParam : "all";
}

interface BlogFilter {
  author: string;
  tag: string;
  dateFrom: string;
  dateTo: string;
}
const EMPTY_FILTER: BlogFilter = { author: "", tag: "", dateFrom: "", dateTo: "" };

function matchesFilter(post: BlogPostListItem, filter: BlogFilter): boolean {
  if (filter.author && post.author_email !== filter.author) return false;
  if (filter.tag && !post.tags.includes(filter.tag)) return false;
  const date = post.created_at.slice(0, 10);
  if (filter.dateFrom && date < filter.dateFrom) return false;
  if (filter.dateTo && date > filter.dateTo) return false;
  return true;
}

export default function BlogListPage() {
  return (
    <Suspense fallback={<p className="md-body-medium text-md-on-surface-variant">Загрузка...</p>}>
      <BlogListPageInner />
    </Suspense>
  );
}

function BlogListPageInner() {
  const canEdit = useCanEdit();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<ContentStatus | "all">(() => initialTab(searchParams.get("status")));
  const [selected, setSelected] = useState<string[]>([]);
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);
  const [quickEditId, setQuickEditId] = useState<string | null>(null);
  const [filterDraft, setFilterDraft] = useState<BlogFilter>(EMPTY_FILTER);
  const [filter, setFilter] = useState<BlogFilter>(EMPTY_FILTER);

  const { data: allPosts, isLoading } = useQuery({
    queryKey: ["blog-posts", tab],
    queryFn: () => adminFetch<BlogPostListItem[]>(tab === "all" ? "api/blog" : `api/blog?status=${tab}`),
  });

  const { data: tags } = useQuery({
    queryKey: ["blog-tags"],
    queryFn: () => adminFetch<string[]>("api/blog/tags"),
  });

  const authors = Array.from(new Set((allPosts || []).map((p) => p.author_email).filter((e): e is string => !!e)));
  const posts = (allPosts || []).filter((p) => matchesFilter(p, filter));
  const hasActiveFilters = !!(filter.author || filter.tag || filter.dateFrom || filter.dateTo);

  const quickEditMutation = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: { title: string; slug: string; status: ContentStatus } }) =>
      adminFetch(`api/blog/${id}/quick-edit`, { method: "PATCH", body: patch }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blog-posts"] });
      setQuickEditId(null);
      showToast("Сохранено");
    },
    onError: (err: Error) => showToast(err.message, "error"),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["blog-posts"] });
    setSelected([]);
  };

  const bulkPublishMutation = useMutation({
    mutationFn: (ids: string[]) => Promise.all(ids.map((id) => adminFetch(`api/blog/${id}/publish`, { method: "POST" }))),
    onSuccess: () => {
      invalidate();
      showToast("Опубликовано");
    },
    onError: (err: Error) => showToast(err.message, "error"),
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: (ids: string[]) => Promise.all(ids.map((id) => adminFetch(`api/blog/${id}`, { method: "DELETE" }))),
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

  const allSelected = posts.length > 0 && selected.length === posts.length;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="md-headline-small m-0 text-md-on-surface">Блог</h1>
        {canEdit && <Button href="/admin/blog/new">+ Новый пост</Button>}
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
        <FilterField label="Автор">
          <FilterSelect
            value={filterDraft.author}
            onChange={(e) => setFilterDraft((f) => ({ ...f, author: e.target.value }))}
          >
            <option value="">Все</option>
            {authors.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </FilterSelect>
        </FilterField>
        <FilterField label="Тег">
          <FilterSelect value={filterDraft.tag} onChange={(e) => setFilterDraft((f) => ({ ...f, tag: e.target.value }))}>
            <option value="">Все</option>
            {(tags || []).map((t) => (
              <option key={t} value={t}>
                {t}
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

      {posts.length === 0 && !isLoading && hasActiveFilters ? (
        <p className="md-body-medium text-md-on-surface-variant">Ничего не найдено по текущим фильтрам.</p>
      ) : posts.length === 0 && !isLoading ? (
        <EmptyState
          icon="ti-news"
          title="Постов пока нет"
          description="Напишите первую статью — заголовки, абзацы, картинки и теги собираются тем же блочным редактором, что и у страниц."
          actionLabel={canEdit ? "+ Новый пост" : undefined}
          actionHref={canEdit ? "/admin/blog/new" : undefined}
        />
      ) : (
        <Card elevation={1} className="overflow-hidden">
          {canEdit && posts.length > 0 && (
            <div className="flex items-center gap-3 border-b border-md-outline-variant px-4 py-2">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={() => setSelected(allSelected ? [] : posts.map((p) => p.id))}
              />
              <span className="md-body-small text-md-on-surface-variant">Выбрать все</span>
            </div>
          )}
          {posts.map((post) =>
            quickEditId === post.id ? (
              <QuickEditRow
                key={post.id}
                title={post.title}
                slug={post.slug}
                status={post.status}
                saving={quickEditMutation.isPending}
                onSave={(patch) => quickEditMutation.mutate({ id: post.id, patch })}
                onCancel={() => setQuickEditId(null)}
              />
            ) : (
              <div
                key={post.id}
                className="md-motion group flex items-center gap-3 border-b border-md-outline-variant px-4 py-3 last:border-0 hover:bg-md-surface-container-high"
              >
                {canEdit && <input type="checkbox" checked={selected.includes(post.id)} onChange={() => toggle(post.id)} />}
                <Link href={`/admin/blog/${post.id}`} className="flex flex-1 items-center justify-between">
                  <div className="min-w-0">
                    <p className="md-body-medium m-0 text-md-on-surface">{post.title}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      <span className="md-body-small text-md-on-surface-variant">/blog/{post.slug}</span>
                      {post.tags.slice(0, 3).map((t) => (
                        <Chip key={t} tone="neutral" variant="outlined" className="px-2 py-0.5">
                          {t}
                        </Chip>
                      ))}
                      {canEdit && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setQuickEditId(post.id);
                          }}
                          className="md-body-small hidden text-md-primary group-hover:inline hover:underline"
                        >
                          Quick Edit
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="md-body-small text-md-on-surface-variant">
                      {post.updated_at ? new Date(post.updated_at).toLocaleDateString("ru-RU") : ""}
                    </span>
                    <StatusBadge status={post.status} />
                  </div>
                </Link>
              </div>
            )
          )}
        </Card>
      )}

      <ConfirmDialog
        open={confirmBulkDelete}
        title={`Удалить ${selected.length} пост${selected.length === 1 ? "" : "а"}?`}
        confirmLabel="Удалить"
        onConfirm={() => bulkDeleteMutation.mutate(selected)}
        onCancel={() => setConfirmBulkDelete(false)}
      />
    </div>
  );
}
