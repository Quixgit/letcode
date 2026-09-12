"use client";

import { useState } from "react";
import { MediaPicker } from "@/components/admin/MediaPicker";
import type { PublicPageBlock } from "@/lib/api";

type GalleryBlock = Extract<PublicPageBlock, { type: "gallery" }>;

export function GalleryBlockEditor({
  block,
  onChange,
}: {
  block: GalleryBlock;
  onChange: (block: GalleryBlock) => void;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);

  return (
    <div>
      <div className="mb-2 flex flex-wrap gap-2">
        {block.images.map((img, i) => (
          <div key={i} className="group relative h-16 w-16 overflow-hidden rounded-lg border border-md-outline-variant">
            <img src={img.url} alt="" className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => onChange({ ...block, images: block.images.filter((_, idx) => idx !== i) })}
              className="absolute right-0.5 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white"
            >
              <i className="ti ti-x text-[10px]" />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          className="flex h-16 w-16 items-center justify-center rounded-lg border border-dashed border-md-outline-variant text-md-on-surface-variant hover:border-md-primary"
        >
          <i className="ti ti-plus" />
        </button>
      </div>

      <MediaPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={(item) => {
          onChange({ ...block, images: [...block.images, { url: item.url, alt: "", media_id: item.id }] });
          setPickerOpen(false);
        }}
      />
    </div>
  );
}
