import type { HomepageStat } from "@/lib/api";

export function StatsBar({ stats }: { stats: HomepageStat[] }) {
  if (stats.length === 0) return null;

  return (
    <section
      style={{
        padding: "1rem 2rem 3.5rem",
        maxWidth: 960,
        margin: "0 auto",
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
        gap: 24,
        textAlign: "center",
      }}
    >
      {stats.map((stat, i) => (
        <div key={i}>
          <p style={{ fontSize: 32, fontWeight: 500, color: "var(--site-text, #17181C)", margin: "0 0 4px" }}>{stat.value}</p>
          <p style={{ fontSize: 13, color: "var(--site-text-muted, #8A8C93)", margin: 0 }}>{stat.label}</p>
        </div>
      ))}
    </section>
  );
}
