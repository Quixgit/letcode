import type { Metadata } from "next";
import {
  getPublicApps,
  getPublicSettings,
  getPublicPage,
  getPublicTestimonials,
  getPublicBlogPosts,
  getActiveTemplate,
  DEFAULT_HOMEPAGE_SECTIONS,
} from "@/lib/api";
import { BlockRenderer } from "@/components/site/BlockRenderer";
import { buildFaqPageJsonLd } from "@/lib/seo";
import { StatsBar } from "@/components/site/StatsBar";
import { TestimonialsSection } from "@/components/site/TestimonialsSection";
import { BlogPreview } from "@/components/site/BlogPreview";
import { AppsGrid, AppsStrip } from "@/components/site/AppsGrid";
import { NexusHero } from "@/components/site/NexusHero";
import { NexusClassicHero } from "@/components/site/NexusClassicHero";
import { Reveal } from "@/components/site/Reveal";
import { BlogCoverArt } from "@/components/site/BlogCoverArt";
import { PageContainer } from "@/components/site/PageContainer";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "lecode — small tools for infrastructure work",
  description: "A collection of focused apps for DevOps engineers, built by one person.",
  alternates: { canonical: "https://lecode.tech/" },
  openGraph: {
    title: "lecode — small tools for infrastructure work",
    description: "A collection of focused apps for DevOps engineers, built by one person.",
    url: "https://lecode.tech/",
    siteName: "lecode",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "lecode — small tools for infrastructure work",
    description: "A collection of focused apps for DevOps engineers, built by one person.",
  },
};

function Hero({ compact }: { compact?: boolean }) {
  return (
    <section style={{ padding: compact ? "3rem 0 2rem" : "4.5rem 0 3rem", textAlign: "center" }}>
      <PageContainer>
        <h1
          style={{
            fontSize: compact ? 28 : 38,
            fontWeight: 500,
            margin: "0 auto 16px",
            maxWidth: 560,
            lineHeight: 1.25,
            color: "var(--site-text, #17181C)",
          }}
        >
          Small, focused apps for people who run infrastructure
        </h1>
        <p style={{ fontSize: 16, color: "var(--site-text-muted, #8A8C93)", margin: "0 auto", maxWidth: 440, lineHeight: 1.7 }}>
          Built by one DevOps engineer who&apos;d rather ship than configure.
        </p>
      </PageContainer>
    </section>
  );
}

function MarketplaceComingSoon() {
  return (
    <section style={{ padding: "3rem 0 6rem", textAlign: "center" }}>
      <PageContainer
        style={{
          maxWidth: 480,
          padding: "2.5rem 2rem",
          border: "1px solid var(--site-border, #EAE8E1)",
          borderRadius: 16,
        }}
      >
        <p
          style={{
            fontSize: 13,
            fontWeight: 600,
            letterSpacing: 0.4,
            textTransform: "uppercase",
            color: "var(--site-text-muted, #8A8C93)",
            margin: "0 0 8px",
          }}
        >
          Marketplace
        </p>
        <p style={{ fontSize: 20, fontWeight: 500, color: "var(--site-text, #17181C)", margin: "0 0 8px" }}>
          Coming soon
        </p>
        <p style={{ fontSize: 14, color: "var(--site-text-muted, #8A8C93)", margin: 0, lineHeight: 1.6 }}>
          We&apos;re building a marketplace for infrastructure tools and integrations. Check back soon.
        </p>
      </PageContainer>
    </section>
  );
}

function BlogFeed({ posts }: { posts: Awaited<ReturnType<typeof getPublicBlogPosts>> }) {
  if (posts.length === 0) return null;
  return (
    <section style={{ padding: "0 0 4rem" }}>
      <PageContainer style={{ maxWidth: 720, display: "flex", flexDirection: "column", gap: 32 }}>
      {posts.map((post) => (
        <a key={post.id} href={`/blog/${post.slug}`} style={{ textDecoration: "none", display: "flex", gap: 20 }}>
          {post.cover_image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={post.cover_image_url}
              alt=""
              style={{ width: 160, height: 110, objectFit: "cover", borderRadius: 10, flexShrink: 0 }}
            />
          ) : (
            <div style={{ width: 160, height: 110, flexShrink: 0 }}>
              <BlogCoverArt tags={post.tags} height={110} />
            </div>
          )}
          <div>
            {post.tags[0] && (
              <span style={{ fontSize: 11, fontWeight: 500, color: "var(--site-text-muted, #8A8C93)", textTransform: "uppercase", letterSpacing: 0.4 }}>
                {post.tags[0]}
              </span>
            )}
            <p style={{ fontSize: 17, fontWeight: 500, color: "var(--site-text, #17181C)", margin: "4px 0 6px", lineHeight: 1.4 }}>{post.title}</p>
            {post.excerpt && <p style={{ fontSize: 13, color: "var(--site-text-muted, #8A8C93)", margin: 0, lineHeight: 1.6 }}>{post.excerpt}</p>}
          </div>
        </a>
      ))}
      </PageContainer>
    </section>
  );
}

export default async function Home() {
  const [apps, settings, testimonials, blogPosts, template] = await Promise.all([
    getPublicApps(),
    getPublicSettings(),
    getPublicTestimonials(),
    getPublicBlogPosts(),
    getActiveTemplate(),
  ]);

  const siteMode = settings.site_mode || "landing";
  const HeroComponent =
    template?.slug === "nexus-light" ? NexusHero : template?.slug === "nexus-classic" ? NexusClassicHero : Hero;
  const sections = { ...DEFAULT_HOMEPAGE_SECTIONS, ...settings.homepage_sections };
  const homepageApps = apps.filter((a) => a.show_on_homepage);
  const stats = settings.homepage_stats || [];

  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: homepageApps.map((app, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: `https://lecode.tech/apps/${app.slug}`,
      name: app.name,
    })),
  };
  const faqJsonLd = buildFaqPageJsonLd(settings.homepage_blocks || []);
  const jsonLdScript =
    settings.seo_json_ld_enabled === false ? null : (
      <>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }} />
        {faqJsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />}
      </>
    );

  // ---- site_mode: full — richest composition, apps + blog + testimonials in equal footing ----
  if (siteMode === "full") {
    return (
      <div style={{ background: "var(--site-page-bg, #FFFFFF)", minHeight: "100vh" }}>
        {jsonLdScript}
        {sections.hero && <HeroComponent />}
        {sections.stats && (
          <Reveal>
            <StatsBar stats={stats} />
          </Reveal>
        )}
        {sections.apps && (
          <Reveal>
            <AppsGrid apps={homepageApps} />
          </Reveal>
        )}
        {(settings.homepage_blocks?.length ?? 0) > 0 && <BlockRenderer blocks={settings.homepage_blocks || []} />}
        {sections.testimonials && (
          <Reveal>
            <TestimonialsSection testimonials={testimonials} />
          </Reveal>
        )}
        {sections.blog && (
          <Reveal>
            <BlogFeed posts={blogPosts.slice(0, 6)} />
          </Reveal>
        )}
      </div>
    );
  }

  // ---- site_mode: blog — blog leads regardless of homepage_layout fine-tuning ----
  if (siteMode === "blog") {
    return (
      <div style={{ background: "var(--site-page-bg, #FFFFFF)", minHeight: "100vh" }}>
        {jsonLdScript}
        {sections.hero && <Hero compact />}
        <Reveal>
          <BlogFeed posts={blogPosts.slice(0, 6)} />
        </Reveal>
        {sections.apps && (
          <Reveal>
            <AppsStrip />
          </Reveal>
        )}
        {sections.testimonials && (
          <Reveal>
            <TestimonialsSection testimonials={testimonials} />
          </Reveal>
        )}
      </div>
    );
  }

  // ---- site_mode: landing (default) — fine-tuned by homepage_layout as before ----
  const layout = settings.homepage_layout || "minimal";

  // ---- new: full block-based landing mode -------------------------------
  if (layout === "landing") {
    return (
      <div style={{ background: "var(--site-page-bg, #FFFFFF)", minHeight: "100vh" }}>
        {jsonLdScript}
        {sections.hero && <HeroComponent />}
        <BlockRenderer blocks={settings.homepage_blocks || []} />
        {sections.blog && (
          <Reveal>
            <BlogPreview posts={blogPosts.slice(0, 3)} />
          </Reveal>
        )}
      </div>
    );
  }

  // ---- new: blog-first homepage ------------------------------------------
  if (layout === "blog") {
    return (
      <div style={{ background: "var(--site-page-bg, #FFFFFF)", minHeight: "100vh" }}>
        {jsonLdScript}
        {sections.hero && <Hero compact />}
        <Reveal>
          <BlogFeed posts={blogPosts.slice(0, 6)} />
        </Reveal>
        {sections.apps && (
          <Reveal>
            <AppsStrip />
          </Reveal>
        )}
        {sections.testimonials && (
          <Reveal>
            <TestimonialsSection testimonials={testimonials} />
          </Reveal>
        )}
      </div>
    );
  }

  // ---- new: marketplace (stub) — hero + "coming soon" placeholder --------
  if (layout === "marketplace") {
    return (
      <div style={{ background: "var(--site-page-bg, #FFFFFF)", minHeight: "100vh" }}>
        {jsonLdScript}
        {sections.hero && <Hero />}
        <MarketplaceComingSoon />
      </div>
    );
  }

  // ---- legacy: minimal / apps_grid — superseded by "marketplace" in the admin
  // mode switcher, kept only so pre-existing data with this layout value still renders. --------
  if (layout === "minimal" || layout === "apps_grid") {
    return (
      <div style={{ background: "var(--site-page-bg, #FFFFFF)", minHeight: "100vh" }}>
        {jsonLdScript}
        {sections.hero && <Hero />}
        {sections.stats && (
          <Reveal>
            <StatsBar stats={stats} />
          </Reveal>
        )}
        {sections.apps && (
          <Reveal>
            <AppsGrid apps={homepageApps} />
          </Reveal>
        )}
      </div>
    );
  }

  // ---- legacy: text_focused / mixed (kept working as before) ------------
  const contentPage = settings.homepage_content_slug ? await getPublicPage(settings.homepage_content_slug) : null;
  const contentSection = contentPage ? (
    <section style={{ padding: "0 2rem 3rem", maxWidth: 720, margin: "0 auto" }}>
      <BlockRenderer blocks={contentPage.content} />
    </section>
  ) : null;
  const appsSection = sections.apps ? <AppsGrid apps={homepageApps} /> : null;

  return (
    <div style={{ background: "var(--site-page-bg, #FFFFFF)", minHeight: "100vh" }}>
      {jsonLdScript}
      {sections.hero && <Hero />}
      {sections.stats && <StatsBar stats={stats} />}

      {layout === "text_focused" && contentSection}

      {layout === "mixed" &&
        (settings.homepage_apps_position === "after_content" ? (
          <>
            {contentSection}
            {appsSection}
          </>
        ) : (
          <>
            {appsSection}
            {contentSection}
          </>
        ))}

      {sections.testimonials && <TestimonialsSection testimonials={testimonials} />}
      {sections.blog && <BlogPreview posts={blogPosts.slice(0, 3)} />}
    </div>
  );
}
