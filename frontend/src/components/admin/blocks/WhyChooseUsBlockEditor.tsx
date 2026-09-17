"use client";

import { useState } from "react";
import { MediaPicker } from "@/components/admin/MediaPicker";
import type { PublicPageBlock } from "@/lib/api";

type WhyChooseUsBlock = Extract<PublicPageBlock, { type: "why_choose_us" }>;

const inputClass =
  "block w-full rounded-md border border-md-outline-variant bg-transparent px-2.5 py-1.5 text-[13px] text-md-on-surface outline-none focus:border-md-outline";

export function WhyChooseUsBlockEditor({ block, onChange }: { block: WhyChooseUsBlock; onChange: (block: WhyChooseUsBlock) => void }) {
  const [pickerForIndex, setPickerForIndex] = useState<number | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  function updateItem(i: number, patch: Partial<WhyChooseUsBlock["items"][number]>) {
    const next = [...block.items];
    next[i] = { ...next[i], ...patch };
    onChange({ ...block, items: next });
  }

  return (
    <div className="flex flex-col gap-3">
      <input
        value={block.heading || ""}
        onChange={(e) => onChange({ ...block, heading: e.target.value })}
        placeholder="Заголовок секции (например, Why Choose Us)"
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
            {item.icon_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={item.icon_url} alt="" className="h-11 w-11 rounded-full bg-[#E63946] object-contain p-2" />
            ) : (
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#E63946] text-white">
                <i className="ti ti-sparkles text-sm" />
              </div>
            )}
            <button type="button" onClick={() => setPickerForIndex(i)} className="text-[10.5px] text-md-on-surface-variant hover:text-md-primary">
              Иконка
            </button>
          </div>

          <div className="flex flex-1 flex-col gap-1.5">
            <input value={item.stat} onChange={(e) => updateItem(i, { stat: e.target.value })} placeholder="Показатель (например, 3 или Solo-Built)" className={inputClass} />
            <textarea value={item.label} onChange={(e) => updateItem(i, { label: e.target.value })} placeholder="Описание" rows={2} className={inputClass} />
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
        onClick={() => onChange({ ...block, items: [...block.items, { stat: "", label: "" }] })}
        className="w-fit rounded-md border border-dashed border-md-outline-variant px-3 py-1.5 text-[13px] text-md-on-surface-variant hover:border-md-primary"
      >
        + Добавить пункт
      </button>

      <MediaPicker
        open={pickerForIndex !== null}
        onClose={() => setPickerForIndex(null)}
        onSelect={(item) => {
          if (pickerForIndex !== null) updateItem(pickerForIndex, { icon_media_id: item.id, icon_url: item.url });
          setPickerForIndex(null);
        }}
      />
    </div>
  );
}
