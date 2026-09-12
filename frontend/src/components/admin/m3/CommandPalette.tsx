"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { adminFetch } from "@/lib/admin-api";
import type { AppListItem, BlogPostListItem, MediaItem, PageListItem } from "@/lib/admin-types";

interface ResultItem {
  id: string;
  title: string;
  subtitle: string;
  href: string;
  icon: string;
  group: string;
}

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (open) {
      setQuery("");
      setActiveIndex(0);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  const { data: pages } = useQuery({
    queryKey: ["pages"],
    queryFn: () => adminFetch<PageListItem[]>("api/pages"),
    enabled: open,
    staleTime: 30_000,
  });
  const { data: apps } = useQuery({
    queryKey: ["apps"],
    queryFn: () => adminFetch<AppListItem[]>("api/apps"),
    enabled: open,
    staleTime: 30_000,
  });
  const { data: posts } = useQuery({
    queryKey: ["blog-posts", "all"],
    queryFn: () => adminFetch<BlogPostListItem[]>("api/blog"),
    enabled: open,
    staleTime: 30_000,
  });
  const { data: media } = useQuery({
    queryKey: ["media"],
    queryFn: () => adminFetch<MediaItem[]>("api/media"),
    enabled: open,
    staleTime: 30_000,
  });

  const allResults: ResultItem[] = useMemo(
    () => [
      ...(pages || []).map((p) => ({ id: p.id, title: p.title, subtitle: `/${p.slug}`, href: `/admin/pages/${p.id}`, icon: "ti-file-text", group: "Страницы" })),
      ...(apps || []).map((a) => ({ id: a.id, title: a.name, subtitle: `/${a.slug}`, href: `/admin/apps/${a.id}`, icon: "ti-app-window", group: "Приложения" })),
      ...(posts || []).map((p) => ({ id: p.id, title: p.title, subtitle: `/blog/${p.slug}`, href: `/admin/blog/${p.id}`, icon: "ti-news", group: "Блог" })),
      ...(media || []).map((m) => ({ id: m.id, title: m.filename, subtitle: "Медиафайл", href: "/admin/media", icon: "ti-photo", group: "Медиа" })),
    ],
    [pages, apps, posts, media]
  );

  const results = useMemo(() => {
    if (!query.trim()) return allResults.slice(0, 8);
    const q = query.trim().toLowerCase();
    return allResults.filter((r) => r.title.toLowerCase().includes(q) || r.subtitle.toLowerCase().includes(q)).slice(0, 20);
  }, [allResults, query]);

  function go(item: ResultItem) {
    setOpen(false);
    router.push(item.href);
  }

  if (!open) return null;

  return (
    <div
      className="md-dialog-scrim fixed inset-0 z-50 flex items-start justify-center pt-[15vh]"
      style={{ animation: "md-scrim-in var(--md-duration-short) var(--md-easing-standard)" }}
      onClick={() => setOpen(false)}
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-xl bg-md-surface-container-high"
        style={{
          boxShadow: "var(--md-elevation-3)",
          animation: "md-dialog-in var(--md-duration-medium) var(--md-easing-emphasized-decelerate)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2.5 border-b border-md-outline-variant px-4 py-3">
          <i className="ti ti-search text-base text-md-on-surface-variant" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActiveIndex(0);
            }}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setActiveIndex((i) => Math.min(i + 1, results.length - 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setActiveIndex((i) => Math.max(i - 1, 0));
              } else if (e.key === "Enter" && results[activeIndex]) {
                go(results[activeIndex]);
              }
            }}
            placeholder="Искать страницы, приложения, посты, медиа..."
            className="md-body-large flex-1 bg-transparent text-md-on-surface outline-none placeholder:text-md-on-surface-variant"
          />
          <kbd className="md-label-small rounded border border-md-outline-variant px-1.5 py-0.5 text-md-on-surface-variant">
            Esc
          </kbd>
        </div>

        <div className="max-h-80 overflow-y-auto p-2">
          {results.length === 0 && (
            <p className="md-body-medium px-3 py-6 text-center text-md-on-surface-variant">Ничего не найдено.</p>
          )}
          {results.map((item, i) => (
            <button
              key={`${item.group}-${item.id}`}
              onClick={() => go(item)}
              onMouseEnter={() => setActiveIndex(i)}
              className={`md-motion flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left ${
                i === activeIndex ? "bg-md-surface-container-highest" : ""
              }`}
            >
              <i className={`ti ${item.icon} text-base text-md-on-surface-variant`} />
              <div className="min-w-0 flex-1">
                <p className="md-body-medium m-0 truncate text-md-on-surface">{item.title}</p>
                <p className="md-body-small m-0 truncate text-md-on-surface-variant">{item.subtitle}</p>
              </div>
              <span className="md-label-small text-md-on-surface-variant">{item.group}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
