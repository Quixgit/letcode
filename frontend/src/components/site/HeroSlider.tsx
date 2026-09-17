"use client";

import { useEffect, useState } from "react";
import { PageContainer } from "@/components/site/PageContainer";

interface Slide {
  image_url?: string;
  title: string;
  subtitle?: string;
  button_label?: string;
  button_url?: string;
}

const navButtonStyle: React.CSSProperties = {
  width: 36,
  height: 36,
  borderRadius: "50%",
  border: "none",
  background: "rgba(255,255,255,0.88)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
};

const HEIGHT_PX: Record<"small" | "medium" | "large", number> = { small: 280, medium: 420, large: 560 };

export function HeroSlider({
  slides,
  intervalMs,
  fullWidth,
  height,
}: {
  slides: Slide[];
  intervalMs?: number;
  fullWidth?: boolean;
  height?: "small" | "medium" | "large";
}) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = slides.length;

  // Autoplay mirrors TestimonialsCarousel's prev/next/dot pattern, plus a paced interval that
  // pauses on hover so a visitor reading a slide isn't fighting the timer.
  useEffect(() => {
    if (count < 2 || paused) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % count), Math.max(intervalMs ?? 5000, 1500));
    return () => clearInterval(t);
  }, [count, intervalMs, paused]);

  if (count === 0) return null;

  const current = slides[Math.min(index, count - 1)];
  const go = (dir: -1 | 1) => setIndex((i) => (i + dir + count) % count);

  const slideHeight = HEIGHT_PX[height ?? "medium"];

  return (
    <section
      style={
        fullWidth
          ? { padding: "0 0 3rem", width: "100vw", position: "relative", left: "50%", marginLeft: "-50vw" }
          : { padding: "0 0 3rem" }
      }
    >
      <PageContainer style={fullWidth ? { maxWidth: "none", padding: 0 } : undefined}>
      <div
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        style={{
          position: "relative",
          borderRadius: fullWidth ? 0 : 20,
          overflow: "hidden",
          height: slideHeight,
          background: current.image_url
            ? `center / cover no-repeat url(${current.image_url})`
            : "var(--site-card-bg, #F7F6F2)",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(180deg, rgba(0,0,0,0) 35%, rgba(0,0,0,0.75) 100%)",
          }}
        />

        {/* The slide's background/card can bleed to the viewport edge (fullWidth), but the text
            itself still aligns to the shared container so it lines up with every other section. */}
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, padding: "2.5rem 0" }}>
          <PageContainer>
            <p style={{ fontSize: 28, fontWeight: 600, color: "#FFFFFF", margin: "0 0 10px", maxWidth: 560, lineHeight: 1.25 }}>
              {current.title}
            </p>
            {current.subtitle && (
              <p style={{ fontSize: 15, color: "rgba(255,255,255,0.88)", margin: "0 0 18px", maxWidth: 520, lineHeight: 1.6 }}>
                {current.subtitle}
              </p>
            )}
            {current.button_url && current.button_label && (
              <a
                href={current.button_url}
                style={{
                  display: "inline-block",
                  padding: "10px 22px",
                  borderRadius: 8,
                  background: "#FFFFFF",
                  color: "var(--site-accent, #17181C)",
                  fontSize: 14,
                  fontWeight: 500,
                  textDecoration: "none",
                }}
              >
                {current.button_label}
              </a>
            )}
          </PageContainer>
        </div>

        {count > 1 && (
          <>
            <button onClick={() => go(-1)} aria-label="Previous slide" style={{ ...navButtonStyle, position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)" }}>
              <i className="ti ti-chevron-left" style={{ color: "#17181C" }} />
            </button>
            <button onClick={() => go(1)} aria-label="Next slide" style={{ ...navButtonStyle, position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)" }}>
              <i className="ti ti-chevron-right" style={{ color: "#17181C" }} />
            </button>
            <div style={{ position: "absolute", bottom: 16, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 6 }}>
              {slides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setIndex(i)}
                  aria-label={`Go to slide ${i + 1}`}
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    border: "none",
                    padding: 0,
                    background: i === index ? "#FFFFFF" : "rgba(255,255,255,0.45)",
                    cursor: "pointer",
                  }}
                />
              ))}
            </div>
          </>
        )}
      </div>
      </PageContainer>
    </section>
  );
}
