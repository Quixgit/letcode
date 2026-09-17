import Link from "next/link";
import type { BlockIcon } from "@/lib/api";
import { GradientIconBadge } from "@/components/site/GradientIconBadge";
import { PageContainer } from "@/components/site/PageContainer";

interface LifecycleItem extends BlockIcon {
  phase_tag?: string;
  title: string;
  description?: string;
  case_link_label?: string;
  case_link_url?: string;
}

export function LifecycleFeatureList({
  heading,
  description,
  items,
}: {
  heading?: string;
  description?: string;
  items: LifecycleItem[];
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
        <div style={{ display: "flex", flexDirection: "column", gap: 20, textAlign: "left" }}>
          {items.map((item, i) => (
            <div
              key={i}
              className="site-hover-card"
              style={{
                display: "flex",
                gap: 20,
                alignItems: "flex-start",
                borderRadius: 16,
                border: "1px solid #EAE8E1",
                background: "var(--site-card-bg, #FFFFFF)",
                padding: "1.5rem",
              }}
            >
              {/* The admin editor uses the shared IconField, which stores the full "ti-xxx" class
                  name, while GradientIconBadge expects the bare suffix and prepends "ti-" itself —
                  strip it here rather than changing either component's established contract. */}
              <GradientIconBadge icon={item.icon?.replace(/^ti-/, "")} iconUrl={item.icon_url} size={48} />
              <div style={{ minWidth: 0 }}>
                {item.phase_tag && (
                  <p
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      letterSpacing: 0.5,
                      color: "var(--site-accent, #E63946)",
                      textTransform: "uppercase",
                      margin: "0 0 6px",
                    }}
                  >
                    {item.phase_tag}
                  </p>
                )}
                <p style={{ fontSize: 17, fontWeight: 600, color: "var(--site-text, #17181C)", margin: "0 0 6px" }}>{item.title}</p>
                {item.description && (
                  <p style={{ fontSize: 14, color: "var(--site-text-muted, #8A8C93)", margin: 0, lineHeight: 1.7 }}>
                    {item.description}
                  </p>
                )}
                {item.case_link_label && item.case_link_url && (
                  <Link
                    href={item.case_link_url}
                    style={{ fontSize: 13, fontWeight: 500, color: "var(--site-accent, #E63946)", textDecoration: "underline" }}
                  >
                    {item.case_link_label}
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      </PageContainer>
    </section>
  );
}
