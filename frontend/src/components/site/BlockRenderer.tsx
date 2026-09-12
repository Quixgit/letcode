import { Fragment } from "react";
import type { PublicPageBlock } from "@/lib/api";
import { getPublicTestimonials } from "@/lib/api";
import { AppsGrid } from "@/components/site/AppsGrid";
import { StatsBar } from "@/components/site/StatsBar";
import { FeatureGrid } from "@/components/site/FeatureGrid";
import { HowItWorks } from "@/components/site/HowItWorks";
import { CtaBanner } from "@/components/site/CtaBanner";
import { TestimonialsCarousel } from "@/components/site/TestimonialsCarousel";
import { AppMockupPanel } from "@/components/site/AppMockupPanel";
import { AnnotatedScreenshot } from "@/components/site/AnnotatedScreenshot";
import { CategoryPreviewRow } from "@/components/site/CategoryPreviewRow";
import { ProgressDots } from "@/components/site/ProgressDots";
import { SectionLabel } from "@/components/site/SectionLabel";
import { Reveal } from "@/components/site/Reveal";

async function Block({ block }: { block: PublicPageBlock }) {
  if ("hidden" in block && block.hidden) return null;

  switch (block.type) {
    case "heading": {
      const Tag = block.level === 3 ? "h3" : "h2";
      return (
        <Tag style={{ fontSize: block.level === 3 ? 17 : 20, fontWeight: 500, color: "var(--site-text, #17181C)", margin: "2rem 0 1rem" }}>
          {block.text}
        </Tag>
      );
    }

    case "text":
      return (
        <p style={{ fontSize: 15, color: "var(--site-text, #17181C)", lineHeight: 1.8, margin: "0 0 1rem", whiteSpace: "pre-wrap" }}>
          {block.text}
        </p>
      );

    case "paragraph":
      return (
        <p
          style={{ fontSize: 15, color: "var(--site-text, #17181C)", lineHeight: 1.8, margin: "0 0 1rem" }}
          dangerouslySetInnerHTML={{ __html: block.html }}
        />
      );

    case "richtext":
      return <div className="site-richtext" dangerouslySetInnerHTML={{ __html: block.html }} />;

    case "image":
      return (
        <figure style={{ margin: "1.5rem 0" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={block.url} alt={block.alt || ""} style={{ maxWidth: "100%", borderRadius: 12 }} />
          {block.caption && (
            <figcaption style={{ fontSize: 13, color: "var(--site-text-muted, #8A8C93)", marginTop: 8, textAlign: "center" }}>
              {block.caption}
            </figcaption>
          )}
        </figure>
      );

    case "gallery":
      return (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: 12,
            margin: "1.5rem 0",
          }}
        >
          {block.images.map((img, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={i} src={img.url} alt={img.alt || ""} style={{ width: "100%", borderRadius: 12, objectFit: "cover" }} />
          ))}
        </div>
      );

    case "button": {
      const primary = block.style !== "secondary";
      return (
        <a
          href={block.url}
          style={{
            display: "inline-block",
            margin: "0.5rem 0 1.5rem",
            padding: "10px 20px",
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 500,
            textDecoration: "none",
            background: primary ? "var(--site-accent, #17181C)" : "var(--site-card-bg, #F7F6F2)",
            color: primary ? "#FFFFFF" : "var(--site-text, #17181C)",
          }}
        >
          {block.label}
        </a>
      );
    }

    case "columns":
      return (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 32, margin: "1.5rem 0" }}>
          {block.columns.map((col, i) => (
            <div key={i} style={{ flex: `${block.spans?.[i] ?? 1} 1 240px`, minWidth: 0 }}>
              <BlockRenderer blocks={col} />
            </div>
          ))}
        </div>
      );

    case "stats_bar":
      return <StatsBar stats={block.stats} />;

    case "feature_grid":
      return <FeatureGrid columns={block.columns} items={block.items} />;

    case "how_it_works":
      return <HowItWorks steps={block.steps} />;

    case "cta_banner":
      return <CtaBanner title={block.title} buttonLabel={block.button_label} buttonUrl={block.button_url} />;

    case "apps_showcase":
      return <AppsGrid />;

    case "testimonials_carousel": {
      const all = await getPublicTestimonials();
      const filtered = block.app_id ? all.filter((t) => t.app_id === block.app_id) : all;
      return <TestimonialsCarousel testimonials={filtered} />;
    }

    case "app_mockup_panel":
      return <AppMockupPanel panels={block.panels} compact={block.compact} />;

    case "annotated_screenshot":
      return <AnnotatedScreenshot imageUrl={block.image_url} annotations={block.annotations} />;

    case "category_preview_row":
      return <CategoryPreviewRow categories={block.categories} />;

    case "progress_dots":
      return <ProgressDots />;

    case "section_label":
      return <SectionLabel text={block.text} />;

    default:
      return null;
  }
}

const REVEAL_TYPES = new Set([
  "stats_bar",
  "feature_grid",
  "how_it_works",
  "cta_banner",
  "apps_showcase",
  "testimonials_carousel",
  "app_mockup_panel",
  "annotated_screenshot",
  "category_preview_row",
  "progress_dots",
  "section_label",
]);

// Block types that sit on the template's alternate section-band color (e.g. nexus-classic's
// light-gray stripes). Fallback is "transparent" for every other template, so this has zero
// visual effect unless a template's theme_config.section_alt_bg is set.
const ALT_BG_TYPES = new Set(["app_mockup_panel", "feature_grid", "category_preview_row"]);

export function BlockRenderer({ blocks }: { blocks: PublicPageBlock[] }) {
  return (
    <>
      {blocks.map((block, i) => {
        const content = ALT_BG_TYPES.has(block.type) ? (
          <div style={{ background: "var(--site-section-alt-bg, transparent)" }}>
            <Block block={block} />
          </div>
        ) : (
          <Block block={block} />
        );
        return REVEAL_TYPES.has(block.type) ? <Reveal key={i}>{content}</Reveal> : <Fragment key={i}>{content}</Fragment>;
      })}
    </>
  );
}
