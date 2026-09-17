"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { logoutAction } from "@/app/admin/actions";
import { adminFetch } from "@/lib/admin-api";
import { useCurrentUser } from "@/lib/role-context";
import { useAdminTheme } from "@/lib/admin-theme";

interface NavEntry {
  href: string;
  label: string;
  icon: string;
  exact?: boolean;
}

const TOP_ITEMS: NavEntry[] = [
  { href: "/admin", label: "Дашборд", icon: "ti-layout-dashboard", exact: true },
  { href: "/admin/help", label: "Помощь", icon: "ti-help-circle" },
];

interface NavGroup {
  label: string;
  items: NavEntry[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: "Контент",
    items: [
      { href: "/admin/pages", label: "Страницы", icon: "ti-file-text" },
      { href: "/admin/apps", label: "Приложения", icon: "ti-app-window" },
      { href: "/admin/blog", label: "Блог", icon: "ti-news" },
      { href: "/admin/media", label: "Медиатека", icon: "ti-photo" },
    ],
  },
  {
    label: "Сайт",
    items: [
      { href: "/admin/homepage", label: "Главная страница", icon: "ti-home" },
      { href: "/admin/templates", label: "Шаблоны", icon: "ti-layout-grid" },
      { href: "/admin/navigation", label: "Навигация", icon: "ti-menu-2" },
      { href: "/admin/seo", label: "SEO", icon: "ti-search" },
      { href: "/admin/settings", label: "Настройки", icon: "ti-settings" },
    ],
  },
  {
    label: "Система",
    items: [
      { href: "/admin/submissions", label: "Заявки", icon: "ti-inbox" },
      { href: "/admin/redirects", label: "Редиректы", icon: "ti-arrow-forward-up" },
      { href: "/admin/audit-log", label: "Журнал аудита", icon: "ti-history" },
    ],
  },
];

const ADMIN_ONLY_ITEM: NavEntry = { href: "/admin/users", label: "Пользователи", icon: "ti-users" };

function navGroups(isAdmin: boolean): NavGroup[] {
  if (!isAdmin) return NAV_GROUPS;
  return NAV_GROUPS.map((group) =>
    group.label === "Система" ? { ...group, items: [ADMIN_ONLY_ITEM, ...group.items] } : group
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useCurrentUser();
  const { mode, toggle } = useAdminTheme();

  const groups = navGroups(user?.role === "admin");

  // Polled, not just fetched once: this is the one nav item where "new since I last looked"
  // actually matters (a lead sitting unseen is the whole reason this page exists) — a 60s
  // interval is enough to feel current without hammering the endpoint from every admin screen.
  const { data: unread } = useQuery({
    queryKey: ["submissions-unread-count"],
    queryFn: () => adminFetch<{ count: number }>("api/submissions/unread-count"),
    refetchInterval: 60_000,
  });

  function renderItem(item: NavEntry) {
    const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
    const badge = item.href === "/admin/submissions" ? unread?.count : undefined;
    return (
      <Link
        key={item.href}
        href={item.href}
        className={`md-motion md-label-large flex items-center gap-2.5 rounded-lg border-l-[3px] px-3 py-2 ${
          active
            ? "border-md-accent bg-md-accent-container font-medium text-md-on-accent-container"
            : "border-transparent text-md-on-surface-variant hover:bg-md-surface-container-high hover:text-md-on-surface"
        }`}
      >
        <i className={`ti ${item.icon} text-base`} />
        {item.label}
        {!!badge && (
          <span className="ml-auto flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-md-error px-1 text-[10px] font-medium text-md-on-error">
            {badge}
          </span>
        )}
      </Link>
    );
  }

  return (
    <aside className="flex h-screen w-60 shrink-0 flex-col border-r border-md-outline-variant bg-md-surface-container-low">
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="flex items-center gap-2 px-5 py-5">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-md-primary">
            <i className="ti ti-terminal-2 text-sm text-md-on-primary" />
          </div>
          <span className="md-title-medium text-md-on-surface">lecode admin</span>
        </div>

        <nav className="flex flex-col gap-0.5 px-3">
          {TOP_ITEMS.map(renderItem)}

          {groups.map((group) => (
            <div key={group.label} className="mt-3 flex flex-col gap-0.5">
              <p className="md-label-small mb-1 px-3 uppercase tracking-wide text-md-on-surface-variant/70">
                {group.label}
              </p>
              {group.items.map(renderItem)}
            </div>
          ))}
        </nav>
      </div>

      <div className="border-t border-md-outline-variant px-3 py-4">
        {user && (
          <div className="mb-2 px-2">
            <p className="md-body-small m-0 truncate text-md-on-surface">{user.email}</p>
            <p className="md-label-small m-0 capitalize text-md-on-surface-variant">{user.role}</p>
          </div>
        )}
        <button
          type="button"
          onClick={toggle}
          className="md-motion md-label-large flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-md-on-surface-variant hover:bg-md-surface-container-high hover:text-md-on-surface"
        >
          <i className={`ti ${mode === "dark" ? "ti-sun" : "ti-moon"} text-base`} />
          {mode === "dark" ? "Светлая тема" : "Тёмная тема"}
        </button>
        <form action={logoutAction}>
          <button
            type="submit"
            className="md-motion md-label-large flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-md-on-surface-variant hover:bg-md-surface-container-high hover:text-md-on-surface"
          >
            <i className="ti ti-logout text-base" />
            Выйти
          </button>
        </form>
      </div>
    </aside>
  );
}
