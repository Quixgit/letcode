"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { adminFetch } from "@/lib/admin-api";
import { diffLines } from "@/lib/diff";
import type { PageRevision } from "@/lib/admin-types";

const CURRENT = "__current__";

function label(rev: PageRevision) {
  return `${new Date(rev.created_at).toLocaleString("ru-RU")} · ${rev.created_by_email || "—"}`;
}

function DiffView({ before, after }: { before: unknown; after: unknown }) {
  const ops = useMemo(
    () => diffLines(JSON.stringify(before, null, 2), JSON.stringify(after, null, 2)),
    [before, after]
  );
  const additions = ops.filter((o) => o.type === "add").length;
  const removals = ops.filter((o) => o.type === "remove").length;

  if (additions === 0 && removals === 0) {
    return <p className="m-0 text-[13px] text-md-on-surface-variant">Различий нет — содержимое идентично.</p>;
  }

  return (
    <div>
      <p className="m-0 mb-2 text-[12px] text-md-on-surface-variant">
        <span className="text-green-600">+{additions}</span> · <span className="text-md-error">-{removals}</span>
      </p>
      <pre className="m-0 max-h-96 overflow-auto rounded-lg border border-md-outline-variant bg-md-surface-container-low p-3 text-[11px] leading-5">
        {ops.map((op, i) => (
          <div
            key={i}
            className={
              op.type === "add"
                ? "bg-green-500/15 text-green-700 dark:text-green-400"
                : op.type === "remove"
                  ? "bg-red-500/15 text-md-error line-through decoration-1"
                  : "text-md-on-surface-variant"
            }
          >
            {op.type === "add" ? "+ " : op.type === "remove" ? "- " : "  "}
            {op.text || " "}
          </div>
        ))}
      </pre>
    </div>
  );
}

export function RevisionsPanel({ pageId, currentContent }: { pageId: string; currentContent: unknown }) {
  const { data: revisions, isLoading } = useQuery({
    queryKey: ["page-revisions", pageId],
    queryFn: () => adminFetch<PageRevision[]>(`api/pages/${pageId}/revisions`),
  });

  const [baseId, setBaseId] = useState<string | null>(null);
  const [compareId, setCompareId] = useState<string>(CURRENT);

  const effectiveBaseId = baseId ?? revisions?.[0]?.id ?? null;

  const contentById = (id: string | null): unknown => {
    if (id === CURRENT) return currentContent;
    return revisions?.find((r) => r.id === id)?.content ?? null;
  };

  return (
    <fieldset className="rounded-xl border border-md-outline-variant p-4">
      <legend className="px-1 text-[13px] text-md-on-surface-variant">История ревизий</legend>

      {isLoading && <p className="m-0 text-[13px] text-md-on-surface-variant">Загрузка...</p>}

      {!isLoading && revisions?.length === 0 && (
        <p className="m-0 text-[13px] text-md-on-surface-variant">
          Ревизии сохраняются автоматически при каждом сохранении страницы. Пока их нет.
        </p>
      )}

      {!isLoading && (revisions?.length ?? 0) > 0 && (
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2 text-[12px] text-md-on-surface-variant">
            <span>Сравнить</span>
            <select
              value={effectiveBaseId ?? ""}
              onChange={(e) => setBaseId(e.target.value)}
              className="rounded-md border border-md-outline-variant bg-transparent px-2 py-1 text-md-on-surface outline-none"
            >
              {(revisions || []).map((rev) => (
                <option key={rev.id} value={rev.id}>
                  {label(rev)}
                </option>
              ))}
            </select>
            <span>→</span>
            <select
              value={compareId}
              onChange={(e) => setCompareId(e.target.value)}
              className="rounded-md border border-md-outline-variant bg-transparent px-2 py-1 text-md-on-surface outline-none"
            >
              <option value={CURRENT}>Текущая версия</option>
              {(revisions || []).map((rev) => (
                <option key={rev.id} value={rev.id}>
                  {label(rev)}
                </option>
              ))}
            </select>
          </div>

          <DiffView before={contentById(effectiveBaseId)} after={contentById(compareId)} />
        </div>
      )}
    </fieldset>
  );
}
