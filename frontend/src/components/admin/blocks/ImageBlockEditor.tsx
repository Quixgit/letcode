"use client";

import { useState } from "react";
import { MediaPicker } from "@/components/admin/MediaPicker";
import type { PublicPageBlock } from "@/lib/api";

type ImageBlock = Extract<PublicPageBlock, { type: "image" }>;

export function ImageBlockEditor({ block, onChange }: { block: ImageBlock; onChange: (block: ImageBlock) => void }) {
  const [pickerOpen, setPickerOpen] = useState(false);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-3">
        {block.url && <img src={block.url} alt="" className="h-16 w-16 rounded-lg object-cover" />}
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          className="rounded-lg border border-md-outline-variant px-3 py-1.5 text-[12px] text-md-on-surface hover:border-md-primary"
        >
          {block.url ? "Заменить" : "Выбрать изображение"}
        </button>
      </div>
      <input
        value={block.alt || ""}
        onChange={(e) => onChange({ ...block, alt: e.target.value })}
        placeholder="Alt text"
        className="block w-full rounded-md border border-md-outline-variant px-2.5 py-1.5 text-[13px] text-md-on-surface outline-none focus:border-md-primary"
      />
      <input
        value={block.caption || ""}
        onChange={(e) => onChange({ ...block, caption: e.target.value })}
        placeholder="Подпись (опционально)"
        className="block w-full rounded-md border border-md-outline-variant px-2.5 py-1.5 text-[13px] text-md-on-surface outline-none focus:border-md-primary"
      />

      <MediaPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={(item) => {
          onChange({ ...block, url: item.url, media_id: item.id });
          setPickerOpen(false);
        }}
      />
    </div>
  );
}
