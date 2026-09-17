import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getPublicBlogPost, getPublicSettings } from "@/lib/api";
import { applyTitleTemplate } from "@/lib/seo";
import { BlockRenderer } from "@/components/site/BlockRenderer";
import { BlogCoverArt } from "@/components/site/BlogCoverArt";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { PageContainer } from "@/components/site/PageContainer";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const [post, settings] = await Promise.all([getPublicBlogPost(slug), getPublicSettings()]);
  if (!post) return {};

  const title = post.meta_title || applyTitleTemplate(post.title, settings.seo_title_template, "lecode blog");
  const description = post.meta_description || post.excerpt || settings.seo_default_meta_description || undefined;
  const url = post.canonical_url || `https://lecode.tech/blog/${post.slug}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    robots: post.noindex ? { index: false, follow: true } : undefined,
    openGraph: {
      title,
      description,
      url,
      siteName: "lecode",
      type: "article",
      images: [post.og_image_url, post.cover_image_url, settings.default_og_image_url]
        .filter((u): u is string => !!u)
        .slice(0, 1)
        .map((url) => ({ url })),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const [post, settings] = await Promise.all([getPublicBlogPost(slug), getPublicSettings()]);
  if (!post) notFound();

  const jsonLd = post.structured_data ?? {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    url: `https://lecode.tech/blog/${post.slug}`,
    datePublished: post.published_at || undefined,
    author: post.author_email ? { "@type": "Person", name: post.author_email } : undefined,
  };

  const crumbs = [
    { label: "Home", href: "/" },
    { label: "Blog", href: "/blog" },
    { label: post.title },
  ];
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://lecode.tech/" },
      { "@type": "ListItem", position: 2, name: "Blog", item: "https://lecode.tech/blog" },
      { "@type": "ListItem", position: 3, name: post.title, item: `https://lecode.tech/blog/${post.slug}` },
    ],
  };

  return (
    <article>
      {settings.seo_json_ld_enabled !== false && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      )}
      {settings.seo_show_breadcrumbs !== false && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      )}

      {settings.seo_show_breadcrumbs !== false && <Breadcrumbs items={crumbs} />}

      <PageContainer style={{ padding: "1.25rem 2rem 0" }}>
      <h1 style={{ fontSize: 32, fontWeight: 500, color: "#17181C", margin: "0 0 8px", lineHeight: 1.3 }}>
        {post.title}
      </h1>
      <p style={{ fontSize: 13, color: "#8A8C93", margin: "0 0 24px" }}>
        {post.published_at
          ? new Date(post.published_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
          : ""}
        {post.author_email ? ` · ${post.author_email}` : ""}
      </p>

      {post.cover_image_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={post.cover_image_url}
          alt=""
          style={{ width: "100%", maxHeight: 420, objectFit: "cover", borderRadius: 12, marginBottom: 24 }}
        />
      ) : (
        <div style={{ marginBottom: 24 }}>
          <BlogCoverArt tags={post.tags} height={280} />
        </div>
      )}
      </PageContainer>

      {/* BlockRenderer's own blocks each self-contain via PageContainer (contained=true default)
          — rendered bare here so they don't get wrapped a second time inside another one. */}
      <BlockRenderer blocks={post.content} />

      {post.tags.length > 0 && (
        <PageContainer style={{ padding: "0 2rem 3rem" }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 32, paddingTop: 24, borderTop: "0.5px solid #EAE8E1" }}>
            {post.tags.map((t) => (
              <Link
                key={t}
                href={`/blog?tag=${encodeURIComponent(t)}`}
                style={{ fontSize: 12, padding: "4px 12px", borderRadius: 999, background: "#F7F6F2", color: "#8A8C93", textDecoration: "none" }}
              >
                {t}
              </Link>
            ))}
          </div>
        </PageContainer>
      )}
    </article>
  );
}
