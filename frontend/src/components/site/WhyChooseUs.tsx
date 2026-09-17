import { GradientIconBadge } from "@/components/site/GradientIconBadge";
import { PageContainer } from "@/components/site/PageContainer";

interface WhyChooseUsItem {
  icon_media_id?: string;
  icon_url?: string;
  stat: string;
  label: string;
}

export function WhyChooseUs({
  heading,
  description,
  items,
}: {
  heading?: string;
  description?: string;
  items: WhyChooseUsItem[];
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

      <div className="site-why-choose-row">
        {items.map((item, i) => (
          <div key={i} className="site-why-choose-item">
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 18 }}>
              <GradientIconBadge iconUrl={item.icon_url} />
            </div>
            <p style={{ fontSize: 24, fontWeight: 700, color: "var(--site-text, #17181C)", margin: "0 0 8px" }}>{item.stat}</p>
            <p style={{ fontSize: 13, color: "var(--site-text-muted, #8A8C93)", margin: 0, lineHeight: 1.6 }}>{item.label}</p>
          </div>
        ))}
      </div>
      </PageContainer>
    </section>
  );
}
