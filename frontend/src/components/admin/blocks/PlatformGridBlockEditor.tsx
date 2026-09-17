"use client";

import { useState } from "react";
import { MediaPicker } from "@/components/admin/MediaPicker";
import { PLATFORM_ICON_PRESETS, PlatformIcon } from "@/lib/platform-icons";
import type { PublicPageBlock } from "@/lib/api";

type PlatformGridBlock = Extract<PublicPageBlock, { type: "platform_grid" }>;

const inputClass =
  "block w-full rounded-md border border-md-outline-variant bg-transparent px-2.5 py-1.5 text-[13px] text-md-on-surface outline-none focus:border-md-outline";
// Same field, no `w-full` baked in — for a field sitting next to a sibling in a flex row.
// Combining `inputClass` (already `w-full`) with an added width utility (`w-28`) is unreliable:
// Tailwind resolves conflicting width utilities by their order in the generated stylesheet, not
// by position in the className string, so `w-full` can silently win — which is exactly what
// happened here: the subtitle field ballooned to ~950px and crushed the title field next to it
// down to a sliver.
const fieldClass =
  "rounded-md border border-md-outline-variant bg-transparent px-2.5 py-1.5 text-[13px] text-md-on-surface outline-none focus:border-md-outline";

export function PlatformGridBlockEditor({ block, onChange }: { block: PlatformGridBlock; onChange: (block: PlatformGridBlock) => void }) {
  const [pickerForIndex, setPickerForIndex] = useState<number | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  function updateItem(i: number, patch: Partial<PlatformGridBlock["items"][number]>) {
    const next = [...block.items];
    next[i] = { ...next[i], ...patch };
    onChange({ ...block, items: next });
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <span className="text-[12px] text-md-on-surface-variant">Тема секции:</span>
        <div className="inline-flex overflow-hidden rounded-md border border-md-outline-variant text-[12px]">
          <button
            type="button"
            onClick={() => onChange({ ...block, theme: "dark" })}
            className={`px-2.5 py-1 ${(block.theme ?? "dark") === "dark" ? "bg-md-secondary-container text-md-on-secondary-container" : "text-md-on-surface-variant hover:bg-md-surface-container-high"}`}
          >
            Тёмная
          </button>
          <button
            type="button"
            onClick={() => onChange({ ...block, theme: "light" })}
            className={`px-2.5 py-1 ${block.theme === "light" ? "bg-md-secondary-container text-md-on-secondary-container" : "text-md-on-surface-variant hover:bg-md-surface-container-high"}`}
          >
            Светлая
          </button>
        </div>
      </div>
      <input
        value={block.heading || ""}
        onChange={(e) => onChange({ ...block, heading: e.target.value })}
        placeholder="Заголовок секции (например, Platforms We Support)"
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
            <div className="h-11 w-11 overflow-hidden rounded-md bg-[#17181C]">
              <PlatformIcon iconKey={item.icon_key} iconUrl={item.icon_url} />
            </div>
            <select
              value={item.icon_key || ""}
              onChange={(e) => {
                const key = e.target.value;
                if (key) updateItem(i, { icon_key: key, icon_media_id: undefined, icon_url: undefined });
                else updateItem(i, { icon_key: undefined });
              }}
              className="w-24 rounded border border-md-outline-variant bg-transparent text-[11px] text-md-on-surface-variant outline-none"
            >
              <option value="">Своя иконка</option>
              {Object.entries(PLATFORM_ICON_PRESETS).map(([key, preset]) => (
                <option key={key} value={key}>
                  {preset.label}
                </option>
              ))}
            </select>
            {!item.icon_key && (
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
                placeholder="Название"
                className={`${fieldClass} min-w-[140px] flex-1`}
              />
              <input
                value={item.subtitle || ""}
                onChange={(e) => updateItem(i, { subtitle: e.target.value })}
                placeholder="Подпись (опц.)"
                className={`${fieldClass} w-28 shrink-0`}
              />
            </div>
            <div className="flex items-center gap-3">
              <input
                value={item.tag_label || ""}
                onChange={(e) => updateItem(i, { tag_label: e.target.value })}
                placeholder="Бейдж (опц.), напр. #1 CLOUD"
                className={`${inputClass} flex-1`}
              />
              <label className="flex shrink-0 items-center gap-1.5 text-[12px] text-md-on-surface-variant">
                <input type="checkbox" checked={!!item.featured} onChange={(e) => updateItem(i, { featured: e.target.checked })} />
                Featured
              </label>
            </div>
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
        onClick={() => onChange({ ...block, items: [...block.items, { title: "" }] })}
        className="w-fit rounded-md border border-dashed border-md-outline-variant px-3 py-1.5 text-[13px] text-md-on-surface-variant hover:border-md-primary"
      >
        + Добавить платформу
      </button>

      <MediaPicker
        open={pickerForIndex !== null}
        onClose={() => setPickerForIndex(null)}
        onSelect={(item) => {
          if (pickerForIndex !== null) updateItem(pickerForIndex, { icon_media_id: item.id, icon_url: item.url, icon_key: undefined });
          setPickerForIndex(null);
        }}
      />
    </div>
  );
}
