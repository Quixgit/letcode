"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/app/admin/actions";
import { useCurrentUser } from "@/lib/role-context";
import { useAdminTheme } from "@/lib/admin-theme";

interface NavEntry {
  href: string;
  label: string;
  icon: string;
  exact?: boolean;
}

const TOP_ITEM: NavEntry = { href: "/admin", label: "Дашборд", icon: "ti-layout-dashboard", exact: true };

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
      { href: "/admin/settings", label: "Настройки", icon: "ti-settings" },
    ],
  },
  {
    label: "Система",
    items: [
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

  function renderItem(item: NavEntry) {
    const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
    return (
      <Link
        key={item.href}
        href={item.href}
        className={`md-motion md-label-large flex items-center gap-2.5 rounded-lg border-l-[3px] px-3 py-2 ${
          active
            ? "border-md-primary bg-md-secondary-container font-medium text-md-on-secondary-container"
            : "border-transparent text-md-on-surface-variant hover:bg-md-surface-container-high hover:text-md-on-surface"
        }`}
      >
        <i className={`ti ${item.icon} text-base`} />
        {item.label}
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
          {renderItem(TOP_ITEM)}

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
