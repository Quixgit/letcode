"use client";

import { useState } from "react";
import { MediaPicker } from "@/components/admin/MediaPicker";
import { Button } from "@/components/admin/m3/Button";
import type { PublicPageBlock } from "@/lib/api";

type AnnotatedScreenshotBlock = Extract<PublicPageBlock, { type: "annotated_screenshot" }>;

const inputClass =
  "block w-full rounded-md border border-md-outline-variant bg-transparent px-2.5 py-1.5 text-[13px] text-md-on-surface outline-none focus:border-md-outline";
// Same field, no `w-full` baked in — the side/percent fields below need `w-20`/`w-16` to actually
// win over `w-full` (Tailwind resolves conflicting width utilities by stylesheet order, not
// className position), otherwise they claim the whole row and the `text` field's `flex-1` sibling
// gets nothing.
const fieldClass =
  "rounded-md border border-md-outline-variant bg-transparent px-2.5 py-1.5 text-[13px] text-md-on-surface outline-none focus:border-md-outline";

export function AnnotatedScreenshotBlockEditor({
  block,
  onChange,
}: {
  block: AnnotatedScreenshotBlock;
  onChange: (block: AnnotatedScreenshotBlock) => void;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);

  function update(i: number, patch: Partial<AnnotatedScreenshotBlock["annotations"][number]>) {
    const next = [...block.annotations];
    next[i] = { ...next[i], ...patch };
    onChange({ ...block, annotations: next });
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        {block.image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={block.image_url} alt="" className="h-16 w-12 rounded-md object-cover" />
        )}
        <Button variant="outlined" onClick={() => setPickerOpen(true)} className="px-3 py-1.5">
          Выбрать скриншот
        </Button>
      </div>

      {block.annotations.map((a, i) => (
        <div key={i} className="flex items-center gap-2">
          <select value={a.side} onChange={(e) => update(i, { side: e.target.value as "left" | "right" })} className={`${fieldClass} w-20 shrink-0`}>
            <option value="left">Слева</option>
            <option value="right">Справа</option>
          </select>
          <input
            type="number"
            min={0}
            max={100}
            value={a.y_percent}
            onChange={(e) => update(i, { y_percent: Number(e.target.value) })}
            className={`${fieldClass} w-16 shrink-0`}
            title="Высота, %"
          />
          <input value={a.text} onChange={(e) => update(i, { text: e.target.value })} placeholder="Текст подписи" className={`${fieldClass} min-w-0 flex-1`} />
          <button type="button" onClick={() => onChange({ ...block, annotations: block.annotations.filter((_, idx) => idx !== i) })} className="text-md-on-surface-variant hover:text-md-error">
            <i className="ti ti-x text-sm" />
          </button>
        </div>
      ))}

      {block.annotations.length < 4 && (
        <button
          type="button"
          onClick={() => onChange({ ...block, annotations: [...block.annotations, { text: "", side: block.annotations.length % 2 === 0 ? "left" : "right", y_percent: 30 + block.annotations.length * 20 }] })}
          className="w-fit rounded-md border border-md-outline-variant px-3 py-1.5 text-[13px] text-md-on-surface hover:border-md-outline"
        >
          + Добавить подпись
        </button>
      )}

      <MediaPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={(item) => {
          onChange({ ...block, image_media_id: item.id, image_url: item.url });
          setPickerOpen(false);
        }}
      />
    </div>
  );
}
