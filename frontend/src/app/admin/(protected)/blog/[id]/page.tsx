"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminFetch } from "@/lib/admin-api";
import { useToast } from "@/lib/toast";
import { useCanEdit, useIsAdmin } from "@/lib/role-context";
import { BlogPostForm, type BlogPostFormValues } from "@/components/admin/BlogPostForm";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { PublishControl } from "@/components/admin/PublishControl";
import { ReviewActions } from "@/components/admin/ReviewActions";
import { ReviewNoteCallout } from "@/components/admin/ReviewBadge";
import { Button } from "@/components/admin/m3/Button";
import { Breadcrumbs } from "@/components/admin/m3/Breadcrumbs";
import type { BlogPostDetail } from "@/lib/admin-types";

export default function EditBlogPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const canEdit = useCanEdit();
  const isAdmin = useIsAdmin();
  const [pendingDelete, setPendingDelete] = useState(false);

  const { data: post, isLoading } = useQuery({
    queryKey: ["blog-post", id],
    queryFn: () => adminFetch<BlogPostDetail>(`api/blog/${id}`),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["blog-post", id] });
    queryClient.invalidateQueries({ queryKey: ["blog-posts"] });
  };

  const updateMutation = useMutation({
    mutationFn: (values: BlogPostFormValues) =>
      adminFetch(`api/blog/${id}`, {
        method: "PUT",
        body: {
          slug: values.slug.trim(),
          title: values.title.trim(),
          excerpt: values.excerpt || null,
          content: values.content,
          cover_image_media_id: values.cover_image_media_id || null,
          tags: values.tags,
          meta_title: values.meta_title || null,
          meta_description: values.meta_description || null,
          og_image_url: values.og_image_url || null,
          canonical_url: values.canonical_url || null,
          noindex: values.noindex,
          structured_data: values.structured_data.trim() ? JSON.parse(values.structured_data) : null,
        },
      }),
    onSuccess: () => {
      invalidate();
      showToast("Сохранено");
    },
    onError: (err: Error) => showToast(err.message, "error"),
  });

  const publishMutation = useMutation({
    mutationFn: () => adminFetch(`api/blog/${id}/publish`, { method: "POST" }),
    onSuccess: () => {
      invalidate();
      showToast("Пост опубликован");
    },
    onError: (err: Error) => showToast(err.message, "error"),
  });

  const unpublishMutation = useMutation({
    mutationFn: () => adminFetch(`api/blog/${id}/unpublish`, { method: "POST" }),
    onSuccess: () => {
      invalidate();
      showToast("Пост снят с публикации");
    },
    onError: (err: Error) => showToast(err.message, "error"),
  });

  const scheduleMutation = useMutation({
    mutationFn: (isoString: string) =>
      adminFetch(`api/blog/${id}/schedule`, { method: "POST", body: { scheduled_publish_at: isoString } }),
    onSuccess: () => {
      invalidate();
      showToast("Публикация запланирована");
    },
    onError: (err: Error) => showToast(err.message, "error"),
  });

  const cancelScheduleMutation = useMutation({
    mutationFn: () => adminFetch(`api/blog/${id}/schedule/cancel`, { method: "POST" }),
    onSuccess: () => {
      invalidate();
      showToast("Расписание отменено");
    },
    onError: (err: Error) => showToast(err.message, "error"),
  });

  const deleteMutation = useMutation({
    mutationFn: () => adminFetch(`api/blog/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blog-posts"] });
      showToast("Пост перемещён в корзину");
      router.push("/admin/blog");
    },
    onError: (err: Error) => showToast(err.message, "error"),
  });

  const submitReviewMutation = useMutation({
    mutationFn: (note: string) => adminFetch(`api/blog/${id}/submit-review`, { method: "POST", body: { note } }),
    onSuccess: () => {
      invalidate();
      showToast("Отправлено на проверку");
    },
    onError: (err: Error) => showToast(err.message, "error"),
  });

  const reviewDecisionMutation = useMutation({
    mutationFn: (body: { decision: string; note: string }) =>
      adminFetch(`api/blog/${id}/review-decision`, { method: "POST", body }),
    onSuccess: () => {
      invalidate();
      showToast("Решение сохранено");
    },
    onError: (err: Error) => showToast(err.message, "error"),
  });

  if (isLoading) return <p className="md-body-medium text-md-on-surface-variant">Загрузка...</p>;
  if (!post) return <p className="md-body-medium text-md-on-surface-variant">Пост не найден.</p>;

  return (
    <div>
      <Breadcrumbs items={[{ label: "Админ", href: "/admin" }, { label: "Блог", href: "/admin/blog" }, { label: post.title }]} />
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="md-headline-small m-0 text-md-on-surface">{post.title}</h1>
          <StatusBadge status={post.status} />
        </div>
        {canEdit && (
          <div className="flex items-center gap-2">
            <ReviewActions
              reviewStatus={post.review_status}
              isAdmin={isAdmin}
              canEdit={canEdit}
              submitting={submitReviewMutation.isPending || reviewDecisionMutation.isPending}
              onSubmitReview={(note) => submitReviewMutation.mutate(note)}
              onApprove={() => reviewDecisionMutation.mutate({ decision: "approved", note: "" })}
              onRequestChanges={(note) => reviewDecisionMutation.mutate({ decision: "changes_requested", note })}
            />
            <PublishControl
              status={post.status}
              scheduledPublishAt={post.scheduled_publish_at}
              onPublishNow={() => publishMutation.mutate()}
              onUnpublish={() => unpublishMutation.mutate()}
              onSchedule={(iso) => scheduleMutation.mutate(iso)}
              onCancelSchedule={() => cancelScheduleMutation.mutate()}
              publishing={publishMutation.isPending}
              unpublishing={unpublishMutation.isPending}
              scheduling={scheduleMutation.isPending}
            />
            <Button variant="text" onClick={() => setPendingDelete(true)}>
              Удалить
            </Button>
          </div>
        )}
      </div>

      <ReviewNoteCallout status={post.review_status} note={post.review_note} />
      <BlogPostForm
        key={post.id}
        initial={post}
        submitting={updateMutation.isPending}
        submitLabel="Сохранить"
        onSubmit={(values) => updateMutation.mutate(values)}
      />

      <ConfirmDialog
        open={pendingDelete}
        title={`Удалить пост «${post.title}»?`}
        onConfirm={() => deleteMutation.mutate()}
        onCancel={() => setPendingDelete(false)}
      />
    </div>
  );
}
