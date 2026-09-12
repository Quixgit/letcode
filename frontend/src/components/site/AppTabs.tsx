"use client";

import { useState } from "react";

interface AppTabsProps {
  features: string[];
  instructions: string | null;
  privacy: string | null;
}

type TabKey = "overview" | "instructions" | "privacy";

export function AppTabs({ features, instructions, privacy }: AppTabsProps) {
  const [tab, setTab] = useState<TabKey>("overview");

  const tabs: { key: TabKey; label: string }[] = [
    { key: "overview", label: "Overview" },
    { key: "instructions", label: "Instructions" },
    { key: "privacy", label: "Privacy policy" },
  ];

  return (
    <div>
      <div style={{ display: "flex", gap: 4, borderBottom: "0.5px solid #EAE8E1", marginBottom: 24 }}>
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding: "10px 16px",
              fontSize: 14,
              fontWeight: 500,
              background: "none",
              border: "none",
              borderBottom: tab === t.key ? "2px solid #17181C" : "2px solid transparent",
              color: tab === t.key ? "#17181C" : "#8A8C93",
              cursor: "pointer",
              marginBottom: -1,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div>
          {features.length === 0 && (
            <p style={{ fontSize: 14, color: "#8A8C93" }}>No features listed yet.</p>
          )}
          <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 12 }}>
            {features.map((feature, i) => (
              <li key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <i className="ti ti-check" style={{ color: "#0F6E56", fontSize: 16, marginTop: 2 }} />
                <span style={{ fontSize: 14, color: "#17181C", lineHeight: 1.6 }}>{feature}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {tab === "instructions" && (
        <div style={{ fontSize: 14, color: "#17181C", lineHeight: 1.8, whiteSpace: "pre-wrap" }}>
          {instructions || "No instructions available yet."}
        </div>
      )}

      {tab === "privacy" && (
        <div style={{ fontSize: 14, color: "#17181C", lineHeight: 1.8, whiteSpace: "pre-wrap" }}>
          {privacy || "No privacy policy available yet."}
        </div>
      )}
    </div>
  );
}
