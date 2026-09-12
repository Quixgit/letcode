"use client";

import { useState } from "react";
import type { Testimonial } from "@/lib/api";
import { Avatar } from "@/components/site/Avatar";

export function TestimonialsCarousel({ testimonials }: { testimonials: Testimonial[] }) {
  const [index, setIndex] = useState(0);
  if (testimonials.length === 0) return null;

  const current = testimonials[index];
  const go = (dir: -1 | 1) => setIndex((i) => (i + dir + testimonials.length) % testimonials.length);

  return (
    <section style={{ padding: "0 2rem 4rem", maxWidth: 640, margin: "0 auto", textAlign: "center" }}>
      <h2 style={{ fontSize: 26, fontWeight: 500, color: "var(--site-text, #17181C)", margin: "0 0 2rem" }}>What people say</h2>

      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <button
          onClick={() => go(-1)}
          aria-label="Previous"
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            border: "0.5px solid #EAE8E1",
            background: "#FFFFFF",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            cursor: "pointer",
          }}
        >
          <i className="ti ti-chevron-left" style={{ color: "var(--site-text, #17181C)" }} />
        </button>

        <div style={{ flex: 1, background: "var(--site-card-bg, #F7F6F2)", borderRadius: 16, padding: "2rem" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}>
            <Avatar name={current.author_name} size={52} />
          </div>
          {current.rating != null && (
            <div style={{ display: "flex", justifyContent: "center", gap: 2, marginBottom: 12 }}>
              {Array.from({ length: 5 }).map((_, i) => (
                <i
                  key={i}
                  className="ti ti-star-filled"
                  style={{ fontSize: 15, color: i < current.rating! ? "#F5A623" : "#E4E4E7" }}
                />
              ))}
            </div>
          )}
          <p style={{ fontSize: 15, color: "var(--site-text, #17181C)", lineHeight: 1.7, margin: "0 0 14px" }}>&ldquo;{current.quote}&rdquo;</p>
          <p style={{ fontSize: 13, fontWeight: 500, color: "var(--site-text, #17181C)", margin: 0 }}>{current.author_name}</p>
          {current.author_title && <p style={{ fontSize: 12, color: "var(--site-text-muted, #8A8C93)", margin: 0 }}>{current.author_title}</p>}
        </div>

        <button
          onClick={() => go(1)}
          aria-label="Next"
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            border: "0.5px solid #EAE8E1",
            background: "#FFFFFF",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            cursor: "pointer",
          }}
        >
          <i className="ti ti-chevron-right" style={{ color: "var(--site-text, #17181C)" }} />
        </button>
      </div>

      {testimonials.length > 1 && (
        <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 16 }}>
          {testimonials.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              aria-label={`Go to testimonial ${i + 1}`}
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                border: "none",
                padding: 0,
                background: i === index ? "var(--site-accent, #17181C)" : "#EAE8E1",
                cursor: "pointer",
              }}
            />
          ))}
        </div>
      )}
    </section>
  );
}
