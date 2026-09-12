"use client";

import { useState } from "react";
import { MediaPicker } from "@/components/admin/MediaPicker";
import { Card } from "@/components/admin/m3/Card";
import { Button } from "@/components/admin/m3/Button";
import { SegmentedButton } from "@/components/admin/m3/SegmentedButton";
import type { FeatureSection } from "@/lib/admin-types";

const inputClass =
  "block w-full rounded-md border border-md-outline-variant bg-transparent px-2.5 py-1.5 text-sm text-md-on-surface outline-none focus:border-md-outline";

function emptySection(): FeatureSection {
  return { title: "", description: "", image_media_id: "", image_url: "", layout: "image_right" };
}

interface FeatureSectionsEditorProps {
  value: FeatureSection[];
  onChange: (sections: FeatureSection[]) => void;
}

export function FeatureSectionsEditor({ value, onChange }: FeatureSectionsEditorProps) {
  const [pickerIndex, setPickerIndex] = useState<number | null>(null);

  function update(i: number, patch: Partial<FeatureSection>) {
    const next = [...value];
    next[i] = { ...next[i], ...patch };
    onChange(next);
  }

  function move(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= value.length) return;
    const next = [...value];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  }

  return (
    <div className="flex flex-col gap-3">
      {value.map((section, i) => (
        <Card key={i} elevation={0} className="p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="md-label-medium uppercase text-md-on-surface-variant">Секция {i + 1}</span>
            <div className="flex items-center gap-1">
              <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="text-md-on-surface-variant hover:text-md-on-surface disabled:opacity-30">
                <i className="ti ti-arrow-up text-sm" />
              </button>
              <button type="button" onClick={() => move(i, 1)} disabled={i === value.length - 1} className="text-md-on-surface-variant hover:text-md-on-surface disabled:opacity-30">
                <i className="ti ti-arrow-down text-sm" />
              </button>
              <button type="button" onClick={() => onChange(value.filter((_, idx) => idx !== i))} className="ml-1 text-md-on-surface-variant hover:text-md-error">
                <i className="ti ti-trash text-sm" />
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <input
              value={section.title}
              onChange={(e) => update(i, { title: e.target.value })}
              placeholder="Заголовок"
              className={inputClass}
            />
            <textarea
              value={section.description}
              onChange={(e) => update(i, { description: e.target.value })}
              placeholder="Описание"
              rows={3}
              className={inputClass}
            />
            <div className="flex items-center gap-3">
              {section.image_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={section.image_url} alt="" className="h-12 w-20 rounded-md object-cover" />
              )}
              <Button variant="outlined" onClick={() => setPickerIndex(i)} className="px-3 py-1.5">
                Выбрать картинку
              </Button>
              <SegmentedButton
                segments={[
                  { value: "image_left", label: "Картинка слева" },
                  { value: "image_right", label: "Картинка справа" },
                ]}
                value={section.layout}
                onChange={(layout) => update(i, { layout })}
              />
            </div>
          </div>
        </Card>
      ))}

      <Button variant="outlined" onClick={() => onChange([...value, emptySection()])} className="w-fit">
        + Добавить секцию
      </Button>

      <MediaPicker
        open={pickerIndex !== null}
        onClose={() => setPickerIndex(null)}
        onSelect={(item) => {
          if (pickerIndex !== null) update(pickerIndex, { image_media_id: item.id, image_url: item.url });
          setPickerIndex(null);
        }}
      />
    </div>
  );
}
