import type { Testimonial } from "@/lib/api";

export function TestimonialsSection({ testimonials }: { testimonials: Testimonial[] }) {
  if (testimonials.length === 0) return null;

  return (
    <section style={{ padding: "0 2rem 4rem", maxWidth: 960, margin: "0 auto" }}>
      <h2 style={{ fontSize: 26, fontWeight: 500, color: "#17181C", textAlign: "center", margin: "0 0 2.5rem" }}>
        What people say
      </h2>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: 20,
        }}
      >
        {testimonials.map((t) => (
          <div
            key={t.id}
            style={{
              background: "#F7F6F2",
              borderRadius: 14,
              padding: "1.5rem",
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            {t.rating != null && (
              <div style={{ display: "flex", gap: 2 }}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <i
                    key={i}
                    className="ti ti-star-filled"
                    style={{ fontSize: 15, color: i < t.rating! ? "#F5A623" : "#E4E4E7" }}
                  />
                ))}
              </div>
            )}
            <p style={{ fontSize: 14, color: "#17181C", lineHeight: 1.7, margin: 0, flex: 1 }}>&ldquo;{t.quote}&rdquo;</p>
            <div>
              <p style={{ fontSize: 13, fontWeight: 500, color: "#17181C", margin: 0 }}>{t.author_name}</p>
              {t.author_title && <p style={{ fontSize: 12, color: "#8A8C93", margin: 0 }}>{t.author_title}</p>}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
