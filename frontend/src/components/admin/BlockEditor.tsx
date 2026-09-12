"use client";

import { useState } from "react";
import {
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  closestCenter,
  pointerWithin,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
  type DragStartEvent,
  type DraggableAttributes,
  type DraggableSyntheticListeners,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { PublicPageBlock } from "@/lib/api";
import { HeadingBlockEditor } from "@/components/admin/blocks/HeadingBlockEditor";
import { ParagraphBlockEditor } from "@/components/admin/blocks/ParagraphBlockEditor";
import { ImageBlockEditor } from "@/components/admin/blocks/ImageBlockEditor";
import { GalleryBlockEditor } from "@/components/admin/blocks/GalleryBlockEditor";
import { ButtonBlockEditor } from "@/components/admin/blocks/ButtonBlockEditor";
import { StatsBarBlockEditor } from "@/components/admin/blocks/StatsBarBlockEditor";
import { FeatureGridBlockEditor } from "@/components/admin/blocks/FeatureGridBlockEditor";
import { HowItWorksBlockEditor } from "@/components/admin/blocks/HowItWorksBlockEditor";
import { CtaBannerBlockEditor } from "@/components/admin/blocks/CtaBannerBlockEditor";
import { TestimonialsCarouselBlockEditor } from "@/components/admin/blocks/TestimonialsCarouselBlockEditor";
import { AppMockupPanelBlockEditor } from "@/components/admin/blocks/AppMockupPanelBlockEditor";
import { AnnotatedScreenshotBlockEditor } from "@/components/admin/blocks/AnnotatedScreenshotBlockEditor";
import { CategoryPreviewRowBlockEditor } from "@/components/admin/blocks/CategoryPreviewRowBlockEditor";
import { SectionLabelBlockEditor } from "@/components/admin/blocks/SectionLabelBlockEditor";
import { RichTextEditor } from "@/components/admin/RichTextEditor";

type Block = PublicPageBlock;
type ColumnsBlock = Extract<Block, { type: "columns" }>;

const TYPE_LABELS: Record<Block["type"], string> = {
  richtext: "Текст",
  heading: "Заголовок (устар.)",
  text: "Текст (устар.)",
  paragraph: "Текст (устар.)",
  image: "Изображение",
  gallery: "Галерея",
  button: "Кнопка",
  columns: "Колонки",
  stats_bar: "Статистика",
  feature_grid: "Сетка карточек",
  how_it_works: "Как это работает",
  testimonials_carousel: "Карусель отзывов",
  apps_showcase: "Витрина приложений",
  cta_banner: "CTA-баннер",
  app_mockup_panel: "Витрина мокапов",
  annotated_screenshot: "Скриншот с подписями",
  category_preview_row: "Ряд категорий",
  progress_dots: "Точки прогресса",
  section_label: "Заголовок секции (кикер)",
};

const TYPE_ICONS: Partial<Record<Block["type"], string>> = {
  richtext: "ti-typography",
  image: "ti-photo",
  gallery: "ti-photo-plus",
  button: "ti-hand-click",
  stats_bar: "ti-chart-bar",
  feature_grid: "ti-layout-grid",
  how_it_works: "ti-list-numbers",
  testimonials_carousel: "ti-quote",
  apps_showcase: "ti-apps",
  cta_banner: "ti-speakerphone",
  app_mockup_panel: "ti-device-mobile",
  annotated_screenshot: "ti-message-2",
  category_preview_row: "ti-layout-cards",
  progress_dots: "ti-point",
  section_label: "ti-heading",
};

// Content block types addable from the palette — both at the top level (as a full-width row)
// and inside a column. "columns" itself is only offered as a row layout preset (see ROW_PRESETS)
// to avoid rows nested inside columns.
const PALETTE_TYPES: Block["type"][] = [
  "richtext",
  "section_label",
  "image",
  "gallery",
  "button",
  "stats_bar",
  "feature_grid",
  "how_it_works",
  "testimonials_carousel",
  "apps_showcase",
  "cta_banner",
  "app_mockup_panel",
  "annotated_screenshot",
  "category_preview_row",
  "progress_dots",
];

const ROW_PRESETS = [1, 2, 3, 4];

const DEVICE_WIDTHS: Record<"desktop" | "tablet" | "mobile", string> = {
  desktop: "100%",
  tablet: "768px",
  mobile: "375px",
};

function defaultBlockFor(type: Block["type"]): Block {
  switch (type) {
    case "richtext":
      return { type: "richtext", html: "" };
    case "heading":
      return { type: "heading", text: "", level: 2 };
    case "image":
      return { type: "image", url: "", alt: "" };
    case "gallery":
      return { type: "gallery", images: [] };
    case "button":
      return { type: "button", label: "", url: "", style: "primary" };
    case "columns":
      return { type: "columns", columns: [[], []] };
    case "stats_bar":
      return { type: "stats_bar", stats: [{ value: "", label: "" }] };
    case "feature_grid":
      return { type: "feature_grid", columns: 2, items: [] };
    case "how_it_works":
      return { type: "how_it_works", steps: [] };
    case "testimonials_carousel":
      return { type: "testimonials_carousel" };
    case "apps_showcase":
      return { type: "apps_showcase" };
    case "cta_banner":
      return { type: "cta_banner", title: "", button_label: "", button_url: "" };
    case "app_mockup_panel":
      return { type: "app_mockup_panel", panels: [] };
    case "annotated_screenshot":
      return { type: "annotated_screenshot", annotations: [] };
    case "category_preview_row":
      return { type: "category_preview_row", categories: [] };
    case "progress_dots":
      return { type: "progress_dots" };
    case "section_label":
      return { type: "section_label", text: "" };
    case "text":
    case "paragraph":
    default:
      return { type: "richtext", html: "" };
  }
}

// Legacy `heading`/`text`/`paragraph` blocks render fine as-is on the public site, but the moment
// someone opens one in this editor we fold it into the single `richtext` shape (preserving the
// visible content) so there's only one code path to maintain going forward. No data is lost.
function normalize(block: Block): Block {
  if (block.type === "text") {
    const escaped = block.text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    return { type: "richtext", html: `<p>${escaped.replace(/\n/g, "<br>")}</p>` };
  }
  if (block.type === "heading") {
    const tag = block.level === 3 ? "h3" : "h2";
    const escaped = block.text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    return { type: "richtext", html: `<${tag}>${escaped}</${tag}>` };
  }
  if (block.type === "paragraph") {
    return { type: "richtext", html: block.html };
  }
  return block;
}

function isHidden(block: Block): boolean {
  return "hidden" in block && !!block.hidden;
}

// ---- drop target parsing -----------------------------------------------------------------

type DropTarget =
  | { kind: "root" }
  | { kind: "row"; index: number }
  | { kind: "col"; row: number; col: number }
  | { kind: "item"; row: number; col: number; index: number };

function parseDropTarget(id: string): DropTarget {
  if (id === "root" || id === "root-end") return { kind: "root" };
  if (id.startsWith("row-")) return { kind: "row", index: Number(id.split("-")[1]) };
  if (id.startsWith("col-")) {
    const [, r, c] = id.split("-");
    return { kind: "col", row: Number(r), col: Number(c) };
  }
  if (id.startsWith("item-")) {
    const [, r, c, i] = id.split("-");
    return { kind: "item", row: Number(r), col: Number(c), index: Number(i) };
  }
  return { kind: "root" };
}

// A columns-row's sortable wrapper (`row-N`) is droppable over its *entire* rect, including the
// nested column drop zones rendered inside it — so a pointer over a column always also collides
// with its parent row. Prefer the most nested match (`item-`/`col-`) whenever both are present.
const collisionDetection: CollisionDetection = (args) => {
  const pointerCollisions = pointerWithin(args);
  if (pointerCollisions.length > 0) {
    const nested = pointerCollisions.filter((c) => {
      const id = String(c.id);
      return id.startsWith("col-") || id.startsWith("item-");
    });
    return nested.length > 0 ? nested : pointerCollisions;
  }
  return closestCenter(args);
};

// ---- main editor ---------------------------------------------------------------------------

interface BlockEditorProps {
  value: Block[];
  onChange: (blocks: Block[]) => void;
}

export function BlockEditor({ value, onChange }: BlockEditorProps) {
  const [device, setDevice] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } })
  );

  function withRow(list: Block[], rowIndex: number, updater: (b: Block) => Block): Block[] {
    return list.map((b, i) => (i === rowIndex ? updater(b) : b));
  }

  function insertRow(block: Block, target: DropTarget) {
    const next = [...value];
    if (target.kind === "row") next.splice(target.index, 0, block);
    else next.push(block);
    onChange(next);
  }

  function insertIntoColumn(block: Block, target: DropTarget) {
    if (target.kind !== "col" && target.kind !== "item") return;
    const row = value[target.row];
    if (row.type !== "columns") return;
    const columns = row.columns.map((c) => [...c]);
    const insertAt = target.kind === "item" ? target.index : columns[target.col].length;
    columns[target.col].splice(insertAt, 0, block);
    onChange(withRow(value, target.row, () => ({ ...row, columns })));
  }

  function insertFromPalette(paletteId: string, overId: string) {
    const target = parseDropTarget(overId);
    if (paletteId.startsWith("palette-row-")) {
      const n = Number(paletteId.split("-")[2]);
      const newRow: Block = { type: "columns", columns: Array.from({ length: n }, () => []) };
      insertRow(newRow, target.kind === "col" || target.kind === "item" ? { kind: "root" } : target);
      return;
    }
    const type = paletteId.replace("palette-block-", "") as Block["type"];
    const block = defaultBlockFor(type);
    if (target.kind === "col" || target.kind === "item") insertIntoColumn(block, target);
    else insertRow(block, target);
  }

  function moveRow(activeRowId: string, overId: string) {
    const from = Number(activeRowId.split("-")[1]);
    if (overId === "root-end") {
      const next = [...value];
      const [moved] = next.splice(from, 1);
      next.push(moved);
      onChange(next);
      return;
    }
    if (!overId.startsWith("row-")) return;
    const to = Number(overId.split("-")[1]);
    if (to === from) return;
    onChange(arrayMove(value, from, to));
  }

  function moveItem(activeItemId: string, overId: string) {
    const [sr, sc, si] = activeItemId.split("-").slice(1).map(Number);
    let tr = sr;
    let tc = sc;
    let ti: number | null = null;
    if (overId.startsWith("item-")) {
      const [r, c, i] = overId.split("-").slice(1).map(Number);
      tr = r;
      tc = c;
      ti = i;
    } else if (overId.startsWith("col-")) {
      const [r, c] = overId.split("-").slice(1).map(Number);
      tr = r;
      tc = c;
    } else {
      return;
    }

    const sourceRow = value[sr];
    if (sourceRow.type !== "columns") return;
    const item = sourceRow.columns[sc]?.[si];
    if (!item) return;

    if (sr === tr) {
      const columns = sourceRow.columns.map((c) => [...c]);
      columns[sc].splice(si, 1);
      let insertAt = ti === null ? columns[tc].length : ti;
      if (sc === tc && ti !== null && ti > si) insertAt -= 1;
      columns[tc].splice(insertAt, 0, item);
      onChange(withRow(value, sr, () => ({ ...sourceRow, columns })));
      return;
    }

    const targetRow = value[tr];
    if (targetRow.type !== "columns") return;
    const sourceColumns = sourceRow.columns.map((c) => [...c]);
    sourceColumns[sc].splice(si, 1);
    const targetColumns = targetRow.columns.map((c) => [...c]);
    const insertAt = ti === null ? targetColumns[tc].length : ti;
    targetColumns[tc].splice(insertAt, 0, item);

    onChange(
      value.map((b, idx) => {
        if (idx === sr) return { ...sourceRow, columns: sourceColumns };
        if (idx === tr) return { ...targetRow, columns: targetColumns };
        return b;
      })
    );
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;
    const activeIdStr = String(active.id);
    const overIdStr = String(over.id);
    if (activeIdStr === overIdStr) return;

    if (activeIdStr.startsWith("palette-")) {
      insertFromPalette(activeIdStr, overIdStr);
    } else if (activeIdStr.startsWith("row-")) {
      moveRow(activeIdStr, overIdStr);
    } else if (activeIdStr.startsWith("item-")) {
      moveItem(activeIdStr, overIdStr);
    }
  }

  // ---- root-level mutators ----
  function updateRoot(i: number, block: Block) {
    onChange(withRow(value, i, () => block));
  }
  function removeRoot(i: number) {
    onChange(value.filter((_, idx) => idx !== i));
  }
  function duplicateRoot(i: number) {
    const next = [...value];
    next.splice(i + 1, 0, structuredClone(value[i]));
    onChange(next);
  }
  function toggleHiddenRoot(i: number) {
    const block = value[i];
    onChange(withRow(value, i, () => ({ ...block, hidden: !isHidden(block) } as Block)));
  }

  // ---- column-item mutators ----
  function updateColumnList(r: number, c: number, updater: (col: Block[]) => Block[]) {
    const row = value[r];
    if (row.type !== "columns") return;
    const columns = row.columns.map((col, idx) => (idx === c ? updater(col) : col));
    onChange(withRow(value, r, () => ({ ...row, columns })));
  }
  function updateItem(r: number, c: number, i: number, block: Block) {
    updateColumnList(r, c, (col) => col.map((b, idx) => (idx === i ? block : b)));
  }
  function removeItem(r: number, c: number, i: number) {
    updateColumnList(r, c, (col) => col.filter((_, idx) => idx !== i));
  }
  function duplicateItem(r: number, c: number, i: number) {
    updateColumnList(r, c, (col) => {
      const next = [...col];
      next.splice(i + 1, 0, structuredClone(col[i]));
      return next;
    });
  }
  function toggleHiddenItem(r: number, c: number, i: number) {
    updateColumnList(r, c, (col) => col.map((b, idx) => (idx === i ? ({ ...b, hidden: !isHidden(b) } as Block) : b)));
  }

  // ---- row-level column layout mutators ----
  function setColumnCount(rowIndex: number, n: number) {
    const row = value[rowIndex];
    if (row.type !== "columns") return;
    let columns = row.columns.map((c) => [...c]);
    if (n > columns.length) {
      while (columns.length < n) columns.push([]);
    } else if (n < columns.length) {
      const overflow = columns.slice(n).flat();
      columns = columns.slice(0, n);
      columns[n - 1] = [...columns[n - 1], ...overflow];
    }
    const spans = row.spans ? row.spans.slice(0, n) : undefined;
    onChange(withRow(value, rowIndex, () => ({ ...row, columns, spans })));
  }
  function setColumnSpan(rowIndex: number, colIndex: number, span: number) {
    const row = value[rowIndex];
    if (row.type !== "columns") return;
    const spans = row.columns.map((_, i) => row.spans?.[i] ?? 1);
    spans[colIndex] = span;
    onChange(withRow(value, rowIndex, () => ({ ...row, spans })));
  }

  const { setNodeRef: setRootEndRef, isOver: rootEndOver } = useDroppable({ id: "root-end" });

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex items-start gap-4">
        <Palette onAdd={(paletteId) => insertFromPalette(paletteId, "root-end")} />

        <div className="min-w-0 flex-1">
          <div className="mb-3 flex justify-end">
            <DeviceToggle value={device} onChange={setDevice} />
          </div>

          <div style={{ maxWidth: DEVICE_WIDTHS[device], margin: "0 auto", transition: "max-width 150ms" }}>
            <SortableContext items={value.map((_, i) => `row-${i}`)} strategy={verticalListSortingStrategy}>
              <div className="flex flex-col gap-2">
                {value.map((rawBlock, i) => {
                  const block = normalize(rawBlock);
                  return (
                    <SortableRow key={i} id={`row-${i}`}>
                      {(handle) =>
                        block.type === "columns" ? (
                          <ColumnsRowCard
                            row={block as ColumnsBlock}
                            rowIndex={i}
                            handle={handle}
                            onToggleHidden={() => toggleHiddenRoot(i)}
                            onDuplicate={() => duplicateRoot(i)}
                            onRemove={() => removeRoot(i)}
                            onSetColumnCount={(n) => setColumnCount(i, n)}
                            onSetSpan={(c, span) => setColumnSpan(i, c, span)}
                            onUpdateItem={(c, idx, b) => updateItem(i, c, idx, b)}
                            onRemoveItem={(c, idx) => removeItem(i, c, idx)}
                            onDuplicateItem={(c, idx) => duplicateItem(i, c, idx)}
                            onToggleHiddenItem={(c, idx) => toggleHiddenItem(i, c, idx)}
                          />
                        ) : (
                          <BlockCard
                            block={block}
                            handle={handle}
                            onToggleHidden={() => toggleHiddenRoot(i)}
                            onDuplicate={() => duplicateRoot(i)}
                            onRemove={() => removeRoot(i)}
                            onChange={(b) => updateRoot(i, b)}
                          />
                        )
                      }
                    </SortableRow>
                  );
                })}
              </div>
            </SortableContext>

            <div
              ref={setRootEndRef}
              className={`mt-2 flex h-12 items-center justify-center rounded-lg border border-dashed text-[12px] text-md-on-surface-variant ${
                rootEndOver ? "border-md-primary bg-md-primary/5" : "border-md-outline-variant"
              }`}
            >
              {value.length === 0 ? "Перетащите блок или строку сюда" : "Перетащите сюда, чтобы добавить в конец"}
            </div>
          </div>
        </div>
      </div>

      <DragOverlay>{activeId && <DragChip label={dragLabel(activeId, value)} />}</DragOverlay>
    </DndContext>
  );
}

function dragLabel(id: string, value: Block[]): string {
  if (id.startsWith("palette-row-")) return `Строка · ${id.split("-")[2]} кол.`;
  if (id.startsWith("palette-block-")) {
    const type = id.replace("palette-block-", "") as Block["type"];
    return TYPE_LABELS[type] || type;
  }
  if (id.startsWith("row-")) {
    const row = value[Number(id.split("-")[1])];
    return row ? TYPE_LABELS[row.type] : "Блок";
  }
  if (id.startsWith("item-")) {
    const [, r, c, i] = id.split("-").map(Number);
    const row = value[r];
    if (row?.type === "columns") {
      const item = row.columns[c]?.[i];
      if (item) return TYPE_LABELS[item.type];
    }
  }
  return "Блок";
}

function DragChip({ label }: { label: string }) {
  return (
    <div
      className="rounded-lg border border-md-outline-variant bg-md-surface-container-highest px-3 py-2 text-[13px] text-md-on-surface"
      style={{ boxShadow: "var(--md-elevation-3)" }}
    >
      {label}
    </div>
  );
}

function DeviceToggle({
  value,
  onChange,
}: {
  value: "desktop" | "tablet" | "mobile";
  onChange: (v: "desktop" | "tablet" | "mobile") => void;
}) {
  const options: { id: "desktop" | "tablet" | "mobile"; icon: string; label: string }[] = [
    { id: "desktop", icon: "ti-device-desktop", label: "Desktop" },
    { id: "tablet", icon: "ti-device-tablet", label: "Tablet" },
    { id: "mobile", icon: "ti-device-mobile", label: "Mobile" },
  ];
  return (
    <div className="inline-flex gap-0.5 rounded-lg bg-md-surface-container-high p-0.5">
      {options.map((opt) => (
        <button
          key={opt.id}
          type="button"
          title={opt.label}
          onClick={() => onChange(opt.id)}
          className={`flex h-7 w-7 items-center justify-center rounded-md ${
            value === opt.id ? "bg-md-surface-container-lowest text-md-on-surface" : "text-md-on-surface-variant hover:text-md-on-surface"
          }`}
        >
          <i className={`ti ${opt.icon} text-sm`} />
        </button>
      ))}
    </div>
  );
}

// ---- palette ---------------------------------------------------------------------------------

function Palette({ onAdd }: { onAdd: (paletteId: string) => void }) {
  return (
    <div className="sticky top-4 flex w-44 shrink-0 flex-col gap-3">
      <div>
        <p className="mb-1.5 px-1 text-[11px] uppercase text-md-on-surface-variant">Строка</p>
        <div className="flex flex-col gap-1">
          {ROW_PRESETS.map((n) => (
            <PaletteDraggable
              key={n}
              id={`palette-row-${n}`}
              label={`${n} колонк${n === 1 ? "а" : n < 5 ? "и" : ""}`}
              icon="ti-columns"
              onAdd={onAdd}
            />
          ))}
        </div>
      </div>
      <div>
        <p className="mb-1.5 px-1 text-[11px] uppercase text-md-on-surface-variant">Блоки</p>
        <div className="flex flex-col gap-1">
          {PALETTE_TYPES.map((type) => (
            <PaletteDraggable
              key={type}
              id={`palette-block-${type}`}
              label={TYPE_LABELS[type]}
              icon={TYPE_ICONS[type] || "ti-square"}
              onAdd={onAdd}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// Drag-to-place is the primary interaction, but a plain click also appends the block/row to the
// end of the canvas — a real click (mousedown+mouseup with no movement) never satisfies dnd-kit's
// MouseSensor activationConstraint, so it can't fire mid-drag; this just makes "add a block" work
// even when pointer-drag itself is flaky (trackpad quirks, remote displays, etc.).
function PaletteDraggable({
  id,
  label,
  icon,
  onAdd,
}: {
  id: string;
  label: string;
  icon: string;
  onAdd: (paletteId: string) => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id });
  return (
    <button
      ref={setNodeRef}
      type="button"
      title="Перетащите на холст или нажмите, чтобы добавить в конец"
      {...listeners}
      {...attributes}
      onClick={() => onAdd(id)}
      className={`flex cursor-grab items-center gap-2 rounded-md border border-md-outline-variant px-2 py-1.5 text-left text-[12.5px] text-md-on-surface active:cursor-grabbing ${
        isDragging ? "opacity-40" : "hover:bg-md-surface-container-low"
      }`}
    >
      <i className={`ti ${icon} shrink-0 text-[13px] text-md-on-surface-variant`} />
      <span className="truncate">{label}</span>
    </button>
  );
}

// ---- sortable row wrapper ----------------------------------------------------------------

type DragHandle = { attributes: DraggableAttributes; listeners: DraggableSyntheticListeners };

function SortableRow({ id, children }: { id: string; children: (handle: DragHandle) => React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition: transition ?? undefined,
        opacity: isDragging ? 0.4 : 1,
      }}
      data-row-id={id}
    >
      {children({ attributes, listeners })}
    </div>
  );
}

// ---- single-block card (used for both top-level blocks and column items) -----------------

function RowHeader({
  handle,
  label,
  hidden,
  onToggleHidden,
  onDuplicate,
  onRemove,
}: {
  handle: DragHandle;
  label: string;
  hidden: boolean;
  onToggleHidden: () => void;
  onDuplicate: () => void;
  onRemove: () => void;
}) {
  return (
    <div className="mb-2 flex items-center justify-between">
      <div className="flex items-center gap-1.5 text-[11px] uppercase text-md-on-surface-variant">
        <span {...handle.listeners} {...handle.attributes} className="cursor-grab active:cursor-grabbing">
          <i className="ti ti-grip-vertical text-sm" />
        </span>
        {label}
        {hidden && <span className="text-md-warning">· скрыт</span>}
      </div>
      <div className="flex items-center gap-2 text-md-on-surface-variant">
        <button type="button" onClick={onToggleHidden} title={hidden ? "Показать" : "Скрыть"} className="hover:text-md-on-surface">
          <i className={`ti ${hidden ? "ti-eye-off" : "ti-eye"} text-sm`} />
        </button>
        <button type="button" onClick={onDuplicate} title="Дублировать" className="hover:text-md-on-surface">
          <i className="ti ti-copy text-sm" />
        </button>
        <button type="button" onClick={onRemove} title="Удалить" className="hover:text-md-error">
          <i className="ti ti-trash text-sm" />
        </button>
      </div>
    </div>
  );
}

function BlockCard({
  block,
  handle,
  onToggleHidden,
  onDuplicate,
  onRemove,
  onChange,
}: {
  block: Block;
  handle: DragHandle;
  onToggleHidden: () => void;
  onDuplicate: () => void;
  onRemove: () => void;
  onChange: (block: Block) => void;
}) {
  return (
    <div className={`rounded-lg border border-md-outline-variant p-3 ${isHidden(block) ? "opacity-50" : ""}`}>
      <RowHeader
        handle={handle}
        label={TYPE_LABELS[block.type]}
        hidden={isHidden(block)}
        onToggleHidden={onToggleHidden}
        onDuplicate={onDuplicate}
        onRemove={onRemove}
      />
      <BlockBody block={block} onChange={onChange} />
    </div>
  );
}

// ---- columns row ---------------------------------------------------------------------------

function ColumnsRowCard({
  row,
  rowIndex,
  handle,
  onToggleHidden,
  onDuplicate,
  onRemove,
  onSetColumnCount,
  onSetSpan,
  onUpdateItem,
  onRemoveItem,
  onDuplicateItem,
  onToggleHiddenItem,
}: {
  row: ColumnsBlock;
  rowIndex: number;
  handle: DragHandle;
  onToggleHidden: () => void;
  onDuplicate: () => void;
  onRemove: () => void;
  onSetColumnCount: (n: number) => void;
  onSetSpan: (col: number, span: number) => void;
  onUpdateItem: (col: number, i: number, block: Block) => void;
  onRemoveItem: (col: number, i: number) => void;
  onDuplicateItem: (col: number, i: number) => void;
  onToggleHiddenItem: (col: number, i: number) => void;
}) {
  const count = row.columns.length;
  return (
    <div className={`rounded-lg border border-md-outline-variant bg-md-surface-container-low p-3 ${isHidden(row) ? "opacity-50" : ""}`}>
      <RowHeader
        handle={handle}
        label={`Строка · ${count} кол.`}
        hidden={isHidden(row)}
        onToggleHidden={onToggleHidden}
        onDuplicate={onDuplicate}
        onRemove={onRemove}
      />
      <div className="mb-2 flex items-center gap-1">
        <span className="mr-1 text-[11px] text-md-on-surface-variant">Колонок:</span>
        {ROW_PRESETS.map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onSetColumnCount(n)}
            className={`h-6 w-6 rounded-md text-[12px] ${
              n === count ? "bg-md-primary text-md-on-primary" : "bg-md-surface-container-high text-md-on-surface-variant hover:text-md-on-surface"
            }`}
          >
            {n}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-3">
        {row.columns.map((col, c) => (
          <ColumnZone
            key={c}
            row={rowIndex}
            col={c}
            span={row.spans?.[c] ?? 1}
            items={col}
            onSetSpan={(span) => onSetSpan(c, span)}
            onUpdateItem={(i, b) => onUpdateItem(c, i, b)}
            onRemoveItem={(i) => onRemoveItem(c, i)}
            onDuplicateItem={(i) => onDuplicateItem(c, i)}
            onToggleHiddenItem={(i) => onToggleHiddenItem(c, i)}
          />
        ))}
      </div>
    </div>
  );
}

function ColumnZone({
  row,
  col,
  span,
  items,
  onSetSpan,
  onUpdateItem,
  onRemoveItem,
  onDuplicateItem,
  onToggleHiddenItem,
}: {
  row: number;
  col: number;
  span: number;
  items: Block[];
  onSetSpan: (span: number) => void;
  onUpdateItem: (i: number, block: Block) => void;
  onRemoveItem: (i: number) => void;
  onDuplicateItem: (i: number) => void;
  onToggleHiddenItem: (i: number) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `col-${row}-${col}` });
  return (
    <div style={{ flex: `${span} 1 200px`, minWidth: 0 }}>
      <div className="mb-1.5 flex items-center justify-between">
        <p className="m-0 text-[10.5px] uppercase text-md-on-surface-variant">Колонка {col + 1}</p>
        <select
          value={span}
          onChange={(e) => onSetSpan(Number(e.target.value))}
          title="Относительная ширина колонки"
          className="rounded border border-md-outline-variant bg-transparent text-[10.5px] text-md-on-surface-variant"
        >
          {[1, 2, 3].map((s) => (
            <option key={s} value={s}>
              {s}x
            </option>
          ))}
        </select>
      </div>
      <div
        ref={setNodeRef}
        className={`flex min-h-16 flex-col gap-2 rounded-md border border-dashed p-1.5 ${
          isOver ? "border-md-primary bg-md-primary/5" : "border-md-outline-variant"
        }`}
      >
        <SortableContext items={items.map((_, i) => `item-${row}-${col}-${i}`)} strategy={verticalListSortingStrategy}>
          {items.map((rawBlock, i) => {
            const block = normalize(rawBlock);
            return (
              <SortableRow key={i} id={`item-${row}-${col}-${i}`}>
                {(handle) => (
                  <BlockCard
                    block={block}
                    handle={handle}
                    onToggleHidden={() => onToggleHiddenItem(i)}
                    onDuplicate={() => onDuplicateItem(i)}
                    onRemove={() => onRemoveItem(i)}
                    onChange={(b) => onUpdateItem(i, b)}
                  />
                )}
              </SortableRow>
            );
          })}
        </SortableContext>
        {items.length === 0 && (
          <p className="m-0 py-2 text-center text-[11px] text-md-on-surface-variant">Перетащите блок сюда</p>
        )}
      </div>
    </div>
  );
}

function BlockBody({ block, onChange }: { block: Block; onChange: (block: Block) => void }) {
  switch (block.type) {
    case "richtext":
      return <RichTextEditor html={block.html} onChange={(html) => onChange({ ...block, html })} />;
    case "heading":
      return <HeadingBlockEditor block={block} onChange={onChange} />;
    case "paragraph":
      return <ParagraphBlockEditor block={block} onChange={onChange} />;
    case "image":
      return <ImageBlockEditor block={block} onChange={onChange} />;
    case "gallery":
      return <GalleryBlockEditor block={block} onChange={onChange} />;
    case "button":
      return <ButtonBlockEditor block={block} onChange={onChange} />;
    case "stats_bar":
      return <StatsBarBlockEditor block={block} onChange={onChange} />;
    case "feature_grid":
      return <FeatureGridBlockEditor block={block} onChange={onChange} />;
    case "how_it_works":
      return <HowItWorksBlockEditor block={block} onChange={onChange} />;
    case "cta_banner":
      return <CtaBannerBlockEditor block={block} onChange={onChange} />;
    case "testimonials_carousel":
      return <TestimonialsCarouselBlockEditor block={block} onChange={onChange} />;
    case "apps_showcase":
      return <p className="m-0 text-[12px] text-md-on-surface-variant">Показывает все опубликованные приложения с флагом «на главной» — без настроек.</p>;
    case "app_mockup_panel":
      return <AppMockupPanelBlockEditor block={block} onChange={onChange} />;
    case "annotated_screenshot":
      return <AnnotatedScreenshotBlockEditor block={block} onChange={onChange} />;
    case "category_preview_row":
      return <CategoryPreviewRowBlockEditor block={block} onChange={onChange} />;
    case "progress_dots":
      return <p className="m-0 text-[12px] text-md-on-surface-variant">Декоративный индикатор — без настроек.</p>;
    case "section_label":
      return <SectionLabelBlockEditor block={block} onChange={onChange} />;
    default:
      return null;
  }
}
