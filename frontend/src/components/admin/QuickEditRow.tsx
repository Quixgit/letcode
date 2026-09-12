"use client";

import { useState } from "react";
import { Button } from "@/components/admin/m3/Button";
import type { ContentStatus } from "@/lib/admin-types";

const inputClass =
  "block w-full rounded-lg border border-md-outline-variant bg-md-surface px-2.5 py-1.5 text-[13px] text-md-on-surface outline-none focus:border-md-primary";

export const STATUS_OPTIONS: { value: ContentStatus; label: string }[] = [
  { value: "draft", label: "Черновик" },
  { value: "published", label: "Опубликовано" },
  { value: "archived", label: "Архив" },
];

interface QuickEditRowProps {
  titleLabel?: string;
  title: string;
  slug: string;
  status: ContentStatus;
  saving?: boolean;
  onSave: (patch: { title: string; slug: string; status: ContentStatus }) => void;
  onCancel: () => void;
}

export function QuickEditRow({
  titleLabel = "Заголовок",
  title,
  slug,
  status,
  saving,
  onSave,
  onCancel,
}: QuickEditRowProps) {
  const [titleValue, setTitleValue] = useState(title);
  const [slugValue, setSlugValue] = useState(slug);
  const [statusValue, setStatusValue] = useState<ContentStatus>(status);

  return (
    <div className="flex flex-col gap-2 border-b border-md-outline-variant bg-md-surface-container-low px-4 py-3 last:border-0">
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <label className="mb-1 block text-[11px] text-md-on-surface-variant">{titleLabel}</label>
          <input value={titleValue} onChange={(e) => setTitleValue(e.target.value)} className={inputClass} autoFocus />
        </div>
        <div className="flex-1">
          <label className="mb-1 block text-[11px] text-md-on-surface-variant">Slug</label>
          <input value={slugValue} onChange={(e) => setSlugValue(e.target.value)} className={inputClass} />
        </div>
        <div className="w-44 shrink-0">
          <label className="mb-1 block text-[11px] text-md-on-surface-variant">Статус</label>
          <select
            value={statusValue}
            onChange={(e) => setStatusValue(e.target.value as ContentStatus)}
            className={inputClass}
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Button
          onClick={() => onSave({ title: titleValue, slug: slugValue, status: statusValue })}
          disabled={saving}
          className="px-3 py-1.5"
        >
          {saving ? "Сохранение..." : "Сохранить"}
        </Button>
        <button type="button" onClick={onCancel} className="text-[12px] text-md-on-surface-variant hover:text-md-on-surface">
          Отмена
        </button>
      </div>
    </div>
  );
}
