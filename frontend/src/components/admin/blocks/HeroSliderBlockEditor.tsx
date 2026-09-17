"use client";

import { useState } from "react";
import { MediaPicker } from "@/components/admin/MediaPicker";
import type { PublicPageBlock } from "@/lib/api";

type HeroSliderBlock = Extract<PublicPageBlock, { type: "hero_slider" }>;

const inputClass =
  "block w-full rounded-md border border-md-outline-variant bg-transparent px-2.5 py-1.5 text-[13px] text-md-on-surface outline-none focus:border-md-outline";
// Same field, no `w-full` baked in — needed whenever an added width utility (`w-24`, `w-28`, …)
// must actually win. `inputClass` already has `w-full`, and Tailwind resolves conflicting width
// utilities by their order in the generated stylesheet, not by className string position, so
// `w-full` silently wins over a same-element `w-NN` far more often than not — this file's own
// interval/height fields were rendering far too wide because of exactly this.
const fieldClass =
  "rounded-md border border-md-outline-variant bg-transparent px-2.5 py-1.5 text-[13px] text-md-on-surface outline-none focus:border-md-outline";

export function HeroSliderBlockEditor({ block, onChange }: { block: HeroSliderBlock; onChange: (block: HeroSliderBlock) => void }) {
  const [pickerForIndex, setPickerForIndex] = useState<number | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  function updateSlide(i: number, patch: Partial<HeroSliderBlock["slides"][number]>) {
    const next = [...block.slides];
    next[i] = { ...next[i], ...patch };
    onChange({ ...block, slides: next });
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-[12px] text-md-on-surface-variant">Автопрокрутка, мс:</span>
          <input
            type="number"
            min={1500}
            step={500}
            value={block.interval_ms ?? 5000}
            onChange={(e) => onChange({ ...block, interval_ms: Number(e.target.value) })}
            className={`${fieldClass} w-24 shrink-0`}
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[12px] text-md-on-surface-variant">Высота:</span>
          <select
            value={block.height ?? "medium"}
            onChange={(e) => onChange({ ...block, height: e.target.value as "small" | "medium" | "large" })}
            className={`${fieldClass} w-28 shrink-0`}
          >
            <option value="small">Small</option>
            <option value="medium">Medium</option>
            <option value="large">Large</option>
          </select>
        </div>
        <label className="flex items-center gap-1.5 text-[12px] text-md-on-surface-variant">
          <input
            type="checkbox"
            checked={!!block.full_width}
            onChange={(e) => onChange({ ...block, full_width: e.target.checked })}
          />
          На всю ширину экрана
        </label>
      </div>

      {block.slides.map((slide, i) => (
        <div
          key={i}
          draggable
          onDragStart={() => setDragIndex(i)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={() => {
            if (dragIndex === null || dragIndex === i) return;
            const next = [...block.slides];
            const [moved] = next.splice(dragIndex, 1);
            next.splice(i, 0, moved);
            setDragIndex(null);
            onChange({ ...block, slides: next });
          }}
          className="flex items-start gap-2.5 rounded-lg border border-md-outline-variant p-2.5"
        >
          <i className="ti ti-grip-vertical mt-2 shrink-0 cursor-grab text-md-on-surface-variant" />

          <div className="flex shrink-0 flex-col items-center gap-1.5">
            {slide.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={slide.image_url} alt="" className="h-16 w-24 rounded-md object-cover" />
            ) : (
              <div className="flex h-16 w-24 items-center justify-center rounded-md border border-dashed border-md-outline-variant text-md-on-surface-variant">
                <i className="ti ti-photo text-sm" />
              </div>
            )}
            <button type="button" onClick={() => setPickerForIndex(i)} className="text-[11px] text-md-on-surface-variant hover:text-md-primary">
              Изображение
            </button>
          </div>

          <div className="flex flex-1 flex-col gap-1.5">
            <input value={slide.title} onChange={(e) => updateSlide(i, { title: e.target.value })} placeholder="Заголовок" className={inputClass} />
            <input
              value={slide.subtitle || ""}
              onChange={(e) => updateSlide(i, { subtitle: e.target.value })}
              placeholder="Подзаголовок (опционально)"
              className={inputClass}
            />
            <div className="flex gap-1.5">
              <input
                value={slide.button_label || ""}
                onChange={(e) => updateSlide(i, { button_label: e.target.value })}
                placeholder="Текст кнопки (опционально)"
                className={inputClass}
              />
              <input
                value={slide.button_url || ""}
                onChange={(e) => updateSlide(i, { button_url: e.target.value })}
                placeholder="/url"
                className={inputClass}
              />
            </div>
          </div>

          <button
            type="button"
            onClick={() => onChange({ ...block, slides: block.slides.filter((_, idx) => idx !== i) })}
            className="mt-2 shrink-0 text-md-on-surface-variant hover:text-md-error"
          >
            <i className="ti ti-trash text-sm" />
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={() =>
          onChange({ ...block, slides: [...block.slides, { title: "", subtitle: "", button_label: "", button_url: "" }] })
        }
        className="w-fit rounded-md border border-dashed border-md-outline-variant px-3 py-1.5 text-[13px] text-md-on-surface-variant hover:border-md-primary"
      >
        + Добавить слайд
      </button>

      <MediaPicker
        open={pickerForIndex !== null}
        onClose={() => setPickerForIndex(null)}
        onSelect={(item) => {
          if (pickerForIndex !== null) updateSlide(pickerForIndex, { image_media_id: item.id, image_url: item.url });
          setPickerForIndex(null);
        }}
      />
    </div>
  );
}
