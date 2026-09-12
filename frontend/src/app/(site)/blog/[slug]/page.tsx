import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getPublicBlogPost } from "@/lib/api";
import { BlockRenderer } from "@/components/site/BlockRenderer";
import { BlogCoverArt } from "@/components/site/BlogCoverArt";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPublicBlogPost(slug);
  if (!post) return {};

  const title = post.meta_title || `${post.title} — lecode blog`;
  const description = post.meta_description || post.excerpt || undefined;
  const url = `https://lecode.tech/blog/${post.slug}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: "lecode",
      type: "article",
      images: post.og_image_url ? [{ url: post.og_image_url }] : post.cover_image_url ? [{ url: post.cover_image_url }] : undefined,
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
  const post = await getPublicBlogPost(slug);
  if (!post) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    url: `https://lecode.tech/blog/${post.slug}`,
    datePublished: post.published_at || undefined,
    author: post.author_email ? { "@type": "Person", name: post.author_email } : undefined,
  };

  return (
    <article style={{ maxWidth: 720, margin: "0 auto", padding: "3rem 2rem" }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <Link href="/blog" style={{ fontSize: 13, color: "#8A8C93", textDecoration: "none" }}>
        ← Blog
      </Link>

      <h1 style={{ fontSize: 32, fontWeight: 500, color: "#17181C", margin: "16px 0 8px", lineHeight: 1.3 }}>
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

      <BlockRenderer blocks={post.content} />

      {post.tags.length > 0 && (
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
      )}
    </article>
  );
}
