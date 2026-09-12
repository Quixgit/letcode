"use client";

import type { PublicPageBlock } from "@/lib/api";

type HeadingBlock = Extract<PublicPageBlock, { type: "heading" }>;

export function HeadingBlockEditor({
  block,
  onChange,
}: {
  block: HeadingBlock;
  onChange: (block: HeadingBlock) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <select
        value={block.level || 2}
        onChange={(e) => onChange({ ...block, level: Number(e.target.value) as 2 | 3 })}
        className="shrink-0 rounded-md border border-md-outline-variant px-2 py-1.5 text-[13px] text-md-on-surface outline-none"
      >
        <option value={2}>H2</option>
        <option value={3}>H3</option>
      </select>
      <input
        value={block.text}
        onChange={(e) => onChange({ ...block, text: e.target.value })}
        placeholder="Текст заголовка"
        className="block w-full rounded-md border border-md-outline-variant px-2.5 py-1.5 text-[13px] text-md-on-surface outline-none focus:border-md-primary"
      />
    </div>
  );
}
