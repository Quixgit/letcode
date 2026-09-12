"use client";

import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { adminFetch } from "@/lib/admin-api";
import { useToast } from "@/lib/toast";
import { PageForm, type PageFormValues } from "@/components/admin/PageForm";
import { Breadcrumbs } from "@/components/admin/m3/Breadcrumbs";

export default function NewPagePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const createMutation = useMutation({
    mutationFn: (values: PageFormValues) =>
      adminFetch<{ id: string }>("api/pages", {
        method: "POST",
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
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["pages"] });
      showToast("Страница создана");
      router.push(`/admin/pages/${result.id}`);
    },
    onError: (err: Error) => showToast(err.message, "error"),
  });

  return (
    <div>
      <Breadcrumbs items={[{ label: "Админ", href: "/admin" }, { label: "Страницы", href: "/admin/pages" }, { label: "Новая страница" }]} />
      <h1 className="md-headline-small mb-6 text-md-on-surface">Новая страница</h1>
      <PageForm
        submitting={createMutation.isPending}
        submitLabel="Создать"
        onSubmit={(values) => createMutation.mutate(values)}
      />
    </div>
  );
}
