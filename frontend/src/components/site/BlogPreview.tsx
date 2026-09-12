import Link from "next/link";
import type { PublicBlogPostListItem } from "@/lib/api";
import { BlogCoverArt } from "@/components/site/BlogCoverArt";

export function BlogPreview({ posts }: { posts: PublicBlogPostListItem[] }) {
  if (posts.length === 0) return null;

  return (
    <section style={{ padding: "0 2rem 4rem", maxWidth: 960, margin: "0 auto" }}>
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
          <Link key={post.id} href={`/blog/${post.slug}`} style={{ textDecoration: "none", display: "block" }}>
            {post.cover_image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={post.cover_image_url}
                alt=""
                style={{ width: "100%", height: 160, objectFit: "cover", borderRadius: 12, marginBottom: 14 }}
              />
            ) : (
              <div style={{ marginBottom: 14 }}>
                <BlogCoverArt tags={post.tags} />
              </div>
            )}
            {post.tags[0] && (
              <span
                style={{
                  display: "inline-block",
                  fontSize: 11,
                  fontWeight: 500,
                  color: "#8A8C93",
                  textTransform: "uppercase",
                  letterSpacing: 0.4,
                  marginBottom: 8,
                }}
              >
                {post.tags[0]}
              </span>
            )}
            <p style={{ fontSize: 16, fontWeight: 500, color: "#17181C", margin: "0 0 6px", lineHeight: 1.4 }}>
              {post.title}
            </p>
            {post.excerpt && (
              <p style={{ fontSize: 13, color: "#8A8C93", margin: 0, lineHeight: 1.6 }}>{post.excerpt}</p>
            )}
          </Link>
        ))}
      </div>
    </section>
  );
}
