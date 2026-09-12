import type { BlockIcon } from "@/lib/api";

export function FeatureGrid({
  columns,
  items,
}: {
  columns: 2 | 3;
  items: ({ title: string; description: string } & BlockIcon)[];
}) {
  if (items.length === 0) return null;

  return (
    <section style={{ padding: "0 2rem 4rem", maxWidth: 960, margin: "0 auto" }}>
      <div
        className="site-feature-grid"
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${columns}, 1fr)`,
          gap: 24,
        }}
      >
        {items.map((item, i) => (
          <div
            key={i}
            className="site-hover-card"
            style={{ display: "flex", flexDirection: "column", gap: 10, borderRadius: 12, padding: "0.25rem" }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: "var(--site-card-bg, #F7F6F2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {item.icon_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.icon_url} alt="" style={{ width: 22, height: 22, objectFit: "contain" }} />
              ) : (
                <i className={`ti ${item.icon || "ti-sparkles"}`} style={{ fontSize: 20, color: "var(--site-accent, #17181C)" }} />
              )}
            </div>
            <p style={{ fontSize: 16, fontWeight: 500, color: "var(--site-text, #17181C)", margin: 0 }}>{item.title}</p>
            <p style={{ fontSize: 13, color: "var(--site-text-muted, #8A8C93)", margin: 0, lineHeight: 1.6 }}>{item.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
