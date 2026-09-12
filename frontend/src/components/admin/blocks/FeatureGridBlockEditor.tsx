"use client";

import { IconField } from "@/components/admin/blocks/IconField";
import type { PublicPageBlock } from "@/lib/api";

type FeatureGridBlock = Extract<PublicPageBlock, { type: "feature_grid" }>;

const inputClass =
  "block w-full rounded-md border border-md-outline-variant bg-transparent px-2.5 py-1.5 text-[13px] text-md-on-surface outline-none focus:border-md-outline";

export function FeatureGridBlockEditor({ block, onChange }: { block: FeatureGridBlock; onChange: (block: FeatureGridBlock) => void }) {
  function update(i: number, patch: Partial<FeatureGridBlock["items"][number]>) {
    const next = [...block.items];
    next[i] = { ...next[i], ...patch };
    onChange({ ...block, items: next });
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <span className="text-[12px] text-md-on-surface-variant">Колонок:</span>
        {[2, 3].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange({ ...block, columns: n as 2 | 3 })}
            className={`rounded-md px-2.5 py-1 text-[12px] ${block.columns === n ? "bg-md-secondary-container text-md-on-secondary-container" : "text-md-on-surface-variant hover:bg-md-surface-container-high"}`}
          >
            {n}×{n}
          </button>
        ))}
      </div>

      {block.items.map((item, i) => (
        <div key={i} className="rounded-md border border-md-outline-variant p-2.5">
          <div className="mb-2 flex items-center justify-between">
            <IconField value={item} onChange={(icon) => update(i, icon)} />
            <button type="button" onClick={() => onChange({ ...block, items: block.items.filter((_, idx) => idx !== i) })} className="text-md-on-surface-variant hover:text-md-error">
              <i className="ti ti-trash text-sm" />
            </button>
          </div>
          <input value={item.title} onChange={(e) => update(i, { title: e.target.value })} placeholder="Заголовок" className={`${inputClass} mb-2`} />
          <textarea value={item.description} onChange={(e) => update(i, { description: e.target.value })} placeholder="Описание" rows={2} className={inputClass} />
        </div>
      ))}

      <button
        type="button"
        onClick={() => onChange({ ...block, items: [...block.items, { icon: "ti-bolt", title: "", description: "" }] })}
        className="w-fit rounded-md border border-md-outline-variant px-3 py-1.5 text-[13px] text-md-on-surface hover:border-md-outline"
      >
        + Добавить карточку
      </button>
    </div>
  );
}
