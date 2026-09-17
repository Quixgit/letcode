import { Fragment } from "react";
import type { PublicPageBlock } from "@/lib/api";
import { getPublicTestimonials, getPublicBlogPosts } from "@/lib/api";
import { AppsGrid } from "@/components/site/AppsGrid";
import { BlogPreview } from "@/components/site/BlogPreview";
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
import { HeroSlider } from "@/components/site/HeroSlider";
import { PlatformGrid } from "@/components/site/PlatformGrid";
import { FaqAccordion } from "@/components/site/FaqAccordion";
import { WhyChooseUs } from "@/components/site/WhyChooseUs";
import { HeroSplitDiagram } from "@/components/site/HeroSplitDiagram";
import { CoreServicesGrid } from "@/components/site/CoreServicesGrid";
import { LogoMarquee } from "@/components/site/LogoMarquee";
import { ContactFormBlock } from "@/components/site/ContactFormBlock";
import { ServiceHeroBanner } from "@/components/site/ServiceHeroBanner";
import { LifecycleFeatureList } from "@/components/site/LifecycleFeatureList";
import { ChallengeSolutionGrid } from "@/components/site/ChallengeSolutionGrid";
import { RelatedServicesGrid } from "@/components/site/RelatedServicesGrid";
import { Reveal } from "@/components/site/Reveal";
import { PageContainer } from "@/components/site/PageContainer";

// Plain content fragments (richtext, heading, image, ...) have no width of their own — they need
// an ambient container. `contained=true` (the default, for top-level page content) gives each one
// its own PageContainer; `contained=false` (used for children nested inside a "columns" block,
// which already lives inside a column narrower than the page container) renders them bare so they
// just fill whatever width their column already has, instead of re-centering to the full 960px
// page width from inside a column that's only a few hundred px wide.
async function Block({ block, contained }: { block: PublicPageBlock; contained: boolean }) {
  if ("hidden" in block && block.hidden) return null;

  switch (block.type) {
    case "heading": {
      const Tag = block.level === 3 ? "h3" : "h2";
      const el = (
        <Tag style={{ fontSize: block.level === 3 ? 17 : 20, fontWeight: 500, color: "var(--site-text, #17181C)", margin: "2rem 0 1rem" }}>
          {block.text}
        </Tag>
      );
      return contained ? <PageContainer>{el}</PageContainer> : el;
    }

    case "text": {
      const el = (
        <p style={{ fontSize: 15, color: "var(--site-text, #17181C)", lineHeight: 1.8, margin: "0 0 1rem", whiteSpace: "pre-wrap" }}>
          {block.text}
        </p>
      );
      return contained ? <PageContainer>{el}</PageContainer> : el;
    }

    case "paragraph": {
      const el = (
        <p
          style={{ fontSize: 15, color: "var(--site-text, #17181C)", lineHeight: 1.8, margin: "0 0 1rem" }}
          dangerouslySetInnerHTML={{ __html: block.html }}
        />
      );
      return contained ? <PageContainer>{el}</PageContainer> : el;
    }

    case "richtext": {
      const el = <div className="site-richtext" dangerouslySetInnerHTML={{ __html: block.html }} />;
      return contained ? <PageContainer>{el}</PageContainer> : el;
    }

    case "image": {
      const el = (
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
      return contained ? <PageContainer>{el}</PageContainer> : el;
    }

    case "gallery": {
      const el = (
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
      return contained ? <PageContainer>{el}</PageContainer> : el;
    }

    case "button": {
      const primary = block.style !== "secondary";
      const el = (
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
      return contained ? <PageContainer>{el}</PageContainer> : el;
    }

    case "columns": {
      const el = (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 32, margin: "1.5rem 0" }}>
          {block.columns.map((col, i) => (
            <div key={i} style={{ flex: `${block.spans?.[i] ?? 1} 1 240px`, minWidth: 0 }}>
              <BlockRenderer blocks={col} contained={false} />
            </div>
          ))}
        </div>
      );
      return contained ? <PageContainer>{el}</PageContainer> : el;
    }

    case "stats_bar":
      return <StatsBar stats={block.stats} />;

    case "feature_grid":
      return <FeatureGrid heading={block.heading} description={block.description} columns={block.columns} items={block.items} />;

    case "how_it_works":
      return <HowItWorks heading={block.heading} description={block.description} steps={block.steps} />;

    case "cta_banner":
      return <CtaBanner title={block.title} buttonLabel={block.button_label} buttonUrl={block.button_url} />;

    case "apps_showcase":
      return <AppsGrid />;

    case "blog_showcase": {
      const posts = await getPublicBlogPosts();
      return <BlogPreview posts={posts.slice(0, block.count ?? 3)} />;
    }

    case "testimonials_carousel": {
      const all = await getPublicTestimonials();
      const filtered = block.app_id ? all.filter((t) => t.app_id === block.app_id) : all;
      return <TestimonialsCarousel testimonials={filtered} />;
    }

    case "app_mockup_panel":
      return <AppMockupPanel panels={block.panels} compact={block.compact} contained={contained} />;

    case "annotated_screenshot":
      return <AnnotatedScreenshot imageUrl={block.image_url} annotations={block.annotations} />;

    case "category_preview_row":
      return <CategoryPreviewRow categories={block.categories} />;

    case "progress_dots":
      return <ProgressDots />;

    case "section_label":
      return <SectionLabel text={block.text} />;

    case "hero_slider":
      return <HeroSlider slides={block.slides} intervalMs={block.interval_ms} fullWidth={block.full_width} height={block.height} />;

    case "platform_grid":
      return <PlatformGrid theme={block.theme} heading={block.heading} description={block.description} items={block.items} />;

    case "faq_accordion":
      return <FaqAccordion heading={block.heading} description={block.description} columns={block.columns} items={block.items} />;

    case "why_choose_us":
      return <WhyChooseUs heading={block.heading} description={block.description} items={block.items} />;

    case "hero_split_diagram":
      return (
        <HeroSplitDiagram
          eyebrow={block.eyebrow}
          headingLine1={block.heading_line1}
          headingLine2Accent={block.heading_line2_accent}
          subtext={block.subtext}
          primaryCta={block.primary_cta}
          secondaryCta={block.secondary_cta}
          platformBadges={block.platform_badges}
          stats={block.stats}
          diagram={block.diagram}
          callouts={block.callouts}
        />
      );

    case "core_services_grid":
      return <CoreServicesGrid heading={block.heading} description={block.description} items={block.items} />;

    case "logo_marquee":
      return <LogoMarquee heading={block.heading} items={block.items} speed={block.speed} pauseOnHover={block.pause_on_hover} />;

    case "contact_form":
      return (
        <ContactFormBlock
          formKey={block.form_key}
          title={block.title}
          description={block.description}
          fields={block.fields}
          submitLabel={block.submit_label}
          successMessage={block.success_message}
          layout={block.layout}
          getInTouch={block.get_in_touch}
          eitherRequired={block.either_required}
        />
      );

    case "service_hero_banner":
      return (
        <ServiceHeroBanner
          eyebrow={block.eyebrow}
          headingLine1={block.heading_line1}
          headingLine2Accent={block.heading_line2_accent}
          subtext={block.subtext}
          cta={block.cta}
          techPills={block.tech_pills}
        />
      );

    case "lifecycle_feature_list":
      return <LifecycleFeatureList heading={block.heading} description={block.description} items={block.items} />;

    case "challenge_solution_grid":
      return <ChallengeSolutionGrid heading={block.heading} description={block.description} items={block.items} />;

    case "related_services_grid":
      return <RelatedServicesGrid heading={block.heading} items={block.items} />;

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
  "blog_showcase",
  "testimonials_carousel",
  "app_mockup_panel",
  "annotated_screenshot",
  "category_preview_row",
  "progress_dots",
  "section_label",
  "platform_grid",
  "faq_accordion",
  "why_choose_us",
  "core_services_grid",
  "logo_marquee",
  "contact_form",
  "lifecycle_feature_list",
  "challenge_solution_grid",
  "related_services_grid",
]);

// Block types that sit on the template's alternate section-band color (e.g. nexus-classic's
// light-gray stripes). Fallback is "transparent" for every other template, so this has zero
// visual effect unless a template's theme_config.section_alt_bg is set.
const ALT_BG_TYPES = new Set(["app_mockup_panel", "feature_grid", "category_preview_row"]);

export function BlockRenderer({ blocks, contained = true }: { blocks: PublicPageBlock[]; contained?: boolean }) {
  return (
    <>
      {blocks.map((block, i) => {
        const content = ALT_BG_TYPES.has(block.type) ? (
          <div style={{ background: "var(--site-section-alt-bg, transparent)" }}>
            <Block block={block} contained={contained} />
          </div>
        ) : (
          <Block block={block} contained={contained} />
        );
        return REVEAL_TYPES.has(block.type) ? <Reveal key={i}>{content}</Reveal> : <Fragment key={i}>{content}</Fragment>;
      })}
    </>
  );
}
