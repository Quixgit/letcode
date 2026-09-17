"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminFetch } from "@/lib/admin-api";
import { useToast } from "@/lib/toast";
import { useCanEdit, useIsAdmin } from "@/lib/role-context";
import { AppForm, type AppFormValues } from "@/components/admin/AppForm";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { PublishControl } from "@/components/admin/PublishControl";
import { ReviewActions } from "@/components/admin/ReviewActions";
import { ReviewNoteCallout } from "@/components/admin/ReviewBadge";
import { Breadcrumbs } from "@/components/admin/m3/Breadcrumbs";
import type { AppDetail, MediaItem } from "@/lib/admin-types";

function toBody(values: AppFormValues) {
  return {
    slug: values.slug.trim(),
    name: values.name.trim(),
    category: values.category || null,
    icon_media_id: values.icon_media_id || null,
    short_description: values.short_description || null,
    description: values.description || null,
    features: values.features.filter((f) => f.trim() !== ""),
    privacy_policy_content: values.privacy_policy_content || null,
    instructions_content: values.instructions_content || null,
    google_play_url: values.google_play_url || null,
    app_store_url: values.app_store_url || null,
    website_url: values.website_url || null,
    pricing_note: values.pricing_note || null,
    sort_order: values.sort_order,
    meta_title: values.meta_title || null,
    meta_description: values.meta_description || null,
    og_image_url: values.og_image_url || null,
    canonical_url: values.canonical_url || null,
    noindex: values.noindex,
    structured_data: values.structured_data.trim() ? JSON.parse(values.structured_data) : null,
    show_on_homepage: values.show_on_homepage,
    hero_image_media_id: values.hero_image_media_id || null,
    rating: values.rating.trim() !== "" ? Number(values.rating) : null,
    rating_count: values.rating_count.trim() !== "" ? Number(values.rating_count) : null,
    feature_sections: values.feature_sections,
    use_case_tabs: values.use_case_tabs,
  };
}

export default function EditAppPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const canEdit = useCanEdit();
  const isAdmin = useIsAdmin();
  const [pendingDelete, setPendingDelete] = useState(false);

  const { data: app, isLoading } = useQuery({
    queryKey: ["app", id],
    queryFn: () => adminFetch<AppDetail>(`api/apps/${id}`),
  });

  const { data: media } = useQuery({
    queryKey: ["media"],
    queryFn: () => adminFetch<MediaItem[]>("api/media"),
  });
  const iconUrl = media?.find((m) => m.id === app?.icon_media_id)?.url;

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["app", id] });
    queryClient.invalidateQueries({ queryKey: ["apps"] });
  };

  const updateMutation = useMutation({
    mutationFn: (values: AppFormValues) => adminFetch(`api/apps/${id}`, { method: "PUT", body: toBody(values) }),
    onSuccess: () => {
      invalidate();
      showToast("Сохранено");
    },
    onError: (err: Error) => showToast(err.message, "error"),
  });

  const publishMutation = useMutation({
    mutationFn: () => adminFetch(`api/apps/${id}/publish`, { method: "POST" }),
    onSuccess: () => {
      invalidate();
      showToast("Приложение опубликовано");
    },
    onError: (err: Error) => showToast(err.message, "error"),
  });

  const unpublishMutation = useMutation({
    mutationFn: () => adminFetch(`api/apps/${id}/unpublish`, { method: "POST" }),
    onSuccess: () => {
      invalidate();
      showToast("Приложение снято с публикации");
    },
    onError: (err: Error) => showToast(err.message, "error"),
  });

  const scheduleMutation = useMutation({
    mutationFn: (isoString: string) =>
      adminFetch(`api/apps/${id}/schedule`, { method: "POST", body: { scheduled_publish_at: isoString } }),
    onSuccess: () => {
      invalidate();
      showToast("Публикация запланирована");
    },
    onError: (err: Error) => showToast(err.message, "error"),
  });

  const cancelScheduleMutation = useMutation({
    mutationFn: () => adminFetch(`api/apps/${id}/schedule/cancel`, { method: "POST" }),
    onSuccess: () => {
      invalidate();
      showToast("Расписание отменено");
    },
    onError: (err: Error) => showToast(err.message, "error"),
  });

  const deleteMutation = useMutation({
    mutationFn: () => adminFetch(`api/apps/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["apps"] });
      showToast("Приложение перемещено в корзину");
      router.push("/admin/apps");
    },
    onError: (err: Error) => showToast(err.message, "error"),
  });

  const submitReviewMutation = useMutation({
    mutationFn: (note: string) => adminFetch(`api/apps/${id}/submit-review`, { method: "POST", body: { note } }),
    onSuccess: () => {
      invalidate();
      showToast("Отправлено на проверку");
    },
    onError: (err: Error) => showToast(err.message, "error"),
  });

  const reviewDecisionMutation = useMutation({
    mutationFn: (body: { decision: string; note: string }) =>
      adminFetch(`api/apps/${id}/review-decision`, { method: "POST", body }),
    onSuccess: () => {
      invalidate();
      showToast("Решение сохранено");
    },
    onError: (err: Error) => showToast(err.message, "error"),
  });

  if (isLoading) return <p className="text-[13px] text-md-on-surface-variant">Загрузка...</p>;
  if (!app) return <p className="text-[13px] text-md-on-surface-variant">Приложение не найдено.</p>;

  return (
    <div>
      <Breadcrumbs items={[{ label: "Админ", href: "/admin" }, { label: "Приложения", href: "/admin/apps" }, { label: app.name }]} />
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="m-0 md-headline-small text-md-on-surface">{app.name}</h1>
          <StatusBadge status={app.status} />
        </div>
        {canEdit && (
          <div className="flex items-center gap-2">
            <ReviewActions
              reviewStatus={app.review_status}
              isAdmin={isAdmin}
              canEdit={canEdit}
              submitting={submitReviewMutation.isPending || reviewDecisionMutation.isPending}
              onSubmitReview={(note) => submitReviewMutation.mutate(note)}
              onApprove={() => reviewDecisionMutation.mutate({ decision: "approved", note: "" })}
              onRequestChanges={(note) => reviewDecisionMutation.mutate({ decision: "changes_requested", note })}
            />
            <PublishControl
              status={app.status}
              scheduledPublishAt={app.scheduled_publish_at}
              onPublishNow={() => publishMutation.mutate()}
              onUnpublish={() => unpublishMutation.mutate()}
              onSchedule={(iso) => scheduleMutation.mutate(iso)}
              onCancelSchedule={() => cancelScheduleMutation.mutate()}
              publishing={publishMutation.isPending}
              unpublishing={unpublishMutation.isPending}
              scheduling={scheduleMutation.isPending}
            />
            <button
              onClick={() => setPendingDelete(true)}
              className="rounded-lg px-3 py-1.5 text-[13px] text-md-on-surface-variant hover:text-md-error"
            >
              Удалить
            </button>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-6">
        <ReviewNoteCallout status={app.review_status} note={app.review_note} />
        <AppForm
          key={app.id}
          initial={app}
          initialIconUrl={iconUrl}
          appId={app.id}
          screenshots={app.screenshots || []}
          submitting={updateMutation.isPending}
          submitLabel="Сохранить"
          onSubmit={(values) => updateMutation.mutate(values)}
        />
      </div>

      <ConfirmDialog
        open={pendingDelete}
        title={`Удалить приложение «${app.name}»?`}
        onConfirm={() => deleteMutation.mutate()}
        onCancel={() => setPendingDelete(false)}
      />
    </div>
  );
}
