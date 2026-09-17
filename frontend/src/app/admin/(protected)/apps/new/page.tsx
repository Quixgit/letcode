"use client";

import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { adminFetch } from "@/lib/admin-api";
import { useToast } from "@/lib/toast";
import { AppForm, type AppFormValues } from "@/components/admin/AppForm";
import { Breadcrumbs } from "@/components/admin/m3/Breadcrumbs";

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

export default function NewAppPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const createMutation = useMutation({
    mutationFn: (values: AppFormValues) =>
      adminFetch<{ id: string }>("api/apps", { method: "POST", body: toBody(values) }),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["apps"] });
      showToast("Приложение создано");
      router.push(`/admin/apps/${result.id}`);
    },
    onError: (err: Error) => showToast(err.message, "error"),
  });

  return (
    <div>
      <Breadcrumbs items={[{ label: "Админ", href: "/admin" }, { label: "Приложения", href: "/admin/apps" }, { label: "Новое приложение" }]} />
      <h1 className="md-headline-small mb-6 text-md-on-surface">Новое приложение</h1>
      <AppForm
        submitting={createMutation.isPending}
        submitLabel="Создать"
        onSubmit={(values) => createMutation.mutate(values)}
      />
    </div>
  );
}
