"use client";

import { useState } from "react";
import { MediaPicker } from "@/components/admin/MediaPicker";
import type { PublicPageBlock } from "@/lib/api";

type LogoMarqueeBlock = Extract<PublicPageBlock, { type: "logo_marquee" }>;

const inputClass =
  "block w-full rounded-md border border-md-outline-variant bg-transparent px-2.5 py-1.5 text-[13px] text-md-on-surface outline-none focus:border-md-outline";
// Same field, no `w-full` baked in — for fields sharing a row with a sibling. Combining
// `inputClass` (already `w-full`) with an added width utility is unreliable in this app's
// Tailwind build (conflicting width utilities resolve by stylesheet order, not className
// position, and `w-full` tends to win) — see CoreServicesGridBlockEditor.tsx for the bug this
// caused when that shortcut was used.
const fieldClass =
  "rounded-md border border-md-outline-variant bg-transparent px-2.5 py-1.5 text-[13px] text-md-on-surface outline-none focus:border-md-outline";

export function LogoMarqueeBlockEditor({ block, onChange }: { block: LogoMarqueeBlock; onChange: (block: LogoMarqueeBlock) => void }) {
  const [pickerForIndex, setPickerForIndex] = useState<number | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  function updateItem(i: number, patch: Partial<LogoMarqueeBlock["items"][number]>) {
    const next = [...block.items];
    next[i] = { ...next[i], ...patch };
    onChange({ ...block, items: next });
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-md border border-dashed border-md-outline-variant bg-md-surface-container-low p-2.5 text-[11.5px] leading-relaxed text-md-on-surface-variant">
        <i className="ti ti-alert-triangle mr-1 text-amber-500" />
        Ниже — демо-данные (вымышленные названия компаний) для проверки блока. Перед реальным
        запуском сайта замените их на настоящих клиентов (с их согласия) или удалите блок.
      </div>

      <input
        value={block.heading || ""}
        onChange={(e) => onChange({ ...block, heading: e.target.value })}
        placeholder="Заголовок (опц.), например: Trusted by 500+ companies worldwide"
        className={inputClass}
      />

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-[12px] text-md-on-surface-variant">Скорость:</span>
          <div className="inline-flex overflow-hidden rounded-md border border-md-outline-variant text-[12px]">
            {(["slow", "medium", "fast"] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => onChange({ ...block, speed: s })}
                className={`px-2.5 py-1 ${(block.speed ?? "medium") === s ? "bg-md-secondary-container text-md-on-secondary-container" : "text-md-on-surface-variant hover:bg-md-surface-container-high"}`}
              >
                {s === "slow" ? "Медленно" : s === "medium" ? "Средне" : "Быстро"}
              </button>
            ))}
          </div>
        </div>
        <label className="flex items-center gap-1.5 text-[12px] text-md-on-surface-variant">
          <input
            type="checkbox"
            checked={block.pause_on_hover ?? true}
            onChange={(e) => onChange({ ...block, pause_on_hover: e.target.checked })}
          />
          Пауза при наведении курсора
        </label>
      </div>

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
          className="flex items-center gap-2.5 rounded-lg border border-md-outline-variant p-2.5"
        >
          <i className="ti ti-grip-vertical shrink-0 cursor-grab text-md-on-surface-variant" />

          <div className="flex shrink-0 flex-col items-center gap-1">
            <div className="flex h-10 w-20 items-center justify-center overflow-hidden rounded-md border border-md-outline-variant bg-md-surface-container-low">
              {item.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.logo_url} alt="" className="max-h-full max-w-full object-contain" />
              ) : (
                <span className="px-1 text-center text-[9.5px] text-md-on-surface-variant">без логотипа</span>
              )}
            </div>
            <button type="button" onClick={() => setPickerForIndex(i)} className="text-[10.5px] text-md-on-surface-variant hover:text-md-primary">
              {item.logo_url ? "Заменить" : "Загрузить"}
            </button>
          </div>

          <div className="flex flex-1 flex-wrap gap-1.5">
            <input
              value={item.company_name}
              onChange={(e) => updateItem(i, { company_name: e.target.value })}
              placeholder="Название компании"
              className={`${fieldClass} min-w-[140px] flex-1`}
            />
            <input
              value={item.url || ""}
              onChange={(e) => updateItem(i, { url: e.target.value || null })}
              placeholder="https://... (опц., ссылка при клике)"
              className={`${fieldClass} w-64 shrink-0`}
            />
          </div>

          <button
            type="button"
            onClick={() => onChange({ ...block, items: block.items.filter((_, idx) => idx !== i) })}
            className="shrink-0 text-md-on-surface-variant hover:text-md-error"
          >
            <i className="ti ti-trash text-sm" />
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={() => onChange({ ...block, items: [...block.items, { company_name: "" }] })}
        className="w-fit rounded-md border border-dashed border-md-outline-variant px-3 py-1.5 text-[13px] text-md-on-surface-variant hover:border-md-primary"
      >
        + Добавить логотип
      </button>

      <MediaPicker
        open={pickerForIndex !== null}
        onClose={() => setPickerForIndex(null)}
        onSelect={(item) => {
          if (pickerForIndex !== null) updateItem(pickerForIndex, { logo_media_id: item.id, logo_url: item.url });
          setPickerForIndex(null);
        }}
      />
    </div>
  );
}
