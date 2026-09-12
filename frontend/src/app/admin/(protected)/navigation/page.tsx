"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminFetch } from "@/lib/admin-api";
import { useToast } from "@/lib/toast";
import { useCanEdit } from "@/lib/role-context";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { Card } from "@/components/admin/m3/Card";
import { Button } from "@/components/admin/m3/Button";
import { MegaMenuEditor } from "@/components/admin/MegaMenuEditor";
import type { NavItem } from "@/lib/admin-types";
import type { NavMenuContent, NavMenuType } from "@/lib/nav-menu-types";
import { emptyMenuContent } from "@/lib/nav-menu-types";

const MENU_TYPE_LABELS: Record<NavMenuType, string> = {
  link: "Ссылка",
  dropdown: "Выпадающий список",
  mega_menu: "Мега-меню",
};

const inputClass =
  "block w-full rounded-lg border border-md-outline-variant px-2.5 py-1.5 text-[13px] text-md-on-surface outline-none focus:border-md-primary";

function useNavMutations() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["nav-items"] });

  const create = useMutation({
    mutationFn: (body: Partial<NavItem>) => adminFetch<{ id: string }>("api/nav-items", { method: "POST", body }),
    onSuccess: () => {
      invalidate();
      showToast("Пункт добавлен");
    },
    onError: (err: Error) => showToast(err.message, "error"),
  });

  const update = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Partial<NavItem> }) =>
      adminFetch(`api/nav-items/${id}`, { method: "PUT", body }),
    onSuccess: () => {
      invalidate();
      showToast("Сохранено");
    },
    onError: (err: Error) => showToast(err.message, "error"),
  });

  const remove = useMutation({
    mutationFn: (id: string) => adminFetch(`api/nav-items/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      invalidate();
      showToast("Удалено");
    },
    onError: (err: Error) => showToast(err.message, "error"),
  });

  const reorder = useMutation({
    mutationFn: (items: { id: string; sort_order: number }[]) =>
      adminFetch("api/nav-items/reorder", { method: "PUT", body: { items } }),
    onSuccess: () => invalidate(),
    onError: (err: Error) => showToast(err.message, "error"),
  });

  return { create, update, remove, reorder };
}

function AddForm({
  onAdd,
  placeholder = "Заголовок",
}: {
  onAdd: (label: string, url: string) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState("");
  const [url, setUrl] = useState("");

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-fit rounded-lg border border-dashed border-md-outline-variant px-3 py-1.5 text-[12px] text-md-on-surface-variant hover:border-md-primary"
      >
        + Добавить
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder={placeholder} className={inputClass} />
      <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="/url" className={inputClass} />
      <Button
        onClick={() => {
          if (!label.trim() || !url.trim()) return;
          onAdd(label.trim(), url.trim());
          setLabel("");
          setUrl("");
          setOpen(false);
        }}
        className="shrink-0 px-3 py-1.5"
      >
        OK
      </Button>
      <button type="button" onClick={() => setOpen(false)} className="shrink-0 text-[12px] text-md-on-surface-variant">
        Отмена
      </button>
    </div>
  );
}

function ItemRow({
  item,
  canEdit,
  onSave,
  onDelete,
  draggable,
  onDragStart,
  onDragOver,
  onDrop,
}: {
  item: NavItem;
  canEdit: boolean;
  onSave: (label: string, url: string) => void;
  onDelete: () => void;
  draggable?: boolean;
  onDragStart?: () => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [label, setLabel] = useState(item.label);
  const [url, setUrl] = useState(item.url);

  if (editing) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-md-outline-variant p-2">
        <input value={label} onChange={(e) => setLabel(e.target.value)} className={inputClass} />
        <input value={url} onChange={(e) => setUrl(e.target.value)} className={inputClass} />
        <Button
          onClick={() => {
            onSave(label, url);
            setEditing(false);
          }}
          className="shrink-0 px-3 py-1.5"
        >
          OK
        </Button>
        <button onClick={() => setEditing(false)} className="shrink-0 text-[12px] text-md-on-surface-variant">
          Отмена
        </button>
      </div>
    );
  }

  return (
    <div
      draggable={draggable && canEdit}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      className="flex items-center justify-between rounded-lg border border-md-outline-variant px-3 py-2"
    >
      <div className="flex items-center gap-2">
        {draggable && canEdit && <i className="ti ti-grip-vertical text-md-on-surface-variant" />}
        <span className="text-[13px] text-md-on-surface">{item.label}</span>
        <span className="text-[12px] text-md-on-surface-variant">{item.url}</span>
      </div>
      {canEdit && (
        <div className="flex items-center gap-2">
          <button onClick={() => setEditing(true)} className="text-md-on-surface-variant hover:text-md-on-surface">
            <i className="ti ti-pencil text-sm" />
          </button>
          <button onClick={onDelete} className="text-md-on-surface-variant hover:text-md-error">
            <i className="ti ti-trash text-sm" />
          </button>
        </div>
      )}
    </div>
  );
}

function HeaderItemRow({
  item,
  canEdit,
  onSave,
  onDelete,
  draggable,
  onDragStart,
  onDragOver,
  onDrop,
}: {
  item: NavItem;
  canEdit: boolean;
  onSave: (patch: Partial<NavItem>) => void;
  onDelete: () => void;
  draggable?: boolean;
  onDragStart?: () => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [label, setLabel] = useState(item.label);
  const [url, setUrl] = useState(item.url);
  const [menuType, setMenuType] = useState<NavMenuType>(item.menu_type);
  const [menuOpen, setMenuOpen] = useState(false);

  if (editing) {
    return (
      <div className="flex flex-col gap-2 rounded-lg border border-md-outline-variant p-2">
        <div className="flex items-center gap-2">
          <input value={label} onChange={(e) => setLabel(e.target.value)} className={inputClass} />
          {menuType === "link" && <input value={url} onChange={(e) => setUrl(e.target.value)} className={inputClass} />}
          <select
            value={menuType}
            onChange={(e) => setMenuType(e.target.value as NavMenuType)}
            className="shrink-0 rounded-md border border-md-outline-variant bg-transparent px-2 py-1.5 text-[12px] text-md-on-surface outline-none"
          >
            {Object.entries(MENU_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => {
              onSave({
                label,
                url: menuType === "link" ? url : item.url || "#",
                menu_type: menuType,
                menu_content: menuType === "link" ? null : item.menu_content || emptyMenuContent(),
              });
              setEditing(false);
            }}
            className="shrink-0 px-3 py-1.5"
          >
            OK
          </Button>
          <button onClick={() => setEditing(false)} className="shrink-0 text-[12px] text-md-on-surface-variant">
            Отмена
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      draggable={draggable && canEdit}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      className="flex items-center justify-between rounded-lg border border-md-outline-variant px-3 py-2"
    >
      <div className="flex items-center gap-2">
        {draggable && canEdit && <i className="ti ti-grip-vertical text-md-on-surface-variant" />}
        <span className="text-[13px] text-md-on-surface">{item.label}</span>
        {item.menu_type === "link" ? (
          <span className="text-[12px] text-md-on-surface-variant">{item.url}</span>
        ) : (
          <span className="rounded-full bg-md-secondary-container px-2 py-0.5 text-[11px] text-md-on-secondary-container">
            {MENU_TYPE_LABELS[item.menu_type]}
          </span>
        )}
      </div>
      {canEdit && (
        <div className="flex items-center gap-2">
          {item.menu_type !== "link" && (
            <button onClick={() => setMenuOpen(true)} className="text-md-on-surface-variant hover:text-md-on-surface" title="Настроить меню">
              <i className="ti ti-layout-grid text-sm" />
            </button>
          )}
          <button onClick={() => setEditing(true)} className="text-md-on-surface-variant hover:text-md-on-surface">
            <i className="ti ti-pencil text-sm" />
          </button>
          <button onClick={onDelete} className="text-md-on-surface-variant hover:text-md-error">
            <i className="ti ti-trash text-sm" />
          </button>
        </div>
      )}
      {menuOpen && item.menu_type !== "link" && (
        <MegaMenuEditor
          menuType={item.menu_type}
          initial={item.menu_content}
          onClose={() => setMenuOpen(false)}
          onSave={(content: NavMenuContent) => {
            onSave({ menu_content: content });
            setMenuOpen(false);
          }}
        />
      )}
    </div>
  );
}

export default function NavigationPage() {
  const canEdit = useCanEdit();
  const { create, update, remove, reorder } = useNavMutations();
  const [pendingDelete, setPendingDelete] = useState<NavItem | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const { data: items, isLoading } = useQuery({
    queryKey: ["nav-items"],
    queryFn: () => adminFetch<NavItem[]>("api/nav-items"),
  });

  const headerItems = (items || []).filter((i) => i.location === "header").sort((a, b) => a.sort_order - b.sort_order);
  const footerParents = (items || [])
    .filter((i) => i.location === "footer" && !i.parent_id)
    .sort((a, b) => a.sort_order - b.sort_order);
  const footerChildren = (parentId: string) =>
    (items || [])
      .filter((i) => i.location === "footer" && i.parent_id === parentId)
      .sort((a, b) => a.sort_order - b.sort_order);

  function reorderHeader(newOrder: NavItem[]) {
    reorder.mutate(newOrder.map((it, idx) => ({ id: it.id, sort_order: idx })));
  }

  if (isLoading) return <p className="md-body-medium text-md-on-surface-variant">Загрузка...</p>;

  return (
    <div>
      <h1 className="md-headline-small mb-6 text-md-on-surface">Навигация</h1>

      <Card elevation={1} outlined className="mb-6 p-4">
        <p className="md-title-small mb-3 text-md-on-surface-variant">Хедер</p>
        <div className="flex flex-col gap-2">
          {headerItems.map((item, index) => (
            <HeaderItemRow
              key={item.id}
              item={item}
              canEdit={canEdit}
              draggable
              onDragStart={() => setDragIndex(index)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                if (dragIndex === null || dragIndex === index) return;
                const reordered = [...headerItems];
                const [moved] = reordered.splice(dragIndex, 1);
                reordered.splice(index, 0, moved);
                setDragIndex(null);
                reorderHeader(reordered);
              }}
              onSave={(patch) => update.mutate({ id: item.id, body: { ...item, ...patch } })}
              onDelete={() => setPendingDelete(item)}
            />
          ))}
          {headerItems.length === 0 && <p className="text-[12px] text-md-on-surface-variant">Пунктов пока нет.</p>}
          {canEdit && (
            <AddForm
              onAdd={(label, url) =>
                create.mutate({ label, url, location: "header", parent_id: null, sort_order: headerItems.length })
              }
            />
          )}
        </div>
      </Card>

      <Card elevation={1} outlined className="p-4">
        <p className="md-title-small mb-3 text-md-on-surface-variant">Футер</p>
        <div className="flex flex-col gap-4">
          {footerParents.map((parent) => {
            const children = footerChildren(parent.id);
            return (
              <div key={parent.id} className="rounded-lg bg-md-surface-container-low p-3">
                <div className="mb-2 flex items-center justify-between">
                  <input
                    defaultValue={parent.label}
                    onBlur={(e) => {
                      if (e.target.value !== parent.label) update.mutate({ id: parent.id, body: { ...parent, label: e.target.value } });
                    }}
                    disabled={!canEdit}
                    className="rounded-md border border-transparent bg-transparent px-1 text-[13px] font-medium text-md-on-surface outline-none focus:border-md-outline-variant disabled:bg-transparent"
                  />
                  {canEdit && (
                    <button onClick={() => setPendingDelete(parent)} className="text-md-on-surface-variant hover:text-md-error">
                      <i className="ti ti-trash text-sm" />
                    </button>
                  )}
                </div>
                <div className="flex flex-col gap-2 pl-3">
                  {children.map((child) => (
                    <ItemRow
                      key={child.id}
                      item={child}
                      canEdit={canEdit}
                      onSave={(label, url) => update.mutate({ id: child.id, body: { ...child, label, url } })}
                      onDelete={() => setPendingDelete(child)}
                    />
                  ))}
                  {canEdit && (
                    <AddForm
                      placeholder="Ссылка"
                      onAdd={(label, url) =>
                        create.mutate({
                          label,
                          url,
                          location: "footer",
                          parent_id: parent.id,
                          sort_order: children.length,
                        })
                      }
                    />
                  )}
                </div>
              </div>
            );
          })}
          {canEdit && (
            <AddForm
              placeholder="Колонка"
              onAdd={(label) =>
                create.mutate({
                  label,
                  url: "#",
                  location: "footer",
                  parent_id: null,
                  sort_order: footerParents.length,
                })
              }
            />
          )}
        </div>
      </Card>

      <ConfirmDialog
        open={!!pendingDelete}
        title={`Удалить «${pendingDelete?.label}»?`}
        description={
          pendingDelete && footerParents.some((p) => p.id === pendingDelete.id)
            ? "Все вложенные ссылки этой колонки тоже будут удалены."
            : undefined
        }
        onConfirm={() => {
          if (pendingDelete) remove.mutate(pendingDelete.id);
          setPendingDelete(null);
        }}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
