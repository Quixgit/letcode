import Link from "next/link";
import { PageContainer } from "@/components/site/PageContainer";

export function ServiceHeroBanner({
  eyebrow,
  headingLine1,
  headingLine2Accent,
  subtext,
  cta,
  techPills,
}: {
  eyebrow?: string;
  headingLine1: string;
  headingLine2Accent: string;
  subtext?: string;
  cta?: { label: string; url: string };
  techPills?: string[];
}) {
  return (
    <section style={{ background: "linear-gradient(135deg, #14151A, #3A3F4B)", padding: "4.5rem 0 4rem" }}>
      <PageContainer style={{ textAlign: "center" }}>
        {eyebrow && (
          <p
            style={{
              fontSize: 12.5,
              fontWeight: 600,
              letterSpacing: 0.6,
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.6)",
              margin: "0 0 18px",
            }}
          >
            {eyebrow}
          </p>
        )}
        <h1 style={{ fontSize: 38, fontWeight: 500, lineHeight: 1.25, margin: "0 0 20px", color: "#FFFFFF" }}>
          {headingLine1}
          <br />
          <span style={{ color: "var(--site-accent, #E63946)" }}>{headingLine2Accent}</span>
        </h1>
        {subtext && (
          <p
            style={{
              fontSize: 16,
              color: "rgba(255,255,255,0.75)",
              maxWidth: 640,
              margin: "0 auto 28px",
              lineHeight: 1.7,
            }}
          >
            {subtext}
          </p>
        )}
        {cta && (
          <Link
            href={cta.url}
            style={{
              display: "inline-block",
              padding: "12px 28px",
              borderRadius: 8,
              background: "var(--site-accent, #E63946)",
              color: "#FFFFFF",
              fontSize: 14,
              fontWeight: 500,
              textDecoration: "none",
              marginBottom: techPills && techPills.length > 0 ? 32 : 0,
            }}
          >
            {cta.label}
          </Link>
        )}
        {techPills && techPills.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 10, marginTop: cta ? 0 : 28 }}>
            {techPills.map((pill, i) => (
              <span
                key={i}
                style={{
                  padding: "6px 16px",
                  borderRadius: 999,
                  border: "1px solid rgba(255,255,255,0.3)",
                  color: "rgba(255,255,255,0.85)",
                  fontSize: 12.5,
                  fontWeight: 500,
                }}
              >
                {pill}
              </span>
            ))}
          </div>
        )}
      </PageContainer>
    </section>
  );
}
