"use client";

import { useState } from "react";
import { MediaPicker } from "@/components/admin/MediaPicker";
import { GradientIconBadge } from "@/components/site/GradientIconBadge";
import type { PublicPageBlock } from "@/lib/api";

type CoreServicesGridBlock = Extract<PublicPageBlock, { type: "core_services_grid" }>;

const inputClass =
  "block w-full rounded-md border border-md-outline-variant bg-transparent px-2.5 py-1.5 text-[13px] text-md-on-surface outline-none focus:border-md-outline";
// Same visual field as `inputClass` but without `w-full` baked in, for fields that sit next to a
// sibling in a flex row: combining `inputClass` (which already has `w-full`) with an added width
// utility (e.g. `w-40`) is unreliable — Tailwind resolves conflicting utilities by their order in
// the generated stylesheet, not by position in the className string, so `w-full` can silently win
// and blow the field out to fill the row (this is exactly what happened here: the badge field
// ballooned to ~950px, crushing the title field next to it down to a sliver and pushing the
// Featured checkbox off the edge of the card).
const fieldClass =
  "rounded-md border border-md-outline-variant bg-transparent px-2.5 py-1.5 text-[13px] text-md-on-surface outline-none focus:border-md-outline";

const MAX_BULLETS = 4;

export function CoreServicesGridBlockEditor({ block, onChange }: { block: CoreServicesGridBlock; onChange: (block: CoreServicesGridBlock) => void }) {
  const [pickerForIndex, setPickerForIndex] = useState<number | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  function updateItem(i: number, patch: Partial<CoreServicesGridBlock["items"][number]>) {
    const next = [...block.items];
    next[i] = { ...next[i], ...patch };
    onChange({ ...block, items: next });
  }

  function updateBullet(i: number, bi: number, value: string) {
    const bullets = [...(block.items[i].bullets || [])];
    bullets[bi] = value;
    updateItem(i, { bullets });
  }

  return (
    <div className="flex flex-col gap-3">
      <input
        value={block.heading || ""}
        onChange={(e) => onChange({ ...block, heading: e.target.value })}
        placeholder="Заголовок секции (например, Our Core Services)"
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
        <div
          key={i}
          draggable
          onDragStart={() => setDragIndex(i)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={() => {
            if (dragIndex === null || dragIndex === i) return;
            const next = [...block.items];
            const [moved] = next.splice(dragIndex, 1);
            next.splice(i, 0, moved);
            setDragIndex(null);
            onChange({ ...block, items: next });
          }}
          className="flex items-start gap-2.5 rounded-lg border border-md-outline-variant p-2.5"
        >
          <i className="ti ti-grip-vertical mt-2 shrink-0 cursor-grab text-md-on-surface-variant" />

          <div className="flex shrink-0 flex-col items-center gap-1.5">
            <GradientIconBadge icon={item.icon} iconUrl={item.icon_url} size={44} />
            <input
              value={item.icon || ""}
              onChange={(e) => updateItem(i, { icon: e.target.value || undefined })}
              placeholder="напр. cloud-upload"
              title="Название иконки Tabler без префикса, например: cloud-upload, shield-check, activity, coin, brand-kubernetes"
              className="w-28 rounded border border-md-outline-variant bg-transparent px-1 py-0.5 text-center text-[10.5px] text-md-on-surface-variant outline-none"
            />
            {!item.icon && (
              <button type="button" onClick={() => setPickerForIndex(i)} className="text-[10.5px] text-md-on-surface-variant hover:text-md-primary">
                Загрузить
              </button>
            )}
          </div>

          <div className="flex flex-1 flex-col gap-1.5">
            <div className="flex flex-wrap gap-1.5">
              <input
                value={item.title}
                onChange={(e) => updateItem(i, { title: e.target.value })}
                placeholder="Название услуги"
                className={`${fieldClass} min-w-[140px] flex-1`}
              />
              <input
                value={item.tag_label || ""}
                onChange={(e) => updateItem(i, { tag_label: e.target.value })}
                placeholder="Бейдж (опц.), напр. MOST POPULAR"
                className={`${fieldClass} w-40 shrink-0`}
              />
              <label className="flex shrink-0 items-center gap-1.5 whitespace-nowrap text-[12px] text-md-on-surface-variant">
                <input type="checkbox" checked={!!item.featured} onChange={(e) => updateItem(i, { featured: e.target.checked })} />
                Featured
              </label>
            </div>
            <textarea
              value={item.description || ""}
              onChange={(e) => updateItem(i, { description: e.target.value })}
              placeholder="Короткое описание"
              rows={2}
              className={inputClass}
            />
            <input
              value={item.url || ""}
              onChange={(e) => updateItem(i, { url: e.target.value || undefined })}
              placeholder="Ссылка «Learn more» (/services/...) — пусто = карточка без ссылки"
              className={inputClass}
            />

            {!item.featured && (
              <div className="flex flex-col gap-1">
                <p className="m-0 text-[11px] text-md-on-surface-variant">Список при наведении (2-4 пункта):</p>
                {(item.bullets || []).map((bullet, bi) => (
                  <div key={bi} className="flex items-center gap-1.5">
                    <i className="ti ti-check text-[11px] text-green-600" />
                    <input
                      value={bullet}
                      onChange={(e) => updateBullet(i, bi, e.target.value)}
                      placeholder="Пункт"
                      className={inputClass}
                    />
                    <button
                      type="button"
                      onClick={() => updateItem(i, { bullets: (item.bullets || []).filter((_, idx) => idx !== bi) })}
                      className="shrink-0 text-md-on-surface-variant hover:text-md-error"
                    >
                      <i className="ti ti-x text-[12px]" />
                    </button>
                  </div>
                ))}
                {(item.bullets?.length || 0) < MAX_BULLETS && (
                  <button
                    type="button"
                    onClick={() => updateItem(i, { bullets: [...(item.bullets || []), ""] })}
                    className="w-fit text-[11px] text-md-on-surface-variant hover:text-md-primary"
                  >
                    + Добавить пункт
                  </button>
                )}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => onChange({ ...block, items: block.items.filter((_, idx) => idx !== i) })}
            className="mt-2 shrink-0 text-md-on-surface-variant hover:text-md-error"
          >
            <i className="ti ti-trash text-sm" />
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={() => onChange({ ...block, items: [...block.items, { title: "", description: "" }] })}
        className="w-fit rounded-md border border-dashed border-md-outline-variant px-3 py-1.5 text-[13px] text-md-on-surface-variant hover:border-md-primary"
      >
        + Добавить услугу
      </button>

      <MediaPicker
        open={pickerForIndex !== null}
        onClose={() => setPickerForIndex(null)}
        onSelect={(item) => {
          if (pickerForIndex !== null) updateItem(pickerForIndex, { icon_media_id: item.id, icon_url: item.url, icon: undefined });
          setPickerForIndex(null);
        }}
      />
    </div>
  );
}
