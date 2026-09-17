// Shared helper so per-content-type SEO title composition (Pages/Apps/Blog detail pages,
// and the site-wide default in the root layout) all honor the same admin-configurable
// `seo_title_template` setting (Settings → SEO defaults) instead of each hardcoding its own
// " — lecode" / " — lecode blog" suffix. Falls back to the pre-existing hardcoded suffix when
// no template is set, so untouched installs render identical titles to before.
import type { PublicPageBlock } from "@/lib/api";

export function applyTitleTemplate(pageTitle: string, template?: string | null, fallbackSuffix = "lecode"): string {
  if (template && template.includes("%s")) return template.replace("%s", pageTitle);
  return `${pageTitle} — ${fallbackSuffix}`;
}

// Same principle as Apps' SoftwareApplication JSON-LD: derive schema.org structured data
// straight from a content block rather than requiring a second, separately-maintained copy of
// the same Q&A pairs. Aggregates every `faq_accordion` block on the page (hidden ones excluded)
// into a single FAQPage — schema.org expects at most one per page, not one per block.
export function buildFaqPageJsonLd(blocks: PublicPageBlock[]): Record<string, unknown> | null {
  const items = blocks
    .filter((b): b is Extract<PublicPageBlock, { type: "faq_accordion" }> => b.type === "faq_accordion" && !("hidden" in b && b.hidden))
    .flatMap((b) => b.items);
  if (items.length === 0) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };
}
