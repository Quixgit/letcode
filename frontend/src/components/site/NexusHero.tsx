import Link from "next/link";

function RingGraphic() {
  const rings = [90, 70, 50];
  return (
    <svg width="220" height="220" viewBox="0 0 220 220" style={{ flexShrink: 0 }}>
      {rings.map((r, i) => (
        <circle key={r} cx={110} cy={110} r={r} fill="none" stroke="#EAE8E1" strokeWidth={1} />
      ))}
      <circle cx={110} cy={110} r={90} fill="none" stroke="#17181C" strokeWidth={3} strokeDasharray="120 400" strokeLinecap="round" />
      <circle cx={110} cy={110} r={70} fill="none" stroke="#0F6E56" strokeWidth={3} strokeDasharray="90 320" strokeLinecap="round" />
      <circle cx={110} cy={110} r={50} fill="none" stroke="#534AB7" strokeWidth={3} strokeDasharray="60 260" strokeLinecap="round" />
      <circle cx={110} cy={110} r={30} fill="#17181C" />
      <foreignObject x={95} y={95} width={30} height={30}>
        <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <i className="ti ti-terminal-2" style={{ color: "#FFFFFF", fontSize: 16 }} />
        </div>
      </foreignObject>
    </svg>
  );
}

export function NexusHero() {
  return (
    <section style={{ padding: "4rem 2rem 4rem", maxWidth: 1000, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 48, flexWrap: "wrap", justifyContent: "center" }}>
        <RingGraphic />
        <div style={{ maxWidth: 460 }}>
          <h1 style={{ fontSize: 38, fontWeight: 500, margin: "0 0 16px", lineHeight: 1.25, color: "#17181C" }}>
            Small, focused apps for people who run infrastructure
          </h1>
          <p style={{ fontSize: 16, color: "#8A8C93", margin: "0 0 24px", lineHeight: 1.7 }}>
            Built by one DevOps engineer who&apos;d rather ship than configure.
          </p>
          <Link
            href="/#apps"
            style={{
              display: "inline-flex",
              padding: "10px 20px",
              borderRadius: 8,
              background: "#17181C",
              color: "#FFFFFF",
              fontSize: 14,
              fontWeight: 500,
              textDecoration: "none",
            }}
          >
            Explore the apps
          </Link>
        </div>
      </div>
    </section>
  );
}
