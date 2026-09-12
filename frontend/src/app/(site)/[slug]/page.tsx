import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getPublicPage } from "@/lib/api";
import { BlockRenderer } from "@/components/site/BlockRenderer";
import { TemplateDefault } from "@/components/site/templates/TemplateDefault";
import { TemplateLanding } from "@/components/site/templates/TemplateLanding";
import { TemplateFullWidth } from "@/components/site/templates/TemplateFullWidth";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPublicPage(slug);
  if (!page) return {};

  const title = page.meta_title || `${page.title} — lecode`;
  const description = page.meta_description || undefined;
  const url = page.canonical_url || `https://lecode.tech/${page.slug}`;

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
      images: page.og_image_url ? [{ url: page.og_image_url }] : undefined,
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
  const page = await getPublicPage(slug);
  if (!page) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: page.title,
    url: `https://lecode.tech/${page.slug}`,
  };

  const body = <BlockRenderer blocks={page.content} />;
  const jsonLdScript = (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
  );

  if (page.template === "landing") {
    return (
      <>
        {jsonLdScript}
        <TemplateLanding title={page.title}>{body}</TemplateLanding>
      </>
    );
  }

  if (page.template === "full-width") {
    return (
      <>
        {jsonLdScript}
        <TemplateFullWidth title={page.title}>{body}</TemplateFullWidth>
      </>
    );
  }

  return (
    <>
      {jsonLdScript}
      <TemplateDefault title={page.title}>{body}</TemplateDefault>
    </>
  );
}
