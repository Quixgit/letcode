"use client";

import type { PublicPageBlock } from "@/lib/api";

type ButtonBlock = Extract<PublicPageBlock, { type: "button" }>;

export function ButtonBlockEditor({ block, onChange }: { block: ButtonBlock; onChange: (block: ButtonBlock) => void }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      <input
        value={block.label}
        onChange={(e) => onChange({ ...block, label: e.target.value })}
        placeholder="Текст кнопки"
        className="block w-full rounded-md border border-md-outline-variant px-2.5 py-1.5 text-[13px] text-md-on-surface outline-none focus:border-md-primary"
      />
      <input
        value={block.url}
        onChange={(e) => onChange({ ...block, url: e.target.value })}
        placeholder="URL"
        className="block w-full rounded-md border border-md-outline-variant px-2.5 py-1.5 text-[13px] text-md-on-surface outline-none focus:border-md-primary"
      />
      <select
        value={block.style || "primary"}
        onChange={(e) => onChange({ ...block, style: e.target.value as "primary" | "secondary" })}
        className="rounded-md border border-md-outline-variant px-2.5 py-1.5 text-[13px] text-md-on-surface outline-none"
      >
        <option value="primary">Primary</option>
        <option value="secondary">Secondary</option>
      </select>
    </div>
  );
}
