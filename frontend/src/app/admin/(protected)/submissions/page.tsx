"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminFetch } from "@/lib/admin-api";
import { useToast } from "@/lib/toast";
import { Card } from "@/components/admin/m3/Card";
import { EmptyState } from "@/components/admin/m3/EmptyState";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import type { FormSubmission } from "@/lib/admin-types";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function preview(data: Record<string, string>): string {
  const values = Object.values(data).filter(Boolean);
  return values.slice(0, 2).join(" · ") || "—";
}

export default function SubmissionsPage() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [formFilter, setFormFilter] = useState<string>("all");
  const [deleteTarget, setDeleteTarget] = useState<FormSubmission | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["submissions"],
    queryFn: () => adminFetch<FormSubmission[]>("api/submissions"),
  });

  const markReadMutation = useMutation({
    mutationFn: (id: number) => adminFetch(`api/submissions/${id}/read`, { method: "PATCH" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["submissions"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => adminFetch(`api/submissions/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["submissions"] });
      showToast("Заявка удалена");
      setDeleteTarget(null);
    },
    onError: (err: Error) => showToast(err.message, "error"),
  });

  const formKeys = useMemo(() => {
    const keys = new Set((data || []).map((s) => s.form_key));
    return Array.from(keys);
  }, [data]);

  const filtered = useMemo(() => {
    if (!data) return [];
    return formFilter === "all" ? data : data.filter((s) => s.form_key === formFilter);
  }, [data, formFilter]);

  const unreadCount = (data || []).filter((s) => !s.is_read).length;

  function toggleExpand(s: FormSubmission) {
    const next = expandedId === s.id ? null : s.id;
    setExpandedId(next);
    if (next !== null && !s.is_read) markReadMutation.mutate(s.id);
  }

  return (
    <div>
      <h1 className="md-headline-small mb-1 text-md-on-surface">Заявки</h1>
      <p className="md-body-medium mb-6 text-md-on-surface-variant">
        Отправки форм обратной связи (блок «Форма обратной связи» в конструкторе страниц).
        {unreadCount > 0 && <span className="ml-1 font-medium text-md-on-surface">{unreadCount} новых.</span>}
      </p>

      {formKeys.length > 1 && (
        <select
          value={formFilter}
          onChange={(e) => setFormFilter(e.target.value)}
          className="mb-4 rounded-lg border border-md-outline-variant bg-transparent px-2.5 py-2 text-sm text-md-on-surface outline-none focus:border-md-primary"
        >
          <option value="all">Все формы</option>
          {formKeys.map((k) => (
            <option key={k} value={k}>
              {k}
            </option>
          ))}
        </select>
      )}

      {isLoading && <p className="md-body-medium text-md-on-surface-variant">Загрузка...</p>}

      {!isLoading && filtered.length === 0 && (
        <EmptyState
          icon="ti-inbox"
          title="Заявок пока нет"
          description="Добавьте блок «Форма обратной связи» на любую страницу или пост через конструктор блоков."
        />
      )}

      {filtered.length > 0 && (
        <Card elevation={1} className="overflow-hidden">
          {filtered.map((s) => (
            <div key={s.id} className="border-b border-md-outline-variant last:border-0">
              <button
                type="button"
                onClick={() => toggleExpand(s)}
                className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-md-surface-container-high"
              >
                <div className="flex min-w-0 items-center gap-2">
                  {!s.is_read && <span className="h-2 w-2 shrink-0 rounded-full bg-md-primary" />}
                  <span className={`md-body-medium truncate text-md-on-surface ${!s.is_read ? "font-medium" : ""}`}>{preview(s.data)}</span>
                </div>
                <div className="flex shrink-0 items-center gap-3 text-[12px] text-md-on-surface-variant">
                  <span className="rounded-full bg-md-secondary-container px-2 py-0.5 text-md-on-secondary-container">
                    {s.form_title || s.form_key}
                  </span>
                  <span>{formatDate(s.created_at)}</span>
                  <i className={`ti ${expandedId === s.id ? "ti-chevron-up" : "ti-chevron-down"}`} />
                </div>
              </button>

              {expandedId === s.id && (
                <div className="px-4 pb-4">
                  <div className="grid grid-cols-[140px_1fr] gap-x-3 gap-y-1.5 rounded-md bg-md-surface-container-high p-3 text-[13px]">
                    {Object.entries(s.data).map(([key, value]) => (
                      <div key={key} className="contents">
                        <span className="text-md-on-surface-variant">{key}</span>
                        <span className="whitespace-pre-wrap break-words text-md-on-surface">{value || "—"}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[12px] text-md-on-surface-variant">
                    <span>{s.page_path ? `Отправлено со страницы: ${s.page_path}` : null}</span>
                    <button type="button" onClick={() => setDeleteTarget(s)} className="text-md-error hover:underline">
                      Удалить
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </Card>
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Удалить заявку?"
        description="Это действие необратимо."
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
      />
    </div>
  );
}
