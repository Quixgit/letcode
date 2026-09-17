"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { adminFetch } from "@/lib/admin-api";
import { MediaPicker } from "@/components/admin/MediaPicker";
import { CharCounter } from "@/components/admin/CharCounter";
import { SeoPreview } from "@/components/admin/SeoPreview";
import { SeoChecklist } from "@/components/admin/SeoChecklist";
import { BlockEditor } from "@/components/admin/BlockEditor";
import { TagInput } from "@/components/admin/m3/TagInput";
import { Card } from "@/components/admin/m3/Card";
import { Button } from "@/components/admin/m3/Button";
import { useSaveShortcut, useUnsavedChangesWarning } from "@/lib/use-form-shortcuts";
import type { BlogPostDetail } from "@/lib/admin-types";
import type { PublicPageBlock } from "@/lib/api";

export interface BlogPostFormValues {
  slug: string;
  title: string;
  excerpt: string;
  content: PublicPageBlock[];
  cover_image_media_id: string;
  cover_image_url: string;
  tags: string[];
  meta_title: string;
  meta_description: string;
  og_image_url: string;
  canonical_url: string;
  noindex: boolean;
  structured_data: string;
}

const inputClass =
  "block w-full rounded-lg border border-md-outline-variant bg-transparent px-2.5 py-2 text-sm text-md-on-surface outline-none focus:border-md-primary";

function toFormValues(post?: BlogPostDetail): BlogPostFormValues {
  return {
    slug: post?.slug || "",
    title: post?.title || "",
    excerpt: post?.excerpt || "",
    content: (post?.content as PublicPageBlock[] | undefined) ?? [],
    cover_image_media_id: post?.cover_image_media_id || "",
    cover_image_url: post?.cover_image_url || "",
    tags: post?.tags || [],
    meta_title: post?.meta_title || "",
    meta_description: post?.meta_description || "",
    og_image_url: post?.og_image_url || "",
    canonical_url: post?.canonical_url || "",
    noindex: post?.noindex || false,
    structured_data: post?.structured_data ? JSON.stringify(post.structured_data, null, 2) : "",
  };
}

interface BlogPostFormProps {
  initial?: BlogPostDetail;
  submitting: boolean;
  submitLabel: string;
  onSubmit: (values: BlogPostFormValues) => void;
}

export function BlogPostForm({ initial, submitting, submitLabel, onSubmit }: BlogPostFormProps) {
  const [values, setValues] = useState<BlogPostFormValues>(() => toFormValues(initial));
  const [coverPickerOpen, setCoverPickerOpen] = useState(false);
  const [ogPickerOpen, setOgPickerOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);

  const { data: existingTags } = useQuery({
    queryKey: ["blog-tags"],
    queryFn: () => adminFetch<string[]>("api/blog/tags"),
  });

  function set<K extends keyof BlogPostFormValues>(key: K, value: BlogPostFormValues[K]) {
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
          placeholder="hello-world"
        />
      </Field>

      <Field label="Заголовок">
        <input value={values.title} onChange={(e) => set("title", e.target.value)} className={inputClass} />
      </Field>

      <Field label="Краткое описание (excerpt)">
        <textarea
          value={values.excerpt}
          onChange={(e) => set("excerpt", e.target.value)}
          rows={2}
          className={inputClass}
        />
      </Field>

      <Field label="Обложка">
        <div className="flex items-center gap-3">
          {values.cover_image_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={values.cover_image_url} alt="" className="h-12 w-20 rounded-lg object-cover" />
          )}
          <Button variant="outlined" onClick={() => setCoverPickerOpen(true)}>
            Выбрать изображение
          </Button>
          {values.cover_image_url && (
            <Button
              variant="text"
              onClick={() => {
                set("cover_image_media_id", "");
                set("cover_image_url", "");
              }}
            >
              Убрать
            </Button>
          )}
        </div>
      </Field>

      <Field label="Теги">
        <TagInput value={values.tags} onChange={(tags) => set("tags", tags)} suggestions={existingTags || []} />
      </Field>

      <Field label="Содержимое">
        <BlockEditor value={values.content} onChange={(blocks) => set("content", blocks)} />
      </Field>

      <Card elevation={1} outlined className="p-4">
        <p className="md-title-small mb-3 text-md-on-surface-variant">SEO</p>
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
                // eslint-disable-next-line @next/next/no-img-element
                <img src={values.og_image_url} alt="" className="h-12 w-12 rounded-lg object-cover" />
              )}
              <Button variant="outlined" onClick={() => setOgPickerOpen(true)}>
                Выбрать изображение
              </Button>
              {values.og_image_url && (
                <Button variant="text" onClick={() => set("og_image_url", "")}>
                  Убрать
                </Button>
              )}
            </div>
          </Field>

          <Field label="Canonical URL">
            <input
              value={values.canonical_url}
              onChange={(e) => set("canonical_url", e.target.value)}
              className={inputClass}
              placeholder={`https://lecode.tech/blog/${values.slug || "slug"}`}
            />
          </Field>
          <label className="flex items-center gap-2 text-[13px] text-md-on-surface">
            <input type="checkbox" checked={values.noindex} onChange={(e) => set("noindex", e.target.checked)} />
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
              description={values.meta_description || values.excerpt}
              url={values.canonical_url || `https://lecode.tech/blog/${values.slug || "slug"}`}
              image={values.og_image_url || values.cover_image_url}
            />
          </div>

          <SeoChecklist
            title={values.title}
            metaTitle={values.meta_title}
            metaDescription={values.meta_description || values.excerpt}
            slug={values.slug}
            hasOgImage={!!(values.og_image_url || values.cover_image_url)}
            noindex={values.noindex}
          />
        </div>
      </Card>

      <Button type="submit" disabled={submitting} className="w-fit">
        {submitting ? "Сохранение..." : submitLabel}
      </Button>

      <MediaPicker
        open={coverPickerOpen}
        onClose={() => setCoverPickerOpen(false)}
        onSelect={(item) => {
          set("cover_image_media_id", item.id);
          set("cover_image_url", item.url);
          setCoverPickerOpen(false);
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
  // to the first labelable descendant (input/button/etc). Several fields here nest interactive
  // widgets (BlockEditor's palette buttons, MediaPicker's "Выбрать изображение" button, ...), so a
  // <label> wrapper caused clicks anywhere in the field to silently re-trigger that first control
  // — most visibly, clicking anywhere under "Содержимое" kept adding a new block to the end.
  return (
    <div className="block text-[13px] text-md-on-surface-variant">
      {label}
      <div className="mt-1.5">{children}</div>
    </div>
  );
}
