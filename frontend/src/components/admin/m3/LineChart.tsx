"use client";

import { useId, useState } from "react";

interface Point {
  date: string;
  views: number;
}

const WIDTH = 640;
const HEIGHT = 220;
const PAD_LEFT = 36;
const PAD_BOTTOM = 24;
const PAD_TOP = 12;

export function LineChart({ data }: { data: Point[] }) {
  const gradientId = useId();
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  if (data.length === 0) {
    return <p className="md-body-medium text-md-on-surface-variant">Нет данных за этот период.</p>;
  }

  const max = Math.max(1, ...data.map((d) => d.views));
  const plotWidth = WIDTH - PAD_LEFT - 8;
  const plotHeight = HEIGHT - PAD_TOP - PAD_BOTTOM;
  const stepX = data.length > 1 ? plotWidth / (data.length - 1) : 0;

  const x = (i: number) => PAD_LEFT + i * stepX;
  const y = (v: number) => PAD_TOP + plotHeight - (v / max) * plotHeight;

  const linePath = data.map((d, i) => `${i === 0 ? "M" : "L"} ${x(i)} ${y(d.views)}`).join(" ");
  const areaPath = `${linePath} L ${x(data.length - 1)} ${PAD_TOP + plotHeight} L ${x(0)} ${PAD_TOP + plotHeight} Z`;

  const gridLines = [0, 0.25, 0.5, 0.75, 1];
  const hovered = hoverIndex !== null ? data[hoverIndex] : null;

  function handleMove(e: React.MouseEvent<SVGSVGElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const relX = ((e.clientX - rect.left) / rect.width) * WIDTH;
    const idx = Math.round((relX - PAD_LEFT) / (stepX || 1));
    setHoverIndex(Math.min(data.length - 1, Math.max(0, idx)));
  }

  const labelEvery = Math.ceil(data.length / 6);

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-full"
        onMouseMove={handleMove}
        onMouseLeave={() => setHoverIndex(null)}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--md-primary)" stopOpacity="0.28" />
            <stop offset="100%" stopColor="var(--md-primary)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {gridLines.map((g) => (
          <line
            key={g}
            x1={PAD_LEFT}
            x2={WIDTH - 8}
            y1={PAD_TOP + plotHeight * (1 - g)}
            y2={PAD_TOP + plotHeight * (1 - g)}
            stroke="var(--md-outline-variant)"
            strokeWidth={1}
          />
        ))}
        <text x={4} y={PAD_TOP + 4} className="fill-md-on-surface-variant" fontSize={10}>
          {max}
        </text>
        <text x={4} y={PAD_TOP + plotHeight} className="fill-md-on-surface-variant" fontSize={10}>
          0
        </text>

        <path d={areaPath} fill={`url(#${gradientId})`} />
        <path d={linePath} fill="none" stroke="var(--md-primary)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />

        {data.map((d, i) =>
          i % labelEvery === 0 ? (
            <text
              key={d.date}
              x={x(i)}
              y={HEIGHT - 6}
              textAnchor="middle"
              className="fill-md-on-surface-variant"
              fontSize={10}
            >
              {d.date.slice(5)}
            </text>
          ) : null
        )}

        {hoverIndex !== null && (
          <>
            <line
              x1={x(hoverIndex)}
              x2={x(hoverIndex)}
              y1={PAD_TOP}
              y2={PAD_TOP + plotHeight}
              stroke="var(--md-outline)"
              strokeWidth={1}
              strokeDasharray="3 3"
            />
            <circle cx={x(hoverIndex)} cy={y(data[hoverIndex].views)} r={4} fill="var(--md-primary)" />
          </>
        )}
      </svg>

      {hovered && (
        <div
          className="pointer-events-none absolute rounded-md bg-md-inverse-surface px-2 py-1 text-md-inverse-on-surface"
          style={{
            left: `${(x(hoverIndex!) / WIDTH) * 100}%`,
            top: 0,
            transform: "translate(-50%, -110%)",
            fontSize: 11,
            whiteSpace: "nowrap",
          }}
        >
          {hovered.date}: {hovered.views}
        </div>
      )}
    </div>
  );
}
