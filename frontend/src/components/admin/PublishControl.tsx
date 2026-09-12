"use client";

import { useState } from "react";
import { Button } from "@/components/admin/m3/Button";
import { Chip } from "@/components/admin/m3/Chip";

interface PublishControlProps {
  status: string;
  scheduledPublishAt: string | null;
  onPublishNow: () => void;
  onUnpublish: () => void;
  onSchedule: (isoString: string) => void;
  onCancelSchedule: () => void;
  publishing: boolean;
  unpublishing: boolean;
  scheduling: boolean;
}

export function PublishControl({
  status,
  scheduledPublishAt,
  onPublishNow,
  onUnpublish,
  onSchedule,
  onCancelSchedule,
  publishing,
  unpublishing,
  scheduling,
}: PublishControlProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [datetime, setDatetime] = useState("");

  if (status === "published") {
    return (
      <Button variant="outlined" onClick={onUnpublish} disabled={unpublishing}>
        Снять с публикации
      </Button>
    );
  }

  if (scheduledPublishAt) {
    return (
      <div className="flex items-center gap-2">
        <Chip tone="warning" icon="ti-clock">
          {new Date(scheduledPublishAt).toLocaleString("ru-RU")}
        </Chip>
        <Button variant="text" onClick={onCancelSchedule}>
          Отменить
        </Button>
      </div>
    );
  }

  return (
    <div className="relative flex items-center gap-2">
      <Button variant="filled" onClick={onPublishNow} disabled={publishing}>
        Опубликовать сейчас
      </Button>
      <Button variant="outlined" onClick={() => setPickerOpen((v) => !v)}>
        Запланировать...
      </Button>

      {pickerOpen && (
        <div
          className="absolute right-0 top-11 z-10 flex items-center gap-2 rounded-lg border border-md-outline-variant bg-md-surface-container-high p-2"
          style={{ boxShadow: "var(--md-elevation-2)" }}
        >
          <input
            type="datetime-local"
            value={datetime}
            onChange={(e) => setDatetime(e.target.value)}
            className="rounded-md border border-md-outline-variant bg-transparent px-2 py-1 text-[13px] text-md-on-surface outline-none [&::-webkit-clear-button]:hidden [&::-webkit-inner-spin-button]:hidden"
          />
          <Button
            variant="filled"
            onClick={() => {
              if (!datetime) return;
              onSchedule(new Date(datetime).toISOString());
              setPickerOpen(false);
            }}
            disabled={scheduling || !datetime}
            className="px-3 py-1.5"
          >
            OK
          </Button>
        </div>
      )}
    </div>
  );
}
