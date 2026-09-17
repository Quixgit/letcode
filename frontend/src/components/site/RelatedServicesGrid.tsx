import Link from "next/link";
import type { BlockIcon } from "@/lib/api";
import { GradientIconBadge } from "@/components/site/GradientIconBadge";
import { PageContainer } from "@/components/site/PageContainer";

interface RelatedServiceItem extends BlockIcon {
  title: string;
  description?: string;
  url: string;
}

export function RelatedServicesGrid({ heading, items }: { heading?: string; items: RelatedServiceItem[] }) {
  if (items.length === 0) return null;

  return (
    <section style={{ padding: "4rem 0", textAlign: "center" }}>
      <PageContainer>
        {heading && (
          <p style={{ fontSize: 26, fontWeight: 500, color: "var(--site-text, #17181C)", margin: "0 0 2rem" }}>{heading}</p>
        )}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16, textAlign: "left" }}>
          {items.map((item, i) => (
            <Link
              key={i}
              href={item.url}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                borderRadius: 14,
                border: "1px solid #EAE8E1",
                background: "var(--site-card-bg, #FFFFFF)",
                padding: "1.1rem 1.25rem",
                textDecoration: "none",
                color: "inherit",
              }}
            >
              {/* icon comes from IconField in the admin editor, which stores the full "ti-xxx"
                  class — GradientIconBadge expects the bare suffix and prepends "ti-" itself. */}
              <GradientIconBadge icon={item.icon?.replace(/^ti-/, "")} iconUrl={item.icon_url} size={40} />
              <div style={{ minWidth: 0, flex: 1 }}>
                <p style={{ fontSize: 14.5, fontWeight: 600, color: "var(--site-text, #17181C)", margin: 0 }}>{item.title}</p>
                {item.description && (
                  <p style={{ fontSize: 12.5, color: "var(--site-text-muted, #8A8C93)", margin: "2px 0 0", lineHeight: 1.5 }}>
                    {item.description}
                  </p>
                )}
              </div>
              <i className="ti ti-arrow-right" style={{ fontSize: 15, color: "var(--site-text-muted, #8A8C93)", flexShrink: 0 }} />
            </Link>
          ))}
        </div>
      </PageContainer>
    </section>
  );
}
