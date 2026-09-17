"use client";

import { useState } from "react";
import { MediaPicker } from "@/components/admin/MediaPicker";
import { PLATFORM_ICON_PRESETS, PlatformIcon } from "@/lib/platform-icons";
import type { PublicPageBlock } from "@/lib/api";

type HeroBlock = Extract<PublicPageBlock, { type: "hero_split_diagram" }>;
type PlatformBadge = NonNullable<HeroBlock["platform_badges"]>[number];
type Stat = NonNullable<HeroBlock["stats"]>[number];
type DiagramGroup = NonNullable<HeroBlock["diagram"]>["groups"][number];
type DiagramItem = DiagramGroup["items"][number];
type Callout = NonNullable<HeroBlock["callouts"]>[number];

const inputClass =
  "block w-full rounded-md border border-md-outline-variant bg-transparent px-2.5 py-1.5 text-[13px] text-md-on-surface outline-none focus:border-md-outline";
// Same field, no `w-full` baked in — needed for a field sitting next to a sibling in a flex row.
// `inputClass` + an added width utility (e.g. `w-32`) is unreliable: Tailwind resolves conflicting
// width utilities by their order in the generated stylesheet, not by class-string position, so
// `w-full` can silently win and blow the field out, crushing its flex-1 sibling to near-zero.
const fieldClass =
  "rounded-md border border-md-outline-variant bg-transparent px-2.5 py-1.5 text-[13px] text-md-on-surface outline-none focus:border-md-outline";
const sectionClass = "flex flex-col gap-2 rounded-lg border border-md-outline-variant p-3";
const labelClass = "text-[11px] font-medium uppercase tracking-wide text-md-on-surface-variant";

function DragList<T>({
  items,
  onChange,
  renderItem,
}: {
  items: T[];
  onChange: (items: T[]) => void;
  renderItem: (item: T, i: number, update: (patch: Partial<T>) => void, remove: () => void, dragHandleProps: object) => React.ReactNode;
}) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  return (
    <div className="flex flex-col gap-2">
      {items.map((item, i) => {
        const update = (patch: Partial<T>) => {
          const next = [...items];
          next[i] = { ...next[i], ...patch };
          onChange(next);
        };
        const remove = () => onChange(items.filter((_, idx) => idx !== i));
        const dragHandleProps = {
          draggable: true,
          onDragStart: () => setDragIndex(i),
          onDragOver: (e: React.DragEvent) => e.preventDefault(),
          onDrop: () => {
            if (dragIndex === null || dragIndex === i) return;
            const next = [...items];
            const [moved] = next.splice(dragIndex, 1);
            next.splice(i, 0, moved);
            setDragIndex(null);
            onChange(next);
          },
        };
        return <div key={i}>{renderItem(item, i, update, remove, dragHandleProps)}</div>;
      })}
    </div>
  );
}

export function HeroSplitDiagramBlockEditor({ block, onChange }: { block: HeroBlock; onChange: (block: HeroBlock) => void }) {
  const [pickerFor, setPickerFor] = useState<{ kind: "badge" | "callout"; index: number } | null>(null);

  const diagram = block.diagram ?? { window_title: "", tag_label: "", groups: [], caption: "" };
  function updateDiagram(patch: Partial<NonNullable<HeroBlock["diagram"]>>) {
    onChange({ ...block, diagram: { ...diagram, ...patch } });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className={sectionClass}>
        <p className={labelClass}>Текст</p>
        <input value={block.eyebrow || ""} onChange={(e) => onChange({ ...block, eyebrow: e.target.value })} placeholder="Eyebrow (например, Cloud • DevOps • SRE)" className={inputClass} />
        <input value={block.heading_line1 || ""} onChange={(e) => onChange({ ...block, heading_line1: e.target.value })} placeholder="Заголовок, строка 1" className={inputClass} />
        <input
          value={block.heading_line2_accent || ""}
          onChange={(e) => onChange({ ...block, heading_line2_accent: e.target.value })}
          placeholder="Заголовок, строка 2 (акцентный цвет)"
          className={inputClass}
        />
        <textarea value={block.subtext || ""} onChange={(e) => onChange({ ...block, subtext: e.target.value })} placeholder="Подтекст" rows={2} className={inputClass} />
        <div className="flex gap-2">
          <input
            value={block.primary_cta?.label || ""}
            onChange={(e) => onChange({ ...block, primary_cta: { label: e.target.value, url: block.primary_cta?.url || "" } })}
            placeholder="Primary CTA — текст"
            className={inputClass}
          />
          <input
            value={block.primary_cta?.url || ""}
            onChange={(e) => onChange({ ...block, primary_cta: { label: block.primary_cta?.label || "", url: e.target.value } })}
            placeholder="/url"
            className={inputClass}
          />
        </div>
        <div className="flex gap-2">
          <input
            value={block.secondary_cta?.label || ""}
            onChange={(e) => onChange({ ...block, secondary_cta: { label: e.target.value, url: block.secondary_cta?.url || "" } })}
            placeholder="Secondary CTA — текст"
            className={inputClass}
          />
          <input
            value={block.secondary_cta?.url || ""}
            onChange={(e) => onChange({ ...block, secondary_cta: { label: block.secondary_cta?.label || "", url: e.target.value } })}
            placeholder="/url"
            className={inputClass}
          />
        </div>
      </div>

      <div className={sectionClass}>
        <p className={labelClass}>Platform badges</p>
        <DragList<PlatformBadge>
          items={block.platform_badges || []}
          onChange={(items) => onChange({ ...block, platform_badges: items })}
          renderItem={(badge, i, update, remove, drag) => (
            <div {...drag} className="flex items-center gap-2 rounded-md border border-md-outline-variant p-2">
              <i className="ti ti-grip-vertical shrink-0 cursor-grab text-md-on-surface-variant" />
              <div className="h-7 w-7 shrink-0 overflow-hidden rounded-full">
                <PlatformIcon iconKey={badge.icon_key} iconUrl={badge.icon_url} />
              </div>
              <select
                value={badge.icon_key || ""}
                onChange={(e) => update({ icon_key: e.target.value || undefined, icon_media_id: undefined, icon_url: undefined } as Partial<PlatformBadge>)}
                className="w-28 shrink-0 rounded border border-md-outline-variant bg-transparent text-[11px] text-md-on-surface-variant outline-none"
              >
                <option value="">Своя иконка</option>
                {Object.entries(PLATFORM_ICON_PRESETS).map(([key, preset]) => (
                  <option key={key} value={key}>
                    {preset.label}
                  </option>
                ))}
              </select>
              {!badge.icon_key && (
                <button type="button" onClick={() => setPickerFor({ kind: "badge", index: i })} className="shrink-0 text-[11px] text-md-on-surface-variant hover:text-md-primary">
                  Загрузить
                </button>
              )}
              <input value={badge.label} onChange={(e) => update({ label: e.target.value } as Partial<PlatformBadge>)} placeholder="Подпись" className={`${inputClass} flex-1`} />
              <button type="button" onClick={remove} className="shrink-0 text-md-on-surface-variant hover:text-md-error">
                <i className="ti ti-trash text-sm" />
              </button>
            </div>
          )}
        />
        <button
          type="button"
          onClick={() => onChange({ ...block, platform_badges: [...(block.platform_badges || []), { label: "" }] })}
          className="w-fit rounded-md border border-dashed border-md-outline-variant px-3 py-1.5 text-[12px] text-md-on-surface-variant hover:border-md-primary"
        >
          + Добавить badge
        </button>
      </div>

      <div className={sectionClass}>
        <p className={labelClass}>Статистика (3 значения)</p>
        <DragList<Stat>
          items={block.stats || []}
          onChange={(items) => onChange({ ...block, stats: items })}
          renderItem={(stat, i, update, remove, drag) => (
            <div {...drag} className="flex items-center gap-2 rounded-md border border-md-outline-variant p-2">
              <i className="ti ti-grip-vertical shrink-0 cursor-grab text-md-on-surface-variant" />
              <input value={stat.value} onChange={(e) => update({ value: e.target.value } as Partial<Stat>)} placeholder="Значение (99.9%)" className={`${fieldClass} w-28 shrink-0`} />
              <input value={stat.label} onChange={(e) => update({ label: e.target.value } as Partial<Stat>)} placeholder="Подпись" className={`${fieldClass} min-w-[100px] flex-1`} />
              <button type="button" onClick={remove} className="shrink-0 text-md-on-surface-variant hover:text-md-error">
                <i className="ti ti-trash text-sm" />
              </button>
            </div>
          )}
        />
        <button
          type="button"
          onClick={() => onChange({ ...block, stats: [...(block.stats || []), { value: "", label: "" }] })}
          className="w-fit rounded-md border border-dashed border-md-outline-variant px-3 py-1.5 text-[12px] text-md-on-surface-variant hover:border-md-primary"
        >
          + Добавить показатель
        </button>
      </div>

      <div className={sectionClass}>
        <p className={labelClass}>Диаграмма</p>
        <div className="flex gap-2">
          <input
            value={diagram.window_title || ""}
            onChange={(e) => updateDiagram({ window_title: e.target.value })}
            placeholder="Заголовок окна"
            className={`${fieldClass} min-w-[140px] flex-1`}
          />
          <input value={diagram.tag_label || ""} onChange={(e) => updateDiagram({ tag_label: e.target.value })} placeholder="Тег (Multi-cloud)" className={`${fieldClass} w-32 shrink-0`} />
        </div>

        <DragList<DiagramGroup>
          items={diagram.groups}
          onChange={(groups) => updateDiagram({ groups })}
          renderItem={(group, gi, updateGroup, removeGroup, drag) => (
            <div className="flex flex-col gap-2 rounded-md border border-md-outline-variant p-2.5">
              <div {...drag} className="flex items-center gap-2">
                <i className="ti ti-grip-vertical shrink-0 cursor-grab text-md-on-surface-variant" />
                <input value={group.label} onChange={(e) => updateGroup({ label: e.target.value } as Partial<DiagramGroup>)} placeholder="Название группы (Edge / Platform)" className={`${inputClass} flex-1`} />
                <button type="button" onClick={removeGroup} className="shrink-0 text-md-on-surface-variant hover:text-md-error">
                  <i className="ti ti-trash text-sm" />
                </button>
              </div>

              <div className="pl-6">
                <DragList<DiagramItem>
                  items={group.items}
                  onChange={(items) => updateGroup({ items } as Partial<DiagramGroup>)}
                  renderItem={(item, ii, updateItem, removeItem, itemDrag) => (
                    <div {...itemDrag} className="mb-1.5 flex items-center gap-1.5">
                      <i className="ti ti-grip-vertical shrink-0 cursor-grab text-md-on-surface-variant" />
                      <input value={item.title} onChange={(e) => updateItem({ title: e.target.value } as Partial<DiagramItem>)} placeholder="Название" className={`${inputClass} flex-1`} />
                      <input
                        value={item.subtitle || ""}
                        onChange={(e) => updateItem({ subtitle: e.target.value } as Partial<DiagramItem>)}
                        placeholder="Подпись (опц.)"
                        className={`${inputClass} flex-1`}
                      />
                      <button type="button" onClick={removeItem} className="shrink-0 text-md-on-surface-variant hover:text-md-error">
                        <i className="ti ti-x text-xs" />
                      </button>
                    </div>
                  )}
                />
                <button
                  type="button"
                  onClick={() => updateGroup({ items: [...group.items, { title: "" }] } as Partial<DiagramGroup>)}
                  className="text-[11px] text-md-on-surface-variant hover:text-md-primary"
                >
                  + Добавить элемент
                </button>
              </div>
            </div>
          )}
        />
        <button
          type="button"
          onClick={() => updateDiagram({ groups: [...diagram.groups, { label: "", items: [] }] })}
          className="w-fit rounded-md border border-dashed border-md-outline-variant px-3 py-1.5 text-[12px] text-md-on-surface-variant hover:border-md-primary"
        >
          + Добавить группу
        </button>

        <textarea value={diagram.caption || ""} onChange={(e) => updateDiagram({ caption: e.target.value })} placeholder="Подпись под диаграммой" rows={2} className={inputClass} />
      </div>

      <div className={sectionClass}>
        <p className={labelClass}>Callouts</p>
        <DragList<Callout>
          items={block.callouts || []}
          onChange={(items) => onChange({ ...block, callouts: items })}
          renderItem={(callout, i, update, remove, drag) => (
            <div {...drag} className="flex items-start gap-2 rounded-md border border-md-outline-variant p-2">
              <i className="ti ti-grip-vertical mt-2 shrink-0 cursor-grab text-md-on-surface-variant" />
              <div className="flex flex-1 flex-col gap-1.5">
                <div className="flex flex-wrap gap-1.5">
                  <input
                    value={callout.icon || ""}
                    onChange={(e) => update({ icon: e.target.value } as Partial<Callout>)}
                    placeholder="ti-shield-check"
                    title="Класс иконки (tabler)"
                    className={`${fieldClass} w-32 shrink-0`}
                  />
                  <input
                    value={callout.title}
                    onChange={(e) => update({ title: e.target.value } as Partial<Callout>)}
                    placeholder="Заголовок"
                    className={`${fieldClass} min-w-[140px] flex-1`}
                  />
                </div>
                <input value={callout.description} onChange={(e) => update({ description: e.target.value } as Partial<Callout>)} placeholder="Описание" className={inputClass} />
              </div>
              <button type="button" onClick={remove} className="mt-2 shrink-0 text-md-on-surface-variant hover:text-md-error">
                <i className="ti ti-trash text-sm" />
              </button>
            </div>
          )}
        />
        <button
          type="button"
          onClick={() => onChange({ ...block, callouts: [...(block.callouts || []), { title: "", description: "" }] })}
          className="w-fit rounded-md border border-dashed border-md-outline-variant px-3 py-1.5 text-[12px] text-md-on-surface-variant hover:border-md-primary"
        >
          + Добавить callout
        </button>
      </div>

      <MediaPicker
        open={pickerFor !== null}
        onClose={() => setPickerFor(null)}
        onSelect={(item) => {
          if (pickerFor?.kind === "badge") {
            const items = [...(block.platform_badges || [])];
            items[pickerFor.index] = { ...items[pickerFor.index], icon_media_id: item.id, icon_url: item.url, icon_key: undefined };
            onChange({ ...block, platform_badges: items });
          }
          setPickerFor(null);
        }}
      />
    </div>
  );
}
