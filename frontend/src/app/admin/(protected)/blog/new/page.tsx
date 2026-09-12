"use client";

import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { adminFetch } from "@/lib/admin-api";
import { useToast } from "@/lib/toast";
import { BlogPostForm, type BlogPostFormValues } from "@/components/admin/BlogPostForm";
import { Breadcrumbs } from "@/components/admin/m3/Breadcrumbs";

function toBody(values: BlogPostFormValues) {
  return {
    slug: values.slug.trim(),
    title: values.title.trim(),
    excerpt: values.excerpt || null,
    content: values.content,
    cover_image_media_id: values.cover_image_media_id || null,
    tags: values.tags,
    meta_title: values.meta_title || null,
    meta_description: values.meta_description || null,
    og_image_url: values.og_image_url || null,
  };
}

export default function NewBlogPostPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const createMutation = useMutation({
    mutationFn: (values: BlogPostFormValues) =>
      adminFetch<{ id: string }>("api/blog", { method: "POST", body: toBody(values) }),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["blog-posts"] });
      showToast("Пост создан");
      router.push(`/admin/blog/${result.id}`);
    },
    onError: (err: Error) => showToast(err.message, "error"),
  });

  return (
    <div>
      <Breadcrumbs items={[{ label: "Админ", href: "/admin" }, { label: "Блог", href: "/admin/blog" }, { label: "Новый пост" }]} />
      <h1 className="md-headline-small mb-6 text-md-on-surface">Новый пост</h1>
      <BlogPostForm
        submitting={createMutation.isPending}
        submitLabel="Создать"
        onSubmit={(values) => createMutation.mutate(values)}
      />
    </div>
  );
}
