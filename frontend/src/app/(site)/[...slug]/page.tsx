import { notFound, redirect, permanentRedirect } from "next/navigation";
import type { Metadata } from "next";
import { getPublicPage, getPublicSettings, lookupRedirect } from "@/lib/api";
import { applyTitleTemplate, buildFaqPageJsonLd } from "@/lib/seo";
import { BlockRenderer } from "@/components/site/BlockRenderer";
import { TemplateDefault } from "@/components/site/templates/TemplateDefault";
import { TemplateLanding } from "@/components/site/templates/TemplateLanding";
import { TemplateFullWidth } from "@/components/site/templates/TemplateFullWidth";

export const dynamic = "force-dynamic";

// A catch-all (not a single [slug] segment) so pages can live at nested paths like
// /services/cloud-audit — but a Page's own `slug` column stays a single flat value (e.g.
// "cloud-audit", no literal "/"). Only the last URL segment is used to look the page up; any
// segments before it (the "services/" prefix) are purely cosmetic routing, not stored anywhere.
// That keeps every existing single-segment page (/about, /contact, ...) working unchanged, and
// means a page is technically reachable under more than one prefix — each service page sets its
// own canonical_url to the intended nested path so that ambiguity never reaches search engines.
type Props = { params: Promise<{ slug: string[] }> };

function leafSlug(slug: string[]): string {
  return slug[slug.length - 1] ?? "";
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const [page, settings] = await Promise.all([getPublicPage(leafSlug(slug)), getPublicSettings()]);
  if (!page) return {};

  const title = page.meta_title || applyTitleTemplate(page.title, settings.seo_title_template);
  const description = page.meta_description || settings.seo_default_meta_description || undefined;
  const url = page.canonical_url || `https://lecode.tech/${slug.join("/")}`;
  const image = page.og_image_url || settings.default_og_image_url || undefined;

  return {
    title,
    description,
    alternates: { canonical: url },
    robots: page.noindex ? { index: false, follow: true } : undefined,
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
    },
  };
}

export default async function GenericPage({ params }: Props) {
  const { slug } = await params;
  const [page, settings] = await Promise.all([getPublicPage(leafSlug(slug)), getPublicSettings()]);
  if (!page) {
    const hit = await lookupRedirect("/" + slug.join("/"));
    if (hit) {
      if (hit.status_code === 301 || hit.status_code === 308) permanentRedirect(hit.to_path);
      redirect(hit.to_path);
    }
    notFound();
  }

  const fullPath = `https://lecode.tech/${slug.join("/")}`;

  // An editor-authored structured_data JSON-LD object (Pages' SEO tab) takes precedence over
  // the generic WebPage fallback — previously this field was saved and served by the API but
  // never actually rendered anywhere, so anything typed into that field had no effect.
  const jsonLd = page.structured_data ?? {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: page.title,
    url: fullPath,
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://lecode.tech/" },
      { "@type": "ListItem", position: 2, name: page.title, item: fullPath },
    ],
  };

  const faqJsonLd = buildFaqPageJsonLd(page.content);

  const showBreadcrumbs = settings.seo_show_breadcrumbs !== false;
  const jsonLdEnabled = settings.seo_json_ld_enabled !== false;
  const crumbs = showBreadcrumbs ? [{ label: "Home", href: "/" }, { label: page.title }] : undefined;

  // A page opening with a full-bleed hero banner reads better with the breadcrumb/title sitting
  // below it (inside the banner's own visual "frame") rather than above — so that leading block
  // renders ahead of TemplateDefault's breadcrumb+h1, and only the remaining content becomes its
  // children.
  const leadsWithHero = page.content[0]?.type === "service_hero_banner";
  const heroBlock = leadsWithHero ? <BlockRenderer blocks={page.content.slice(0, 1)} /> : null;
  const body = <BlockRenderer blocks={leadsWithHero ? page.content.slice(1) : page.content} />;
  const jsonLdScript = (
    <>
      {jsonLdEnabled && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />}
      {showBreadcrumbs && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      )}
      {jsonLdEnabled && faqJsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      )}
    </>
  );

  if (page.template === "landing") {
    return (
      <>
        {jsonLdScript}
        {heroBlock}
        <TemplateLanding title={page.title} breadcrumbs={crumbs}>
          {body}
        </TemplateLanding>
      </>
    );
  }

  if (page.template === "full-width") {
    return (
      <>
        {jsonLdScript}
        {heroBlock}
        <TemplateFullWidth title={page.title} breadcrumbs={crumbs}>
          {body}
        </TemplateFullWidth>
      </>
    );
  }

  return (
    <>
      {jsonLdScript}
      {heroBlock}
      <TemplateDefault title={page.title} breadcrumbs={crumbs}>
        {body}
      </TemplateDefault>
    </>
  );
}
