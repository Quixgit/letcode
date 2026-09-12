"use client";

import type { PublicPageBlock } from "@/lib/api";

type SectionLabelBlock = Extract<PublicPageBlock, { type: "section_label" }>;

export function SectionLabelBlockEditor({ block, onChange }: { block: SectionLabelBlock; onChange: (block: SectionLabelBlock) => void }) {
  return (
    <input
      value={block.text}
      onChange={(e) => onChange({ ...block, text: e.target.value })}
      placeholder="Текст (например: ALERTS AT A GLANCE)"
      className="block w-full rounded-md border border-md-outline-variant bg-transparent px-2.5 py-1.5 text-[13px] text-md-on-surface outline-none focus:border-md-outline"
    />
  );
}
