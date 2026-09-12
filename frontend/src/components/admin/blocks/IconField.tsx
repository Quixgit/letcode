"use client";

import { useState } from "react";
import { MediaPicker } from "@/components/admin/MediaPicker";
import type { BlockIcon } from "@/lib/api";

const SUGGESTED_ICONS = [
  "ti-bolt", "ti-shield-check", "ti-rocket", "ti-bell-ringing", "ti-lock", "ti-chart-bar",
  "ti-clock", "ti-cloud", "ti-devices", "ti-heart", "ti-plug", "ti-settings",
];

export function IconField({ value, onChange }: { value: BlockIcon; onChange: (v: BlockIcon) => void }) {
  const [pickerOpen, setPickerOpen] = useState(false);

  return (
    <div className="flex items-center gap-2">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-md-surface-container-high">
        {value.icon_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value.icon_url} alt="" className="h-5 w-5 object-contain" />
        ) : (
          <i className={`ti ${value.icon || "ti-sparkles"} text-base text-md-on-surface`} />
        )}
      </div>
      <select
        value={value.icon_url ? "" : value.icon || ""}
        onChange={(e) => onChange({ icon: e.target.value, icon_media_id: "", icon_url: "" })}
        className="rounded-md border border-md-outline-variant bg-transparent px-2 py-1.5 text-[12px] text-md-on-surface outline-none"
      >
        <option value="">— иконка —</option>
        {SUGGESTED_ICONS.map((ic) => (
          <option key={ic} value={ic}>
            {ic}
          </option>
        ))}
      </select>
      <button
        type="button"
        onClick={() => setPickerOpen(true)}
        className="md-label-small rounded-md border border-md-outline-variant px-2 py-1.5 text-md-on-surface-variant hover:border-md-outline"
      >
        Картинка
      </button>
      <MediaPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={(item) => {
          onChange({ icon: "", icon_media_id: item.id, icon_url: item.url });
          setPickerOpen(false);
        }}
      />
    </div>
  );
}
