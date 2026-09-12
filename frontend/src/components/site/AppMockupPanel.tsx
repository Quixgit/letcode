"use client";

import { useId, useState } from "react";
import { smoothLinePath, toChartCoords } from "@/lib/svg-path";
import { SmoothStatChart } from "@/components/site/SmoothStatChart";

function ListMockup({ dark }: { dark?: boolean }) {
  const rows = [
    { color: "#DC2626", label: "prod-db-01: disk usage 94%" },
    { color: "#D97706", label: "api-gateway: p99 latency 620ms" },
    { color: dark ? "#FFFFFF" : "#17181C", label: "worker-3: deployment finished" },
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {rows.map((row, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: dark ? "rgba(255,255,255,0.08)" : "var(--site-card-bg, #F7F6F2)",
            borderRadius: 8,
            padding: "8px 10px",
          }}
        >
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: row.color, flexShrink: 0 }} />
          <span style={{ fontSize: 11, color: dark ? "#FFFFFF" : "var(--site-text, #17181C)" }}>{row.label}</span>
        </div>
      ))}
    </div>
  );
}

function ChartMockup({ dark }: { dark?: boolean }) {
  return (
    <SmoothStatChart
      value="86%"
      unit="resolved"
      trend="up"
      weekLabels={["Mon", "Tue", "Wed", "Thu"]}
      points={[22, 30, 26, 46, 64, 82]}
      height={90}
      dark={!!dark}
    />
  );
}

function TogglesMockup({ dark }: { dark?: boolean }) {
  const rows = [
    { label: "Push notifications", on: true },
    { label: "Weekly digest", on: false },
    { label: "Critical only", on: true },
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {rows.map((row, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 12, color: dark ? "#FFFFFF" : "var(--site-text, #17181C)" }}>{row.label}</span>
          <span
            style={{
              width: 30,
              height: 17,
              borderRadius: 999,
              background: row.on ? "var(--site-accent, #17181C)" : dark ? "rgba(255,255,255,0.16)" : "#E4E4E7",
              position: "relative",
              display: "inline-block",
            }}
          >
            <span
              style={{
                position: "absolute",
                top: 2,
                left: row.on ? 15 : 2,
                width: 13,
                height: 13,
                borderRadius: "50%",
                background: "#FFFFFF",
              }}
            />
          </span>
        </div>
      ))}
    </div>
  );
}

function DashboardMockup({ dark }: { dark?: boolean }) {
  const gradId = useId();
  const icons = ["ti-layout-dashboard", "ti-bell", "ti-plug", "ti-settings"];
  const coords = toChartCoords([20, 32, 26, 50, 42, 74], 100, 50, 6);
  const line = smoothLinePath(coords);
  const area = `${line} L${coords[coords.length - 1][0]},50 L${coords[0][0]},50 Z`;
  const trackColor = dark ? "rgba(255,255,255,0.12)" : "#EAE8E1";
  const textColor = dark ? "#FFFFFF" : "var(--site-text, #17181C)";
  const mutedColor = dark ? "rgba(255,255,255,0.55)" : "var(--site-text-muted, #8A8C93)";

  return (
    <div style={{ display: "flex", gap: 12, height: 132 }}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 10,
          padding: "8px 6px",
          borderRadius: 10,
          background: dark ? "rgba(255,255,255,0.05)" : "var(--site-card-bg, #F7F6F2)",
          flexShrink: 0,
        }}
      >
        {icons.map((icon, i) => (
          <div
            key={icon}
            style={{
              width: 22,
              height: 22,
              borderRadius: 6,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: i === 0 ? "var(--site-accent, #17181C)" : "transparent",
            }}
          >
            <i className={`ti ${icon}`} style={{ fontSize: 12, color: i === 0 ? "#FFFFFF" : mutedColor }} />
          </div>
        ))}
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8, minWidth: 0 }}>
        <div style={{ display: "flex", gap: 12, borderBottom: `1px solid ${trackColor}`, paddingBottom: 6 }}>
          <span style={{ fontSize: 10.5, fontWeight: 600, color: textColor }}>Overview</span>
          <span style={{ fontSize: 10.5, color: mutedColor }}>History</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <svg width="44" height="44" viewBox="0 0 44 44" style={{ flexShrink: 0 }}>
            <circle cx={22} cy={22} r={18} fill="none" stroke={trackColor} strokeWidth={4} />
            <circle
              cx={22}
              cy={22}
              r={18}
              fill="none"
              stroke="var(--site-accent, #17181C)"
              strokeWidth={4}
              strokeDasharray={`${2 * Math.PI * 18 * 0.72} ${2 * Math.PI * 18}`}
              strokeLinecap="round"
              transform="rotate(-90 22 22)"
            />
          </svg>
          <div>
            <p style={{ fontSize: 15, fontWeight: 600, color: textColor, margin: 0, lineHeight: 1.2 }}>72%</p>
            <p style={{ fontSize: 9.5, color: mutedColor, margin: 0 }}>on target</p>
          </div>
        </div>

        <svg viewBox="0 0 100 50" preserveAspectRatio="none" style={{ width: "100%", height: 36, overflow: "visible" }}>
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--site-accent, #17181C)" stopOpacity="0.22" />
              <stop offset="100%" stopColor="var(--site-accent, #17181C)" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={area} fill={`url(#${gradId})`} />
          <path d={line} fill="none" stroke="var(--site-accent, #17181C)" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
          <circle cx={coords[coords.length - 1][0]} cy={coords[coords.length - 1][1]} r={2} fill="var(--site-accent, #17181C)" />
        </svg>
      </div>
    </div>
  );
}

function Mockup({ type, dark }: { type: "list" | "chart" | "toggles" | "dashboard"; dark?: boolean }) {
  if (type === "chart") return <ChartMockup dark={dark} />;
  if (type === "toggles") return <TogglesMockup dark={dark} />;
  if (type === "dashboard") return <DashboardMockup dark={dark} />;
  return <ListMockup dark={dark} />;
}

export function AppMockupPanel({
  panels,
  compact,
}: {
  panels: { title: string; description: string; mockup: "list" | "chart" | "toggles" | "dashboard"; dark?: boolean }[];
  compact?: boolean;
}) {
  const [page, setPage] = useState(0);
  const perPage = compact ? 3 : 2;
  const pages = Math.ceil(panels.length / perPage);
  const visible = panels.slice(page * perPage, page * perPage + perPage);

  if (panels.length === 0) return null;

  return (
    <section style={{ padding: "0 2rem 4rem", maxWidth: 960, margin: "0 auto" }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(auto-fit, minmax(${compact ? 200 : 280}px, 1fr))`,
          gap: 20,
        }}
      >
        {visible.map((panel, i) => (
          <div
            key={i}
            className={panel.dark ? undefined : "site-hover-card"}
            style={{
              background: panel.dark ? "#17181C" : "#FFFFFF",
              border: panel.dark ? "none" : "0.5px solid #EAE8E1",
              borderRadius: 16,
              padding: compact ? "1.25rem" : "1.75rem",
            }}
          >
            <p
              style={{
                fontSize: compact ? 14 : 16,
                fontWeight: 500,
                color: panel.dark ? "#FFFFFF" : "var(--site-text, #17181C)",
                margin: "0 0 6px",
              }}
            >
              {panel.title}
            </p>
            <p
              style={{
                fontSize: 12,
                color: panel.dark ? "rgba(255,255,255,0.6)" : "var(--site-text-muted, #8A8C93)",
                margin: "0 0 16px",
                lineHeight: 1.5,
              }}
            >
              {panel.description}
            </p>
            <Mockup type={panel.mockup} dark={panel.dark} />
          </div>
        ))}
      </div>

      {pages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 24 }}>
          {Array.from({ length: pages }).map((_, i) => (
            <button
              key={i}
              onClick={() => setPage(i)}
              aria-label={`Page ${i + 1}`}
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                border: "none",
                padding: 0,
                background: i === page ? "var(--site-accent, #17181C)" : "#EAE8E1",
                cursor: "pointer",
              }}
            />
          ))}
        </div>
      )}
    </section>
  );
}
