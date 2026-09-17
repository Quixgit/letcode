import type { BlockIcon } from "@/lib/api";
import { PageContainer } from "@/components/site/PageContainer";

// A neutral square badge rather than the red GradientIconBadge used elsewhere — this grid sits
// right under the (also-neutral) status panel and reads better as a calm, technical summary
// than another wash of the site's red accent.
function NeutralIconBadge({ icon, icon_url: iconUrl }: BlockIcon) {
  return (
    <div
      style={{
        width: 48,
        height: 48,
        borderRadius: 12,
        background: "#3A3F4B",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      {iconUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={iconUrl} alt="" style={{ width: 22, height: 22, objectFit: "contain" }} />
      ) : (
        // item.icon is the full "ti-xxx" class from IconField in the admin editor.
        <i className={`ti ${icon || "ti-sparkles"}`} style={{ fontSize: 21, color: "#FFFFFF" }} />
      )}
    </div>
  );
}

export function FeatureGrid({
  heading,
  description,
  columns,
  items,
}: {
  heading?: string;
  description?: string;
  columns: 2 | 3;
  items: ({ title: string; description: string } & BlockIcon)[];
}) {
  if (items.length === 0) return null;

  return (
    <section style={{ padding: "4rem 0", textAlign: "center" }}>
      <PageContainer>
        {heading && (
          <p style={{ fontSize: 26, fontWeight: 500, color: "var(--site-text, #17181C)", margin: "0 0 12px" }}>{heading}</p>
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
          className="site-feature-grid"
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${columns}, 1fr)`,
            gap: 20,
            textAlign: "left",
          }}
        >
          {items.map((item, i) => (
            <div
              key={i}
              className="site-hover-card"
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 14,
                borderRadius: 16,
                border: "1px solid #EAE8E1",
                background: "var(--site-card-bg, #FFFFFF)",
                padding: "1.75rem",
              }}
            >
              <NeutralIconBadge icon={item.icon} icon_url={item.icon_url} />
              <div>
                <p style={{ fontSize: 16, fontWeight: 600, color: "var(--site-text, #17181C)", margin: "0 0 8px" }}>{item.title}</p>
                <p style={{ fontSize: 13.5, color: "var(--site-text-muted, #8A8C93)", margin: 0, lineHeight: 1.65 }}>
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </PageContainer>
    </section>
  );
}
