import Link from "next/link";
import type { PublicBlogPostListItem } from "@/lib/api";
import { BlogCard } from "@/components/site/BlogCard";
import { PageContainer } from "@/components/site/PageContainer";

export function BlogPreview({ posts }: { posts: PublicBlogPostListItem[] }) {
  if (posts.length === 0) return null;

  return (
    <section style={{ padding: "0 0 4rem" }}>
      <PageContainer>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 24 }}>
        <h2 style={{ fontSize: 26, fontWeight: 500, color: "#17181C", margin: 0 }}>Latest from the blog</h2>
        <Link href="/blog" style={{ fontSize: 13, color: "#8A8C93", textDecoration: "none" }}>
          View all articles →
        </Link>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: 20,
        }}
      >
        {posts.map((post) => (
          <BlogCard key={post.id} post={post} />
        ))}
      </div>
      </PageContainer>
    </section>
  );
}
