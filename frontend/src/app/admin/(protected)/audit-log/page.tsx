"use client";

import { useQuery } from "@tanstack/react-query";
import { adminFetch } from "@/lib/admin-api";
import { Card } from "@/components/admin/m3/Card";
import { EmptyState } from "@/components/admin/m3/EmptyState";
import type { AuditLogItem } from "@/lib/admin-types";

export default function AuditLogPage() {
  const { data: entries, isLoading } = useQuery({
    queryKey: ["audit-log"],
    queryFn: () => adminFetch<AuditLogItem[]>("api/audit-logs"),
  });

  return (
    <div>
      <h1 className="md-headline-small mb-6 text-md-on-surface">Журнал аудита</h1>

      {isLoading && <p className="md-body-medium text-md-on-surface-variant">Загрузка...</p>}

      {entries?.length === 0 && !isLoading ? (
        <EmptyState
          icon="ti-history"
          title="Записей пока нет"
          description="Здесь появится история изменений — кто и когда создавал, публиковал или удалял контент."
        />
      ) : (
        <Card elevation={1} className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead>
                <tr className="border-b border-md-outline-variant text-md-on-surface-variant">
                  <th className="whitespace-nowrap px-4 py-2 font-normal">Дата</th>
                  <th className="whitespace-nowrap px-4 py-2 font-normal">Пользователь</th>
                  <th className="whitespace-nowrap px-4 py-2 font-normal">Действие</th>
                  <th className="whitespace-nowrap px-4 py-2 font-normal">Объект</th>
                  <th className="whitespace-nowrap px-4 py-2 font-normal">IP</th>
                </tr>
              </thead>
              <tbody>
                {(entries || []).map((entry) => (
                  <tr key={entry.id} className="border-b border-md-outline-variant last:border-0">
                    <td className="whitespace-nowrap px-4 py-2 text-md-on-surface">
                      {new Date(entry.created_at).toLocaleString("ru-RU")}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2 text-md-on-surface">{entry.user_email || "—"}</td>
                    <td className="whitespace-nowrap px-4 py-2 text-md-on-surface">{entry.action}</td>
                    <td className="whitespace-nowrap px-4 py-2 text-md-on-surface-variant">
                      {entry.entity_type}
                      {entry.entity_id ? ` · ${entry.entity_id.slice(0, 8)}` : ""}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2 text-md-on-surface-variant">{entry.ip_address || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
