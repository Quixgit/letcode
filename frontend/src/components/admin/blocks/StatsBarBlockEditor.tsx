"use client";

import type { PublicPageBlock } from "@/lib/api";

type StatsBarBlock = Extract<PublicPageBlock, { type: "stats_bar" }>;

const inputClass =
  "block w-full rounded-md border border-md-outline-variant bg-transparent px-2.5 py-1.5 text-[13px] text-md-on-surface outline-none focus:border-md-outline";

export function StatsBarBlockEditor({ block, onChange }: { block: StatsBarBlock; onChange: (block: StatsBarBlock) => void }) {
  function update(i: number, patch: Partial<{ value: string; label: string }>) {
    const next = [...block.stats];
    next[i] = { ...next[i], ...patch };
    onChange({ ...block, stats: next });
  }

  return (
    <div className="flex flex-col gap-2">
      {block.stats.map((stat, i) => (
        <div key={i} className="flex items-center gap-2">
          <input value={stat.value} onChange={(e) => update(i, { value: e.target.value })} placeholder="3 apps" className={`${inputClass} w-28`} />
          <input value={stat.label} onChange={(e) => update(i, { label: e.target.value })} placeholder="shipped" className={inputClass} />
          <button type="button" onClick={() => onChange({ ...block, stats: block.stats.filter((_, idx) => idx !== i) })} className="text-md-on-surface-variant hover:text-md-error">
            <i className="ti ti-x text-sm" />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange({ ...block, stats: [...block.stats, { value: "", label: "" }] })}
        className="w-fit rounded-md border border-md-outline-variant px-3 py-1.5 text-[13px] text-md-on-surface hover:border-md-outline"
      >
        + Добавить показатель
      </button>
    </div>
  );
}
