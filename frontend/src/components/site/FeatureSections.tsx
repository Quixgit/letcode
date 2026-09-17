import type { FeatureSection } from "@/lib/api";
import { PageContainer } from "@/components/site/PageContainer";

export function FeatureSections({ sections }: { sections: FeatureSection[] }) {
  if (sections.length === 0) return null;

  return (
    <section style={{ padding: "0 0 4rem" }}>
      <PageContainer style={{ display: "flex", flexDirection: "column", gap: 56 }}>
      {sections.map((section, i) => (
        <div
          key={i}
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 40,
            alignItems: "center",
          }}
        >
          <div style={{ order: section.layout === "image_left" ? 2 : 1 }}>
            <h3 style={{ fontSize: 22, fontWeight: 500, color: "#17181C", margin: "0 0 12px" }}>{section.title}</h3>
            <p style={{ fontSize: 14, color: "#8A8C93", lineHeight: 1.8, margin: 0, whiteSpace: "pre-wrap" }}>
              {section.description}
            </p>
          </div>
          {section.image_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={section.image_url}
              alt={section.title}
              style={{ width: "100%", borderRadius: 12, order: section.layout === "image_left" ? 1 : 2 }}
            />
          )}
        </div>
      ))}
      </PageContainer>
    </section>
  );
}
