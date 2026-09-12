"use client";

import type { PublicPageBlock } from "@/lib/api";

type CtaBannerBlock = Extract<PublicPageBlock, { type: "cta_banner" }>;

const inputClass =
  "block w-full rounded-md border border-md-outline-variant bg-transparent px-2.5 py-1.5 text-[13px] text-md-on-surface outline-none focus:border-md-outline";

export function CtaBannerBlockEditor({ block, onChange }: { block: CtaBannerBlock; onChange: (block: CtaBannerBlock) => void }) {
  return (
    <div className="flex flex-col gap-2">
      <input value={block.title} onChange={(e) => onChange({ ...block, title: e.target.value })} placeholder="Заголовок баннера" className={inputClass} />
      <div className="grid grid-cols-2 gap-2">
        <input value={block.button_label} onChange={(e) => onChange({ ...block, button_label: e.target.value })} placeholder="Текст кнопки" className={inputClass} />
        <input value={block.button_url} onChange={(e) => onChange({ ...block, button_url: e.target.value })} placeholder="URL кнопки" className={inputClass} />
      </div>
    </div>
  );
}
