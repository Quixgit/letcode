import Link from "next/link";
import { getPublicSettings, getPublicNavItems, getActiveTemplate, getPublicBlogPosts } from "@/lib/api";
import type { NavItem } from "@/lib/api";
import { NavMenu } from "@/components/site/NavMenu";

const isAppsUrl = (url: string) => url.startsWith("/apps") || url.startsWith("/#apps");
const isBlogUrl = (url: string) => url.startsWith("/blog");

/** site_mode is a site-wide axis independent of nav_items content: it reorders/demotes existing
 * header nav entries at render time (never writes to the DB) so admin-authored mega menus survive. */
function applySiteModeToHeaderNav(navItems: NavItem[], siteMode: string, blogTags: string[]): NavItem[] {
  if (siteMode === "blog") {
    const blogItems = navItems.filter((i) => isBlogUrl(i.url));
    const rest = navItems.filter((i) => !isBlogUrl(i.url) && !isAppsUrl(i.url));
    const appsItems = navItems
      .filter((i) => isAppsUrl(i.url))
      .map((i) => ({ ...i, menu_type: "link" as const, menu_content: null }));
    return [...blogItems, ...rest, ...appsItems];
  }
  if (siteMode === "full") {
    return navItems.map((item) => {
      if (!isBlogUrl(item.url) || item.menu_content || blogTags.length === 0) return item;
      return {
        ...item,
        menu_type: "mega_menu" as const,
        menu_content: {
          tabs: [
            {
              label: "Категории",
              columns: 2 as const,
              items: blogTags.slice(0, 8).map((tag) => ({ title: tag, description: null, icon_url: null, url: `/blog?tag=${encodeURIComponent(tag)}` })),
            },
          ],
          side_panel: { title: "Blog", style: "text_links" as const, items: [{ label: "Все статьи", url: "/blog" }] },
        },
      };
    });
  }
  return navItems;
}

export async function Header() {
  const [settings, navItems, template, blogPosts] = await Promise.all([
    getPublicSettings(),
    getPublicNavItems("header"),
    getActiveTemplate(),
    getPublicBlogPosts(),
  ]);
  const siteName = settings.site_name || "lecode";
  const siteMode = settings.site_mode || "landing";
  const blogTags = Array.from(new Set(blogPosts.flatMap((p) => p.tags))).sort();
  const effectiveNavItems = applySiteModeToHeaderNav(navItems, siteMode, blogTags);

  const alignment = template?.header_config.menu_alignment || "right";
  const sticky = template?.header_config.sticky ?? false;
  const showCta = template?.header_config.show_cta_button ?? false;

  return (
    <header
      style={{
        display: "flex",
        alignItems: "center",
        padding: "1.1rem 2rem",
        borderBottom: "0.5px solid #EAE8E1",
        background: "var(--site-page-bg, #FFFFFF)",
        position: sticky ? "sticky" : "relative",
        top: sticky ? 0 : undefined,
        zIndex: 20,
      }}
    >
      <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none", flexShrink: 0 }}>
        {settings.logo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={settings.logo_url} alt={siteName} style={{ width: 26, height: 26, borderRadius: 7, objectFit: "cover" }} />
        ) : (
          <div
            style={{
              width: 26,
              height: 26,
              borderRadius: 7,
              background: "var(--site-text, #17181C)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <i className="ti ti-terminal-2" style={{ fontSize: 14, color: "#FFFFFF" }} />
          </div>
        )}
        <span style={{ fontWeight: 500, fontSize: 15, color: "var(--site-text, #17181C)" }}>{siteName}</span>
      </Link>

      <NavMenu navItems={effectiveNavItems} alignment={alignment} />

      {showCta && (
        <Link
          href="/#apps"
          className="site-cta-desktop"
          style={{
            marginLeft: alignment === "right" ? 20 : alignment === "center" ? 0 : "auto",
            flexShrink: 0,
            padding: "8px 16px",
            borderRadius: 8,
            background: "var(--site-accent, #17181C)",
            color: "#FFFFFF",
            fontSize: 13,
            fontWeight: 500,
            textDecoration: "none",
          }}
        >
          Get started
        </Link>
      )}
    </header>
  );
}
