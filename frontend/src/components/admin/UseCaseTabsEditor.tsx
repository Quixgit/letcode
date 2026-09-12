"use client";

import { useState } from "react";
import { MediaPicker } from "@/components/admin/MediaPicker";
import { Card } from "@/components/admin/m3/Card";
import { Button } from "@/components/admin/m3/Button";
import type { UseCaseTab } from "@/lib/admin-types";

const inputClass =
  "block w-full rounded-md border border-md-outline-variant bg-transparent px-2.5 py-1.5 text-sm text-md-on-surface outline-none focus:border-md-outline";

function emptyTab(): UseCaseTab {
  return { label: "", icon_media_id: "", icon_url: "", title: "", description: "", screenshot_media_id: "", screenshot_url: "" };
}

type PickerTarget = { index: number; field: "icon" | "screenshot" };

interface UseCaseTabsEditorProps {
  value: UseCaseTab[];
  onChange: (tabs: UseCaseTab[]) => void;
}

export function UseCaseTabsEditor({ value, onChange }: UseCaseTabsEditorProps) {
  const [picker, setPicker] = useState<PickerTarget | null>(null);

  function update(i: number, patch: Partial<UseCaseTab>) {
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
      {value.map((tab, i) => (
        <Card key={i} elevation={0} className="p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="md-label-medium uppercase text-md-on-surface-variant">Вкладка {i + 1}</span>
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
            <div className="flex items-center gap-3">
              {tab.icon_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={tab.icon_url} alt="" className="h-8 w-8 rounded-md object-cover" />
              )}
              <Button variant="outlined" onClick={() => setPicker({ index: i, field: "icon" })} className="px-3 py-1.5">
                Иконка вкладки
              </Button>
              <input
                value={tab.label}
                onChange={(e) => update(i, { label: e.target.value })}
                placeholder="Подпись (SFTP, FTP, Google Drive...)"
                className={`${inputClass} flex-1`}
              />
            </div>
            <input
              value={tab.title}
              onChange={(e) => update(i, { title: e.target.value })}
              placeholder="Заголовок сценария"
              className={inputClass}
            />
            <textarea
              value={tab.description}
              onChange={(e) => update(i, { description: e.target.value })}
              placeholder="Описание сценария"
              rows={3}
              className={inputClass}
            />
            <div className="flex items-center gap-3">
              {tab.screenshot_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={tab.screenshot_url} alt="" className="h-12 w-20 rounded-md object-cover" />
              )}
              <Button variant="outlined" onClick={() => setPicker({ index: i, field: "screenshot" })} className="px-3 py-1.5">
                Скриншот
              </Button>
            </div>
          </div>
        </Card>
      ))}

      <Button variant="outlined" onClick={() => onChange([...value, emptyTab()])} className="w-fit">
        + Добавить вкладку
      </Button>

      <MediaPicker
        open={picker !== null}
        onClose={() => setPicker(null)}
        onSelect={(item) => {
          if (picker) {
            if (picker.field === "icon") update(picker.index, { icon_media_id: item.id, icon_url: item.url });
            else update(picker.index, { screenshot_media_id: item.id, screenshot_url: item.url });
          }
          setPicker(null);
        }}
      />
    </div>
  );
}
