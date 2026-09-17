"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminFetch } from "@/lib/admin-api";
import { useToast } from "@/lib/toast";
import { useCanEdit } from "@/lib/role-context";
import { Card } from "@/components/admin/m3/Card";
import { Button } from "@/components/admin/m3/Button";
import { Chip } from "@/components/admin/m3/Chip";
import { Switch } from "@/components/admin/m3/Switch";
import { SegmentedButton } from "@/components/admin/m3/SegmentedButton";
import type { SiteTemplateItem } from "@/lib/admin-types";

const inputClass =
  "block w-full rounded-md border border-md-outline-variant bg-transparent px-2.5 py-1.5 text-[13px] text-md-on-surface outline-none focus:border-md-outline";

function TemplateConfigForm({ template, onSaved }: { template: SiteTemplateItem; onSaved: () => void }) {
  const { showToast } = useToast();
  const [name, setName] = useState(template.name);
  const [description, setDescription] = useState(template.description || "");
  const [headerConfig, setHeaderConfig] = useState(template.header_config);
  const [footerConfig, setFooterConfig] = useState(template.footer_config);
  const [themeConfig, setThemeConfig] = useState(template.theme_config || {});

  const saveMutation = useMutation({
    mutationFn: () =>
      adminFetch(`api/templates/${template.id}`, {
        method: "PUT",
        body: {
          name,
          description: description || null,
          header_config: headerConfig,
          footer_config: footerConfig,
          theme_config: themeConfig,
        },
      }),
    onSuccess: () => {
      showToast("Сохранено");
      onSaved();
    },
    onError: (err: Error) => showToast(err.message, "error"),
  });

  return (
    <div className="flex flex-col gap-3 border-t border-md-outline-variant p-4">
      <div className="grid grid-cols-2 gap-3">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Название" className={inputClass} />
        <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Описание" className={inputClass} />
      </div>

      <div>
        <p className="md-body-small mb-1.5 text-md-on-surface-variant">Header — выравнивание меню</p>
        <SegmentedButton
          segments={[
            { value: "left", label: "Слева" },
            { value: "center", label: "По центру" },
            { value: "right", label: "Справа" },
          ]}
          value={headerConfig.menu_alignment || "right"}
          onChange={(v) => setHeaderConfig({ ...headerConfig, menu_alignment: v })}
        />
      </div>

      <div>
        <p className="md-body-small mb-1.5 text-md-on-surface-variant">Логотип</p>
        <SegmentedButton
          segments={[
            { value: "left", label: "Слева" },
            { value: "right", label: "Справа" },
          ]}
          value={headerConfig.logo_position || "left"}
          onChange={(v) => setHeaderConfig({ ...headerConfig, logo_position: v })}
        />
      </div>

      <div>
        <p className="md-body-small mb-1.5 text-md-on-surface-variant">Header — поведение при скролле</p>
        <SegmentedButton
          segments={[
            { value: "static", label: "Обычный" },
            { value: "fixed", label: "Зафиксирован" },
            { value: "floating", label: "Плавающий" },
          ]}
          value={!headerConfig.sticky ? "static" : headerConfig.sticky_style === "floating" ? "floating" : "fixed"}
          onChange={(v) =>
            setHeaderConfig(
              v === "static"
                ? { ...headerConfig, sticky: false }
                : { ...headerConfig, sticky: true, sticky_style: v === "floating" ? "floating" : "fixed" }
            )
          }
        />
        <p className="md-body-small mt-1 text-md-on-surface-variant">
          Обычный — уходит вместе со страницей при прокрутке. Зафиксирован — остаётся наверху без изменений. Плавающий —
          остаётся наверху, но при прокрутке вниз становится полупрозрачным с лёгкой тенью, а у самого верха страницы — снова
          непрозрачным без тени.
        </p>
      </div>
      <Switch
        checked={!!headerConfig.show_cta_button}
        onChange={(v) => setHeaderConfig({ ...headerConfig, show_cta_button: v })}
        label="Кнопка призыва к действию в хедере"
      />

      <div>
        <p className="md-body-small mb-1.5 text-md-on-surface-variant">Footer — выравнивание колонок</p>
        <SegmentedButton
          segments={[
            { value: "left", label: "Слева" },
            { value: "center", label: "По центру" },
            { value: "right", label: "Справа" },
          ]}
          value={footerConfig.menu_alignment || "left"}
          onChange={(v) => setFooterConfig({ ...footerConfig, menu_alignment: v })}
        />
      </div>

      <div>
        <p className="md-body-small mb-1.5 text-md-on-surface-variant">Цвета (пусто = как раньше, навигационная тёмная палитра)</p>
        <div className="grid grid-cols-3 gap-2">
          {(
            [
              ["accent", "Акцент"],
              ["text", "Текст"],
              ["text_muted", "Вторичный текст"],
              ["card_bg", "Фон карточек"],
              ["page_bg", "Фон страницы"],
              ["section_alt_bg", "Фон чередующихся секций"],
              ["footer_bg", "Фон футера"],
            ] as const
          ).map(([key, label]) => (
            <input
              key={key}
              value={themeConfig[key] || ""}
              onChange={(e) => setThemeConfig({ ...themeConfig, [key]: e.target.value || undefined })}
              placeholder={label}
              className={inputClass}
            />
          ))}
        </div>
      </div>

      <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="w-fit">
        {saveMutation.isPending ? "Сохранение..." : "Сохранить"}
      </Button>
    </div>
  );
}

export default function TemplatesPage() {
  const canEdit = useCanEdit();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: templates, isLoading } = useQuery({
    queryKey: ["templates"],
    queryFn: () => adminFetch<SiteTemplateItem[]>("api/templates"),
  });

  const activateMutation = useMutation({
    mutationFn: (id: string) => adminFetch(`api/templates/${id}/activate`, { method: "POST" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templates"] });
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      showToast("Шаблон активирован");
    },
    onError: (err: Error) => showToast(err.message, "error"),
  });

  return (
    <div>
      <h1 className="md-headline-small mb-2 text-md-on-surface">Шаблоны сайта</h1>
      <p className="md-body-medium mb-6 text-md-on-surface-variant">
        Шаблон задаёт header/footer и стартовый набор блоков главной страницы. Сами блоки остаются редактируемыми одинаково независимо от выбранного шаблона.
      </p>

      {isLoading && <p className="md-body-medium text-md-on-surface-variant">Загрузка...</p>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {(templates || []).map((t) => (
          <Card key={t.id} elevation={1} className="overflow-hidden">
            <button
              type="button"
              onClick={() => setExpandedId(expandedId === t.id ? null : t.id)}
              className="flex w-full flex-col text-left"
            >
              <div className="flex h-32 items-center justify-center bg-md-surface-container-high">
                {t.preview_image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={t.preview_image_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <i className="ti ti-layout-dashboard text-3xl text-md-on-surface-variant" />
                )}
              </div>
              <div className="p-4">
                <div className="mb-1 flex items-center gap-2">
                  <p className="md-title-small m-0 text-md-on-surface">{t.name}</p>
                  {t.is_active && <Chip tone="success">Current</Chip>}
                </div>
                <p className="md-body-small m-0 text-md-on-surface-variant">{t.description}</p>
              </div>
            </button>

            {canEdit && (
              <div className="flex items-center justify-between border-t border-md-outline-variant px-4 py-2.5">
                <button onClick={() => setExpandedId(expandedId === t.id ? null : t.id)} className="md-body-small text-md-on-surface-variant hover:text-md-on-surface">
                  {expandedId === t.id ? "Свернуть настройки" : "Настроить"}
                </button>
                {!t.is_active && (
                  <Button variant="outlined" onClick={() => activateMutation.mutate(t.id)} disabled={activateMutation.isPending} className="px-3 py-1.5">
                    Activate
                  </Button>
                )}
              </div>
            )}

            {expandedId === t.id && <TemplateConfigForm template={t} onSaved={() => queryClient.invalidateQueries({ queryKey: ["templates"] })} />}
          </Card>
        ))}
      </div>
    </div>
  );
}
