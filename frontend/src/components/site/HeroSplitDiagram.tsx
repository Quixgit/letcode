import Link from "next/link";
import { PlatformIcon } from "@/lib/platform-icons";
import { SITE_CONTENT_WIDTH } from "@/components/site/PageContainer";

interface CtaLink {
  label: string;
  url: string;
}

interface DiagramGroup {
  label: string;
  items: { title: string; subtitle?: string }[];
}

interface Diagram {
  window_title?: string;
  tag_label?: string;
  groups: DiagramGroup[];
  caption?: string;
}

interface Callout {
  icon?: string;
  icon_media_id?: string;
  icon_url?: string;
  title: string;
  description: string;
}

interface PlatformBadge {
  icon_key?: string;
  icon_media_id?: string;
  icon_url?: string;
  label: string;
}

function DiagramCard({ diagram }: { diagram: Diagram }) {
  const edge = diagram.groups[0];
  const rest = diagram.groups.slice(1);

  return (
    <div style={{ border: "1px solid #EAE8E1", borderRadius: 18, background: "#FFFFFF", boxShadow: "0 20px 44px rgba(23,24,28,0.08)", overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.85rem 1.1rem", borderBottom: "1px solid #EAE8E1" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ width: 9, height: 9, borderRadius: "50%", background: "#FF5F56" }} />
          <span style={{ width: 9, height: 9, borderRadius: "50%", background: "#FFBD2E" }} />
          <span style={{ width: 9, height: 9, borderRadius: "50%", background: "#27C93F" }} />
          {diagram.window_title && (
            <span style={{ marginLeft: 10, fontSize: 12.5, fontWeight: 500, color: "var(--site-text, #17181C)" }}>{diagram.window_title}</span>
          )}
        </div>
        {diagram.tag_label && (
          <span
            style={{
              fontSize: 10.5,
              fontWeight: 600,
              letterSpacing: 0.3,
              color: "var(--site-accent, #E63946)",
              background: "rgba(230,57,70,0.08)",
              padding: "3px 9px",
              borderRadius: 999,
            }}
          >
            {diagram.tag_label}
          </span>
        )}
      </div>

      <div style={{ padding: "1.25rem" }}>
        {edge && (
          <div style={{ border: "1px solid #EAE8E1", borderRadius: 12, padding: "0.8rem 0.9rem", background: "var(--site-card-bg, #F7F6F2)" }}>
            <p style={{ margin: "0 0 8px", fontSize: 10.5, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, color: "var(--site-text-muted, #8A8C93)" }}>
              {edge.label}
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {edge.items.map((item, i) => (
                <span
                  key={i}
                  style={{
                    fontSize: 12,
                    fontWeight: 500,
                    color: "var(--site-text, #17181C)",
                    background: "#FFFFFF",
                    border: "1px solid #EAE8E1",
                    borderRadius: 8,
                    padding: "5px 10px",
                  }}
                >
                  {item.title}
                </span>
              ))}
            </div>
          </div>
        )}

        {edge && rest.length > 0 && (
          <div style={{ position: "relative", height: 26, margin: "2px 0" }}>
            <div style={{ position: "absolute", left: "50%", top: 0, bottom: 0, width: 0, borderLeft: "1.5px dashed #D7D5CE" }} />
            <div style={{ position: "absolute", left: "50%", top: "50%", width: 6, height: 6, borderRadius: "50%", background: "#D7D5CE", transform: "translate(-50%, -50%)" }} />
          </div>
        )}

        {rest.map((group, gi) => (
          <div
            key={gi}
            style={{
              border: "1px solid #EAE8E1",
              borderRadius: 12,
              padding: "0.8rem 0.9rem",
              background: "var(--site-card-bg, #F7F6F2)",
              marginTop: gi > 0 ? 10 : 0,
            }}
          >
            <p style={{ margin: "0 0 8px", fontSize: 10.5, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, color: "var(--site-text-muted, #8A8C93)" }}>
              {group.label}
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 8 }}>
              {group.items.map((item, i) => (
                <div
                  key={i}
                  style={{
                    fontSize: 12,
                    color: "var(--site-text, #17181C)",
                    background: "#FFFFFF",
                    border: "1px solid #EAE8E1",
                    borderRadius: 8,
                    padding: "7px 10px",
                  }}
                >
                  <p style={{ margin: 0, fontWeight: 500 }}>{item.title}</p>
                  {item.subtitle && <p style={{ margin: "2px 0 0", fontSize: 10.5, color: "var(--site-text-muted, #8A8C93)" }}>{item.subtitle}</p>}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {diagram.caption && (
        <p
          style={{
            margin: 0,
            padding: "0.85rem 1.1rem",
            borderTop: "1px solid #EAE8E1",
            fontSize: 11.5,
            color: "var(--site-text-muted, #8A8C93)",
            lineHeight: 1.6,
          }}
        >
          {diagram.caption}
        </p>
      )}
    </div>
  );
}

export function HeroSplitDiagram({
  eyebrow,
  headingLine1,
  headingLine2Accent,
  subtext,
  primaryCta,
  secondaryCta,
  platformBadges,
  stats,
  diagram,
  callouts,
}: {
  eyebrow?: string;
  headingLine1?: string;
  headingLine2Accent?: string;
  subtext?: string;
  primaryCta?: CtaLink;
  secondaryCta?: CtaLink;
  platformBadges?: PlatformBadge[];
  stats?: { value: string; label: string }[];
  diagram?: Diagram;
  callouts?: Callout[];
}) {
  return (
    <section style={{ padding: "3.5rem 2rem 4rem", maxWidth: SITE_CONTENT_WIDTH, margin: "0 auto" }}>
      <div className="site-hero-split" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48, alignItems: "center" }}>
        <div>
          {eyebrow && (
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                background: "var(--site-card-bg, #F7F6F2)",
                border: "1px solid #EAE8E1",
                borderRadius: 999,
                padding: "5px 13px",
                marginBottom: 18,
              }}
            >
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--site-accent, #E63946)" }} />
              <span style={{ fontSize: 12, fontWeight: 500, color: "var(--site-text-muted, #8A8C93)" }}>{eyebrow}</span>
            </div>
          )}

          <h1 style={{ margin: "0 0 18px", fontSize: 40, fontWeight: 700, lineHeight: 1.18, color: "var(--site-text, #17181C)" }}>
            {headingLine1}
            <br />
            <span
              style={{
                background: "linear-gradient(135deg, var(--site-accent, #E63946), #FF7A6E)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              {headingLine2Accent}
            </span>
          </h1>

          {subtext && (
            <p style={{ fontSize: 15.5, color: "var(--site-text-muted, #8A8C93)", lineHeight: 1.75, margin: "0 0 28px", maxWidth: 480 }}>
              {subtext}
            </p>
          )}

          <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 24, marginBottom: platformBadges?.length ? 28 : 0 }}>
            {primaryCta?.label && primaryCta?.url && (
              <Link
                href={primaryCta.url}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "12px 22px",
                  borderRadius: 10,
                  background: "linear-gradient(135deg, #17181C, var(--site-accent, #E63946))",
                  color: "#FFFFFF",
                  fontSize: 14,
                  fontWeight: 500,
                  textDecoration: "none",
                }}
              >
                {primaryCta.label}
                <i className="ti ti-arrow-right" style={{ fontSize: 15 }} />
              </Link>
            )}
            {secondaryCta?.label && secondaryCta?.url && (
              <Link
                href={secondaryCta.url}
                style={{ fontSize: 14, fontWeight: 500, color: "var(--site-text, #17181C)", textDecoration: "none" }}
              >
                {secondaryCta.label}
              </Link>
            )}
          </div>

          {platformBadges && platformBadges.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 28 }}>
              {platformBadges.map((badge, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    background: "var(--site-card-bg, #F7F6F2)",
                    border: "1px solid #EAE8E1",
                    borderRadius: 999,
                    padding: "5px 11px 5px 5px",
                  }}
                >
                  <div style={{ width: 20, height: 20 }}>
                    <PlatformIcon iconKey={badge.icon_key} iconUrl={badge.icon_url} />
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 500, color: "var(--site-text, #17181C)" }}>{badge.label}</span>
                </div>
              ))}
            </div>
          )}

          {stats && stats.length > 0 && (
            <div className="site-hero-stats" style={{ display: "flex" }}>
              {stats.map((stat, i) => (
                <div key={i} className="site-hero-stat">
                  <p style={{ margin: "0 0 3px", fontSize: 22, fontWeight: 700, color: "var(--site-text, #17181C)" }}>{stat.value}</p>
                  <p style={{ margin: 0, fontSize: 12, color: "var(--site-text-muted, #8A8C93)" }}>{stat.label}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          {diagram && diagram.groups?.length > 0 && <DiagramCard diagram={diagram} />}

          {callouts && callouts.length > 0 && (
            <div className="site-hero-callouts" style={{ display: "grid", gridTemplateColumns: `repeat(${callouts.length}, 1fr)`, gap: 10, marginTop: 16 }}>
              {callouts.map((c, i) => (
                <div key={i} style={{ border: "1px solid #EAE8E1", borderRadius: 12, padding: "0.75rem 0.85rem", background: "var(--site-card-bg, #F7F6F2)" }}>
                  <i className={`ti ${c.icon || "ti-check"}`} style={{ fontSize: 16, color: "var(--site-accent, #E63946)" }} />
                  <p style={{ margin: "7px 0 2px", fontSize: 12.5, fontWeight: 500, color: "var(--site-text, #17181C)" }}>{c.title}</p>
                  <p style={{ margin: 0, fontSize: 11, color: "var(--site-text-muted, #8A8C93)", lineHeight: 1.5 }}>{c.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
