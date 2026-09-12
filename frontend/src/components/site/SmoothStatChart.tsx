"use client";

import { useId } from "react";
import { smoothLinePath, toChartCoords } from "@/lib/svg-path";

/** A polished dark-panel stat chart: big number, smooth gradient-filled line, week labels.
 * Shared between the annotated-screenshot fallback mockup and the app-mockup-panel "chart" type
 * so the two most visible dark UI mockups on the homepage read as the same design system. */
export function SmoothStatChart({
  value,
  unit,
  trend,
  weekLabels = ["Week 1", "Week 2", "Week 3", "Week 4"],
  points,
  accent = "var(--site-accent, #E63946)",
  height = 90,
  dark = true,
}: {
  value: string;
  unit?: string;
  trend?: "up" | "down";
  weekLabels?: string[];
  points: number[];
  accent?: string;
  height?: number;
  dark?: boolean;
}) {
  const gradId = useId();
  const coords = toChartCoords(points, 100, 50, 5);
  const linePath = smoothLinePath(coords);
  const areaPath = coords.length > 0 ? `${linePath} L${coords[coords.length - 1][0]},50 L${coords[0][0]},50 Z` : "";
  const last = coords[coords.length - 1];
  const textColor = dark ? "#FFFFFF" : "var(--site-text, #17181C)";
  const mutedColor = dark ? "rgba(255,255,255,0.5)" : "var(--site-text-muted, #8A8C93)";
  const dotStroke = dark ? "#17181C" : "#FFFFFF";

  return (
    <div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 6 }}>
        {trend && (
          <i
            className={`ti ti-arrow-${trend}`}
            style={{ fontSize: 14, color: trend === "up" ? accent : mutedColor }}
          />
        )}
        <span style={{ fontSize: 30, fontWeight: 700, color: textColor, letterSpacing: -0.5 }}>{value}</span>
        {unit && <span style={{ fontSize: 12, color: mutedColor }}>{unit}</span>}
      </div>

      <div style={{ position: "relative", height }}>
        <svg viewBox="0 0 100 50" preserveAspectRatio="none" style={{ width: "100%", height: "100%", overflow: "visible" }}>
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={accent} stopOpacity="0.28" />
              <stop offset="100%" stopColor={accent} stopOpacity="0" />
            </linearGradient>
          </defs>
          {areaPath && <path d={areaPath} fill={`url(#${gradId})`} />}
          <path d={linePath} fill="none" stroke={accent} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" />
          {last && <circle cx={last[0]} cy={last[1]} r={2.4} fill={accent} stroke={dotStroke} strokeWidth={1} />}
        </svg>
      </div>

      {weekLabels.length > 0 && (
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10 }}>
          {weekLabels.map((w) => (
            <span key={w} style={{ fontSize: 9, color: mutedColor }}>
              {w}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
