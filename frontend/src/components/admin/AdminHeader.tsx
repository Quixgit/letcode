"use client";

import { CommandPalette } from "@/components/admin/m3/CommandPalette";

export function AdminHeader() {
  return (
    <>
      <div className="mb-6 flex justify-end">
        <button
          onClick={() => window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }))}
          className="md-motion md-body-medium flex w-64 items-center gap-2 rounded-lg border border-md-outline-variant px-3 py-2 text-md-on-surface-variant hover:border-md-outline"
        >
          <i className="ti ti-search text-base" />
          <span className="flex-1 text-left">Поиск...</span>
          <kbd className="md-label-small rounded border border-md-outline-variant px-1.5 py-0.5">⌘K</kbd>
        </button>
      </div>
      <CommandPalette />
    </>
  );
}
