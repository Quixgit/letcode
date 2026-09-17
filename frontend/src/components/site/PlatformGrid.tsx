import { PlatformIcon } from "@/lib/platform-icons";
import { PageContainer } from "@/components/site/PageContainer";

interface PlatformItem {
  icon_key?: string;
  icon_media_id?: string;
  icon_url?: string;
  tag_label?: string;
  title: string;
  subtitle?: string;
  featured?: boolean;
}

export function PlatformGrid({
  theme,
  heading,
  description,
  items,
}: {
  theme?: "dark" | "light";
  heading?: string;
  description?: string;
  items: PlatformItem[];
}) {
  if (items.length === 0) return null;

  const isLight = theme === "light";

  return (
    <section
      style={{
        background: isLight
          ? "linear-gradient(180deg, rgba(230,57,70,0.05), rgba(230,57,70,0) 55%), var(--site-page-bg, #FAFAFA)"
          : "#17181C",
        padding: "4rem 0",
      }}
    >
      <PageContainer style={{ textAlign: "center" }}>
        {heading && (
          <p
            style={{
              fontSize: 26,
              fontWeight: 500,
              color: isLight ? "var(--site-text, #17181C)" : "#FFFFFF",
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
              color: isLight ? "var(--site-text-muted, #8A8C93)" : "rgba(255,255,255,0.6)",
              maxWidth: 560,
              margin: "0 auto 2.5rem",
              lineHeight: 1.7,
            }}
          >
            {description}
          </p>
        )}

        <div
          className="site-platform-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 16,
            marginTop: description ? 0 : 32,
          }}
        >
          {items.map((item, i) => (
            <div
              key={i}
              className={`site-logo-card${item.featured ? " site-logo-card--featured" : ""}`}
              style={{
                position: "relative",
                background: isLight ? "#FFFFFF" : "#1E2025",
                borderRadius: 14,
                padding: "1.5rem 1rem",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 10,
                // Rest-state border/shadow only — `.site-logo-card:hover` (globals.css) overrides
                // both with `!important` for the scale+glow effect, since these are also set here
                // as inline styles (an unqualified CSS rule can never win against an inline
                // style, only an `!important` one can).
                border: item.featured
                  ? "1px solid var(--site-accent, #E63946)"
                  : `1px solid ${isLight ? "#EAE8E1" : "rgba(255,255,255,0.08)"}`,
                boxShadow: item.featured
                  ? "0 0 0 1px var(--site-accent, #E63946), 0 0 28px rgba(230,57,70,0.25)"
                  : isLight
                    ? "0 1px 3px rgba(23,24,28,0.05)"
                    : "none",
              }}
            >
              {item.tag_label && (
                <span
                  style={{
                    position: "absolute",
                    top: -10,
                    left: "50%",
                    transform: "translateX(-50%)",
                    background: "var(--site-accent, #E63946)",
                    color: "#FFFFFF",
                    fontSize: 10,
                    fontWeight: 600,
                    letterSpacing: 0.4,
                    padding: "3px 10px",
                    borderRadius: 999,
                    whiteSpace: "nowrap",
                  }}
                >
                  {item.tag_label}
                </span>
              )}
              <div style={{ width: 64, height: 64, marginTop: item.tag_label ? 6 : 0 }}>
                <PlatformIcon iconKey={item.icon_key} iconUrl={item.icon_url} />
              </div>
              <p
                className="site-logo-card-title"
                style={{
                  fontSize: 13.5,
                  fontWeight: 500,
                  color: isLight ? "var(--site-text, #17181C)" : "#FFFFFF",
                  margin: 0,
                  textAlign: "center",
                  textTransform: isLight ? "uppercase" : "none",
                  letterSpacing: isLight ? 0.3 : "normal",
                }}
              >
                {item.title}
              </p>
              {item.subtitle && (
                <p
                  style={{
                    fontSize: 11.5,
                    color: isLight ? "var(--site-text-muted, #8A8C93)" : "rgba(255,255,255,0.5)",
                    margin: 0,
                    textAlign: "center",
                  }}
                >
                  {item.subtitle}
                </p>
              )}
            </div>
          ))}
        </div>
      </PageContainer>
    </section>
  );
}
