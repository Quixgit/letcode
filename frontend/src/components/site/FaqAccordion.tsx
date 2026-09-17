"use client";

import { useState } from "react";
import { PageContainer } from "@/components/site/PageContainer";

interface FaqItem {
  question: string;
  answer: string;
}

function FaqCard({ item }: { item: FaqItem }) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className={`site-faq-card${open ? " site-faq-card--open" : ""}`}
      style={{
        border: "1px solid #EAE8E1",
        borderRadius: 14,
        background: "var(--site-card-bg, #F7F6F2)",
        overflow: "hidden",
      }}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="site-faq-toggle"
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          padding: "1.1rem 1.25rem",
          background: "none",
          border: "none",
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        <span className="site-faq-question" style={{ fontSize: 14.5, fontWeight: 500, color: "var(--site-text, #17181C)" }}>
          {item.question}
        </span>
        <i
          className="ti ti-chevron-down site-faq-chevron"
          style={{
            fontSize: 17,
            flexShrink: 0,
            color: open ? "var(--site-accent, #E63946)" : "var(--site-text-muted, #8A8C93)",
            transform: open ? "rotate(180deg)" : "none",
            transition: "transform 220ms ease-out, color 220ms ease-out",
          }}
        />
      </button>
      <div style={{ display: "grid", gridTemplateRows: open ? "1fr" : "0fr", transition: "grid-template-rows 220ms ease-out" }}>
        <div style={{ overflow: "hidden" }}>
          <p style={{ margin: "0 1.25rem 1.15rem", fontSize: 13.5, color: "var(--site-text-muted, #8A8C93)", lineHeight: 1.7 }}>
            {item.answer}
          </p>
        </div>
      </div>
    </div>
  );
}

export function FaqAccordion({
  heading,
  description,
  columns,
  items,
}: {
  heading?: string;
  description?: string;
  columns?: 1 | 2;
  items: FaqItem[];
}) {
  if (items.length === 0) return null;

  return (
    <section style={{ padding: "0 0 4rem" }}>
      <PageContainer>
      {heading && (
        <p style={{ fontSize: 26, fontWeight: 500, color: "var(--site-text, #17181C)", margin: "0 0 10px", textAlign: "center" }}>
          {heading}
        </p>
      )}
      {description && (
        <p
          style={{
            fontSize: 14.5,
            color: "var(--site-text-muted, #8A8C93)",
            maxWidth: 560,
            margin: "0 auto 2rem",
            textAlign: "center",
            lineHeight: 1.7,
          }}
        >
          {description}
        </p>
      )}
      {/* `alignItems: "start"` matters here: without it, grid items default to "stretch", so
          opening one card in a 2-column row makes it taller and its row-mate — a completely
          unrelated FAQ item — gets stretched to match, rendering as an empty open-looking box. */}
      <div
        className="site-faq-grid"
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${columns === 1 ? 1 : 2}, 1fr)`,
          gap: 14,
          alignItems: "start",
        }}
      >
        {items.map((item, i) => (
          <FaqCard key={i} item={item} />
        ))}
      </div>
      </PageContainer>
    </section>
  );
}
