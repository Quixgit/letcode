"use client";

import { useState } from "react";
import { MediaPicker } from "@/components/admin/MediaPicker";
import { CharCounter } from "@/components/admin/CharCounter";
import { SeoPreview } from "@/components/admin/SeoPreview";
import { TemplatePicker } from "@/components/admin/TemplatePicker";
import { BlockEditor } from "@/components/admin/BlockEditor";
import { useSaveShortcut, useUnsavedChangesWarning } from "@/lib/use-form-shortcuts";
import type { PageDetail } from "@/lib/admin-types";
import type { PublicPageBlock } from "@/lib/api";

export interface PageFormValues {
  slug: string;
  title: string;
  template: string;
  content: PublicPageBlock[];
  meta_title: string;
  meta_description: string;
  og_image_url: string;
  canonical_url: string;
  noindex: boolean;
  structured_data: string;
}

const inputClass =
  "block w-full rounded-lg border border-md-outline-variant px-2.5 py-2 text-sm text-md-on-surface outline-none focus:border-md-primary";

function toFormValues(page?: PageDetail): PageFormValues {
  return {
    slug: page?.slug || "",
    title: page?.title || "",
    template: page?.template || "default",
    content: (page?.content as PublicPageBlock[] | undefined) ?? [],
    meta_title: page?.meta_title || "",
    meta_description: page?.meta_description || "",
    og_image_url: page?.og_image_url || "",
    canonical_url: page?.canonical_url || "",
    noindex: page?.noindex || false,
    structured_data: page?.structured_data ? JSON.stringify(page.structured_data, null, 2) : "",
  };
}

interface PageFormProps {
  initial?: PageDetail;
  submitting: boolean;
  submitLabel: string;
  onSubmit: (values: PageFormValues) => void;
}

export function PageForm({ initial, submitting, submitLabel, onSubmit }: PageFormProps) {
  const [values, setValues] = useState<PageFormValues>(() => toFormValues(initial));
  const [pickerOpen, setPickerOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);

  function set<K extends keyof PageFormValues>(key: K, value: PageFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
    setDirty(true);
  }

  function submit() {
    setError(null);

    if (!values.slug.trim() || !/^[a-z0-9-]+$/.test(values.slug.trim())) {
      setError("Slug обязателен и может содержать только строчные буквы, цифры и дефисы");
      return;
    }
    if (!values.title.trim()) {
      setError("Заголовок обязателен");
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

      <Field label="Slug">
        <input
          value={values.slug}
          onChange={(e) => set("slug", e.target.value)}
          className={inputClass}
          placeholder="about-us"
        />
      </Field>

      <Field label="Заголовок">
        <input value={values.title} onChange={(e) => set("title", e.target.value)} className={inputClass} />
      </Field>

      <Field label="Шаблон">
        <TemplatePicker value={values.template} onChange={(template) => set("template", template)} />
      </Field>

      <Field label="Содержимое">
        <BlockEditor value={values.content} onChange={(blocks) => set("content", blocks)} />
      </Field>

      <fieldset className="rounded-xl border border-md-outline-variant p-4">
        <legend className="px-1 text-[13px] text-md-on-surface-variant">SEO</legend>
        <div className="flex flex-col gap-4">
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
                onClick={() => setPickerOpen(true)}
                className="rounded-lg border border-md-outline-variant px-3 py-1.5 text-[13px] text-md-on-surface hover:border-md-primary"
              >
                Выбрать изображение
              </button>
              {values.og_image_url && (
                <button
                  type="button"
                  onClick={() => set("og_image_url", "")}
                  className="text-[13px] text-md-on-surface-variant hover:text-md-error"
                >
                  Убрать
                </button>
              )}
            </div>
          </Field>
          <Field label="Canonical URL">
            <input
              value={values.canonical_url}
              onChange={(e) => set("canonical_url", e.target.value)}
              className={inputClass}
            />
          </Field>
          <label className="flex items-center gap-2 text-[13px] text-md-on-surface">
            <input
              type="checkbox"
              checked={values.noindex}
              onChange={(e) => set("noindex", e.target.checked)}
            />
            noindex
          </label>
          <Field label="Structured data (JSON, опционально)">
            <textarea
              value={values.structured_data}
              onChange={(e) => set("structured_data", e.target.value)}
              rows={4}
              className={`${inputClass} font-mono text-xs`}
            />
          </Field>

          <div>
            <p className="mb-2 text-[13px] text-md-on-surface-variant">Предпросмотр</p>
            <SeoPreview
              title={values.meta_title || values.title}
              description={values.meta_description}
              url={`https://lecode.tech/${values.slug || "slug"}`}
              image={values.og_image_url}
            />
          </div>
        </div>
      </fieldset>

      <button
        type="submit"
        disabled={submitting}
        className="w-fit rounded-lg bg-md-primary px-5 py-2.5 text-sm font-medium text-md-on-primary disabled:opacity-60"
      >
        {submitting ? "Сохранение..." : submitLabel}
      </button>

      <MediaPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={(item) => {
          set("og_image_url", item.url);
          setPickerOpen(false);
        }}
      />
    </form>
  );
}

function Field({ label, children }: { label: React.ReactNode; children: React.ReactNode }) {
  return (
    <label className="block text-[13px] text-md-on-surface-variant">
      {label}
      <div className="mt-1.5">{children}</div>
    </label>
  );
}
