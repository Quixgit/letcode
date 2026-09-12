type Row = { label: string; kind: "slider" | "toggle"; value?: number; on?: boolean };
type Category = { title: string; rows: Row[] };

function SliderRow({ row }: { row: Row }) {
  const value = Math.max(0, Math.min(100, row.value ?? 0));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <span style={{ fontSize: 11, color: "var(--site-text-muted, #8A8C93)", textTransform: "uppercase", letterSpacing: 0.4 }}>
        {row.label}
      </span>
      <div style={{ height: 6, borderRadius: 999, background: "#E4E4E7", overflow: "hidden" }}>
        <div
          style={{
            width: `${value}%`,
            height: "100%",
            background: "var(--site-accent, #17181C)",
            borderRadius: 999,
            transition: "width 300ms ease",
          }}
        />
      </div>
    </div>
  );
}

function ToggleRow({ row }: { row: Row }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <span style={{ fontSize: 12, color: "var(--site-text, #17181C)" }}>{row.label}</span>
      <span
        style={{
          width: 30,
          height: 17,
          borderRadius: 999,
          background: row.on ? "var(--site-accent, #17181C)" : "#E4E4E7",
          position: "relative",
          display: "inline-block",
          transition: "background 200ms ease",
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
            boxShadow: "0 1px 3px rgba(0,0,0,0.25)",
            transition: "left 200ms ease",
          }}
        />
      </span>
    </div>
  );
}

export function CategoryPreviewRow({ categories }: { categories: Category[] }) {
  if (categories.length === 0) return null;

  return (
    <section style={{ padding: "0 2rem 4rem", maxWidth: 1000, margin: "0 auto" }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(auto-fit, minmax(240px, 1fr))`,
          gap: 20,
        }}
      >
        {categories.map((cat, i) => (
          <div
            key={i}
            className="site-hover-card"
            style={{
              background: "#FFFFFF",
              border: "0.5px solid #EAE8E1",
              borderRadius: 16,
              padding: "1.5rem",
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <p style={{ fontSize: 14, fontWeight: 500, color: "var(--site-text, #17181C)", margin: 0 }}>{cat.title}</p>
              <i className="ti ti-chevron-down" style={{ fontSize: 14, color: "var(--site-text-muted, #8A8C93)" }} />
            </div>
            {cat.rows.map((row, j) => (row.kind === "slider" ? <SliderRow key={j} row={row} /> : <ToggleRow key={j} row={row} />))}
          </div>
        ))}
      </div>
    </section>
  );
}
