"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminFetch } from "@/lib/admin-api";
import { useToast } from "@/lib/toast";
import { useCanEdit } from "@/lib/role-context";
import { MediaPicker } from "@/components/admin/MediaPicker";
import { Card } from "@/components/admin/m3/Card";
import { Button } from "@/components/admin/m3/Button";
import { Switch } from "@/components/admin/m3/Switch";
import type { SiteSettings } from "@/lib/admin-types";

const inputClass =
  "block w-full rounded-lg border border-md-outline-variant bg-transparent px-2.5 py-2 text-sm text-md-on-surface outline-none focus:border-md-primary";

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  // Deliberately a <div>, not a <label> — see the same note on Settings' Field: a native <label>
  // would forward clicks to the first labelable descendant, which misfires on nested widgets.
  return (
    <div className="block text-[13px] text-md-on-surface-variant">
      {label}
      <div className="mt-1.5">{children}</div>
      {hint && <p className="mt-1 text-[12px] text-md-on-surface-variant/70">{hint}</p>}
    </div>
  );
}

function SectionCard({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <Card elevation={1} outlined className="p-4">
      <p className="md-title-small mb-1 text-md-on-surface-variant">{title}</p>
      {description && <p className="md-body-small mb-3 text-md-on-surface-variant">{description}</p>}
      <div className={description ? "" : "mt-3"}>{children}</div>
    </Card>
  );
}

export default function SEOPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["settings"],
    queryFn: () => adminFetch<SiteSettings>("api/settings"),
  });

  if (isLoading || !data) return <p className="md-body-medium text-md-on-surface-variant">Загрузка...</p>;

  return <SEOForm initial={data} />;
}

function SEOForm({ initial }: { initial: SiteSettings }) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const canEdit = useCanEdit();
  const [values, setValues] = useState<SiteSettings>(initial);
  const [ogPickerOpen, setOgPickerOpen] = useState(false);
  const [orgLogoPickerOpen, setOrgLogoPickerOpen] = useState(false);

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

  function set<K extends keyof SiteSettings>(key: K, value: SiteSettings[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  const socialLinksCount = [values.social_twitter, values.social_github, values.social_linkedin].filter(Boolean).length;

  return (
    <div>
      <h1 className="md-headline-small mb-1 text-md-on-surface">SEO</h1>
      <p className="md-body-medium mb-6 text-md-on-surface-variant">
        Всё, что влияет на то, как сайт находят и показывают поисковики и AI-краулеры: мета-теги, подтверждение в
        вебмастерских, sitemap.xml, llms.txt и мгновенное уведомление поисковиков о публикациях.
      </p>

      <div className="flex flex-col gap-6">
        <SectionCard title="Мета-теги по умолчанию" description="Используются, если у конкретной страницы/поста/приложения своё значение не задано.">
          <div className="flex flex-col gap-4">
            <Field label="OG-изображение по умолчанию" hint="Показывается при расшаривании ссылки в соцсетях и мессенджерах, если у страницы нет своего.">
              <div className="flex items-center gap-3">
                {values.default_og_image_url && (
                  <img src={values.default_og_image_url} alt="" className="h-10 w-10 rounded-lg object-cover" />
                )}
                <Button variant="outlined" onClick={() => setOgPickerOpen(true)}>
                  Выбрать
                </Button>
              </div>
            </Field>

            <Field label="Шаблон title" hint="Используйте %s — будет заменено на заголовок конкретной страницы.">
              <input
                value={values.seo_title_template || ""}
                onChange={(e) => set("seo_title_template", e.target.value)}
                className={inputClass}
                placeholder="%s — lecode.tech"
              />
            </Field>

            <Field label="Meta description по умолчанию">
              <textarea
                value={values.seo_default_meta_description || ""}
                onChange={(e) => set("seo_default_meta_description", e.target.value)}
                rows={2}
                className={inputClass}
              />
            </Field>
          </div>
        </SectionCard>

        <SectionCard
          title="Подтверждение в поисковых системах"
          description="Коды верификации для вебмастерских панелей — вставляются в <head> как meta-теги, ничего больше настраивать не нужно."
        >
          <div className="grid grid-cols-3 gap-4">
            <Field label="Google Search Console">
              <input
                value={values.google_site_verification || ""}
                onChange={(e) => set("google_site_verification", e.target.value)}
                className={inputClass}
                placeholder="код верификации"
              />
            </Field>
            <Field label="Bing Webmaster">
              <input
                value={values.bing_site_verification || ""}
                onChange={(e) => set("bing_site_verification", e.target.value)}
                className={inputClass}
                placeholder="код верификации"
              />
            </Field>
            <Field label="Yandex Webmaster">
              <input
                value={values.yandex_site_verification || ""}
                onChange={(e) => set("yandex_site_verification", e.target.value)}
                className={inputClass}
                placeholder="код верификации"
              />
            </Field>
          </div>
        </SectionCard>

        <SectionCard title="Организация (schema.org)" description="Формируют JSON-LD Organization/WebSite в <head> — помогает поисковикам и AI понять, кто владелец сайта.">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Название организации">
              <input
                value={values.seo_organization_name || ""}
                onChange={(e) => set("seo_organization_name", e.target.value)}
                className={inputClass}
                placeholder={values.site_name || "lecode"}
              />
            </Field>
            <Field label="Лого организации (URL)">
              <div className="flex items-center gap-3">
                {(values.seo_organization_logo_url || values.logo_url) && (
                  <img src={values.seo_organization_logo_url || values.logo_url} alt="" className="h-9 w-9 rounded-lg object-cover" />
                )}
                <Button variant="outlined" onClick={() => setOrgLogoPickerOpen(true)}>
                  Выбрать
                </Button>
                {values.seo_organization_logo_url && (
                  <button
                    type="button"
                    onClick={() => set("seo_organization_logo_url", undefined)}
                    className="text-[12px] text-md-on-surface-variant hover:text-md-error"
                  >
                    Сбросить
                  </button>
                )}
              </div>
            </Field>
          </div>
          <p className="mt-3 text-[12px] text-md-on-surface-variant/70">
            {socialLinksCount > 0
              ? `sameAs подтягивается автоматически из ${socialLinksCount} ссылок, заданных в Настройки → Контакты и соцсети.`
              : "Добавьте Twitter/GitHub/LinkedIn в Настройки → Контакты и соцсети — они попадут в sameAs автоматически."}
          </p>
        </SectionCard>

        <Card elevation={0} className="bg-md-error-container/40 p-3">
          <Switch
            checked={values.seo_sitewide_noindex || false}
            onChange={(v) => set("seo_sitewide_noindex", v)}
            label="Noindex всего сайта (аварийный переключатель)"
          />
          <p className="md-body-small mt-1 text-md-on-surface-variant">
            Скрывает весь сайт из поисковиков (пустой sitemap.xml, Disallow: / в robots.txt). Используйте для staging
            или временной блокировки индексации.
          </p>
        </Card>

        <SectionCard
          title="Хлебные крошки и структурированные данные"
          description="Общесайтовые переключатели — полезно для SEO-экспериментов (A/B, диагностика проблем с индексацией)."
        >
          <div className="flex flex-col gap-3">
            <Switch
              checked={values.seo_show_breadcrumbs ?? true}
              onChange={(v) => set("seo_show_breadcrumbs", v)}
              label="Хлебные крошки"
            />
            <p className="md-body-small -mt-2 text-md-on-surface-variant">
              Видимая цепочка навигации и её BreadcrumbList JSON-LD на страницах блога, приложений и обычных
              страниц. На главной хлебных крошек нет.
            </p>
            <Switch
              checked={values.seo_json_ld_enabled ?? true}
              onChange={(v) => set("seo_json_ld_enabled", v)}
              label="Rich snippets (JSON-LD)"
            />
            <p className="md-body-small -mt-2 text-md-on-surface-variant">
              Структурированные данные ItemList, FAQPage, Article/Product и т.п. на всех страницах сайта (не
              затрагивает Organization/WebSite-разметку выше и хлебные крошки).
            </p>
          </div>
        </SectionCard>

        <SectionCard title="Проверочные файлы">
          <div className="flex flex-wrap gap-4 text-[13px]">
            <a href="/robots.txt" target="_blank" rel="noreferrer" className="text-md-on-surface underline hover:text-md-primary">
              robots.txt
            </a>
            <a href="/sitemap.xml" target="_blank" rel="noreferrer" className="text-md-on-surface underline hover:text-md-primary">
              sitemap.xml
            </a>
            <a href="/llms.txt" target="_blank" rel="noreferrer" className="text-md-on-surface underline hover:text-md-primary">
              llms.txt
            </a>
          </div>
        </SectionCard>

        <SectionCard
          title="sitemap.xml — дополнительные адреса"
          description="Главная, страницы, приложения и посты блога попадают в sitemap.xml автоматически — добавлять их вручную не нужно. Здесь можно добавить адреса, которых нет в CMS."
        >
          <SitemapExtraUrlsEditor items={values.sitemap_extra_urls || []} onChange={(items) => set("sitemap_extra_urls", items)} />
        </SectionCard>

        <SectionCard title="llms.txt" description="Переопределение для AI-краулеров (ChatGPT, Claude и т.п.). Оставьте пустым — тогда файл соберётся автоматически из опубликованных страниц, приложений и постов блога.">
          <textarea
            value={values.llms_txt_content || ""}
            onChange={(e) => set("llms_txt_content", e.target.value)}
            rows={8}
            placeholder="Оставьте пустым для авто-генерации"
            className={`${inputClass} font-mono text-xs`}
          />
        </SectionCard>

        <SectionCard title="IndexNow">
          <Switch
            checked={values.indexnow_enabled || false}
            onChange={(v) => set("indexnow_enabled", v)}
            label="Уведомлять поисковики сразу при публикации"
          />
          <p className="md-body-small mt-2 text-md-on-surface-variant">
            При публикации или переводе страницы/приложения/поста в «published» бэкенд сам отправляет адрес в IndexNow —
            это мгновенно доходит до Bing и Yandex (Google IndexNow не поддерживает, для него по-прежнему работает
            sitemap.xml + Google Search Console). Ключ подтверждения сгенерирован автоматически.
            {values.indexnow_key && (
              <>
                {" "}
                Файл проверки:{" "}
                <a href={`/api/${values.indexnow_key}.txt`} target="_blank" rel="noreferrer" className="text-md-on-surface underline">
                  /api/{values.indexnow_key}.txt
                </a>
                .
              </>
            )}
          </p>
        </SectionCard>

        {canEdit && (
          <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="w-fit">
            {saveMutation.isPending ? "Сохранение..." : "Сохранить"}
          </Button>
        )}
      </div>

      <MediaPicker
        open={ogPickerOpen}
        onClose={() => setOgPickerOpen(false)}
        onSelect={(item) => {
          set("default_og_image_url", item.url);
          setOgPickerOpen(false);
        }}
      />
      <MediaPicker
        open={orgLogoPickerOpen}
        onClose={() => setOrgLogoPickerOpen(false)}
        onSelect={(item) => {
          set("seo_organization_logo_url", item.url);
          setOrgLogoPickerOpen(false);
        }}
      />
    </div>
  );
}

type SitemapExtraUrl = NonNullable<SiteSettings["sitemap_extra_urls"]>[number];

function SitemapExtraUrlsEditor({ items, onChange }: { items: SitemapExtraUrl[]; onChange: (items: SitemapExtraUrl[]) => void }) {
  function update(i: number, patch: Partial<SitemapExtraUrl>) {
    const next = [...items];
    next[i] = { ...next[i], ...patch };
    onChange(next);
  }

  return (
    <div className="flex flex-col gap-2">
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-2">
          <input
            value={item.url}
            onChange={(e) => update(i, { url: e.target.value })}
            placeholder="/путь или https://..."
            className={`${inputClass} flex-1`}
          />
          {/* w-40 wraps a shrink-0 container rather than sitting on the <input> itself: inputClass
              already bakes in w-full, and a second width utility on the same element loses to it
              (same specificity, later in the stylesheet), so the input silently ignores w-40. */}
          <div className="w-40 shrink-0">
            <input
              type="date"
              value={item.lastmod || ""}
              onChange={(e) => update(i, { lastmod: e.target.value || undefined })}
              className={inputClass}
            />
          </div>
          <button type="button" onClick={() => onChange(items.filter((_, idx) => idx !== i))} className="shrink-0 text-md-on-surface-variant hover:text-md-error">
            <i className="ti ti-trash text-sm" />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...items, { url: "" }])}
        className="w-fit rounded-md border border-dashed border-md-outline-variant px-3 py-1.5 text-[12px] text-md-on-surface-variant hover:border-md-primary"
      >
        + Добавить адрес
      </button>
      <a href="/sitemap.xml" target="_blank" rel="noreferrer" className="mt-1 w-fit text-[12px] text-md-on-surface-variant underline hover:text-md-on-surface">
        Открыть текущий sitemap.xml
      </a>
    </div>
  );
}
