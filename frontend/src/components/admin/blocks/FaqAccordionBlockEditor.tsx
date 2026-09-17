"use client";

import { useState } from "react";
import type { PublicPageBlock } from "@/lib/api";

type FaqAccordionBlock = Extract<PublicPageBlock, { type: "faq_accordion" }>;

const inputClass =
  "block w-full rounded-md border border-md-outline-variant bg-transparent px-2.5 py-1.5 text-[13px] text-md-on-surface outline-none focus:border-md-outline";

export function FaqAccordionBlockEditor({ block, onChange }: { block: FaqAccordionBlock; onChange: (block: FaqAccordionBlock) => void }) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  function updateItem(i: number, patch: Partial<FaqAccordionBlock["items"][number]>) {
    const next = [...block.items];
    next[i] = { ...next[i], ...patch };
    onChange({ ...block, items: next });
  }

  return (
    <div className="flex flex-col gap-3">
      <input
        value={block.heading || ""}
        onChange={(e) => onChange({ ...block, heading: e.target.value })}
        placeholder="Заголовок секции (например, Frequently Asked Questions)"
        className={inputClass}
      />
      <textarea
        value={block.description || ""}
        onChange={(e) => onChange({ ...block, description: e.target.value })}
        placeholder="Описание (опционально)"
        rows={2}
        className={inputClass}
      />

      <div className="flex items-center gap-2">
        <span className="text-[12px] text-md-on-surface-variant">Колонок:</span>
        {[1, 2].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange({ ...block, columns: n as 1 | 2 })}
            className={`rounded-md px-2.5 py-1 text-[12px] ${(block.columns ?? 2) === n ? "bg-md-secondary-container text-md-on-secondary-container" : "text-md-on-surface-variant hover:bg-md-surface-container-high"}`}
          >
            {n}
          </button>
        ))}
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
          className="flex items-start gap-2.5 rounded-lg border border-md-outline-variant p-2.5"
        >
          <i className="ti ti-grip-vertical mt-2 shrink-0 cursor-grab text-md-on-surface-variant" />
          <div className="flex flex-1 flex-col gap-1.5">
            <input
              value={item.question}
              onChange={(e) => updateItem(i, { question: e.target.value })}
              placeholder="Вопрос"
              className={inputClass}
            />
            <textarea
              value={item.answer}
              onChange={(e) => updateItem(i, { answer: e.target.value })}
              placeholder="Ответ"
              rows={2}
              className={inputClass}
            />
          </div>
          <button
            type="button"
            onClick={() => onChange({ ...block, items: block.items.filter((_, idx) => idx !== i) })}
            className="mt-2 shrink-0 text-md-on-surface-variant hover:text-md-error"
          >
            <i className="ti ti-trash text-sm" />
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={() => onChange({ ...block, items: [...block.items, { question: "", answer: "" }] })}
        className="w-fit rounded-md border border-dashed border-md-outline-variant px-3 py-1.5 text-[13px] text-md-on-surface-variant hover:border-md-primary"
      >
        + Добавить вопрос
      </button>
    </div>
  );
}
