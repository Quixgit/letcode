import Link from "next/link";
import type { PublicBlogPostListItem } from "@/lib/api";
import { BlogCoverArt } from "@/components/site/BlogCoverArt";

/** The one blog-post card used everywhere a post preview appears (homepage "Latest from the
 * blog" and the `/blog` index) — a single shared component so hover behavior and internal
 * spacing never drift apart between the two places again. */
export function BlogCard({ post, imageHeight = 160 }: { post: PublicBlogPostListItem; imageHeight?: number }) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="site-blog-card"
      style={{ textDecoration: "none", display: "flex", flexDirection: "column", height: "100%" }}
    >
      {post.cover_image_url ? (
        <div style={{ overflow: "hidden", borderRadius: 12, marginBottom: 16 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={post.cover_image_url}
            alt=""
            className="site-blog-card-image"
            style={{ width: "100%", height: imageHeight, objectFit: "cover", display: "block" }}
          />
        </div>
      ) : (
        <div style={{ marginBottom: 16 }}>
          <BlogCoverArt tags={post.tags} height={imageHeight} />
        </div>
      )}
      {post.tags[0] && (
        <span
          style={{
            display: "inline-block",
            fontSize: 11,
            fontWeight: 500,
            color: "var(--site-text-muted, #8A8C93)",
            textTransform: "uppercase",
            letterSpacing: 0.4,
            marginBottom: 8,
          }}
        >
          {post.tags[0]}
        </span>
      )}
      <p
        className="site-blog-card-title"
        style={{ fontSize: 16, fontWeight: 500, color: "var(--site-text, #17181C)", margin: "0 0 8px", lineHeight: 1.4, transition: "color 180ms ease" }}
      >
        {post.title}
      </p>
      {post.excerpt && (
        <p
          style={{
            fontSize: 13,
            color: "var(--site-text-muted, #8A8C93)",
            margin: 0,
            lineHeight: 1.6,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {post.excerpt}
        </p>
      )}
    </Link>
  );
}
