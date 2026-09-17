import Link from "next/link";
import { PageContainer } from "@/components/site/PageContainer";

interface ChallengeItem {
  number?: string;
  problem_title: string;
  problem_description?: string;
  solution_text: string;
  case_link_label?: string;
  case_link_url?: string;
}

export function ChallengeSolutionGrid({ heading, description, items }: { heading?: string; description?: string; items: ChallengeItem[] }) {
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
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 20, textAlign: "left" }}>
          {items.map((item, i) => (
            <div
              key={i}
              style={{
                borderRadius: 16,
                border: "1px solid #EAE8E1",
                background: "var(--site-card-bg, #FFFFFF)",
                padding: "1.75rem",
              }}
            >
              {item.number && (
                <p style={{ fontSize: 13, fontWeight: 700, color: "var(--site-text-muted, #8A8C93)", margin: "0 0 10px" }}>
                  {item.number}
                </p>
              )}
              <p style={{ fontSize: 16, fontWeight: 600, color: "var(--site-text, #17181C)", margin: "0 0 8px" }}>{item.problem_title}</p>
              {item.problem_description && (
                <p style={{ fontSize: 13.5, color: "var(--site-text-muted, #8A8C93)", margin: "0 0 16px", lineHeight: 1.65 }}>
                  {item.problem_description}
                </p>
              )}
              <div
                style={{
                  display: "flex",
                  gap: 10,
                  alignItems: "flex-start",
                  background: "rgba(34, 197, 94, 0.08)",
                  border: "1px solid rgba(34, 197, 94, 0.25)",
                  borderRadius: 10,
                  padding: "0.85rem 1rem",
                }}
              >
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 18,
                    height: 18,
                    borderRadius: "50%",
                    background: "#22C55E",
                    flexShrink: 0,
                    marginTop: 1,
                  }}
                >
                  <i className="ti ti-check" style={{ fontSize: 12, color: "#FFFFFF" }} />
                </span>
                <p style={{ fontSize: 13.5, color: "var(--site-text, #17181C)", margin: 0, lineHeight: 1.6 }}>{item.solution_text}</p>
              </div>
              {item.case_link_label && item.case_link_url && (
                <Link
                  href={item.case_link_url}
                  style={{ display: "inline-block", marginTop: 12, fontSize: 13, fontWeight: 500, color: "var(--site-accent, #E63946)", textDecoration: "underline" }}
                >
                  {item.case_link_label}
                </Link>
              )}
            </div>
          ))}
        </div>
      </PageContainer>
    </section>
  );
}
