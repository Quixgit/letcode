import Link from "next/link";
import { SITE_CONTENT_WIDTH } from "@/components/site/PageContainer";

export interface BreadcrumbItem {
  label: string;
  /** Omit for the current page (last item) or a category-style segment with no real destination. */
  href?: string;
}

/** The one breadcrumb trail component for the public site — every page that renders one should
 * build its `items` array (also reusable for that page's own BreadcrumbList JSON-LD) and pass it
 * here, rather than hand-rolling the `<nav>` markup again. Not rendered on the homepage.
 * `maxWidth` should only ever be left at its default (the shared site container width) or set to
 * `"none"` for a genuinely full-width template — not overridden to some other one-off number. */
export function Breadcrumbs({ items, maxWidth = SITE_CONTENT_WIDTH }: { items: BreadcrumbItem[]; maxWidth?: number | string }) {
  if (items.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" style={{ maxWidth, margin: "0 auto", padding: "1.5rem 2rem 0" }}>
      <ol style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 7, listStyle: "none", margin: 0, padding: 0, fontSize: 13 }}>
        {items.map((item, i) => {
          const isLast = i === items.length - 1;
          return (
            <li key={i} style={{ display: "flex", alignItems: "center", gap: 7 }}>
              {i > 0 && (
                <span style={{ color: "var(--site-text-muted, #8A8C93)", opacity: 0.55 }} aria-hidden="true">
                  /
                </span>
              )}
              {item.href && !isLast ? (
                <Link href={item.href} className="site-breadcrumb-link" style={{ color: "var(--site-text-muted, #8A8C93)", textDecoration: "none" }}>
                  {item.label}
                </Link>
              ) : (
                <span
                  style={{ color: isLast ? "var(--site-text, #17181C)" : "var(--site-text-muted, #8A8C93)" }}
                  aria-current={isLast ? "page" : undefined}
                >
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
