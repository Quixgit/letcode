import type { ReactNode, CSSProperties } from "react";
import Link from "next/link";
import { GradientIconBadge } from "@/components/site/GradientIconBadge";
import { PageContainer } from "@/components/site/PageContainer";

interface CoreServiceItem {
  icon?: string;
  icon_media_id?: string;
  icon_url?: string;
  tag_label?: string;
  title: string;
  description?: string;
  featured?: boolean;
  bullets?: string[];
  url?: string;
}

// Renders as a real link (keyboard/SEO friendly, whole card clickable) when the item has a
// `url`; otherwise a plain div, so a service without a detail page yet still renders fine.
function ServiceCardLink({
  href,
  className,
  style,
  children,
}: { href?: string; className?: string; style?: CSSProperties; children: ReactNode }) {
  if (href) {
    return (
      <Link href={href} className={className} style={{ textDecoration: "none", color: "inherit", ...style }}>
        {children}
      </Link>
    );
  }
  return (
    <div className={className} style={style}>
      {children}
    </div>
  );
}

export function CoreServicesGrid({
  heading,
  description,
  items,
}: {
  heading?: string;
  description?: string;
  items: CoreServiceItem[];
}) {
  if (items.length === 0) return null;

  return (
    <section style={{ padding: "4rem 0", textAlign: "center" }}>
      <PageContainer>
      {heading && (
        <p
          style={{
            fontSize: 26,
            fontWeight: 500,
            color: "var(--site-text, #17181C)",
            margin: "0 0 12px",
            display: "inline-block",
            borderBottom: "3px solid var(--site-accent, #E63946)",
            paddingBottom: 10,
          }}
        >
          {heading}
        </p>
      )}
      {description && (
        <p
          style={{
            fontSize: 14.5,
            color: "var(--site-text-muted, #8A8C93)",
            maxWidth: 560,
            margin: "0 auto 2.5rem",
            lineHeight: 1.7,
          }}
        >
          {description}
        </p>
      )}

      <div
        className="site-services-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 16,
          marginTop: description ? 0 : 32,
          alignItems: "start",
          textAlign: "left",
        }}
      >
        {items.map((item, i) =>
          item.featured ? (
            <ServiceCardLink
              key={i}
              href={item.url}
              className="site-service-card site-service-card--featured"
              style={{
                position: "relative",
                borderRadius: 16,
                padding: "1.75rem 1.5rem",
                background: "linear-gradient(150deg, var(--site-accent, #E63946), #FF7A6E)",
                boxShadow: "0 14px 30px rgba(230,57,70,0.3)",
              }}
            >
              {item.tag_label && (
                <span
                  style={{
                    display: "inline-block",
                    background: "rgba(255,255,255,0.22)",
                    color: "#FFFFFF",
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: 0.5,
                    padding: "3px 10px",
                    borderRadius: 999,
                    marginBottom: 14,
                  }}
                >
                  {item.tag_label}
                </span>
              )}
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.18)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 16,
                }}
              >
                {item.icon_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.icon_url} alt="" style={{ width: 26, height: 26, objectFit: "contain" }} />
                ) : (
                  <i className={`ti ti-${item.icon || "sparkles"}`} style={{ fontSize: 24, color: "#FFFFFF" }} />
                )}
              </div>
              <p style={{ fontSize: 16, fontWeight: 600, color: "#FFFFFF", margin: "0 0 8px" }}>{item.title}</p>
              {item.description && (
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.85)", margin: 0, lineHeight: 1.65 }}>{item.description}</p>
              )}
              {item.url && (
                <p style={{ fontSize: 12.5, fontWeight: 600, color: "#FFFFFF", margin: "14px 0 0", display: "flex", alignItems: "center", gap: 4 }}>
                  Learn more <i className="ti ti-arrow-right" style={{ fontSize: 13 }} />
                </p>
              )}
            </ServiceCardLink>
          ) : (
            <ServiceCardLink
              key={i}
              href={item.url}
              className="site-service-card"
              style={{
                position: "relative",
                borderRadius: 16,
                padding: "1.75rem 1.5rem",
                background: "var(--site-card-bg, #FFFFFF)",
                border: "1px solid #EAE8E1",
                display: "block",
              }}
            >
              <div style={{ marginBottom: 16 }}>
                <GradientIconBadge icon={item.icon} iconUrl={item.icon_url} size={52} />
              </div>
              <p style={{ fontSize: 16, fontWeight: 600, color: "var(--site-text, #17181C)", margin: "0 0 8px" }}>{item.title}</p>
              {item.description && (
                <p style={{ fontSize: 13, color: "var(--site-text-muted, #8A8C93)", margin: 0, lineHeight: 1.65 }}>{item.description}</p>
              )}

              {item.bullets && item.bullets.length > 0 && (
                <div className="site-service-bullets">
                  <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 8 }}>
                    {item.bullets.map((bullet, bi) => (
                      <li key={bi} style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 12.5, color: "var(--site-text, #17181C)", lineHeight: 1.5 }}>
                        <span
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            width: 16,
                            height: 16,
                            borderRadius: "50%",
                            background: "#22C55E",
                            flexShrink: 0,
                            marginTop: 1,
                          }}
                        >
                          <i className="ti ti-check" style={{ fontSize: 11, color: "#FFFFFF" }} />
                        </span>
                        {bullet}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {item.url && (
                <p
                  style={{
                    fontSize: 12.5,
                    fontWeight: 600,
                    color: "var(--site-accent, #E63946)",
                    margin: "14px 0 0",
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  Learn more <i className="ti ti-arrow-right" style={{ fontSize: 13 }} />
                </p>
              )}
            </ServiceCardLink>
          )
        )}
      </div>
      </PageContainer>
    </section>
  );
}
