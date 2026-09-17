"use client";

import { useState } from "react";
import { MediaPicker } from "@/components/admin/MediaPicker";
import { CategoryAutocomplete } from "@/components/admin/CategoryAutocomplete";
import { FeaturesEditor } from "@/components/admin/FeaturesEditor";
import { CharCounter } from "@/components/admin/CharCounter";
import { SeoPreview } from "@/components/admin/SeoPreview";
import { SeoChecklist } from "@/components/admin/SeoChecklist";
import { Switch } from "@/components/admin/m3/Switch";
import { FeatureSectionsEditor } from "@/components/admin/FeatureSectionsEditor";
import { UseCaseTabsEditor } from "@/components/admin/UseCaseTabsEditor";
import { ScreenshotGallery } from "@/components/admin/ScreenshotGallery";
import { FormTabs } from "@/components/admin/m3/FormTabs";
import { useSaveShortcut, useUnsavedChangesWarning } from "@/lib/use-form-shortcuts";
import type { AppDetail, AppScreenshot, FeatureSection, UseCaseTab } from "@/lib/admin-types";

const TABS = [
  { id: "general", label: "General", icon: "ti-info-circle" },
  { id: "content", label: "Content", icon: "ti-align-left" },
  { id: "media", label: "Media", icon: "ti-photo" },
  { id: "seo", label: "SEO", icon: "ti-search" },
  { id: "links", label: "Links", icon: "ti-link" },
];

export interface AppFormValues {
  slug: string;
  name: string;
  category: string;
  icon_media_id: string;
  icon_url: string;
  short_description: string;
  description: string;
  features: string[];
  privacy_policy_content: string;
  instructions_content: string;
  google_play_url: string;
  app_store_url: string;
  website_url: string;
  pricing_note: string;
  sort_order: number;
  meta_title: string;
  meta_description: string;
  og_image_url: string;
  canonical_url: string;
  noindex: boolean;
  structured_data: string;
  show_on_homepage: boolean;
  hero_image_media_id: string;
  hero_image_url: string;
  rating: string;
  rating_count: string;
  feature_sections: FeatureSection[];
  use_case_tabs: UseCaseTab[];
}

function toFormValues(app?: AppDetail): AppFormValues {
  return {
    slug: app?.slug || "",
    name: app?.name || "",
    category: app?.category || "",
    icon_media_id: app?.icon_media_id || "",
    icon_url: "",
    short_description: app?.short_description || "",
    description: app?.description || "",
    features: app?.features || [],
    privacy_policy_content: app?.privacy_policy_content || "",
    instructions_content: app?.instructions_content || "",
    google_play_url: app?.google_play_url || "",
    app_store_url: app?.app_store_url || "",
    website_url: app?.website_url || "",
    pricing_note: app?.pricing_note || "",
    sort_order: app?.sort_order ?? 0,
    meta_title: app?.meta_title || "",
    meta_description: app?.meta_description || "",
    og_image_url: app?.og_image_url || "",
    canonical_url: app?.canonical_url || "",
    noindex: app?.noindex || false,
    structured_data: app?.structured_data ? JSON.stringify(app.structured_data, null, 2) : "",
    show_on_homepage: app?.show_on_homepage ?? true,
    hero_image_media_id: app?.hero_image_media_id || "",
    hero_image_url: app?.hero_image_url || "",
    rating: app?.rating != null ? String(app.rating) : "",
    rating_count: app?.rating_count != null ? String(app.rating_count) : "",
    feature_sections: app?.feature_sections || [],
    use_case_tabs: app?.use_case_tabs || [],
  };
}

const inputClass =
  "block w-full rounded-lg border border-md-outline-variant px-2.5 py-2 text-sm text-md-on-surface outline-none focus:border-md-primary";

interface AppFormProps {
  initial?: AppDetail;
  initialIconUrl?: string;
  appId?: string;
  screenshots?: AppScreenshot[];
  submitting: boolean;
  submitLabel: string;
  onSubmit: (values: AppFormValues) => void;
}

export function AppForm({ initial, initialIconUrl, appId, screenshots, submitting, submitLabel, onSubmit }: AppFormProps) {
  const [values, setValues] = useState<AppFormValues>(() => ({
    ...toFormValues(initial),
    icon_url: initialIconUrl || "",
  }));
  const [tab, setTab] = useState("general");
  const [iconPickerOpen, setIconPickerOpen] = useState(false);
  const [heroPickerOpen, setHeroPickerOpen] = useState(false);
  const [ogPickerOpen, setOgPickerOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);

  function set<K extends keyof AppFormValues>(key: K, value: AppFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
    setDirty(true);
  }

  function submit() {
    setError(null);

    if (!values.slug.trim() || !/^[a-z0-9-]+$/.test(values.slug.trim())) {
      setError("Slug обязателен и может содержать только строчные буквы, цифры и дефисы");
      return;
    }
    if (!values.name.trim()) {
      setError("Название обязательно");
      return;
    }
    if (values.structured_data.trim()) {
      try {
        JSON.parse(values.structured_data);
      } catch {
        setError("Поле «Structured data» должно быть корректным JSON");
        return;
      }
    }

    setDirty(false);
    onSubmit(values);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    submit();
  }

  useSaveShortcut(submit);
  useUnsavedChangesWarning(dirty);

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error && <p className="m-0 rounded-lg bg-md-error-container px-3 py-2 text-[13px] text-md-error">{error}</p>}

      <FormTabs tabs={TABS} active={tab} onChange={setTab} />

      <div hidden={tab !== "general"} className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Slug">
            <input
              value={values.slug}
              onChange={(e) => set("slug", e.target.value)}
              className={inputClass}
              placeholder="blare"
            />
          </Field>
          <Field label="Название">
            <input value={values.name} onChange={(e) => set("name", e.target.value)} className={inputClass} />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Категория">
            <CategoryAutocomplete value={values.category} onChange={(v) => set("category", v)} className={inputClass} />
          </Field>
          <Field label="Порядок сортировки">
            <input
              type="number"
              value={values.sort_order}
              onChange={(e) => set("sort_order", Number(e.target.value))}
              className={inputClass}
            />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Рейтинг (0–5, опционально)">
            <input
              type="number"
              step="0.1"
              min="0"
              max="5"
              value={values.rating}
              onChange={(e) => set("rating", e.target.value)}
              className={inputClass}
              placeholder="4.8"
            />
          </Field>
          <Field label="Количество отзывов (опционально)">
            <input
              type="number"
              min="0"
              value={values.rating_count}
              onChange={(e) => set("rating_count", e.target.value)}
              className={inputClass}
              placeholder="255"
            />
          </Field>
        </div>

        <Switch
          checked={values.show_on_homepage}
          onChange={(v) => set("show_on_homepage", v)}
          label="Показывать на главной странице"
        />

        <Field label="Короткое описание">
          <textarea
            value={values.short_description}
            onChange={(e) => set("short_description", e.target.value)}
            rows={2}
            className={inputClass}
          />
        </Field>
      </div>

      <div hidden={tab !== "content"} className="flex flex-col gap-4">
        <Field label="Полное описание">
          <textarea
            value={values.description}
            onChange={(e) => set("description", e.target.value)}
            rows={4}
            className={inputClass}
          />
        </Field>

        <Field label="Особенности">
          <FeaturesEditor features={values.features} onChange={(features) => set("features", features)} />
        </Field>

        <Field label="Секции с картинками (чередуются на странице приложения)">
          <FeatureSectionsEditor value={values.feature_sections} onChange={(v) => set("feature_sections", v)} />
        </Field>

        <Field label="Вкладки со сценариями использования">
          <UseCaseTabsEditor value={values.use_case_tabs} onChange={(v) => set("use_case_tabs", v)} />
        </Field>

        <Field label="Privacy Policy">
          <textarea
            value={values.privacy_policy_content}
            onChange={(e) => set("privacy_policy_content", e.target.value)}
            rows={6}
            className={inputClass}
          />
        </Field>

        <Field label="Инструкции">
          <textarea
            value={values.instructions_content}
            onChange={(e) => set("instructions_content", e.target.value)}
            rows={6}
            className={inputClass}
          />
        </Field>
      </div>

      <div hidden={tab !== "media"} className="flex flex-col gap-4">
        <Field label="Иконка">
          <div className="flex items-center gap-3">
            {values.icon_url && <img src={values.icon_url} alt="" className="h-12 w-12 rounded-xl object-cover" />}
            <button
              type="button"
              onClick={() => setIconPickerOpen(true)}
              className="rounded-lg border border-md-outline-variant px-3 py-1.5 text-[13px] text-md-on-surface hover:border-md-primary"
            >
              Выбрать иконку
            </button>
          </div>
        </Field>

        <Field label="Hero-изображение (крупный скриншот на странице приложения)">
          <div className="flex items-center gap-3">
            {values.hero_image_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={values.hero_image_url} alt="" className="h-16 w-28 rounded-md object-cover" />
            )}
            <button
              type="button"
              onClick={() => setHeroPickerOpen(true)}
              className="rounded-md border border-md-outline-variant px-3 py-1.5 text-[13px] text-md-on-surface hover:border-md-outline"
            >
              Выбрать изображение
            </button>
          </div>
        </Field>

        <Field label="Скриншоты">
          {appId ? (
            <ScreenshotGallery appId={appId} screenshots={screenshots || []} />
          ) : (
            <p className="m-0 text-[13px] text-md-on-surface-variant">
              Скриншоты можно будет добавить после создания приложения.
            </p>
          )}
        </Field>
      </div>

      <div hidden={tab !== "seo"} className="flex flex-col gap-4">
        <Field
          label={
            <>
              Meta title <CharCounter length={values.meta_title.length} max={60} />
            </>
          }
        >
          <input value={values.meta_title} onChange={(e) => set("meta_title", e.target.value)} className={inputClass} />
        </Field>
        <Field
          label={
            <>
              Meta description <CharCounter length={values.meta_description.length} max={160} />
            </>
          }
        >
          <textarea
            value={values.meta_description}
            onChange={(e) => set("meta_description", e.target.value)}
            rows={2}
            className={inputClass}
          />
        </Field>
        <Field label="OG image">
          <div className="flex items-center gap-3">
            {values.og_image_url && (
              <img src={values.og_image_url} alt="" className="h-12 w-12 rounded-lg object-cover" />
            )}
            <button
              type="button"
              onClick={() => setOgPickerOpen(true)}
              className="rounded-lg border border-md-outline-variant px-3 py-1.5 text-[13px] text-md-on-surface hover:border-md-primary"
            >
              Выбрать изображение
            </button>
          </div>
        </Field>

        <Field label="Canonical URL">
          <input
            value={values.canonical_url}
            onChange={(e) => set("canonical_url", e.target.value)}
            className={inputClass}
            placeholder={`https://lecode.tech/apps/${values.slug || "slug"}`}
          />
        </Field>
        <label className="flex items-center gap-2 text-[13px] text-md-on-surface">
          <input type="checkbox" checked={values.noindex} onChange={(e) => set("noindex", e.target.checked)} />
          noindex
        </label>

        <div>
          <p className="mb-2 text-[13px] text-md-on-surface-variant">Предпросмотр</p>
          <SeoPreview
            title={values.meta_title || `${values.name || "App"} — lecode`}
            description={values.meta_description || values.short_description}
            url={values.canonical_url || `https://lecode.tech/apps/${values.slug || "slug"}`}
            image={values.og_image_url || values.icon_url}
          />
        </div>

        <SeoChecklist
          title={values.name}
          metaTitle={values.meta_title}
          metaDescription={values.meta_description || values.short_description}
          slug={values.slug}
          hasOgImage={!!(values.og_image_url || values.icon_url)}
          noindex={values.noindex}
        />

        <Field label="Structured data (JSON, опционально — переопределяет автоматическую схему ниже)">
          <textarea
            value={values.structured_data}
            onChange={(e) => set("structured_data", e.target.value)}
            rows={4}
            className={`${inputClass} font-mono text-xs`}
          />
        </Field>

        {!values.structured_data.trim() && (
          <div>
            <p className="mb-2 text-[13px] text-md-on-surface-variant">
              JSON-LD (генерируется автоматически из полей выше, то же самое отдаётся на публичной странице)
            </p>
            <pre className="overflow-x-auto rounded-lg bg-md-surface-container-low p-3 text-[11px] text-md-on-surface">
              {JSON.stringify(
                {
                  "@context": "https://schema.org",
                  "@type": "SoftwareApplication",
                  name: values.name || undefined,
                  description: values.short_description || values.description || undefined,
                  applicationCategory: values.category || undefined,
                  url: values.website_url || `https://lecode.tech/apps/${values.slug || "slug"}`,
                  image: values.og_image_url || values.icon_url || undefined,
                },
                null,
                2
              )}
            </pre>
          </div>
        )}
      </div>

      <div hidden={tab !== "links"} className="grid grid-cols-2 gap-4">
        <Field label="Google Play URL">
          <input
            value={values.google_play_url}
            onChange={(e) => set("google_play_url", e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="App Store URL">
          <input
            value={values.app_store_url}
            onChange={(e) => set("app_store_url", e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="Website URL">
          <input value={values.website_url} onChange={(e) => set("website_url", e.target.value)} className={inputClass} />
        </Field>
        <Field label="Pricing note">
          <input value={values.pricing_note} onChange={(e) => set("pricing_note", e.target.value)} className={inputClass} />
        </Field>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-fit rounded-lg bg-md-primary px-5 py-2.5 text-sm font-medium text-md-on-primary disabled:opacity-60"
      >
        {submitting ? "Сохранение..." : submitLabel}
      </button>

      <MediaPicker
        open={iconPickerOpen}
        onClose={() => setIconPickerOpen(false)}
        onSelect={(item) => {
          set("icon_media_id", item.id);
          set("icon_url", item.url);
          setIconPickerOpen(false);
        }}
      />
      <MediaPicker
        open={heroPickerOpen}
        onClose={() => setHeroPickerOpen(false)}
        onSelect={(item) => {
          set("hero_image_media_id", item.id);
          set("hero_image_url", item.url);
          setHeroPickerOpen(false);
        }}
      />
      <MediaPicker
        open={ogPickerOpen}
        onClose={() => setOgPickerOpen(false)}
        onSelect={(item) => {
          set("og_image_url", item.url);
          setOgPickerOpen(false);
        }}
      />
    </form>
  );
}

function Field({ label, children }: { label: React.ReactNode; children: React.ReactNode }) {
  // Deliberately a <div>, not a <label>: a native <label> forwards any click within its bounds
  // to the first labelable descendant (input/button/etc), which misfires when a field nests its
  // own interactive widgets (see PageForm/BlogPostForm's Field for the bug this caused there).
  return (
    <div className="block text-[13px] text-md-on-surface-variant">
      {label}
      <div className="mt-1.5">{children}</div>
    </div>
  );
}
