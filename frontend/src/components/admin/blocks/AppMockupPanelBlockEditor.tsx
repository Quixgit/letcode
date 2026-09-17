"use client";

import { IconField } from "@/components/admin/blocks/IconField";
import type { PublicPageBlock } from "@/lib/api";

type AppMockupPanelBlock = Extract<PublicPageBlock, { type: "app_mockup_panel" }>;
type Panel = AppMockupPanelBlock["panels"][number];
type StatusItem = NonNullable<Panel["items"]>[number];

const inputClass =
  "block w-full rounded-md border border-md-outline-variant bg-transparent px-2.5 py-1.5 text-[13px] text-md-on-surface outline-none focus:border-md-outline";
// Same field, no `w-full` baked in — the mockup-type select below needs `w-32` to actually win
// over `w-full` (Tailwind resolves conflicting width utilities by stylesheet order, not className
// position), otherwise it claims the whole row and crowds out the delete button next to it.
const fieldClass =
  "rounded-md border border-md-outline-variant bg-transparent px-2.5 py-1.5 text-[13px] text-md-on-surface outline-none focus:border-md-outline";

export function AppMockupPanelBlockEditor({ block, onChange }: { block: AppMockupPanelBlock; onChange: (block: AppMockupPanelBlock) => void }) {
  function update(i: number, patch: Partial<Panel>) {
    const next = [...block.panels];
    next[i] = { ...next[i], ...patch };
    onChange({ ...block, panels: next });
  }

  function updateItem(panelIdx: number, itemIdx: number, patch: Partial<StatusItem>) {
    const items = [...(block.panels[panelIdx].items || [])];
    items[itemIdx] = { ...items[itemIdx], ...patch };
    update(panelIdx, { items });
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
            <select
              value={panel.mockup}
              onChange={(e) => update(i, { mockup: e.target.value as Panel["mockup"] })}
              className={`${fieldClass} w-32 shrink-0`}
            >
              <option value="list">Список</option>
              <option value="chart">График</option>
              <option value="toggles">Переключатели</option>
              <option value="dashboard">Дашборд UI</option>
              <option value="status_list">Статус-список (реальные пункты)</option>
            </select>
            <button type="button" onClick={() => onChange({ ...block, panels: block.panels.filter((_, idx) => idx !== i) })} className="text-md-on-surface-variant hover:text-md-error">
              <i className="ti ti-trash text-sm" />
            </button>
          </div>
          <input value={panel.title} onChange={(e) => update(i, { title: e.target.value })} placeholder="Заголовок панели" className={`${inputClass} mb-2`} />

          {panel.mockup === "status_list" ? (
            <>
              <div className="mb-2 flex items-center gap-2">
                <input
                  value={panel.status_label || ""}
                  onChange={(e) => update(i, { status_label: e.target.value || undefined })}
                  placeholder="Статус-пилюля у заголовка (напр. Healthy)"
                  className={`${fieldClass} min-w-[120px] flex-1`}
                />
                <select
                  value={panel.status_color || "success"}
                  onChange={(e) => update(i, { status_color: e.target.value as "success" | "neutral" | "warning" })}
                  className={`${fieldClass} w-28 shrink-0`}
                >
                  <option value="success">Зелёный</option>
                  <option value="neutral">Серый</option>
                  <option value="warning">Жёлтый</option>
                </select>
              </div>

              <p className="m-0 mb-1.5 text-[11px] text-md-on-surface-variant">Пункты:</p>
              {(panel.items || []).map((item, ii) => (
                <div key={ii} className="mb-1.5 flex flex-col gap-1.5 rounded-md border border-md-outline-variant p-2">
                  <div className="flex items-center gap-2">
                    <IconField value={{ icon: item.icon }} onChange={(v) => updateItem(i, ii, { icon: v.icon })} />
                    <input
                      value={item.title}
                      onChange={(e) => updateItem(i, ii, { title: e.target.value })}
                      placeholder="Название (CI/CD pipeline)"
                      className={`${fieldClass} min-w-[100px] flex-1`}
                    />
                    <button
                      type="button"
                      onClick={() => update(i, { items: (panel.items || []).filter((_, idx) => idx !== ii) })}
                      className="shrink-0 text-md-on-surface-variant hover:text-md-error"
                    >
                      <i className="ti ti-x text-[12px]" />
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      value={item.subtitle || ""}
                      onChange={(e) => updateItem(i, ii, { subtitle: e.target.value || undefined })}
                      placeholder="Подпись, моноширинным (GitHub Actions · tests + scan gates)"
                      className={`${fieldClass} min-w-[140px] flex-1`}
                    />
                    <input
                      value={item.status_text || ""}
                      onChange={(e) => updateItem(i, ii, { status_text: e.target.value || undefined })}
                      placeholder="Статус справа (14 deploys)"
                      className={`${fieldClass} w-36 shrink-0`}
                    />
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={() => update(i, { items: [...(panel.items || []), { title: "" }] })}
                className="mb-2 w-fit text-[11px] text-md-on-surface-variant hover:text-md-primary"
              >
                + Добавить пункт
              </button>

              <input
                value={panel.footer_text || ""}
                onChange={(e) => update(i, { footer_text: e.target.value || undefined })}
                placeholder="Итоговая строка под чертой (опционально)"
                className={`${inputClass} mb-2`}
              />
            </>
          ) : (
            <textarea value={panel.description} onChange={(e) => update(i, { description: e.target.value })} placeholder="Описание" rows={2} className={`${inputClass} mb-2`} />
          )}

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
