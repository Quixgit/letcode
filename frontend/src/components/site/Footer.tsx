import Link from "next/link";
import { getPublicSettings, getPublicNavItems, getPublicApps, getActiveTemplate } from "@/lib/api";
import { AppStoreBadge, GooglePlayBadge } from "@/components/site/StoreBadges";
import { PageContainer } from "@/components/site/PageContainer";

export async function Footer() {
  const [settings, navItems, apps, template] = await Promise.all([
    getPublicSettings(),
    getPublicNavItems("footer"),
    getPublicApps(),
    getActiveTemplate(),
  ]);

  const parents = navItems.filter((n) => !n.parent_id);
  const columns = parents.map((parent) => ({
    title: parent.label,
    links: navItems.filter((n) => n.parent_id === parent.id).map((n) => ({ label: n.label, href: n.url })),
  }));

  const socialLinks = [
    { label: "Twitter", href: settings.social_twitter, icon: "ti-brand-x" },
    { label: "GitHub", href: settings.social_github, icon: "ti-brand-github" },
    { label: "LinkedIn", href: settings.social_linkedin, icon: "ti-brand-linkedin" },
  ].filter((s) => s.href);

  const firstApp = apps[0];
  const appStoreUrl = settings.footer_app_store_url || firstApp?.app_store_url || undefined;
  const googlePlayUrl = settings.footer_google_play_url || firstApp?.google_play_url || undefined;

  const copyright = settings.footer_copyright || `© ${new Date().getFullYear()} lecode. All rights reserved.`;
  const justify = template?.footer_config.menu_alignment === "center" ? "center" : template?.footer_config.menu_alignment === "right" ? "end" : "start";

  return (
    <footer
      style={{
        borderTop: "0.5px solid #EAE8E1",
        padding: "3rem 0 2rem",
        marginTop: "auto",
        background: "var(--site-footer-bg, transparent)",
      }}
    >
      <PageContainer
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          gap: 32,
          justifyContent: justify,
        }}
      >
        {columns.map((col) => (
          <div key={col.title}>
            <p style={{ fontSize: 13, fontWeight: 500, color: "var(--site-text, #17181C)", margin: "0 0 12px" }}>{col.title}</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {col.links.map((link) => (
                <Link key={link.href} href={link.href} style={{ fontSize: 13, color: "var(--site-text-muted, #8A8C93)", textDecoration: "none" }}>
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        ))}

        {(appStoreUrl || googlePlayUrl) && (
          <div>
            <p style={{ fontSize: 13, fontWeight: 500, color: "var(--site-text, #17181C)", margin: "0 0 12px" }}>Download App</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {appStoreUrl && <AppStoreBadge href={appStoreUrl} />}
              {googlePlayUrl && <GooglePlayBadge href={googlePlayUrl} />}
            </div>
          </div>
        )}
      </PageContainer>
      <PageContainer
        style={{
          margin: "2.5rem auto 0",
          paddingTop: "1.5rem",
          borderTop: "0.5px solid #EAE8E1",
          display: "flex",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 8,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <p style={{ fontSize: 12, color: "var(--site-text-muted, #8A8C93)", margin: 0 }}>{copyright}</p>
          {socialLinks.length > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {socialLinks.map((s) => (
                <a key={s.label} href={s.href} target="_blank" rel="noreferrer" aria-label={s.label} style={{ color: "var(--site-text-muted, #8A8C93)" }}>
                  <i className={`ti ${s.icon}`} style={{ fontSize: 15 }} />
                </a>
              ))}
            </div>
          )}
        </div>
        <div style={{ display: "flex", gap: 16 }}>
          <a href="/sitemap.xml" style={{ fontSize: 12, color: "var(--site-text-muted, #8A8C93)", textDecoration: "none" }}>
            sitemap.xml
          </a>
          <a href="/llms.txt" style={{ fontSize: 12, color: "var(--site-text-muted, #8A8C93)", textDecoration: "none" }}>
            llms.txt
          </a>
        </div>
      </PageContainer>
    </footer>
  );
}
