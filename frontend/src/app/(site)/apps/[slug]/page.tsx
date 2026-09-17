import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getPublicApp, getPublicSettings } from "@/lib/api";
import { applyTitleTemplate } from "@/lib/seo";
import { AppTabs } from "@/components/site/AppTabs";
import { FeatureSections } from "@/components/site/FeatureSections";
import { UseCaseTabs } from "@/components/site/UseCaseTabs";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { PageContainer } from "@/components/site/PageContainer";

export const dynamic = "force-dynamic";

const appColors: Record<string, string> = {
  blare: "#0F6E56",
  cancely: "#534AB7",
  devtools: "#993C1D",
};

const appIcons: Record<string, string> = {
  blare: "ti-bell-ringing",
  cancely: "ti-receipt",
  devtools: "ti-tool",
};

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const [app, settings] = await Promise.all([getPublicApp(slug), getPublicSettings()]);
  if (!app) return {};

  const title = app.meta_title || applyTitleTemplate(app.name, settings.seo_title_template);
  const description = app.meta_description || app.short_description || settings.seo_default_meta_description || undefined;
  const url = app.canonical_url || `https://lecode.tech/apps/${app.slug}`;
  const image = app.og_image_url || app.icon_url || settings.default_og_image_url || undefined;

  return {
    title,
    description,
    alternates: { canonical: url },
    robots: app.noindex ? { index: false, follow: true } : undefined,
    openGraph: {
      title,
      description,
      url,
      siteName: "lecode",
      type: "website",
      images: image ? [{ url: image }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export default async function AppPage({ params }: Props) {
  const { slug } = await params;
  const [app, settings] = await Promise.all([getPublicApp(slug), getPublicSettings()]);
  if (!app) notFound();

  const color = appColors[app.slug] || "#8A8C93";
  const icon = appIcons[app.slug] || "ti-app-window";

  const jsonLd = app.structured_data ?? {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: app.name,
    description: app.short_description || app.description || undefined,
    applicationCategory: app.category || undefined,
    url: app.website_url || `https://lecode.tech/apps/${app.slug}`,
    image: app.og_image_url || app.icon_url || undefined,
    aggregateRating:
      app.rating && app.rating_count
        ? { "@type": "AggregateRating", ratingValue: app.rating, reviewCount: app.rating_count }
        : undefined,
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://lecode.tech/" },
      { "@type": "ListItem", position: 2, name: "Apps", item: "https://lecode.tech/apps" },
      { "@type": "ListItem", position: 3, name: app.name, item: `https://lecode.tech/apps/${app.slug}` },
    ],
  };

  const primaryStoreLink = app.google_play_url || app.app_store_url;

  return (
    <div>
      {settings.seo_json_ld_enabled !== false && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      )}
      {settings.seo_show_breadcrumbs !== false && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      )}

      {settings.seo_show_breadcrumbs !== false && (
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Apps" }, { label: app.name }]} />
      )}

      {/* ---- Hero ---- */}
      <section style={{ padding: "0 0 3rem" }}>
      <PageContainer
        style={{
          display: "grid",
          gridTemplateColumns: app.hero_image_url ? "repeat(auto-fit, minmax(320px, 1fr))" : "1fr",
          gap: 40,
          alignItems: "center",
        }}
      >
        <div>
          <div style={{ display: "flex", gap: 20, alignItems: "flex-start", marginBottom: 24 }}>
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: 16,
                background: color,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                overflow: "hidden",
              }}
            >
              {app.icon_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={app.icon_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <i className={`ti ${icon}`} style={{ fontSize: 30, color: "#FFFFFF" }} />
              )}
            </div>
            <div>
              <h1 style={{ fontSize: 30, fontWeight: 500, margin: "0 0 6px", color: "#17181C", lineHeight: 1.25 }}>
                {app.name}
              </h1>
              <p style={{ fontSize: 15, color: "#8A8C93", margin: 0, lineHeight: 1.6 }}>{app.short_description}</p>
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginBottom: 12 }}>
            {app.google_play_url && (
              <a href={app.google_play_url} target="_blank" rel="noreferrer" style={ctaStyle}>
                <i className="ti ti-brand-google-play" /> Google Play
              </a>
            )}
            {app.app_store_url && (
              <a href={app.app_store_url} target="_blank" rel="noreferrer" style={ctaStyle}>
                <i className="ti ti-brand-apple" /> App Store
              </a>
            )}
            {app.website_url && (
              <a href={app.website_url} target="_blank" rel="noreferrer" style={ctaSecondaryStyle}>
                <i className="ti ti-external-link" /> Website
              </a>
            )}
          </div>

          {app.pricing_note && <p style={{ fontSize: 13, color: "#8A8C93", margin: 0 }}>{app.pricing_note}</p>}
        </div>

        {app.hero_image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={app.hero_image_url}
            alt={`${app.name} screenshot`}
            style={{ width: "100%", borderRadius: 16, border: "0.5px solid #EAE8E1" }}
          />
        )}
      </PageContainer>
      </section>

      {app.screenshots.length > 0 && (
        <PageContainer
          style={{
            display: "flex",
            gap: 12,
            overflowX: "auto",
            marginBottom: 56,
            paddingBottom: 4,
          }}
        >
          {app.screenshots.map((shot) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={shot.id}
              src={shot.url}
              alt={`${app.name} screenshot`}
              style={{
                height: 320,
                borderRadius: 12,
                border: "0.5px solid #EAE8E1",
                flexShrink: 0,
              }}
            />
          ))}
        </PageContainer>
      )}

      {/* ---- Feature sections ---- */}
      <FeatureSections sections={app.feature_sections} />

      {/* ---- Use case tabs ---- */}
      <UseCaseTabs tabs={app.use_case_tabs} />

      {/* ---- Rating + repeat CTA ---- */}
      {app.rating != null && app.rating_count != null && (
        <section
          style={{ padding: "0 0 4rem" }}
        >
          <PageContainer style={{ textAlign: "center" }}>
          <div
            style={{
              border: "0.5px solid #EAE8E1",
              borderRadius: 16,
              padding: "2.5rem 2rem",
            }}
          >
            <div style={{ display: "flex", justifyContent: "center", gap: 4, marginBottom: 10 }}>
              {Array.from({ length: 5 }).map((_, i) => (
                <i
                  key={i}
                  className="ti ti-star-filled"
                  style={{ fontSize: 20, color: i < Math.round(app.rating!) ? "#F5A623" : "#EAE8E1" }}
                />
              ))}
            </div>
            <p style={{ fontSize: 18, fontWeight: 500, color: "#17181C", margin: "0 0 6px" }}>
              {app.rating!.toFixed(1)} based on {app.rating_count} reviews
            </p>
            <p style={{ fontSize: 14, color: "#8A8C93", margin: "0 0 20px" }}>
              Join {app.rating_count}+ people already using {app.name}.
            </p>
            {primaryStoreLink && (
              <a
                href={primaryStoreLink}
                target="_blank"
                rel="noreferrer"
                style={{ ...ctaStyle, display: "inline-flex", padding: "10px 20px" }}
              >
                <i className="ti ti-brand-google-play" /> Get {app.name}
              </a>
            )}
          </div>
          </PageContainer>
        </section>
      )}

      {/* ---- Detailed info ---- */}
      <PageContainer style={{ maxWidth: 720, padding: "0 2rem 4rem" }}>
        {app.description && (
          <p style={{ fontSize: 15, color: "#17181C", lineHeight: 1.8, marginBottom: 32, whiteSpace: "pre-wrap" }}>
            {app.description}
          </p>
        )}

        <AppTabs features={app.features} instructions={app.instructions_content} privacy={app.privacy_policy_content} />
      </PageContainer>
    </div>
  );
}

const ctaStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  padding: "8px 14px",
  borderRadius: 8,
  background: "#17181C",
  color: "#FFFFFF",
  fontSize: 13,
  fontWeight: 500,
  textDecoration: "none",
};

const ctaSecondaryStyle: React.CSSProperties = {
  ...ctaStyle,
  background: "#F7F6F2",
  color: "#17181C",
};
