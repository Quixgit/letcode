"use client";

import { useState } from "react";
import type { UseCaseTab } from "@/lib/api";

export function UseCaseTabs({ tabs }: { tabs: UseCaseTab[] }) {
  const [active, setActive] = useState(0);
  if (tabs.length === 0) return null;
  const current = tabs[active] || tabs[0];

  return (
    <section style={{ padding: "0 2rem 4rem", maxWidth: 960, margin: "0 auto" }}>
      <div
        style={{
          display: "flex",
          gap: 8,
          overflowX: "auto",
          marginBottom: 28,
          borderBottom: "0.5px solid #EAE8E1",
        }}
      >
        {tabs.map((tab, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 16px",
              fontSize: 14,
              fontWeight: 500,
              background: "none",
              border: "none",
              borderBottom: active === i ? "2px solid #17181C" : "2px solid transparent",
              color: active === i ? "#17181C" : "#8A8C93",
              cursor: "pointer",
              marginBottom: -1,
              whiteSpace: "nowrap",
            }}
          >
            {tab.icon_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={tab.icon_url} alt="" style={{ width: 18, height: 18, objectFit: "contain" }} />
            )}
            {tab.label}
          </button>
        ))}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 40,
          alignItems: "center",
        }}
      >
        <div>
          <h3 style={{ fontSize: 22, fontWeight: 500, color: "#17181C", margin: "0 0 12px" }}>{current.title}</h3>
          <p style={{ fontSize: 14, color: "#8A8C93", lineHeight: 1.8, margin: 0, whiteSpace: "pre-wrap" }}>
            {current.description}
          </p>
        </div>
        {current.screenshot_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={current.screenshot_url}
            alt={current.title}
            style={{ width: "100%", borderRadius: 12, border: "0.5px solid #EAE8E1" }}
          />
        )}
      </div>
    </section>
  );
}
