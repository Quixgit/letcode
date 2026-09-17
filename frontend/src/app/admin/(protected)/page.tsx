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
          <div className="mb-4 flex flex-wrap gap-8">
            <TrafficStat icon="ti-eye" label="просмотров" value={analytics?.total_views ?? 0} delta={computeDelta(analytics)} />
            <TrafficStat icon="ti-files" label="уникальных страниц" value={analytics?.unique_paths ?? 0} />
            <TrafficStat icon="ti-calendar-event" label="сегодня" value={analytics?.views_today ?? 0} />
          </div>
          <LineChart data={analytics?.views_by_day ?? []} />
        </Card>

        <div className="grid grid-cols-3 gap-4">
          <RankedListCard title="Топ страниц" icon="ti-file-text" rows={(analytics?.top_pages ?? []).map((p) => ({ key: p.path, label: p.path, views: p.views }))} />
          <RankedListCard
            title="Источники трафика"
            icon="ti-external-link"
            rows={(analytics?.top_referrers ?? []).map((r) => ({ key: r.referrer, label: formatReferrer(r.referrer), views: r.views }))}
          />
          <RankedListCard
            title="Устройства"
            icon="ti-devices"
            rows={(analytics?.devices ?? []).map((d) => ({ key: d.device, label: deviceLabel(d.device), views: d.views, icon: deviceIcon(d.device) }))}
          />
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
          <Link href="/admin/seo" className="text-md-on-surface hover:underline">
            Настройки SEO →
          </Link>
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
    <Card elevation={1} outlined className="p-4">
      <Link href={href} className="block">
        <p className="md-display-small m-0 text-md-accent">{total}</p>
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

function computeDelta(analytics: AnalyticsSummary | undefined): number | null {
  // No prior-period baseline to compare against (brand new site, or the whole previous window
  // had zero traffic) — a bare percentage would be misleading (0 → 1 view reads as "+∞%").
  if (!analytics || analytics.prev_views === 0) return null;
  return ((analytics.total_views - analytics.prev_views) / analytics.prev_views) * 100;
}

function formatReferrer(referrer: string): string {
  try {
    return new URL(referrer).hostname.replace(/^www\./, "");
  } catch {
    return referrer;
  }
}

const DEVICE_LABELS: Record<string, string> = {
  desktop: "Десктоп",
  mobile: "Мобильные",
  tablet: "Планшеты",
  bot: "Боты / краулеры",
  unknown: "Неизвестно",
};
const DEVICE_ICONS: Record<string, string> = {
  desktop: "ti-device-desktop",
  mobile: "ti-device-mobile",
  tablet: "ti-device-tablet",
  bot: "ti-robot",
  unknown: "ti-help-circle",
};
function deviceLabel(device: string): string {
  return DEVICE_LABELS[device] || device;
}
function deviceIcon(device: string): string {
  return DEVICE_ICONS[device] || "ti-device-unknown";
}

function TrafficStat({ icon, label, value, delta }: { icon: string; label: string; value: number; delta?: number | null }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-md-secondary-container text-md-on-secondary-container">
        <i className={`ti ${icon} text-base`} />
      </div>
      <div>
        <div className="flex items-baseline gap-2">
          <p className="md-display-small m-0 text-md-on-surface">{value}</p>
          {delta !== undefined && delta !== null && (
            <span
              className={`md-label-small flex items-center gap-0.5 rounded-full px-1.5 py-0.5 ${
                delta > 0
                  ? "bg-md-tertiary-container text-md-on-tertiary-container"
                  : delta < 0
                    ? "bg-md-error-container text-md-on-error-container"
                    : "text-md-on-surface-variant"
              }`}
            >
              <i className={`ti ${delta > 0 ? "ti-trending-up" : delta < 0 ? "ti-trending-down" : "ti-minus"} text-xs`} />
              {delta > 0 ? "+" : ""}
              {delta.toFixed(0)}%
            </span>
          )}
        </div>
        <p className="md-body-small m-0 text-md-on-surface-variant">{label}</p>
      </div>
    </div>
  );
}

function RankedListCard({
  title,
  icon,
  rows,
}: {
  title: string;
  icon: string;
  rows: { key: string; label: string; views: number; icon?: string }[];
}) {
  const max = Math.max(1, ...rows.map((r) => r.views));
  return (
    <Card elevation={1} className="overflow-hidden">
      <p className="md-title-small m-0 flex items-center gap-2 border-b border-md-outline-variant px-4 py-3 text-md-on-surface-variant">
        <i className={`ti ${icon} text-base`} />
        {title}
      </p>
      {rows.map((r) => (
        <div key={r.key} className="relative border-b border-md-outline-variant px-4 py-2 last:border-0">
          <div
            className="absolute inset-y-0 left-0 bg-md-secondary-container/40"
            style={{ width: `${Math.round((r.views / max) * 100)}%` }}
          />
          <div className="relative flex items-center justify-between gap-3 md-body-medium">
            <span className="flex min-w-0 items-center gap-1.5 truncate text-md-on-surface">
              {r.icon && <i className={`ti ${r.icon} shrink-0 text-sm text-md-on-surface-variant`} />}
              <span className="truncate">{r.label}</span>
            </span>
            <span className="shrink-0 text-md-on-surface-variant">{r.views}</span>
          </div>
        </div>
      ))}
      {rows.length === 0 && <p className="md-body-medium px-4 py-3 text-md-on-surface-variant">Пока нет данных.</p>}
    </Card>
  );
}
