import type { HomepageStat } from "@/lib/api";
import { PageContainer } from "@/components/site/PageContainer";

export function StatsBar({ stats }: { stats: HomepageStat[] }) {
  if (stats.length === 0) return null;

  return (
    <section style={{ padding: "1rem 0 3.5rem" }}>
      <PageContainer
        style={{
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
      </PageContainer>
    </section>
  );
}
