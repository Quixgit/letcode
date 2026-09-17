import Link from "next/link";
import { getPublicSettings } from "@/lib/api";
import { DecorativeBackground } from "@/components/site/DecorativeBackground";
import { SITE_CONTENT_WIDTH } from "@/components/site/PageContainer";

function TickGauge() {
  const tickCount = 72;
  const activeTickIndex = 12;
  const radius = 100;
  const center = 110;

  const ticks = Array.from({ length: tickCount }, (_, i) => {
    const angle = (i / tickCount) * Math.PI * 2 - Math.PI / 2;
    const isActive = i === activeTickIndex;
    const isMajor = !isActive && i % 6 === 0;
    const inner = isActive ? radius - 15 : isMajor ? radius - 10 : radius - 6;
    const outer = radius;
    const x1 = center + Math.cos(angle) * inner;
    const y1 = center + Math.sin(angle) * inner;
    const x2 = center + Math.cos(angle) * outer;
    const y2 = center + Math.sin(angle) * outer;
    return (
      <line
        key={i}
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={isActive ? "var(--site-accent, #E63946)" : isMajor ? "#D4D2CC" : "#EAE8E1"}
        strokeWidth={isActive ? 2.25 : isMajor ? 1.25 : 0.75}
        strokeLinecap="round"
      />
    );
  });
  const activeAngle = (activeTickIndex / tickCount) * Math.PI * 2 - Math.PI / 2;
  const dotR = radius - 20;

  return (
    <svg width="220" height="220" viewBox="0 0 220 220" style={{ flexShrink: 0 }}>
      <circle cx={center} cy={center} r={radius + 3} fill="none" stroke="#F1F0EB" strokeWidth={1} />
      {ticks}
      <circle
        cx={center + Math.cos(activeAngle) * dotR}
        cy={center + Math.sin(activeAngle) * dotR}
        r={2.5}
        fill="var(--site-accent, #E63946)"
      />
      <circle cx={center} cy={center} r={radius - 24} fill="#FFFFFF" stroke="#EAE8E1" strokeWidth={1} />
      <text
        x={center}
        y={center - 2}
        textAnchor="middle"
        fontSize={30}
        fontWeight={700}
        letterSpacing={-0.5}
        fill="var(--site-text, #1A1A1A)"
      >
        24/7
      </text>
      <text x={center} y={center + 20} textAnchor="middle" fontSize={10.5} letterSpacing={0.4} fill="var(--site-text-muted, #6B6B6B)">
        UPTIME WATCH
      </text>
    </svg>
  );
}

export async function NexusClassicHero() {
  const settings = await getPublicSettings();
  const showDecorative = settings.show_decorative_backgrounds !== false;

  return (
    <section style={{ position: "relative", padding: "4rem 2rem 4rem", maxWidth: SITE_CONTENT_WIDTH, margin: "0 auto", overflow: "hidden" }}>
      {showDecorative && <DecorativeBackground />}
      <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 48, flexWrap: "wrap", justifyContent: "center" }}>
        <TickGauge />
        <div style={{ maxWidth: 460 }}>
          <h1
            style={{
              fontSize: 34,
              fontWeight: 700,
              margin: "0 0 16px",
              lineHeight: 1.25,
              color: "var(--site-text, #1A1A1A)",
              textTransform: "uppercase",
            }}
          >
            Your infrastructure, simplified.
          </h1>
          <p style={{ fontSize: 16, color: "var(--site-text-muted, #6B6B6B)", margin: "0 0 24px", lineHeight: 1.7 }}>
            Blare, Cancely and Devtools — small, focused apps built by one DevOps engineer who&apos;d rather ship than configure.
          </p>
          <Link
            href="/#apps"
            style={{
              display: "inline-flex",
              padding: "12px 28px",
              borderRadius: 999,
              background: "var(--site-accent, #E63946)",
              color: "#FFFFFF",
              fontSize: 14,
              fontWeight: 500,
              textDecoration: "none",
            }}
          >
            Get started
          </Link>
        </div>
      </div>
    </section>
  );
}
