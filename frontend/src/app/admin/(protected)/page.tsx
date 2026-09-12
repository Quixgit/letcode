"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { adminFetch } from "@/lib/admin-api";
import { Card } from "@/components/admin/m3/Card";
import { SegmentedButton } from "@/components/admin/m3/SegmentedButton";
import { LineChart } from "@/components/admin/m3/LineChart";
import { QuickDraftWidget } from "@/components/admin/QuickDraftWidget";
import type { AnalyticsSummary, AppListItem, AuditLogItem, BlogPostListItem, PageListItem } from "@/lib/admin-types";

const PERIODS = [
  { value: "7", label: "7 дней" },
  { value: "30", label: "30 дней" },
  { value: "90", label: "90 дней" },
] as const;

function countByStatus(items: { status: string }[] | undefined) {
  const counts = { draft: 0, published: 0, archived: 0 };
  for (const item of items || []) {
    if (item.status in counts) counts[item.status as keyof typeof counts]++;
  }
  return counts;
}

export default function DashboardPage() {
  const [period, setPeriod] = useState<(typeof PERIODS)[number]["value"]>("7");

  const { data: analytics } = useQuery({
    queryKey: ["analytics-summary", period],
    queryFn: () => adminFetch<AnalyticsSummary>(`api/analytics/summary?days=${period}`),
  });

  const { data: pages } = useQuery({
    queryKey: ["pages"],
    queryFn: () => adminFetch<PageListItem[]>("api/pages"),
  });
  const { data: apps } = useQuery({
    queryKey: ["apps"],
    queryFn: () => adminFetch<AppListItem[]>("api/apps"),
  });
  const { data: blogPosts } = useQuery({
    queryKey: ["blog-posts"],
    queryFn: () => adminFetch<BlogPostListItem[]>("api/blog"),
  });
  const { data: auditLog } = useQuery({
    queryKey: ["audit-log"],
    queryFn: () => adminFetch<AuditLogItem[]>("api/audit-logs"),
  });

  const pageCounts = countByStatus(pages);
  const appCounts = countByStatus(apps);
  const blogCounts = countByStatus(blogPosts);

  return (
    <div className="flex flex-col gap-8">
      <h1 className="md-headline-small m-0 text-md-on-surface">Дашборд</h1>

      <div>
        <h2 className="md-title-medium mb-3 text-md-on-surface">At a Glance</h2>
        <div className="grid grid-cols-3 gap-4">
          <SummaryCard title="Страницы" total={pages?.length ?? 0} counts={pageCounts} href="/admin/pages" />
          <SummaryCard title="Приложения" total={apps?.length ?? 0} counts={appCounts} href="/admin/apps" />
          <SummaryCard title="Посты блога" total={blogPosts?.length ?? 0} counts={blogCounts} href="/admin/blog" />
        </div>
      </div>

      <QuickDraftWidget />

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="md-title-medium m-0 text-md-on-surface">Посещаемость сайта</h2>
          <SegmentedButton segments={[...PERIODS]} value={period} onChange={setPeriod} />
        </div>

        <Card elevation={1} className="mb-4 p-4">
          <div className="mb-3 flex gap-6">
            <div>
              <p className="md-display-small m-0 text-md-on-surface">{analytics?.total_views ?? 0}</p>
              <p className="md-body-small m-0 text-md-on-surface-variant">просмотров</p>
            </div>
            <div>
              <p className="md-display-small m-0 text-md-on-surface">{analytics?.unique_paths ?? 0}</p>
              <p className="md-body-small m-0 text-md-on-surface-variant">уникальных страниц</p>
            </div>
          </div>
          <LineChart data={analytics?.views_by_day ?? []} />
        </Card>

        <div className="grid grid-cols-2 gap-4">
          <Card elevation={1} className="overflow-hidden">
            <p className="md-title-small m-0 border-b border-md-outline-variant px-4 py-3 text-md-on-surface-variant">
              Топ страниц
            </p>
            {(analytics?.top_pages ?? []).map((p) => (
              <div
                key={p.path}
                className="flex items-center justify-between border-b border-md-outline-variant px-4 py-2 md-body-medium last:border-0"
              >
                <span className="truncate text-md-on-surface">{p.path}</span>
                <span className="shrink-0 text-md-on-surface-variant">{p.views}</span>
              </div>
            ))}
            {(analytics?.top_pages?.length ?? 0) === 0 && (
              <p className="md-body-medium px-4 py-3 text-md-on-surface-variant">Пока нет данных.</p>
            )}
          </Card>
          <Card elevation={1} className="overflow-hidden">
            <p className="md-title-small m-0 border-b border-md-outline-variant px-4 py-3 text-md-on-surface-variant">
              Источники трафика
            </p>
            {(analytics?.top_referrers ?? []).map((r) => (
              <div
                key={r.referrer}
                className="flex items-center justify-between border-b border-md-outline-variant px-4 py-2 md-body-medium last:border-0"
              >
                <span className="truncate text-md-on-surface">{r.referrer}</span>
                <span className="shrink-0 text-md-on-surface-variant">{r.views}</span>
              </div>
            ))}
            {(analytics?.top_referrers?.length ?? 0) === 0 && (
              <p className="md-body-medium px-4 py-3 text-md-on-surface-variant">Пока нет данных.</p>
            )}
          </Card>
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="md-title-medium m-0 text-md-on-surface">Последние действия</h2>
          <Link href="/admin/audit-log" className="md-body-small text-md-on-surface-variant hover:text-md-on-surface">
            Весь журнал →
          </Link>
        </div>
        <Card elevation={1} className="overflow-hidden">
          {(auditLog || []).slice(0, 5).map((entry) => (
            <div
              key={entry.id}
              className="flex items-center justify-between border-b border-md-outline-variant px-4 py-2.5 md-body-medium last:border-0"
            >
              <span className="text-md-on-surface">
                {entry.action} · {entry.entity_type}
              </span>
              <span className="text-md-on-surface-variant">{entry.user_email || "—"}</span>
            </div>
          ))}
          {auditLog?.length === 0 && (
            <div className="md-body-medium px-4 py-3 text-md-on-surface-variant">Пока нет записей</div>
          )}
        </Card>
      </div>

      <div>
        <h2 className="md-title-medium mb-2 text-md-on-surface">SEO</h2>
        <Card elevation={1} className="flex gap-4 px-4 py-3 md-body-medium">
          <a
            href="https://lecode.tech/sitemap.xml"
            target="_blank"
            rel="noreferrer"
            className="text-md-on-surface-variant hover:text-md-on-surface"
          >
            sitemap.xml
          </a>
          <a
            href="https://lecode.tech/robots.txt"
            target="_blank"
            rel="noreferrer"
            className="text-md-on-surface-variant hover:text-md-on-surface"
          >
            robots.txt
          </a>
          <a
            href="https://lecode.tech/llms.txt"
            target="_blank"
            rel="noreferrer"
            className="text-md-on-surface-variant hover:text-md-on-surface"
          >
            llms.txt
          </a>
        </Card>
      </div>
    </div>
  );
}

function SummaryCard({
  title,
  total,
  counts,
  href,
}: {
  title: string;
  total: number;
  counts: Record<string, number>;
  href: string;
}) {
  return (
    <Card elevation={1} className="p-5">
      <Link href={href} className="block">
        <p className="md-display-small m-0 text-md-on-surface">{total}</p>
        <p className="md-body-medium m-0 mb-2 text-md-on-surface-variant">{title}</p>
      </Link>
      <p className="md-body-small m-0 flex flex-wrap gap-x-1 text-md-on-surface-variant">
        <Link href={`${href}?status=published`} className="hover:text-md-on-surface hover:underline">
          {counts.published} опубликовано
        </Link>
        <span>·</span>
        <Link href={`${href}?status=draft`} className="hover:text-md-on-surface hover:underline">
          {counts.draft} черновик
        </Link>
        <span>·</span>
        <Link href={`${href}?status=archived`} className="hover:text-md-on-surface hover:underline">
          {counts.archived} архив
        </Link>
      </p>
    </Card>
  );
}
