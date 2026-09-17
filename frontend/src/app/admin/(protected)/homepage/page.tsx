"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminFetch } from "@/lib/admin-api";
import { useToast } from "@/lib/toast";
import { useCanEdit } from "@/lib/role-context";
import { Card } from "@/components/admin/m3/Card";
import { Button } from "@/components/admin/m3/Button";
import { Switch } from "@/components/admin/m3/Switch";
import { SegmentedButton } from "@/components/admin/m3/SegmentedButton";
import { EmptyState } from "@/components/admin/m3/EmptyState";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { BlockEditor } from "@/components/admin/BlockEditor";
import type { AppListItem, SiteSettings, TestimonialItem } from "@/lib/admin-types";
import type { PublicPageBlock } from "@/lib/api";

type HomepageMode = "landing" | "blog" | "marketplace";

function normalizeMode(layout: SiteSettings["homepage_layout"]): HomepageMode {
  if (layout === "landing" || layout === "blog" || layout === "marketplace") return layout;
  // "minimal"/"apps_grid" is the old mode Marketplace replaced — map any existing data onto
  // the new stub rather than dropping it into an unlabeled state.
  if (layout === "minimal" || layout === "apps_grid") return "marketplace";
  if (layout === "mixed" || layout === "text_focused") return "landing";
  return "marketplace";
}

const inputClass =
  "block w-full rounded-md border border-md-outline-variant bg-transparent px-2.5 py-2 text-sm text-md-on-surface outline-none focus:border-md-outline";

const previewBox = "block rounded-sm bg-md-on-surface-variant/70";

// Which of the 5 section toggles the public renderer (frontend/src/app/(site)/page.tsx)
// actually reads, per homepage mode — keeping this in sync avoids showing a switch
// that has zero effect on the live site.
const MODE_VISIBLE_SECTIONS: Record<HomepageMode, (keyof NonNullable<SiteSettings["homepage_sections"]>)[]> = {
  landing: ["hero", "blog"],
  marketplace: ["hero"],
  blog: ["hero", "apps", "testimonials"],
};

const SECTION_LABELS: {
  key: keyof NonNullable<SiteSettings["homepage_sections"]>;
  label: string;
  description: string;
  preview: React.ReactNode;
}[] = [
  {
    key: "hero",
    label: "Hero",
    description: "Заголовок, подзаголовок и основной призыв к действию в самом верху страницы.",
    preview: (
      <div className="flex h-full w-full flex-col items-center justify-center gap-1">
        <div className={previewBox} style={{ width: 34, height: 5 }} />
        <div className={previewBox} style={{ width: 24, height: 3, opacity: 0.5 }} />
        <div className={previewBox} style={{ width: 14, height: 5, borderRadius: 999 }} />
      </div>
    ),
  },
  {
    key: "stats",
    label: "Statistics",
    description: "Ряд крупных цифр с подписями — например, число приложений или лет опыта.",
    preview: (
      <div className="flex h-full w-full items-end justify-center gap-1.5">
        <div className={previewBox} style={{ width: 6, height: 10 }} />
        <div className={previewBox} style={{ width: 6, height: 18 }} />
        <div className={previewBox} style={{ width: 6, height: 13 }} />
        <div className={previewBox} style={{ width: 6, height: 20 }} />
      </div>
    ),
  },
  {
    key: "apps",
    label: "Apps grid",
    description: "Карточки всех опубликованных приложений.",
    preview: (
      <div className="grid h-full w-full grid-cols-2 gap-1 p-1">
        <div className={previewBox} />
        <div className={previewBox} />
        <div className={previewBox} />
        <div className={previewBox} />
      </div>
    ),
  },
  {
    key: "testimonials",
    label: "Testimonials",
    description: "Отзывы пользователей в виде карусели.",
    preview: (
      <div className="flex h-full w-full flex-col items-center justify-center gap-1.5">
        <div className={previewBox} style={{ width: 30, height: 14, borderRadius: 6 }} />
        <div className="flex gap-1">
          <div className={previewBox} style={{ width: 4, height: 4, borderRadius: 999 }} />
          <div className={previewBox} style={{ width: 4, height: 4, borderRadius: 999, opacity: 0.4 }} />
          <div className={previewBox} style={{ width: 4, height: 4, borderRadius: 999, opacity: 0.4 }} />
        </div>
      </div>
    ),
  },
  {
    key: "blog",
    label: "Blog preview",
    description: "Превью нескольких последних статей блога с переходом на полный список.",
    preview: (
      <div className="flex h-full w-full flex-col justify-center gap-1.5 px-2">
        {[0, 1].map((i) => (
          <div key={i} className="flex items-center gap-1.5">
            <div className={previewBox} style={{ width: 10, height: 8, borderRadius: 3, flexShrink: 0 }} />
            <div className="flex flex-1 flex-col gap-0.5">
              <div className={previewBox} style={{ width: "80%", height: 2.5 }} />
              <div className={previewBox} style={{ width: "55%", height: 2.5, opacity: 0.5 }} />
            </div>
          </div>
        ))}
      </div>
    ),
  },
];

const DEFAULT_SECTIONS = { hero: true, stats: true, apps: true, testimonials: true, blog: true };
const EMPTY_STATS = [
  { value: "", label: "" },
  { value: "", label: "" },
  { value: "", label: "" },
  { value: "", label: "" },
];

function emptyTestimonial(): Omit<TestimonialItem, "id"> {
  return { author_name: "", author_title: "", quote: "", rating: 5, app_id: null, app_slug: null, sort_order: 0, is_published: true };
}

function TestimonialForm({
  initial,
  apps,
  onSave,
  onCancel,
  saving,
}: {
  initial: Omit<TestimonialItem, "id">;
  apps: AppListItem[];
  onSave: (values: Omit<TestimonialItem, "id">) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const [values, setValues] = useState(initial);

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3">
        <input
          value={values.author_name}
          onChange={(e) => setValues({ ...values, author_name: e.target.value })}
          placeholder="Имя автора"
          className={inputClass}
        />
        <input
          value={values.author_title || ""}
          onChange={(e) => setValues({ ...values, author_title: e.target.value })}
          placeholder="Должность / подпись (опционально)"
          className={inputClass}
        />
      </div>
      <textarea
        value={values.quote}
        onChange={(e) => setValues({ ...values, quote: e.target.value })}
        placeholder="Текст отзыва"
        rows={3}
        className={inputClass}
      />
      <div className="grid grid-cols-2 gap-3">
        <select
          value={values.rating ?? ""}
          onChange={(e) => setValues({ ...values, rating: e.target.value ? Number(e.target.value) : null })}
          className={inputClass}
        >
          <option value="">Без рейтинга</option>
          {[5, 4, 3, 2, 1].map((r) => (
            <option key={r} value={r}>
              {r} звёзд
            </option>
          ))}
        </select>
        <select
          value={values.app_id || ""}
          onChange={(e) => setValues({ ...values, app_id: e.target.value || null })}
          className={inputClass}
        >
          <option value="">Без привязки к приложению</option>
          {apps.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
      </div>
      <div className="flex items-center justify-between">
        <Switch
          checked={values.is_published}
          onChange={(v) => setValues({ ...values, is_published: v })}
          label="Опубликован"
        />
        <div className="flex gap-2">
          <Button variant="text" onClick={onCancel}>
            Отмена
          </Button>
          <Button
            onClick={() => onSave(values)}
            disabled={saving || !values.author_name.trim() || !values.quote.trim()}
          >
            Сохранить
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function HomepagePage() {
  const canEdit = useCanEdit();
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [mode, setMode] = useState<HomepageMode>("marketplace");
  const [sections, setSections] = useState(DEFAULT_SECTIONS);
  const [stats, setStats] = useState(EMPTY_STATS);
  const [blocks, setBlocks] = useState<PublicPageBlock[]>([]);
  const [addingTestimonial, setAddingTestimonial] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<TestimonialItem | null>(null);

  const { data: settings, isLoading: settingsLoading } = useQuery({
    queryKey: ["settings"],
    queryFn: () => adminFetch<SiteSettings>("api/settings"),
  });
  const { data: testimonials, isLoading: testimonialsLoading } = useQuery({
    queryKey: ["testimonials"],
    queryFn: () => adminFetch<TestimonialItem[]>("api/testimonials"),
  });
  const { data: apps } = useQuery({
    queryKey: ["apps"],
    queryFn: () => adminFetch<AppListItem[]>("api/apps"),
  });

  useEffect(() => {
    if (settings) {
      setMode(normalizeMode(settings.homepage_layout));
      setSections({ ...DEFAULT_SECTIONS, ...settings.homepage_sections });
      const loaded = settings.homepage_stats || [];
      setStats([0, 1, 2, 3].map((i) => loaded[i] || { value: "", label: "" }));
      setBlocks(settings.homepage_blocks || []);
    }
  }, [settings]);

  const saveSettingsMutation = useMutation({
    mutationFn: () =>
      adminFetch("api/settings", {
        method: "PUT",
        body: {
          homepage_layout: mode,
          homepage_sections: sections,
          homepage_stats: stats.filter((s) => s.value || s.label),
          homepage_blocks: blocks,
        },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      queryClient.invalidateQueries({ queryKey: ["public-settings"] });
      showToast("Сохранено");
    },
    onError: (err: Error) => showToast(err.message, "error"),
  });

  const invalidateTestimonials = () => queryClient.invalidateQueries({ queryKey: ["testimonials"] });

  const createMutation = useMutation({
    mutationFn: (body: Omit<TestimonialItem, "id">) => adminFetch("api/testimonials", { method: "POST", body }),
    onSuccess: () => {
      invalidateTestimonials();
      setAddingTestimonial(false);
      showToast("Отзыв добавлен");
    },
    onError: (err: Error) => showToast(err.message, "error"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Omit<TestimonialItem, "id"> }) =>
      adminFetch(`api/testimonials/${id}`, { method: "PUT", body }),
    onSuccess: () => {
      invalidateTestimonials();
      setEditingId(null);
      showToast("Сохранено");
    },
    onError: (err: Error) => showToast(err.message, "error"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminFetch(`api/testimonials/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      invalidateTestimonials();
      setPendingDelete(null);
      showToast("Отзыв удалён");
    },
    onError: (err: Error) => showToast(err.message, "error"),
  });

  if (settingsLoading) return <p className="md-body-medium text-md-on-surface-variant">Загрузка...</p>;

  return (
    <div>
      <h1 className="md-headline-small mb-6 text-md-on-surface">Главная страница</h1>

      <Card elevation={1} outlined className="mb-6 p-4">
        <p className="md-title-small mb-3 text-md-on-surface-variant">Режим главной страницы</p>
        <SegmentedButton
          segments={[
            { value: "landing", label: "Landing" },
            { value: "blog", label: "Blog" },
            { value: "marketplace", label: "Marketplace" },
          ]}
          value={mode}
          onChange={setMode}
        />
        <p className="md-body-small mt-2 text-md-on-surface-variant">
          {mode === "landing" && "Полная композиция из блоков ниже — hero, затем настраиваемые секции, затем блог."}
          {mode === "blog" && "Лента блога — основной контент, приложения и отзывы уходят в конец страницы."}
          {mode === "marketplace" &&
            "Заглушка «Marketplace — скоро»: на главной показывается только hero и информационный блок. Полноценный маркетплейс ещё в разработке."}
        </p>
      </Card>

      <Card elevation={1} outlined className="mb-6 p-4">
        <p className="md-title-small mb-3 text-md-on-surface-variant">Видимость секций</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {SECTION_LABELS.filter(({ key }) => MODE_VISIBLE_SECTIONS[mode].includes(key)).map(
            ({ key, label, description, preview }) => (
              <div key={key} className="flex items-center gap-3 rounded-lg border border-md-outline-variant p-3">
                <div className="flex h-12 w-14 shrink-0 items-center justify-center rounded-md bg-md-surface-container-low">
                  {preview}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="md-body-medium m-0 text-md-on-surface">{label}</p>
                  <p className="md-body-small m-0 text-md-on-surface-variant">{description}</p>
                </div>
                <Switch checked={sections[key]} onChange={(v) => setSections({ ...sections, [key]: v })} />
              </div>
            )
          )}
        </div>
        {mode === "landing" && (
          <p className="md-body-small mt-3 text-md-on-surface-variant">
            В режиме Landing статистика, сетка приложений и отзывы управляются блоками «Статистика», «Витрина
            приложений» и «Карусель отзывов» в редакторе блоков ниже, а не этими переключателями.
          </p>
        )}
      </Card>

      {mode === "landing" ? (
        <Card elevation={1} outlined className="mb-6 p-4">
          <p className="md-title-small mb-3 text-md-on-surface-variant">Блоки лендинга</p>
          <BlockEditor value={blocks} onChange={setBlocks} />
        </Card>
      ) : mode === "marketplace" ? (
        <Card elevation={0} outlined className="mb-6 p-4">
          <p className="md-title-small mb-1 text-md-on-surface-variant">Marketplace — заглушка</p>
          <p className="md-body-small text-md-on-surface-variant">
            Публичная страница сейчас показывает только hero и блок «Скоро». Статистика и остальные секции появятся
            здесь, когда маркетплейс будет готов.
          </p>
        </Card>
      ) : (
        <Card elevation={1} outlined className="mb-6 p-4">
          <p className="md-title-small mb-3 text-md-on-surface-variant">Статистика (Stats bar)</p>
          <div className="grid grid-cols-2 gap-3">
            {stats.map((stat, i) => (
              <div key={i} className="flex gap-2">
                <input
                  value={stat.value}
                  onChange={(e) => setStats(stats.map((s, idx) => (idx === i ? { ...s, value: e.target.value } : s)))}
                  placeholder="3 apps"
                  className={`${inputClass} w-24`}
                />
                <input
                  value={stat.label}
                  onChange={(e) => setStats(stats.map((s, idx) => (idx === i ? { ...s, label: e.target.value } : s)))}
                  placeholder="shipped"
                  className={inputClass}
                />
              </div>
            ))}
          </div>
        </Card>
      )}

      {canEdit && (
        <Button onClick={() => saveSettingsMutation.mutate()} disabled={saveSettingsMutation.isPending} className="mb-8">
          {saveSettingsMutation.isPending ? "Сохранение..." : "Сохранить"}
        </Button>
      )}

      <div className="mb-3 flex items-center justify-between">
        <p className="md-title-small text-md-on-surface-variant">Testimonials</p>
        {canEdit && !addingTestimonial && (
          <Button variant="outlined" onClick={() => setAddingTestimonial(true)} className="px-3 py-1.5">
            + Добавить отзыв
          </Button>
        )}
      </div>

      {addingTestimonial && (
        <Card elevation={1} outlined className="mb-3 p-4">
          <TestimonialForm
            initial={emptyTestimonial()}
            apps={apps || []}
            onSave={(values) => createMutation.mutate(values)}
            onCancel={() => setAddingTestimonial(false)}
            saving={createMutation.isPending}
          />
        </Card>
      )}

      {testimonialsLoading && <p className="md-body-medium text-md-on-surface-variant">Загрузка...</p>}

      <div className="flex flex-col gap-3">
        {(testimonials || []).map((t) =>
          editingId === t.id ? (
            <Card key={t.id} elevation={1} outlined className="p-4">
              <TestimonialForm
                initial={t}
                apps={apps || []}
                onSave={(values) => updateMutation.mutate({ id: t.id, body: values })}
                onCancel={() => setEditingId(null)}
                saving={updateMutation.isPending}
              />
            </Card>
          ) : (
            <Card key={t.id} elevation={1} className="flex items-start justify-between gap-4 p-4">
              <div className="min-w-0">
                <p className="md-body-medium m-0 text-md-on-surface">&ldquo;{t.quote}&rdquo;</p>
                <p className="md-body-small mt-1 text-md-on-surface-variant">
                  {t.author_name}
                  {t.author_title ? ` · ${t.author_title}` : ""}
                  {t.rating ? ` · ${t.rating}★` : ""}
                  {!t.is_published ? " · черновик" : ""}
                </p>
              </div>
              {canEdit && (
                <div className="flex shrink-0 items-center gap-2">
                  <button onClick={() => setEditingId(t.id)} className="text-md-on-surface-variant hover:text-md-on-surface">
                    <i className="ti ti-pencil text-sm" />
                  </button>
                  <button onClick={() => setPendingDelete(t)} className="text-md-on-surface-variant hover:text-md-error">
                    <i className="ti ti-trash text-sm" />
                  </button>
                </div>
              )}
            </Card>
          )
        )}
        {testimonials?.length === 0 && !testimonialsLoading && !addingTestimonial && (
          <EmptyState icon="ti-quote" title="Отзывов пока нет" description="Добавьте первый отзыв, чтобы он появился на сайте." />
        )}
      </div>

      <ConfirmDialog
        open={!!pendingDelete}
        title={`Удалить отзыв «${pendingDelete?.author_name}»?`}
        onConfirm={() => pendingDelete && deleteMutation.mutate(pendingDelete.id)}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
