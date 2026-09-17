"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminFetch } from "@/lib/admin-api";
import { useToast } from "@/lib/toast";
import { useCurrentUser, useIsAdmin } from "@/lib/role-context";
import { Card } from "@/components/admin/m3/Card";
import { Button } from "@/components/admin/m3/Button";
import { Chip } from "@/components/admin/m3/Chip";
import { EmptyState } from "@/components/admin/m3/EmptyState";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { SegmentedButton } from "@/components/admin/m3/SegmentedButton";
import type { UserItem } from "@/lib/admin-types";

const inputClass =
  "block w-full rounded-lg border border-md-outline-variant bg-transparent px-2.5 py-1.5 text-[13px] text-md-on-surface outline-none focus:border-md-primary";

const ROLES = ["admin", "editor", "viewer"];

export default function UsersPage() {
  const isAdmin = useIsAdmin();
  const { user: currentUser } = useCurrentUser();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("editor");
  const [lastInvite, setLastInvite] = useState<{ email: string; temp_password: string } | null>(null);
  const [tab, setTab] = useState<"active" | "trash">("active");
  const [pendingDelete, setPendingDelete] = useState<UserItem | null>(null);

  const { data: users, isLoading } = useQuery({
    queryKey: ["users", tab],
    queryFn: () => adminFetch<UserItem[]>(`api/users${tab === "trash" ? "?trashed=true" : ""}`),
    enabled: isAdmin,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["users"] });

  const inviteMutation = useMutation({
    mutationFn: () => adminFetch<{ id: string; temp_password: string }>("api/users/invite", {
      method: "POST",
      body: { email, role_name: role },
    }),
    onSuccess: (result) => {
      invalidate();
      setLastInvite({ email, temp_password: result.temp_password });
      setEmail("");
      showToast("Пользователь приглашён");
    },
    onError: (err: Error) => showToast(err.message, "error"),
  });

  const roleMutation = useMutation({
    mutationFn: ({ id, role_name }: { id: string; role_name: string }) =>
      adminFetch(`api/users/${id}/role`, { method: "PUT", body: { role_name } }),
    onSuccess: () => {
      invalidate();
      showToast("Роль изменена");
    },
    onError: (err: Error) => showToast(err.message, "error"),
  });

  const activeMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      adminFetch(`api/users/${id}/active`, { method: "PUT", body: { is_active } }),
    onSuccess: () => {
      invalidate();
      showToast("Статус изменён");
    },
    onError: (err: Error) => showToast(err.message, "error"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminFetch(`api/users/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      invalidate();
      setPendingDelete(null);
      showToast("Пользователь перемещён в корзину");
    },
    onError: (err: Error) => {
      setPendingDelete(null);
      if (err.message.includes("cannot_delete_last_admin")) {
        showToast("Нельзя удалить последнего администратора", "error");
      } else if (err.message.includes("cannot_delete_self")) {
        showToast("Нельзя удалить свой собственный аккаунт", "error");
      } else {
        showToast(err.message, "error");
      }
    },
  });

  const restoreMutation = useMutation({
    mutationFn: (id: string) => adminFetch(`api/users/${id}/restore`, { method: "POST" }),
    onSuccess: () => {
      invalidate();
      showToast("Пользователь восстановлен");
    },
    onError: (err: Error) => showToast(err.message, "error"),
  });

  if (!isAdmin) {
    return <p className="text-[13px] text-md-on-surface-variant">Доступно только для роли admin.</p>;
  }

  return (
    <div>
      <h1 className="md-headline-small mb-6 text-md-on-surface">Пользователи</h1>

      <Card elevation={1} outlined className="mb-4 p-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!email.trim()) return;
            inviteMutation.mutate();
          }}
          className="flex items-end gap-3"
        >
          <label className="flex-1 text-[13px] text-md-on-surface-variant">
            Email
            <input value={email} onChange={(e) => setEmail(e.target.value)} className={`${inputClass} mt-1.5`} />
          </label>
          <label className="w-32 text-[13px] text-md-on-surface-variant">
            Роль
            <select value={role} onChange={(e) => setRole(e.target.value)} className={`${inputClass} mt-1.5`}>
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </label>
          <Button type="submit" disabled={inviteMutation.isPending}>
            Пригласить
          </Button>
        </form>
      </Card>

      {lastInvite && (
        <Card elevation={0} className="mb-4 bg-md-primary-container p-3">
          <p className="m-0 text-md-on-primary-container">
            Временный пароль для <strong>{lastInvite.email}</strong>:{" "}
            <code className="rounded bg-md-surface-container-highest px-1.5 py-0.5 text-md-on-surface">
              {lastInvite.temp_password}
            </code>
          </p>
          <p className="m-0 mt-1 text-[12px] text-md-on-primary-container/80">
            Сохраните и передайте пользователю — повторно этот пароль показать нельзя.
          </p>
        </Card>
      )}

      <div className="mb-4">
        <SegmentedButton
          segments={[
            { value: "active", label: "Активные" },
            { value: "trash", label: "Корзина" },
          ]}
          value={tab}
          onChange={(v) => setTab(v as "active" | "trash")}
        />
      </div>

      {isLoading && <p className="md-body-medium text-md-on-surface-variant">Загрузка...</p>}

      {users?.length === 0 && !isLoading ? (
        tab === "trash" ? (
          <EmptyState icon="ti-trash" title="Корзина пуста" description="Удалённые пользователи появятся здесь." />
        ) : (
          <EmptyState icon="ti-users" title="Пользователей пока нет" description="Пригласите первого коллегу — им будет выдан временный пароль для первого входа." />
        )
      ) : (
        <Card elevation={1} className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead>
                <tr className="border-b border-md-outline-variant text-md-on-surface-variant">
                  <th className="whitespace-nowrap px-4 py-2 font-normal">Email</th>
                  <th className="whitespace-nowrap px-4 py-2 font-normal">Роль</th>
                  <th className="whitespace-nowrap px-4 py-2 font-normal">Статус</th>
                  <th className="whitespace-nowrap px-4 py-2 font-normal">Последний вход</th>
                  <th className="whitespace-nowrap px-4 py-2 font-normal"></th>
                </tr>
              </thead>
              <tbody>
                {(users || []).map((u) => {
                  const isSelf = currentUser?.email === u.email;
                  return (
                    <tr key={u.id} className="border-b border-md-outline-variant last:border-0">
                      <td className="whitespace-nowrap px-4 py-2 text-md-on-surface">
                        {u.email}
                        {isSelf && <span className="ml-1.5 text-[11px] text-md-on-surface-variant">(вы)</span>}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2">
                        {tab === "trash" ? (
                          <Chip tone="neutral">{u.role_name}</Chip>
                        ) : (
                          <select
                            value={u.role_name}
                            onChange={(e) => roleMutation.mutate({ id: u.id, role_name: e.target.value })}
                            className="rounded-md border border-md-outline-variant px-2 py-1 text-[12px] text-md-on-surface outline-none"
                          >
                            {ROLES.map((r) => (
                              <option key={r} value={r}>
                                {r}
                              </option>
                            ))}
                          </select>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2">
                        {tab === "trash" ? (
                          <Chip tone="neutral">Удалён</Chip>
                        ) : (
                          <Chip tone={u.is_active ? "success" : "neutral"}>{u.is_active ? "Активен" : "Отключён"}</Chip>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2 text-md-on-surface-variant">
                        {u.last_login_at ? new Date(u.last_login_at).toLocaleString("ru-RU") : "—"}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2 text-right">
                        {tab === "trash" ? (
                          <button
                            onClick={() => restoreMutation.mutate(u.id)}
                            className="text-[12px] text-md-on-surface-variant underline hover:text-md-on-surface"
                          >
                            Восстановить
                          </button>
                        ) : (
                          <div className="flex items-center justify-end gap-3">
                            <button
                              onClick={() => activeMutation.mutate({ id: u.id, is_active: !u.is_active })}
                              className="text-[12px] text-md-on-surface-variant underline hover:text-md-on-surface"
                            >
                              {u.is_active ? "Отключить" : "Включить"}
                            </button>
                            {!isSelf && (
                              <button
                                onClick={() => setPendingDelete(u)}
                                className="text-md-on-surface-variant hover:text-md-error"
                                title="Удалить"
                              >
                                <i className="ti ti-trash text-sm" />
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <ConfirmDialog
        open={!!pendingDelete}
        title={`Удалить пользователя «${pendingDelete?.email}»?`}
        description="Пользователь будет перемещён в корзину и потеряет доступ немедленно. Созданный им контент останется без изменений."
        onConfirm={() => pendingDelete && deleteMutation.mutate(pendingDelete.id)}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
