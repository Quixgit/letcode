import { getPublicSettings } from "@/lib/api";
import { DecorativeBackground } from "@/components/site/DecorativeBackground";
import { PageContainer } from "@/components/site/PageContainer";

export async function CtaBanner({ title, buttonLabel, buttonUrl }: { title: string; buttonLabel: string; buttonUrl: string }) {
  const settings = await getPublicSettings();
  const showDecorative = settings.show_decorative_backgrounds !== false;

  return (
    <section style={{ padding: "0 0 4rem" }}>
      <PageContainer>
      <div
        style={{
          position: "relative",
          overflow: "hidden",
          background: "var(--site-accent, #17181C)",
          borderRadius: 20,
          padding: "3rem 2rem",
          textAlign: "center",
        }}
      >
        {showDecorative && <DecorativeBackground color="#FFFFFF" />}
        <p style={{ position: "relative", fontSize: 26, fontWeight: 500, color: "#FFFFFF", margin: "0 0 24px", lineHeight: 1.3 }}>{title}</p>
        {buttonUrl && buttonLabel && (
          <a
            href={buttonUrl}
            style={{
              display: "inline-block",
              padding: "10px 24px",
              borderRadius: 8,
              background: "#FFFFFF",
              color: "var(--site-accent, #17181C)",
              fontSize: 14,
              fontWeight: 500,
              textDecoration: "none",
            }}
          >
            {buttonLabel}
          </a>
        )}
      </div>
      </PageContainer>
    </section>
  );
}
