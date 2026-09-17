"use client";

import { IconField } from "@/components/admin/blocks/IconField";
import type { PublicPageBlock } from "@/lib/api";

type LifecycleFeatureListBlock = Extract<PublicPageBlock, { type: "lifecycle_feature_list" }>;

const inputClass =
  "block w-full rounded-md border border-md-outline-variant bg-transparent px-2.5 py-1.5 text-[13px] text-md-on-surface outline-none focus:border-md-outline";
const fieldClass =
  "rounded-md border border-md-outline-variant bg-transparent px-2.5 py-1.5 text-[13px] text-md-on-surface outline-none focus:border-md-outline";

export function LifecycleFeatureListBlockEditor({
  block,
  onChange,
}: {
  block: LifecycleFeatureListBlock;
  onChange: (block: LifecycleFeatureListBlock) => void;
}) {
  function updateItem(i: number, patch: Partial<LifecycleFeatureListBlock["items"][number]>) {
    const next = [...block.items];
    next[i] = { ...next[i], ...patch };
    onChange({ ...block, items: next });
  }

  return (
    <div className="flex flex-col gap-3">
      <input
        value={block.heading || ""}
        onChange={(e) => onChange({ ...block, heading: e.target.value })}
        placeholder="Заголовок секции (напр. What's Included)"
        className={inputClass}
      />
      <textarea
        value={block.description || ""}
        onChange={(e) => onChange({ ...block, description: e.target.value })}
        placeholder="Описание (опционально)"
        rows={2}
        className={inputClass}
      />

      {block.items.map((item, i) => (
        <div key={i} className="flex flex-col gap-1.5 rounded-md border border-md-outline-variant p-2.5">
          <div className="flex items-center gap-2">
            <IconField value={item} onChange={(icon) => updateItem(i, icon)} />
            <input
              value={item.phase_tag || ""}
              onChange={(e) => updateItem(i, { phase_tag: e.target.value })}
              placeholder="Фаза (ASSESS)"
              className={`${fieldClass} w-28 shrink-0`}
            />
            <button
              type="button"
              onClick={() => onChange({ ...block, items: block.items.filter((_, idx) => idx !== i) })}
              className="shrink-0 text-md-on-surface-variant hover:text-md-error"
            >
              <i className="ti ti-trash text-sm" />
            </button>
          </div>
          <input
            value={item.title}
            onChange={(e) => updateItem(i, { title: e.target.value })}
            placeholder="Название"
            className={inputClass}
          />
          <textarea
            value={item.description || ""}
            onChange={(e) => updateItem(i, { description: e.target.value })}
            placeholder="Описание"
            rows={2}
            className={inputClass}
          />
          <div className="flex items-center gap-2">
            <input
              value={item.case_link_label || ""}
              onChange={(e) => updateItem(i, { case_link_label: e.target.value || undefined })}
              placeholder="Текст ссылки «In practice: ...» (опц., пусто пока нет реальных кейсов)"
              className={`${fieldClass} min-w-[140px] flex-1`}
            />
            <input
              value={item.case_link_url || ""}
              onChange={(e) => updateItem(i, { case_link_url: e.target.value || undefined })}
              placeholder="/blog/..."
              className={`${fieldClass} w-32 shrink-0`}
            />
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={() => onChange({ ...block, items: [...block.items, { title: "" }] })}
        className="w-fit rounded-md border border-dashed border-md-outline-variant px-3 py-1.5 text-[13px] text-md-on-surface-variant hover:border-md-primary"
      >
        + Добавить пункт
      </button>
    </div>
  );
}
