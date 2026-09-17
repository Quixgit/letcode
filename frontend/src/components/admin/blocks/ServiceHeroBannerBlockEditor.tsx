"use client";

import type { PublicPageBlock } from "@/lib/api";

type ServiceHeroBannerBlock = Extract<PublicPageBlock, { type: "service_hero_banner" }>;

const inputClass =
  "block w-full rounded-md border border-md-outline-variant bg-transparent px-2.5 py-1.5 text-[13px] text-md-on-surface outline-none focus:border-md-outline";
const fieldClass =
  "rounded-md border border-md-outline-variant bg-transparent px-2.5 py-1.5 text-[13px] text-md-on-surface outline-none focus:border-md-outline";

export function ServiceHeroBannerBlockEditor({
  block,
  onChange,
}: {
  block: ServiceHeroBannerBlock;
  onChange: (block: ServiceHeroBannerBlock) => void;
}) {
  const pills = block.tech_pills || [];

  return (
    <div className="flex flex-col gap-3">
      <input
        value={block.eyebrow || ""}
        onChange={(e) => onChange({ ...block, eyebrow: e.target.value })}
        placeholder="Надстрочный текст (напр. DevOps Consulting • Managed Operations)"
        className={inputClass}
      />
      <div className="grid grid-cols-2 gap-2">
        <input
          value={block.heading_line1}
          onChange={(e) => onChange({ ...block, heading_line1: e.target.value })}
          placeholder="Заголовок, строка 1"
          className={inputClass}
        />
        <input
          value={block.heading_line2_accent}
          onChange={(e) => onChange({ ...block, heading_line2_accent: e.target.value })}
          placeholder="Заголовок, строка 2 (акцентным цветом)"
          className={inputClass}
        />
      </div>
      <textarea
        value={block.subtext || ""}
        onChange={(e) => onChange({ ...block, subtext: e.target.value })}
        placeholder="Подзаголовок (опционально)"
        rows={2}
        className={inputClass}
      />

      <div className="flex items-center gap-2">
        <input
          value={block.cta?.label || ""}
          onChange={(e) => onChange({ ...block, cta: { label: e.target.value, url: block.cta?.url || "" } })}
          placeholder="Текст кнопки"
          className={`${fieldClass} min-w-[120px] flex-1`}
        />
        <input
          value={block.cta?.url || ""}
          onChange={(e) => onChange({ ...block, cta: { label: block.cta?.label || "", url: e.target.value } })}
          placeholder="/contact"
          className={`${fieldClass} min-w-[120px] flex-1`}
        />
        {block.cta && (
          <button type="button" onClick={() => onChange({ ...block, cta: undefined })} className="shrink-0 text-md-on-surface-variant hover:text-md-error">
            <i className="ti ti-x text-sm" />
          </button>
        )}
      </div>

      <div>
        <p className="mb-1.5 text-[12px] text-md-on-surface-variant">Технологии-капсулы (CI/CD, Terraform, Kubernetes...):</p>
        <div className="flex flex-wrap gap-1.5">
          {pills.map((pill, i) => (
            <span key={i} className="flex items-center gap-1 rounded-full border border-md-outline-variant px-2.5 py-1 text-[12px] text-md-on-surface">
              <input
                value={pill}
                onChange={(e) => onChange({ ...block, tech_pills: pills.map((p, idx) => (idx === i ? e.target.value : p)) })}
                className="w-20 bg-transparent outline-none"
              />
              <button type="button" onClick={() => onChange({ ...block, tech_pills: pills.filter((_, idx) => idx !== i) })} className="text-md-on-surface-variant hover:text-md-error">
                <i className="ti ti-x text-[11px]" />
              </button>
            </span>
          ))}
          <button
            type="button"
            onClick={() => onChange({ ...block, tech_pills: [...pills, ""] })}
            className="rounded-full border border-dashed border-md-outline-variant px-2.5 py-1 text-[12px] text-md-on-surface-variant hover:border-md-primary"
          >
            + Капсула
          </button>
        </div>
      </div>
    </div>
  );
}
