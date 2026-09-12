"use client";

import type { PublicPageBlock } from "@/lib/api";

type AppMockupPanelBlock = Extract<PublicPageBlock, { type: "app_mockup_panel" }>;

const inputClass =
  "block w-full rounded-md border border-md-outline-variant bg-transparent px-2.5 py-1.5 text-[13px] text-md-on-surface outline-none focus:border-md-outline";

export function AppMockupPanelBlockEditor({ block, onChange }: { block: AppMockupPanelBlock; onChange: (block: AppMockupPanelBlock) => void }) {
  function update(i: number, patch: Partial<AppMockupPanelBlock["panels"][number]>) {
    const next = [...block.panels];
    next[i] = { ...next[i], ...patch };
    onChange({ ...block, panels: next });
  }

  return (
    <div className="flex flex-col gap-3">
      <label className="flex items-center gap-2 text-[12px] text-md-on-surface-variant">
        <input type="checkbox" checked={!!block.compact} onChange={(e) => onChange({ ...block, compact: e.target.checked })} />
        Компактный вид (маленькие карточки, до 3 в ряд)
      </label>

      {block.panels.map((panel, i) => (
        <div key={i} className="rounded-md border border-md-outline-variant p-2.5">
          <div className="mb-2 flex items-center justify-between">
            <select value={panel.mockup} onChange={(e) => update(i, { mockup: e.target.value as "list" | "chart" | "toggles" | "dashboard" })} className={`${inputClass} w-32`}>
              <option value="list">Список</option>
              <option value="chart">График</option>
              <option value="toggles">Переключатели</option>
              <option value="dashboard">Дашборд UI</option>
            </select>
            <button type="button" onClick={() => onChange({ ...block, panels: block.panels.filter((_, idx) => idx !== i) })} className="text-md-on-surface-variant hover:text-md-error">
              <i className="ti ti-trash text-sm" />
            </button>
          </div>
          <input value={panel.title} onChange={(e) => update(i, { title: e.target.value })} placeholder="Заголовок панели" className={`${inputClass} mb-2`} />
          <textarea value={panel.description} onChange={(e) => update(i, { description: e.target.value })} placeholder="Описание" rows={2} className={`${inputClass} mb-2`} />
          <label className="flex items-center gap-2 text-[12px] text-md-on-surface-variant">
            <input type="checkbox" checked={!!panel.dark} onChange={(e) => update(i, { dark: e.target.checked })} />
            Тёмная карточка
          </label>
        </div>
      ))}

      <button
        type="button"
        onClick={() => onChange({ ...block, panels: [...block.panels, { title: "", description: "", mockup: "list" }] })}
        className="w-fit rounded-md border border-md-outline-variant px-3 py-1.5 text-[13px] text-md-on-surface hover:border-md-outline"
      >
        + Добавить панель
      </button>
    </div>
  );
}
