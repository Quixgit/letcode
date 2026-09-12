"use client";

import { useQuery } from "@tanstack/react-query";
import { adminFetch } from "@/lib/admin-api";
import type { PublicPageBlock } from "@/lib/api";
import type { AppListItem } from "@/lib/admin-types";

type TestimonialsCarouselBlock = Extract<PublicPageBlock, { type: "testimonials_carousel" }>;

export function TestimonialsCarouselBlockEditor({
  block,
  onChange,
}: {
  block: TestimonialsCarouselBlock;
  onChange: (block: TestimonialsCarouselBlock) => void;
}) {
  const { data: apps } = useQuery({
    queryKey: ["apps"],
    queryFn: () => adminFetch<AppListItem[]>("api/apps"),
  });

  return (
    <label className="block text-[12px] text-md-on-surface-variant">
      Показывать отзывы для приложения (опционально)
      <select
        value={block.app_id || ""}
        onChange={(e) => onChange({ ...block, app_id: e.target.value || undefined })}
        className="mt-1.5 block w-full rounded-md border border-md-outline-variant bg-transparent px-2.5 py-1.5 text-[13px] text-md-on-surface outline-none focus:border-md-outline"
      >
        <option value="">Все отзывы</option>
        {(apps || []).map((a) => (
          <option key={a.id} value={a.id}>
            {a.name}
          </option>
        ))}
      </select>
    </label>
  );
}
