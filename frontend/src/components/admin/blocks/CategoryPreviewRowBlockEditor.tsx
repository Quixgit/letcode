"use client";

import type { PublicPageBlock } from "@/lib/api";

type CategoryPreviewRowBlock = Extract<PublicPageBlock, { type: "category_preview_row" }>;
type Row = CategoryPreviewRowBlock["categories"][number]["rows"][number];

const inputClass =
  "block w-full rounded-md border border-md-outline-variant bg-transparent px-2.5 py-1.5 text-[13px] text-md-on-surface outline-none focus:border-md-outline";
// Same field, no `w-full` baked in — needed for the three width-constrained fields below, which
// otherwise all fight over `w-full` (Tailwind resolves conflicting width utilities by stylesheet
// order, not className position, so `w-full` tends to win) and end up rendering at ~equal widths
// instead of their intended label/kind/value proportions.
const fieldClass =
  "rounded-md border border-md-outline-variant bg-transparent px-2.5 py-1.5 text-[13px] text-md-on-surface outline-none focus:border-md-outline";

export function CategoryPreviewRowBlockEditor({
  block,
  onChange,
}: {
  block: CategoryPreviewRowBlock;
  onChange: (block: CategoryPreviewRowBlock) => void;
}) {
  function updateCategory(i: number, patch: Partial<CategoryPreviewRowBlock["categories"][number]>) {
    const next = [...block.categories];
    next[i] = { ...next[i], ...patch };
    onChange({ ...block, categories: next });
  }

  function updateRow(catIdx: number, rowIdx: number, patch: Partial<Row>) {
    const rows = [...block.categories[catIdx].rows];
    rows[rowIdx] = { ...rows[rowIdx], ...patch };
    updateCategory(catIdx, { rows });
  }

  return (
    <div className="flex flex-col gap-3">
      {block.categories.map((cat, i) => (
        <div key={i} className="rounded-md border border-md-outline-variant p-2.5">
          <div className="mb-2 flex items-center gap-2">
            <input
              value={cat.title}
              onChange={(e) => updateCategory(i, { title: e.target.value })}
              placeholder="Название категории"
              className={inputClass}
            />
            <button
              type="button"
              onClick={() => onChange({ ...block, categories: block.categories.filter((_, idx) => idx !== i) })}
              className="text-md-on-surface-variant hover:text-md-error"
            >
              <i className="ti ti-trash text-sm" />
            </button>
          </div>

          {cat.rows.map((row, j) => (
            <div key={j} className="mb-2 flex items-center gap-2">
              <input
                value={row.label}
                onChange={(e) => updateRow(i, j, { label: e.target.value })}
                placeholder="Подпись строки"
                className={`${fieldClass} min-w-[100px] flex-1`}
              />
              <select
                value={row.kind}
                onChange={(e) => updateRow(i, j, { kind: e.target.value as "slider" | "toggle" })}
                className={`${fieldClass} w-28 shrink-0`}
              >
                <option value="slider">Слайдер</option>
                <option value="toggle">Переключатель</option>
              </select>
              {row.kind === "slider" ? (
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={row.value ?? 0}
                  onChange={(e) => updateRow(i, j, { value: Number(e.target.value) })}
                  className={`${fieldClass} w-20 shrink-0`}
                />
              ) : (
                <label className="flex items-center gap-1 text-[12px] text-md-on-surface-variant">
                  <input type="checkbox" checked={!!row.on} onChange={(e) => updateRow(i, j, { on: e.target.checked })} />
                  Вкл
                </label>
              )}
              <button
                type="button"
                onClick={() => updateCategory(i, { rows: cat.rows.filter((_, idx) => idx !== j) })}
                className="text-md-on-surface-variant hover:text-md-error"
              >
                <i className="ti ti-x text-sm" />
              </button>
            </div>
          ))}

          {cat.rows.length < 3 && (
            <button
              type="button"
              onClick={() => updateCategory(i, { rows: [...cat.rows, { label: "", kind: "toggle", on: false }] })}
              className="text-[12px] text-md-on-surface-variant hover:text-md-on-surface"
            >
              + Добавить строку
            </button>
          )}
        </div>
      ))}

      {block.categories.length < 3 && (
        <button
          type="button"
          onClick={() => onChange({ ...block, categories: [...block.categories, { title: "", rows: [] }] })}
          className="w-fit rounded-md border border-md-outline-variant px-3 py-1.5 text-[13px] text-md-on-surface hover:border-md-outline"
        >
          + Добавить категорию
        </button>
      )}
    </div>
  );
}
