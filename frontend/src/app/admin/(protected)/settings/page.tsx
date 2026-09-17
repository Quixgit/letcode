"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminFetch } from "@/lib/admin-api";
import { useToast } from "@/lib/toast";
import { useCanEdit } from "@/lib/role-context";
import { MediaPicker } from "@/components/admin/MediaPicker";
import { Card } from "@/components/admin/m3/Card";
import { Button } from "@/components/admin/m3/Button";
import { Switch } from "@/components/admin/m3/Switch";
import { SegmentedButton } from "@/components/admin/m3/SegmentedButton";
import { FormTabs } from "@/components/admin/m3/FormTabs";
import { useAdminTheme } from "@/lib/admin-theme";
import type { SettingsHistoryItem, SiteSettings } from "@/lib/admin-types";

const TABS = [
  { id: "general", label: "Общее", icon: "ti-settings" },
  { id: "contacts", label: "Контакты и соцсети", icon: "ti-share" },
  { id: "analytics", label: "Аналитика", icon: "ti-chart-bar" },
  { id: "history", label: "История", icon: "ti-history" },
];

const inputClass =
  "block w-full rounded-lg border border-md-outline-variant bg-transparent px-2.5 py-2 text-sm text-md-on-surface outline-none focus:border-md-primary";

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  // Deliberately a <div>, not a <label>: a native <label> forwards any click within its bounds
  // to the first labelable descendant (input/button/etc), which misfires when a field nests its
  // own interactive widgets (see PageForm/BlogPostForm's Field for the bug this caused there).
  return (
    <div className="block text-[13px] text-md-on-surface-variant">
      {label}
      <div className="mt-1.5">{children}</div>
      {hint && <p className="mt-1 text-[12px] text-md-on-surface-variant/70">{hint}</p>}
    </div>
  );
}

export default function SettingsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["settings"],
    queryFn: () => adminFetch<SiteSettings>("api/settings"),
  });

  if (isLoading || !data) return <p className="md-body-medium text-md-on-surface-variant">Загрузка...</p>;

  return <SettingsForm initial={data} />;
}

/** Mounted once `data` has loaded, so local draft state derives from props at mount instead of
 * syncing via an effect — a background refetch of `settings` then can't clobber in-progress edits. */
function SettingsForm({ initial }: { initial: SiteSettings }) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const canEdit = useCanEdit();
  const { mode, toggle } = useAdminTheme();
  const [tab, setTab] = useState("general");
  const [values, setValues] = useState<SiteSettings>(initial);
  const [logoPickerOpen, setLogoPickerOpen] = useState(false);
  const [faviconPickerOpen, setFaviconPickerOpen] = useState(false);

  const saveMutation = useMutation({
    mutationFn: () => adminFetch<SiteSettings>("api/settings", { method: "PUT", body: values }),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      queryClient.invalidateQueries({ queryKey: ["public-settings"] });
      setValues(result);
      showToast("Настройки сохранены");
    },
    onError: (err: Error) => showToast(err.message, "error"),
  });

  const siteModeMutation = useMutation({
    mutationFn: (site_mode: SiteSettings["site_mode"]) =>
      adminFetch<SiteSettings>("api/settings", { method: "PUT", body: { site_mode } }),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      queryClient.invalidateQueries({ queryKey: ["public-settings"] });
      setValues((prev) => ({ ...prev, site_mode: result.site_mode }));
      showToast("Режим сайта применён");
    },
    onError: (err: Error) => showToast(err.message, "error"),
  });

  function set<K extends keyof SiteSettings>(key: K, value: SiteSettings[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <div>
      <h1 className="md-headline-small mb-6 text-md-on-surface">Настройки сайта</h1>

      <FormTabs tabs={TABS} active={tab} onChange={setTab} />

      <div className="mt-6 flex flex-col gap-6">
        <div hidden={tab !== "general"} className="flex flex-col gap-6">
          <Card elevation={1} outlined className="p-4">
            <p className="md-title-small mb-3 text-md-on-surface-variant">Внешний вид админки</p>
            <Switch
              checked={mode === "dark"}
              onChange={toggle}
              label={mode === "dark" ? "Тёмная тема" : "Светлая тема"}
            />
          </Card>

          <Card elevation={1} outlined className="p-4">
            <p className="md-title-small mb-3 text-md-on-surface-variant">Режим сайта</p>
            <SegmentedButton
              segments={[
                { value: "landing", label: "Landing" },
                { value: "blog", label: "Blog" },
                { value: "full", label: "Full" },
              ]}
              value={values.site_mode || "landing"}
              onChange={(v) => {
                set("site_mode", v);
                siteModeMutation.mutate(v);
              }}
            />
            <p className="md-body-small mt-2 text-md-on-surface-variant">
              {(values.site_mode || "landing") === "landing" &&
                "Витрина приложений на первом плане, блог — во второстепенной роли. Влияет на весь сайт, применяется сразу."}
              {values.site_mode === "blog" &&
                "Главная — лента блога, Blog становится первым пунктом навигации, приложения уходят в подраздел меню."}
              {values.site_mode === "full" &&
                "Максимально насыщенная версия: полная навигация с мега-меню для Apps и Blog, богатая витрина + активный блог + отзывы на главной."}
            </p>
          </Card>

          <Card elevation={1} outlined className="p-4">
            <p className="md-title-small mb-1 text-md-on-surface-variant">Композиция главной страницы</p>
            <p className="md-body-medium m-0 text-md-on-surface-variant">
              Режим (Landing / Blog / Minimal), блоки и секции главной теперь настраиваются на отдельном экране —{" "}
              <Link href="/admin/homepage" className="text-md-on-surface underline">
                /admin/homepage
              </Link>
              .
            </p>
          </Card>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Название сайта">
              <input
                value={values.site_name || ""}
                onChange={(e) => set("site_name", e.target.value)}
                className={inputClass}
                placeholder="lecode"
              />
            </Field>
            <Field label="Слоган">
              <input
                value={values.tagline || ""}
                onChange={(e) => set("tagline", e.target.value)}
                className={inputClass}
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Логотип">
              <div className="flex items-center gap-3">
                {values.logo_url && (
                  <img src={values.logo_url} alt="" className="h-10 w-10 rounded-lg object-cover" />
                )}
                <Button variant="outlined" onClick={() => setLogoPickerOpen(true)}>
                  Выбрать
                </Button>
              </div>
            </Field>
            <Field label="Favicon">
              <div className="flex items-center gap-3">
                {values.favicon_url && (
                  <img src={values.favicon_url} alt="" className="h-10 w-10 rounded-lg object-cover" />
                )}
                <Button variant="outlined" onClick={() => setFaviconPickerOpen(true)}>
                  Выбрать
                </Button>
              </div>
            </Field>
          </div>

          <Card elevation={1} outlined className="p-4">
            <p className="md-title-small mb-3 text-md-on-surface-variant">Блог</p>
            <p className="md-body-small mb-2 text-md-on-surface-variant">Колонок в сетке /blog</p>
            <SegmentedButton
              segments={[
                { value: "1", label: "1" },
                { value: "2", label: "2" },
                { value: "3", label: "3" },
              ]}
              value={String(values.blog_columns || 3)}
              onChange={(v) => set("blog_columns", Number(v) as 1 | 2 | 3)}
            />
          </Card>

          <Card elevation={1} outlined className="p-4">
            <Switch
              checked={values.show_decorative_backgrounds ?? true}
              onChange={(checked) => set("show_decorative_backgrounds", checked)}
              label="Фоновые декоративные иллюстрации"
            />
            <p className="md-body-small mt-2 text-md-on-surface-variant">
              Едва заметные тематические фоны на Hero и Services-блоках главной. Выключите, если сайт используется под другую тематику.
            </p>
          </Card>

          <Field label="Копирайт в футере">
            <input
              value={values.footer_copyright || ""}
              onChange={(e) => set("footer_copyright", e.target.value)}
              className={inputClass}
              placeholder="© 2026 lecode. All rights reserved."
            />
          </Field>
        </div>

        <div hidden={tab !== "contacts"} className="flex flex-col gap-4">
          <Card elevation={0} outlined className="p-3">
            <p className="md-body-small text-md-on-surface-variant">
              Мета-теги, sitemap.xml, llms.txt, IndexNow и остальные настройки для поисковиков и AI-краулеров переехали
              на отдельную страницу —{" "}
              <Link href="/admin/seo" className="text-md-on-surface underline">
                /admin/seo
              </Link>
              .
            </p>
          </Card>

          <Field label="Twitter / X">
            <input
              value={values.social_twitter || ""}
              onChange={(e) => set("social_twitter", e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="GitHub">
            <input
              value={values.social_github || ""}
              onChange={(e) => set("social_github", e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="LinkedIn">
            <input
              value={values.social_linkedin || ""}
              onChange={(e) => set("social_linkedin", e.target.value)}
              className={inputClass}
            />
          </Field>

          <Card elevation={1} outlined className="p-4">
            <p className="md-title-small mb-1 text-md-on-surface-variant">Контакты (футер)</p>
            <p className="md-body-small mb-3 text-md-on-surface-variant">
              Пустые поля просто не показываются в футере — не заполняйте то, чего на самом деле нет.
            </p>
            <div className="flex flex-col gap-3">
              <Field label="Email">
                <input value={values.contact_email || ""} onChange={(e) => set("contact_email", e.target.value)} className={inputClass} placeholder="hello@lecode.tech" />
              </Field>
              <Field label="Телефон">
                <input value={values.contact_phone || ""} onChange={(e) => set("contact_phone", e.target.value)} className={inputClass} placeholder="Оставьте пустым, если нет" />
              </Field>
              <Field label="Адрес">
                <input value={values.contact_address || ""} onChange={(e) => set("contact_address", e.target.value)} className={inputClass} placeholder="Оставьте пустым, если нет" />
              </Field>
            </div>
          </Card>

          <Card elevation={1} outlined className="p-4">
            <p className="md-title-small mb-1 text-md-on-surface-variant">Сертификации / бейджи (футер)</p>
            <p className="md-body-small mb-3 text-md-on-surface-variant">
              Опционально. Если список пуст, секция в футере не отображается вообще.
            </p>
            <CertificationsEditor
              items={values.footer_certifications || []}
              onChange={(items) => set("footer_certifications", items)}
            />
          </Card>

          <Card elevation={1} outlined className="p-4">
            <p className="md-title-small mb-1 text-md-on-surface-variant">Ссылки на приложение (футер)</p>
            <p className="md-body-small mb-3 text-md-on-surface-variant">
              Опционально — если не задано, футер берёт ссылки первого опубликованного приложения из /admin/apps.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <Field label="App Store">
                <input
                  value={values.footer_app_store_url || ""}
                  onChange={(e) => set("footer_app_store_url", e.target.value)}
                  className={inputClass}
                  placeholder="https://apps.apple.com/..."
                />
              </Field>
              <Field label="Google Play">
                <input
                  value={values.footer_google_play_url || ""}
                  onChange={(e) => set("footer_google_play_url", e.target.value)}
                  className={inputClass}
                  placeholder="https://play.google.com/..."
                />
              </Field>
            </div>
          </Card>
        </div>

        <div hidden={tab !== "analytics"} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Провайдер">
              <select
                value={values.analytics_provider || "none"}
                onChange={(e) => set("analytics_provider", e.target.value as SiteSettings["analytics_provider"])}
                className={inputClass}
              >
                <option value="none">Не используется</option>
                <option value="google">Google Analytics</option>
                <option value="plausible">Plausible</option>
              </select>
            </Field>
            <Field
              label={values.analytics_provider === "plausible" ? "Домен сайта" : "Measurement ID"}
              hint={
                values.analytics_provider === "plausible"
                  ? "Обычно совпадает с доменом сайта, например lecode.tech."
                  : values.analytics_provider === "google"
                    ? "Measurement ID из GA4, вида G-XXXXXXX."
                    : undefined
              }
            >
              <input
                value={values.analytics_id || ""}
                onChange={(e) => set("analytics_id", e.target.value)}
                className={inputClass}
                placeholder={values.analytics_provider === "plausible" ? "lecode.tech" : "G-XXXXXXX"}
              />
            </Field>
          </div>
          {values.analytics_provider && values.analytics_provider !== "none" && !values.analytics_id && (
            <p className="text-[12px] text-md-on-surface-variant">
              Без ID скрипт аналитики не подключится — провайдер выбран, но трекинг не заработает.
            </p>
          )}
        </div>

        <div hidden={tab !== "history"}>
          <SettingsHistoryTab />
        </div>

        {canEdit && tab !== "history" && (
          <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="w-fit">
            {saveMutation.isPending ? "Сохранение..." : "Сохранить"}
          </Button>
        )}
      </div>

      <MediaPicker
        open={logoPickerOpen}
        onClose={() => setLogoPickerOpen(false)}
        onSelect={(item) => {
          set("logo_media_id", item.id);
          set("logo_url", item.url);
          setLogoPickerOpen(false);
        }}
      />
      <MediaPicker
        open={faviconPickerOpen}
        onClose={() => setFaviconPickerOpen(false)}
        onSelect={(item) => {
          set("favicon_media_id", item.id);
          set("favicon_url", item.url);
          setFaviconPickerOpen(false);
        }}
      />
    </div>
  );
}

function formatValue(v: unknown): string {
  if (v === null || v === undefined) return "—";
  if (typeof v === "string") return v;
  return JSON.stringify(v);
}

function SettingsHistoryTab() {
  const { data, isLoading } = useQuery({
    queryKey: ["settings-history"],
    queryFn: () => adminFetch<SettingsHistoryItem[]>("api/settings/history"),
  });

  if (isLoading) return <p className="md-body-medium text-md-on-surface-variant">Загрузка...</p>;
  if (!data || data.length === 0) {
    return <p className="md-body-medium text-md-on-surface-variant">Изменений пока не было.</p>;
  }

  return (
    <Card elevation={1} className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-[13px]">
          <thead>
            <tr className="border-b border-md-outline-variant text-md-on-surface-variant">
              <th className="whitespace-nowrap px-4 py-2 font-normal">Ключ</th>
              <th className="whitespace-nowrap px-4 py-2 font-normal">Было</th>
              <th className="whitespace-nowrap px-4 py-2 font-normal">Стало</th>
              <th className="whitespace-nowrap px-4 py-2 font-normal">Кто</th>
              <th className="whitespace-nowrap px-4 py-2 font-normal">Когда</th>
            </tr>
          </thead>
          <tbody>
            {data.map((h) => (
              <tr key={h.id} className="border-b border-md-outline-variant last:border-0 align-top">
                <td className="whitespace-nowrap px-4 py-2 font-mono text-[12px] text-md-on-surface">{h.key}</td>
                <td className="max-w-64 truncate px-4 py-2 text-md-on-surface-variant" title={formatValue(h.old_value)}>
                  {formatValue(h.old_value)}
                </td>
                <td className="max-w-64 truncate px-4 py-2 text-md-on-surface" title={formatValue(h.new_value)}>
                  {formatValue(h.new_value)}
                </td>
                <td className="whitespace-nowrap px-4 py-2 text-md-on-surface-variant">{h.changed_by_email || "—"}</td>
                <td className="whitespace-nowrap px-4 py-2 text-md-on-surface-variant">
                  {new Date(h.created_at).toLocaleString("ru-RU")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

type Certification = NonNullable<SiteSettings["footer_certifications"]>[number];

function CertificationsEditor({ items, onChange }: { items: Certification[]; onChange: (items: Certification[]) => void }) {
  const [pickerForIndex, setPickerForIndex] = useState<number | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  function update(i: number, patch: Partial<Certification>) {
    const next = [...items];
    next[i] = { ...next[i], ...patch };
    onChange(next);
  }

  return (
    <div className="flex flex-col gap-2">
      {items.map((item, i) => (
        <div
          key={i}
          draggable
          onDragStart={() => setDragIndex(i)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={() => {
            if (dragIndex === null || dragIndex === i) return;
            const next = [...items];
            const [moved] = next.splice(dragIndex, 1);
            next.splice(i, 0, moved);
            setDragIndex(null);
            onChange(next);
          }}
          className="flex items-center gap-2 rounded-md border border-md-outline-variant p-2"
        >
          <i className="ti ti-grip-vertical shrink-0 cursor-grab text-md-on-surface-variant" />
          {item.image_url ? (
            <img src={item.image_url} alt="" className="h-9 w-9 shrink-0 rounded object-contain" />
          ) : (
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded border border-dashed border-md-outline-variant text-md-on-surface-variant">
              <i className="ti ti-photo text-sm" />
            </div>
          )}
          <button type="button" onClick={() => setPickerForIndex(i)} className="shrink-0 text-[11px] text-md-on-surface-variant hover:text-md-primary">
            Картинка
          </button>
          <input value={item.caption} onChange={(e) => update(i, { caption: e.target.value })} placeholder="Подпись (например, ISO 27001 Certified)" className={`${inputClass} flex-1`} />
          <button type="button" onClick={() => onChange(items.filter((_, idx) => idx !== i))} className="shrink-0 text-md-on-surface-variant hover:text-md-error">
            <i className="ti ti-trash text-sm" />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...items, { caption: "" }])}
        className="w-fit rounded-md border border-dashed border-md-outline-variant px-3 py-1.5 text-[12px] text-md-on-surface-variant hover:border-md-primary"
      >
        + Добавить
      </button>
      <MediaPicker
        open={pickerForIndex !== null}
        onClose={() => setPickerForIndex(null)}
        onSelect={(item) => {
          if (pickerForIndex !== null) update(pickerForIndex, { media_id: item.id, image_url: item.url });
          setPickerForIndex(null);
        }}
      />
    </div>
  );
}
