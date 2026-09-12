"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminFetch } from "@/lib/admin-api";
import { useToast } from "@/lib/toast";
import { useCanEdit } from "@/lib/role-context";
import { PageForm, type PageFormValues } from "@/components/admin/PageForm";
import { RevisionsPanel } from "@/components/admin/RevisionsPanel";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { PublishControl } from "@/components/admin/PublishControl";
import { Breadcrumbs } from "@/components/admin/m3/Breadcrumbs";
import type { PageDetail } from "@/lib/admin-types";

export default function EditPagePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const canEdit = useCanEdit();
  const [pendingDelete, setPendingDelete] = useState(false);

  const { data: page, isLoading } = useQuery({
    queryKey: ["page", id],
    queryFn: () => adminFetch<PageDetail>(`api/pages/${id}`),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["page", id] });
    queryClient.invalidateQueries({ queryKey: ["pages"] });
  };

  const updateMutation = useMutation({
    mutationFn: (values: PageFormValues) =>
      adminFetch(`api/pages/${id}`, {
        method: "PUT",
        body: {
          slug: values.slug.trim(),
          title: values.title.trim(),
          template: values.template.trim() || "default",
          content: values.content,
          meta_title: values.meta_title || null,
          meta_description: values.meta_description || null,
          og_image_url: values.og_image_url || null,
          canonical_url: values.canonical_url || null,
          noindex: values.noindex,
          structured_data: values.structured_data ? JSON.parse(values.structured_data) : null,
        },
      }),
    onSuccess: () => {
      invalidate();
      queryClient.invalidateQueries({ queryKey: ["page-revisions", id] });
      showToast("Сохранено");
    },
    onError: (err: Error) => showToast(err.message, "error"),
  });

  const publishMutation = useMutation({
    mutationFn: () => adminFetch(`api/pages/${id}/publish`, { method: "POST" }),
    onSuccess: () => {
      invalidate();
      showToast("Страница опубликована");
    },
    onError: (err: Error) => showToast(err.message, "error"),
  });

  const unpublishMutation = useMutation({
    mutationFn: () => adminFetch(`api/pages/${id}/unpublish`, { method: "POST" }),
    onSuccess: () => {
      invalidate();
      showToast("Страница снята с публикации");
    },
    onError: (err: Error) => showToast(err.message, "error"),
  });

  const scheduleMutation = useMutation({
    mutationFn: (isoString: string) =>
      adminFetch(`api/pages/${id}/schedule`, { method: "POST", body: { scheduled_publish_at: isoString } }),
    onSuccess: () => {
      invalidate();
      showToast("Публикация запланирована");
    },
    onError: (err: Error) => showToast(err.message, "error"),
  });

  const cancelScheduleMutation = useMutation({
    mutationFn: () => adminFetch(`api/pages/${id}/schedule/cancel`, { method: "POST" }),
    onSuccess: () => {
      invalidate();
      showToast("Расписание отменено");
    },
    onError: (err: Error) => showToast(err.message, "error"),
  });

  const deleteMutation = useMutation({
    mutationFn: () => adminFetch(`api/pages/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pages"] });
      showToast("Страница удалена");
      router.push("/admin/pages");
    },
    onError: (err: Error) => showToast(err.message, "error"),
  });

  if (isLoading) return <p className="text-[13px] text-md-on-surface-variant">Загрузка...</p>;
  if (!page) return <p className="text-[13px] text-md-on-surface-variant">Страница не найдена.</p>;

  return (
    <div>
      <Breadcrumbs items={[{ label: "Админ", href: "/admin" }, { label: "Страницы", href: "/admin/pages" }, { label: page.title }]} />
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="m-0 md-headline-small text-md-on-surface">{page.title}</h1>
          <StatusBadge status={page.status} />
        </div>
        {canEdit && (
          <div className="flex items-center gap-2">
            <a
              href={`/preview/pages/${page.id}`}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg border border-md-outline-variant px-3 py-1.5 text-[13px] text-md-on-surface hover:border-md-outline"
            >
              Предпросмотр
            </a>
            <PublishControl
              status={page.status}
              scheduledPublishAt={page.scheduled_publish_at}
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
        <PageForm
          key={page.id}
          initial={page}
          submitting={updateMutation.isPending}
          submitLabel="Сохранить"
          onSubmit={(values) => updateMutation.mutate(values)}
        />
        <div>
          <RevisionsPanel pageId={page.id} currentContent={page.content} />
        </div>
      </div>

      <ConfirmDialog
        open={pendingDelete}
        title={`Удалить страницу «${page.title}»?`}
        onConfirm={() => deleteMutation.mutate()}
        onCancel={() => setPendingDelete(false)}
      />
    </div>
  );
}
