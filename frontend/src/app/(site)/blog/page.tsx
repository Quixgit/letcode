import Link from "next/link";
import type { Metadata } from "next";
import { getPublicBlogPosts, getPublicSettings } from "@/lib/api";
import { BlogCard } from "@/components/site/BlogCard";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { PageContainer } from "@/components/site/PageContainer";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Blog — lecode",
  description: "Updates, notes, and behind-the-scenes from lecode.",
  alternates: {
    canonical: "https://lecode.tech/blog",
  },
};

type Props = { searchParams: Promise<{ tag?: string; page?: string }> };

export default async function BlogIndexPage({ searchParams }: Props) {
  const { tag, page } = await searchParams;
  const pageNum = Number(page) > 0 ? Number(page) : 1;
  const [posts, settings] = await Promise.all([getPublicBlogPosts({ tag, page: pageNum }), getPublicSettings()]);
  const columns = settings.blog_columns || 3;

  const allTags = Array.from(new Set(posts.flatMap((p) => p.tags))).sort();

  return (
    <div>
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Blog" }]} />
      <PageContainer style={{ padding: "1.25rem 2rem 3rem" }}>
      <h1 style={{ fontSize: 30, fontWeight: 500, color: "#17181C", margin: "0 0 8px" }}>Blog</h1>
      <p style={{ fontSize: 14, color: "#8A8C93", margin: "0 0 24px" }}>
        Updates, notes, and behind-the-scenes from lecode.
      </p>

      {allTags.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 28 }}>
          <Link
            href="/blog"
            style={{
              fontSize: 12,
              padding: "4px 12px",
              borderRadius: 999,
              textDecoration: "none",
              background: !tag ? "#17181C" : "#F7F6F2",
              color: !tag ? "#FFFFFF" : "#8A8C93",
            }}
          >
            Все
          </Link>
          {allTags.map((t) => (
            <Link
              key={t}
              href={`/blog?tag=${encodeURIComponent(t)}`}
              style={{
                fontSize: 12,
                padding: "4px 12px",
                borderRadius: 999,
                textDecoration: "none",
                background: tag === t ? "#17181C" : "#F7F6F2",
                color: tag === t ? "#FFFFFF" : "#8A8C93",
              }}
            >
              {t}
            </Link>
          ))}
        </div>
      )}

      {posts.length === 0 && <p style={{ color: "#8A8C93", fontSize: 14 }}>No posts yet.</p>}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: columns === 1 ? "1fr" : `repeat(auto-fit, minmax(${columns === 3 ? 300 : 400}px, 1fr))`,
          gap: 28,
        }}
      >
        {posts.map((post) => (
          <BlogCard key={post.id} post={post} imageHeight={columns === 1 ? 220 : 160} />
        ))}
      </div>

      {posts.length === 10 && (
        <div style={{ marginTop: 32, textAlign: "center" }}>
          <Link
            href={`/blog?${new URLSearchParams({ ...(tag ? { tag } : {}), page: String(pageNum + 1) }).toString()}`}
            style={{ fontSize: 13, color: "#8A8C93" }}
          >
            Следующая страница →
          </Link>
        </div>
      )}
      </PageContainer>
    </div>
  );
}
