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
import type { SiteSettings } from "@/lib/admin-types";

const TABS = [
  { id: "general", label: "General", icon: "ti-settings" },
  { id: "seo", label: "SEO defaults", icon: "ti-search" },
  { id: "social", label: "Social", icon: "ti-share" },
  { id: "analytics", label: "Analytics", icon: "ti-chart-bar" },
  { id: "advanced", label: "Advanced", icon: "ti-code" },
];

const inputClass =
  "block w-full rounded-lg border border-md-outline-variant bg-transparent px-2.5 py-2 text-sm text-md-on-surface outline-none focus:border-md-primary";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-[13px] text-md-on-surface-variant">
      {label}
      <div className="mt-1.5">{children}</div>
    </label>
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
  const [ogPickerOpen, setOgPickerOpen] = useState(false);

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

          <Field label="Копирайт в футере">
            <input
              value={values.footer_copyright || ""}
              onChange={(e) => set("footer_copyright", e.target.value)}
              className={inputClass}
              placeholder="© 2026 lecode. All rights reserved."
            />
          </Field>
        </div>

        <div hidden={tab !== "seo"} className="flex flex-col gap-4">
          <Field label="OG image по умолчанию">
            <div className="flex items-center gap-3">
              {values.default_og_image_url && (
                <img src={values.default_og_image_url} alt="" className="h-10 w-10 rounded-lg object-cover" />
              )}
              <Button variant="outlined" onClick={() => setOgPickerOpen(true)}>
                Выбрать
              </Button>
            </div>
          </Field>
        </div>

        <div hidden={tab !== "social"} className="flex flex-col gap-4">
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
        </div>

        <div hidden={tab !== "analytics"} className="grid grid-cols-2 gap-4">
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
          <Field label="ID">
            <input
              value={values.analytics_id || ""}
              onChange={(e) => set("analytics_id", e.target.value)}
              className={inputClass}
              placeholder="G-XXXXXXX"
            />
          </Field>
        </div>

        <div hidden={tab !== "advanced"} className="flex flex-col gap-4">
          <Field label="llms.txt (переопределение, оставьте пустым для авто-генерации)">
            <textarea
              value={values.llms_txt_content || ""}
              onChange={(e) => set("llms_txt_content", e.target.value)}
              rows={6}
              className={`${inputClass} font-mono text-xs`}
            />
          </Field>
        </div>

        {canEdit && (
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
      <MediaPicker
        open={ogPickerOpen}
        onClose={() => setOgPickerOpen(false)}
        onSelect={(item) => {
          set("default_og_image_url", item.url);
          setOgPickerOpen(false);
        }}
      />
    </div>
  );
}
