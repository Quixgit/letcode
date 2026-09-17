"use client";

import { useState } from "react";
import { MediaPicker } from "@/components/admin/MediaPicker";
import { Button } from "@/components/admin/m3/Button";
import type {
  NavMenuContent,
  NavMenuItem,
  NavMenuTab,
  NavSidePanel,
  NavSidePanelItem,
} from "@/lib/nav-menu-types";
import { emptyMenuContent } from "@/lib/nav-menu-types";

const inputClass =
  "block w-full rounded-lg border border-md-outline-variant bg-md-surface px-2.5 py-1.5 text-[13px] text-md-on-surface outline-none focus:border-md-primary";
const labelClass = "mb-1 block text-[11px] font-medium uppercase tracking-wide text-md-on-surface-variant";

function IconPicker({
  iconUrl,
  onChange,
}: {
  iconUrl: string | null | undefined;
  onChange: (mediaId: string | null, url: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex shrink-0 items-center gap-1">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-9 w-9 items-center justify-center rounded-md border border-dashed border-md-outline-variant bg-md-surface-container-high hover:border-md-primary"
        title="Иконка"
      >
        {iconUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={iconUrl} alt="" className="h-5 w-5 object-contain" />
        ) : (
          <i className="ti ti-photo text-sm text-md-on-surface-variant" />
        )}
      </button>
      {iconUrl && (
        <button
          type="button"
          onClick={() => onChange(null, null)}
          className="text-md-on-surface-variant hover:text-md-error"
          title="Убрать иконку"
        >
          <i className="ti ti-x text-xs" />
        </button>
      )}
      <MediaPicker
        open={open}
        onClose={() => setOpen(false)}
        onSelect={(item) => {
          onChange(item.id, item.url);
          setOpen(false);
        }}
      />
    </div>
  );
}

function TabItemRow({
  item,
  onChange,
  onDelete,
  onDragStart,
  onDragOver,
  onDrop,
}: {
  item: NavMenuItem;
  onChange: (item: NavMenuItem) => void;
  onDelete: () => void;
  onDragStart: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: () => void;
}) {
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      className="flex items-start gap-2 rounded-lg border border-md-outline-variant p-2"
    >
      <i className="ti ti-grip-vertical mt-2 shrink-0 cursor-grab text-md-on-surface-variant" />
      <IconPicker
        iconUrl={item.icon_url}
        onChange={(mediaId, url) => onChange({ ...item, icon_media_id: mediaId, icon_url: url })}
      />
      <div className="flex flex-1 flex-col gap-1.5">
        <div className="flex gap-1.5">
          <input
            value={item.title}
            onChange={(e) => onChange({ ...item, title: e.target.value })}
            placeholder="Заголовок"
            className={inputClass}
          />
          <input
            value={item.icon || ""}
            onChange={(e) => onChange({ ...item, icon: e.target.value })}
            placeholder="ti-rocket"
            title="Класс иконки (tabler), например ti-rocket — используется вместо картинки, если задан"
            className={`${inputClass} w-28 shrink-0`}
          />
        </div>
        <input
          value={item.description || ""}
          onChange={(e) => onChange({ ...item, description: e.target.value })}
          placeholder="Описание (опционально)"
          className={inputClass}
        />
        <input
          value={item.url}
          onChange={(e) => onChange({ ...item, url: e.target.value })}
          placeholder="/url"
          className={inputClass}
        />
      </div>
      <button onClick={onDelete} className="mt-2 shrink-0 text-md-on-surface-variant hover:text-md-error">
        <i className="ti ti-trash text-sm" />
      </button>
    </div>
  );
}

function SidePanelItemRow({
  item,
  showIcon,
  onChange,
  onDelete,
  onDragStart,
  onDragOver,
  onDrop,
}: {
  item: NavSidePanelItem;
  showIcon: boolean;
  onChange: (item: NavSidePanelItem) => void;
  onDelete: () => void;
  onDragStart: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: () => void;
}) {
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      className="flex items-center gap-2 rounded-lg border border-md-outline-variant p-2"
    >
      <i className="ti ti-grip-vertical shrink-0 cursor-grab text-md-on-surface-variant" />
      {showIcon && (
        <IconPicker
          iconUrl={item.icon_url}
          onChange={(mediaId, url) => onChange({ ...item, icon_media_id: mediaId, icon_url: url })}
        />
      )}
      <input
        value={item.label}
        onChange={(e) => onChange({ ...item, label: e.target.value })}
        placeholder="Название"
        className={inputClass}
      />
      <input
        value={item.url}
        onChange={(e) => onChange({ ...item, url: e.target.value })}
        placeholder="/url"
        className={inputClass}
      />
      <button onClick={onDelete} className="shrink-0 text-md-on-surface-variant hover:text-md-error">
        <i className="ti ti-trash text-sm" />
      </button>
    </div>
  );
}

function PreviewPanel({ content }: { content: NavMenuContent }) {
  const [activeTab, setActiveTab] = useState(0);
  const tabs = content.tabs.length ? content.tabs : [{ label: "", columns: 2, items: [] }];
  const tab = tabs[Math.min(activeTab, tabs.length - 1)] || tabs[0];
  const showTabs = tabs.length > 1;

  return (
    <div className="rounded-xl border border-md-outline-variant bg-white p-4" style={{ fontFamily: "system-ui, sans-serif" }}>
      <div className="mb-3 flex items-center gap-2">
        <i className="ti ti-eye text-sm text-md-on-surface-variant" />
        <span className="text-[11px] font-medium uppercase tracking-wide text-md-on-surface-variant">Превью</span>
      </div>
      <div className="flex gap-6">
        <div className="flex-1">
          {showTabs && (
            <div className="mb-4 flex gap-4 border-b" style={{ borderColor: "#EAE8E1" }}>
              {tabs.map((t, i) => (
                <button
                  key={i}
                  onClick={() => setActiveTab(i)}
                  className="pb-2 text-[13px] font-medium"
                  style={{
                    color: i === activeTab ? "#17181C" : "#8A8C93",
                    borderBottom: i === activeTab ? "2px solid #17181C" : "2px solid transparent",
                    marginBottom: -1,
                  }}
                >
                  {t.label || "Без названия"}
                </button>
              ))}
            </div>
          )}
          <div
            className="grid gap-3"
            style={{ gridTemplateColumns: `repeat(${tab.columns === 1 ? 1 : 2}, 1fr)` }}
          >
            {tab.items.length === 0 && (
              <p className="text-[12px] text-md-on-surface-variant">Пунктов пока нет.</p>
            )}
            {tab.items.map((item, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <div
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md"
                  style={{ background: "#F7F6F2" }}
                >
                  {item.icon_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.icon_url} alt="" className="h-4 w-4 object-contain" />
                  ) : (
                    <i className="ti ti-sparkles text-sm" style={{ color: "#17181C" }} />
                  )}
                </div>
                <div>
                  <p className="m-0 text-[13px] font-medium" style={{ color: "#17181C" }}>
                    {item.title || "Заголовок"}
                  </p>
                  {item.description && (
                    <p className="m-0 text-[11px]" style={{ color: "#8A8C93" }}>
                      {item.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
        {content.side_panel && (
          <div className="w-40 shrink-0 border-l pl-4" style={{ borderColor: "#EAE8E1" }}>
            <p className="m-0 mb-2 text-[11px] font-medium uppercase tracking-wide" style={{ color: "#8A8C93" }}>
              {content.side_panel.title || "Side panel"}
            </p>
            {content.side_panel.text && (
              <p className="m-0 mb-2 text-[11.5px] leading-snug" style={{ color: "#8A8C93" }}>
                {content.side_panel.text}
              </p>
            )}
            <div className="flex flex-col gap-1.5">
              {content.side_panel.items.map((item, i) => (
                <div key={i} className="flex items-center gap-1.5 text-[12px]" style={{ color: "#17181C" }}>
                  {content.side_panel!.style === "icon_links" &&
                    (item.icon_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.icon_url} alt="" className="h-3.5 w-3.5 object-contain" />
                    ) : (
                      <i className="ti ti-link text-xs" />
                    ))}
                  <span>{item.label || "Ссылка"}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface MegaMenuEditorProps {
  menuType: "dropdown" | "mega_menu";
  initial: NavMenuContent | null;
  onClose: () => void;
  onSave: (content: NavMenuContent) => void;
}

/** Mount this only while the editor should be open — its state is derived once from `initial` at mount. */
export function MegaMenuEditor({ menuType, initial, onClose, onSave }: MegaMenuEditorProps) {
  const [content, setContent] = useState<NavMenuContent>(initial ?? emptyMenuContent());
  const [activeTab, setActiveTab] = useState(0);
  const [dragTabItemIndex, setDragTabItemIndex] = useState<number | null>(null);
  const [dragSideItemIndex, setDragSideItemIndex] = useState<number | null>(null);

  const tabs = content.tabs;
  const tab = tabs[Math.min(activeTab, tabs.length - 1)] || tabs[0];

  function updateTab(index: number, next: NavMenuTab) {
    const nextTabs = [...content.tabs];
    nextTabs[index] = next;
    setContent({ ...content, tabs: nextTabs });
  }

  function addTab() {
    setContent({ ...content, tabs: [...content.tabs, { label: "", columns: 2, items: [] }] });
    setActiveTab(content.tabs.length);
  }

  function removeTab(index: number) {
    const nextTabs = content.tabs.filter((_, i) => i !== index);
    setContent({ ...content, tabs: nextTabs.length ? nextTabs : [{ label: "", columns: 2, items: [] }] });
    setActiveTab(0);
  }

  function moveTab(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= content.tabs.length) return;
    const nextTabs = [...content.tabs];
    [nextTabs[index], nextTabs[target]] = [nextTabs[target], nextTabs[index]];
    setContent({ ...content, tabs: nextTabs });
    setActiveTab(target);
  }

  function addItem() {
    updateTab(activeTab, { ...tab, items: [...tab.items, { title: "", description: "", url: "" }] });
  }

  function toggleSidePanel(enabled: boolean) {
    setContent({
      ...content,
      side_panel: enabled ? { title: "", style: "text_links", items: [] } : null,
    });
  }

  function updateSidePanel(next: Partial<NavSidePanel>) {
    if (!content.side_panel) return;
    setContent({ ...content, side_panel: { ...content.side_panel, ...next } });
  }

  function addSideItem() {
    if (!content.side_panel) return;
    updateSidePanel({ items: [...content.side_panel.items, { label: "", url: "" }] });
  }

  return (
    <div className="md-dialog-scrim fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="flex max-h-[88vh] w-[1000px] max-w-full flex-col rounded-xl bg-md-surface-container-high"
        style={{ boxShadow: "var(--md-elevation-3)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-md-outline-variant px-5 py-3.5">
          <p className="md-title-medium m-0 text-md-on-surface">
            {menuType === "mega_menu" ? "Мега-меню" : "Выпадающий список"}
          </p>
          <button onClick={onClose} className="text-md-on-surface-variant hover:text-md-on-surface">
            <i className="ti ti-x text-lg" />
          </button>
        </div>

        <div className="flex flex-1 gap-5 overflow-y-auto p-5">
          <div className="flex w-[440px] shrink-0 flex-col gap-4">
            {menuType === "mega_menu" && (
              <div>
                <p className={labelClass}>Вкладки</p>
                <div className="flex flex-wrap items-center gap-1.5">
                  {tabs.map((t, i) => (
                    <div
                      key={i}
                      className={`flex items-center gap-1 rounded-full border px-2 py-1 text-[12px] ${
                        i === activeTab ? "border-md-primary bg-md-primary-container" : "border-md-outline-variant"
                      }`}
                    >
                      <button onClick={() => setActiveTab(i)} className="text-md-on-surface">
                        {t.label || `Вкладка ${i + 1}`}
                      </button>
                      <button onClick={() => moveTab(i, -1)} className="text-md-on-surface-variant hover:text-md-on-surface">
                        <i className="ti ti-chevron-left text-xs" />
                      </button>
                      <button onClick={() => moveTab(i, 1)} className="text-md-on-surface-variant hover:text-md-on-surface">
                        <i className="ti ti-chevron-right text-xs" />
                      </button>
                      {tabs.length > 1 && (
                        <button onClick={() => removeTab(i)} className="text-md-on-surface-variant hover:text-md-error">
                          <i className="ti ti-x text-xs" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={addTab}
                    className="rounded-full border border-dashed border-md-outline-variant px-2.5 py-1 text-[12px] text-md-on-surface-variant hover:border-md-primary"
                  >
                    + Add tab
                  </button>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-2">
              {menuType === "mega_menu" && (
                <input
                  value={tab.label}
                  onChange={(e) => updateTab(activeTab, { ...tab, label: e.target.value })}
                  placeholder="Название вкладки"
                  className={inputClass}
                />
              )}
              <div className="flex items-center gap-2">
                <label className="text-[12px] text-md-on-surface-variant">Колонки:</label>
                <select
                  value={tab.columns || 2}
                  onChange={(e) => updateTab(activeTab, { ...tab, columns: Number(e.target.value) as 1 | 2 })}
                  className="rounded-md border border-md-outline-variant bg-transparent px-2 py-1 text-[12px] text-md-on-surface outline-none"
                >
                  <option value={1}>1</option>
                  <option value={2}>2</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              {tab.items.map((item, i) => (
                <TabItemRow
                  key={i}
                  item={item}
                  onChange={(next) => {
                    const nextItems = [...tab.items];
                    nextItems[i] = next;
                    updateTab(activeTab, { ...tab, items: nextItems });
                  }}
                  onDelete={() => updateTab(activeTab, { ...tab, items: tab.items.filter((_, j) => j !== i) })}
                  onDragStart={() => setDragTabItemIndex(i)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => {
                    if (dragTabItemIndex === null || dragTabItemIndex === i) return;
                    const nextItems = [...tab.items];
                    const [moved] = nextItems.splice(dragTabItemIndex, 1);
                    nextItems.splice(i, 0, moved);
                    setDragTabItemIndex(null);
                    updateTab(activeTab, { ...tab, items: nextItems });
                  }}
                />
              ))}
              <button
                onClick={addItem}
                className="w-fit rounded-lg border border-dashed border-md-outline-variant px-3 py-1.5 text-[12px] text-md-on-surface-variant hover:border-md-primary"
              >
                + Добавить пункт
              </button>
            </div>

            <div className="mt-2 border-t border-md-outline-variant pt-4">
              <label className="mb-2 flex items-center gap-2 text-[13px] text-md-on-surface">
                <input
                  type="checkbox"
                  checked={!!content.side_panel}
                  onChange={(e) => toggleSidePanel(e.target.checked)}
                />
                Add side panel
              </label>
              {content.side_panel && (
                <div className="flex flex-col gap-2 rounded-lg bg-md-surface-container-low p-3">
                  <input
                    value={content.side_panel.title}
                    onChange={(e) => updateSidePanel({ title: e.target.value })}
                    placeholder="Заголовок колонки"
                    className={inputClass}
                  />
                  <textarea
                    value={content.side_panel.text || ""}
                    onChange={(e) => updateSidePanel({ text: e.target.value })}
                    placeholder="Короткий поясняющий текст (опционально)"
                    rows={2}
                    className={inputClass}
                  />
                  <div className="flex items-center gap-3 text-[12px] text-md-on-surface-variant">
                    <label className="flex items-center gap-1.5">
                      <input
                        type="radio"
                        name="side-panel-style"
                        checked={content.side_panel.style === "text_links"}
                        onChange={() => updateSidePanel({ style: "text_links" })}
                      />
                      Текстовые ссылки
                    </label>
                    <label className="flex items-center gap-1.5">
                      <input
                        type="radio"
                        name="side-panel-style"
                        checked={content.side_panel.style === "icon_links"}
                        onChange={() => updateSidePanel({ style: "icon_links" })}
                      />
                      Со значками
                    </label>
                  </div>
                  {content.side_panel.items.map((item, i) => (
                    <SidePanelItemRow
                      key={i}
                      item={item}
                      showIcon={content.side_panel!.style === "icon_links"}
                      onChange={(next) => {
                        const nextItems = [...content.side_panel!.items];
                        nextItems[i] = next;
                        updateSidePanel({ items: nextItems });
                      }}
                      onDelete={() => updateSidePanel({ items: content.side_panel!.items.filter((_, j) => j !== i) })}
                      onDragStart={() => setDragSideItemIndex(i)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => {
                        if (dragSideItemIndex === null || dragSideItemIndex === i) return;
                        const nextItems = [...content.side_panel!.items];
                        const [moved] = nextItems.splice(dragSideItemIndex, 1);
                        nextItems.splice(i, 0, moved);
                        setDragSideItemIndex(null);
                        updateSidePanel({ items: nextItems });
                      }}
                    />
                  ))}
                  <button
                    onClick={addSideItem}
                    className="w-fit rounded-lg border border-dashed border-md-outline-variant px-3 py-1.5 text-[12px] text-md-on-surface-variant hover:border-md-primary"
                  >
                    + Добавить ссылку
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <PreviewPanel content={content} />
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-md-outline-variant px-5 py-3.5">
          <button onClick={onClose} className="px-3 py-1.5 text-[13px] text-md-on-surface-variant">
            Отмена
          </button>
          <Button
            onClick={() => {
              const cleanedTabs = content.tabs.map((t) => ({ ...t, columns: t.columns || 2 }));
              onSave({ ...content, tabs: cleanedTabs });
            }}
            className="px-4 py-1.5"
          >
            Сохранить
          </Button>
        </div>
      </div>
    </div>
  );
}
