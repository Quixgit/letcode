"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminFetch } from "@/lib/admin-api";
import { useToast } from "@/lib/toast";
import { useCanEdit } from "@/lib/role-context";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { Card } from "@/components/admin/m3/Card";
import { Button } from "@/components/admin/m3/Button";
import { EmptyState } from "@/components/admin/m3/EmptyState";
import { TextField } from "@/components/admin/m3/TextField";
import type { RedirectItem } from "@/lib/admin-types";

export default function RedirectsPage() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const canEdit = useCanEdit();
  const [pendingDelete, setPendingDelete] = useState<RedirectItem | null>(null);
  const [form, setForm] = useState({ from_path: "", to_path: "", status_code: 301 });

  const { data: redirects, isLoading } = useQuery({
    queryKey: ["redirects"],
    queryFn: () => adminFetch<RedirectItem[]>("api/redirects"),
  });

  const createMutation = useMutation({
    mutationFn: () => adminFetch("api/redirects", { method: "POST", body: form }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["redirects"] });
      setForm({ from_path: "", to_path: "", status_code: 301 });
      showToast("Редирект добавлен");
    },
    onError: (err: Error) => showToast(err.message, "error"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminFetch(`api/redirects/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["redirects"] });
      showToast("Редирект удалён");
      setPendingDelete(null);
    },
    onError: (err: Error) => showToast(err.message, "error"),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.from_path.trim() || !form.to_path.trim()) {
      showToast("Заполните оба пути", "error");
      return;
    }
    createMutation.mutate();
  }

  return (
    <div>
      <h1 className="md-headline-small mb-6 text-md-on-surface">Редиректы</h1>

      {canEdit && (
        <Card elevation={1} outlined className="mb-6 p-4">
          <form onSubmit={handleSubmit} className="flex items-end gap-3">
            <TextField
              label="Откуда"
              value={form.from_path}
              onChange={(e) => setForm({ ...form, from_path: e.target.value })}
              containerClassName="flex-1"
            />
            <TextField
              label="Куда"
              value={form.to_path}
              onChange={(e) => setForm({ ...form, to_path: e.target.value })}
              containerClassName="flex-1"
            />
            <label className="md-body-small w-24 text-md-on-surface-variant">
              Код
              <select
                value={form.status_code}
                onChange={(e) => setForm({ ...form, status_code: Number(e.target.value) })}
                className="mt-1.5 block w-full rounded-lg border border-md-outline-variant bg-transparent px-2.5 py-1.5 text-sm text-md-on-surface outline-none focus:border-md-primary"
              >
                <option value={301}>301</option>
                <option value={302}>302</option>
              </select>
            </label>
            <Button type="submit" disabled={createMutation.isPending}>
              Добавить
            </Button>
          </form>
        </Card>
      )}

      {isLoading && <p className="md-body-medium text-md-on-surface-variant">Загрузка...</p>}

      {redirects?.length === 0 && !isLoading ? (
        <EmptyState
          icon="ti-arrow-forward-up"
          title="Редиректов пока нет"
          description="Редиректы 301/302 сохраняют SEO-вес и пользовательские закладки, когда меняется URL страницы или приложения."
        />
      ) : (
        <Card elevation={1} className="overflow-hidden">
          {(redirects || []).map((r) => (
            <div
              key={r.id}
              className="flex items-center justify-between border-b border-md-outline-variant px-4 py-2.5 md-body-medium last:border-0"
            >
              <span className="text-md-on-surface">
                {r.from_path} <i className="ti ti-arrow-right mx-1 text-md-on-surface-variant" /> {r.to_path}
              </span>
              <div className="flex items-center gap-3">
                <span className="text-md-on-surface-variant">{r.status_code}</span>
                {canEdit && (
                  <button onClick={() => setPendingDelete(r)} className="text-md-on-surface-variant hover:text-md-error">
                    <i className="ti ti-trash" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </Card>
      )}

      <ConfirmDialog
        open={!!pendingDelete}
        title={`Удалить редирект «${pendingDelete?.from_path}»?`}
        onConfirm={() => pendingDelete && deleteMutation.mutate(pendingDelete.id)}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
