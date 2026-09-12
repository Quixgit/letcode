"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { adminFetch } from "@/lib/admin-api";
import { useToast } from "@/lib/toast";
import { Card } from "@/components/admin/m3/Card";
import { Button } from "@/components/admin/m3/Button";

const inputClass =
  "block w-full rounded-lg border border-md-outline-variant bg-transparent px-2.5 py-1.5 text-[13px] text-md-on-surface outline-none focus:border-md-primary";

function slugify(title: string) {
  return title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function QuickDraftWidget() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [lastDraftId, setLastDraftId] = useState<string | null>(null);

  const createMutation = useMutation({
    mutationFn: () => {
      const html = body
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => `<p>${line}</p>`)
        .join("");
      return adminFetch<{ id: string }>("api/blog", {
        method: "POST",
        body: {
          title: title.trim(),
          slug: slugify(title) || `draft-${Date.now()}`,
          content: html ? [{ type: "richtext", html }] : [],
        },
      });
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["blog-posts"] });
      setLastDraftId(result.id);
      setTitle("");
      setBody("");
      showToast("Черновик сохранён");
    },
    onError: (err: Error) => showToast(err.message, "error"),
  });

  return (
    <Card elevation={1} className="p-4">
      <p className="md-title-small m-0 mb-3 text-md-on-surface-variant">Quick Draft</p>
      <div className="flex flex-col gap-2">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Заголовок"
          className={inputClass}
        />
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Пара мыслей..."
          rows={4}
          className={`${inputClass} resize-none`}
        />
        <div className="flex items-center gap-3">
          <Button
            onClick={() => createMutation.mutate()}
            disabled={!title.trim() || createMutation.isPending}
            className="px-3 py-1.5"
          >
            {createMutation.isPending ? "Сохранение..." : "Save Draft"}
          </Button>
          {lastDraftId && (
            <a
              href={`/admin/blog/${lastDraftId}`}
              className="md-body-small text-md-on-surface-variant hover:text-md-on-surface"
            >
              Продолжить редактирование →
            </a>
          )}
        </div>
      </div>
    </Card>
  );
}
