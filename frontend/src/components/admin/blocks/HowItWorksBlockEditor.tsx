"use client";

import { IconField } from "@/components/admin/blocks/IconField";
import type { PublicPageBlock } from "@/lib/api";

type HowItWorksBlock = Extract<PublicPageBlock, { type: "how_it_works" }>;

export function HowItWorksBlockEditor({ block, onChange }: { block: HowItWorksBlock; onChange: (block: HowItWorksBlock) => void }) {
  function update(i: number, patch: Partial<HowItWorksBlock["steps"][number]>) {
    const next = [...block.steps];
    next[i] = { ...next[i], ...patch };
    onChange({ ...block, steps: next });
  }

  return (
    <div className="flex flex-col gap-2">
      {block.steps.map((step, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-5 text-center text-[12px] text-md-on-surface-variant">{i + 1}</span>
          <IconField value={step} onChange={(icon) => update(i, icon)} />
          <input
            value={step.label}
            onChange={(e) => update(i, { label: e.target.value })}
            placeholder="Шаг"
            className="block min-w-0 flex-1 rounded-md border border-md-outline-variant bg-transparent px-2.5 py-1.5 text-[13px] text-md-on-surface outline-none focus:border-md-outline"
          />
          <button
            type="button"
            onClick={() => onChange({ ...block, steps: block.steps.filter((_, idx) => idx !== i) })}
            className="text-md-on-surface-variant hover:text-md-error"
          >
            <i className="ti ti-x text-sm" />
          </button>
        </div>
      ))}
      {block.steps.length < 5 && (
        <button
          type="button"
          onClick={() => onChange({ ...block, steps: [...block.steps, { icon: "ti-point", label: "" }] })}
          className="w-fit rounded-md border border-md-outline-variant px-3 py-1.5 text-[13px] text-md-on-surface hover:border-md-outline"
        >
          + Добавить шаг
        </button>
      )}
    </div>
  );
}
