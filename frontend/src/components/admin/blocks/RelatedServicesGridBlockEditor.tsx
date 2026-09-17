"use client";

import { IconField } from "@/components/admin/blocks/IconField";
import type { PublicPageBlock } from "@/lib/api";

type RelatedServicesGridBlock = Extract<PublicPageBlock, { type: "related_services_grid" }>;

const inputClass =
  "block w-full rounded-md border border-md-outline-variant bg-transparent px-2.5 py-1.5 text-[13px] text-md-on-surface outline-none focus:border-md-outline";
const fieldClass =
  "rounded-md border border-md-outline-variant bg-transparent px-2.5 py-1.5 text-[13px] text-md-on-surface outline-none focus:border-md-outline";

export function RelatedServicesGridBlockEditor({
  block,
  onChange,
}: {
  block: RelatedServicesGridBlock;
  onChange: (block: RelatedServicesGridBlock) => void;
}) {
  function updateItem(i: number, patch: Partial<RelatedServicesGridBlock["items"][number]>) {
    const next = [...block.items];
    next[i] = { ...next[i], ...patch };
    onChange({ ...block, items: next });
  }

  return (
    <div className="flex flex-col gap-3">
      <input
        value={block.heading || ""}
        onChange={(e) => onChange({ ...block, heading: e.target.value })}
        placeholder="Заголовок секции (напр. Related Services)"
        className={inputClass}
      />

      {block.items.map((item, i) => (
        <div key={i} className="flex flex-col gap-1.5 rounded-md border border-md-outline-variant p-2.5">
          <div className="flex items-center gap-2">
            <IconField value={item} onChange={(icon) => updateItem(i, icon)} />
            <input
              value={item.title}
              onChange={(e) => updateItem(i, { title: e.target.value })}
              placeholder="Название услуги"
              className={`${fieldClass} min-w-[120px] flex-1`}
            />
            <button
              type="button"
              onClick={() => onChange({ ...block, items: block.items.filter((_, idx) => idx !== i) })}
              className="shrink-0 text-md-on-surface-variant hover:text-md-error"
            >
              <i className="ti ti-trash text-sm" />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <input
              value={item.description || ""}
              onChange={(e) => updateItem(i, { description: e.target.value })}
              placeholder="Короткое описание (опционально)"
              className={`${fieldClass} min-w-[140px] flex-1`}
            />
            <input
              value={item.url}
              onChange={(e) => updateItem(i, { url: e.target.value })}
              placeholder="/services/..."
              className={`${fieldClass} w-40 shrink-0`}
            />
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={() => onChange({ ...block, items: [...block.items, { title: "", url: "" }] })}
        className="w-fit rounded-md border border-dashed border-md-outline-variant px-3 py-1.5 text-[13px] text-md-on-surface-variant hover:border-md-primary"
      >
        + Добавить услугу
      </button>
    </div>
  );
}
