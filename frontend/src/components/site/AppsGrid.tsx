import Link from "next/link";
import { getPublicApps } from "@/lib/api";

const appColors: Record<string, string> = {
  blare: "#0F6E56",
  cancely: "#534AB7",
  devtools: "#993C1D",
};

const appIcons: Record<string, string> = {
  blare: "ti-bell-ringing",
  cancely: "ti-receipt",
  devtools: "ti-tool",
};

export async function AppsGrid({ apps }: { apps?: Awaited<ReturnType<typeof getPublicApps>> }) {
  const allApps = apps || (await getPublicApps());
  const list = allApps.filter((a) => a.show_on_homepage);

  return (
    <section
      id="apps"
      style={{
        padding: "0 2rem 4rem",
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
        gap: 20,
        maxWidth: 960,
        margin: "0 auto",
      }}
    >
      {list.length === 0 && <p style={{ color: "#8A8C93", fontSize: 14 }}>No apps published yet.</p>}
      {list.map((app) => {
        const color = appColors[app.slug] || "#8A8C93";
        const primary = app.google_play_url
          ? { href: app.google_play_url, label: "Get it on Google Play", icon: "ti-brand-google-play" }
          : app.app_store_url
            ? { href: app.app_store_url, label: "Get it on App Store", icon: "ti-brand-apple" }
            : app.website_url
              ? { href: app.website_url, label: "Visit website", icon: "ti-external-link" }
              : null;

        return (
          <div
            key={app.id}
            className="site-hover-card"
            style={{
              background: `color-mix(in srgb, ${color} 10%, white)`,
              borderRadius: 16,
              padding: "1.75rem",
              display: "flex",
              flexDirection: "column",
              gap: 14,
            }}
          >
            {app.category && (
              <span
                style={{
                  display: "inline-block",
                  width: "fit-content",
                  fontSize: 11,
                  fontWeight: 500,
                  color: "#FFFFFF",
                  background: color,
                  padding: "3px 10px",
                  borderRadius: 999,
                  textTransform: "uppercase",
                  letterSpacing: 0.4,
                }}
              >
                {app.category}
              </span>
            )}

            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 13,
                background: color,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
              }}
            >
              {app.icon_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={app.icon_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <i className={`ti ${appIcons[app.slug] || "ti-app-window"}`} style={{ fontSize: 24, color: "#FFFFFF" }} />
              )}
            </div>

            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 18, fontWeight: 500, margin: "0 0 6px", color: "#17181C" }}>{app.name}</p>
              <p style={{ fontSize: 13, color: "#8A8C93", margin: 0, lineHeight: 1.6 }}>{app.short_description}</p>
            </div>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {primary && (
                <a
                  href={primary.href}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "8px 14px",
                    borderRadius: 8,
                    background: "#17181C",
                    color: "#FFFFFF",
                    fontSize: 13,
                    fontWeight: 500,
                    textDecoration: "none",
                  }}
                >
                  <i className={`ti ${primary.icon}`} /> {primary.label}
                </a>
              )}
              <Link
                href={`/apps/${app.slug}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "8px 14px",
                  borderRadius: 8,
                  background: "#FFFFFF",
                  color: "#17181C",
                  fontSize: 13,
                  fontWeight: 500,
                  textDecoration: "none",
                }}
              >
                Learn more
              </Link>
            </div>
          </div>
        );
      })}
    </section>
  );
}

export async function AppsStrip() {
  const apps = (await getPublicApps()).filter((a) => a.show_on_homepage);
  if (apps.length === 0) return null;

  return (
    <section
      style={{
        padding: "0 2rem 3rem",
        maxWidth: 960,
        margin: "0 auto",
        display: "flex",
        gap: 12,
        flexWrap: "wrap",
        justifyContent: "center",
      }}
    >
      {apps.map((app) => {
        const color = appColors[app.slug] || "#8A8C93";
        return (
          <Link
            key={app.id}
            href={`/apps/${app.slug}`}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 14px 8px 8px",
              borderRadius: 999,
              background: "#F7F6F2",
              textDecoration: "none",
            }}
          >
            <div
              style={{
                width: 24,
                height: 24,
                borderRadius: 7,
                background: color,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
              }}
            >
              {app.icon_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={app.icon_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <i className={`ti ${appIcons[app.slug] || "ti-app-window"}`} style={{ fontSize: 12, color: "#FFFFFF" }} />
              )}
            </div>
            <span style={{ fontSize: 13, fontWeight: 500, color: "#17181C" }}>{app.name}</span>
          </Link>
        );
      })}
    </section>
  );
}
