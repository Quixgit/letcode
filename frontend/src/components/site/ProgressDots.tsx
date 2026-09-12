export function ProgressDots() {
  const count = 5;
  return (
    <div style={{ padding: "0 2rem 3rem", display: "flex", justifyContent: "center", gap: 8 }}>
      {Array.from({ length: count }).map((_, i) => (
        <span
          key={i}
          style={{
            width: i === 0 ? 22 : 7,
            height: 7,
            borderRadius: 999,
            background: i === 0 ? "var(--site-accent, #17181C)" : "#E4E4E7",
          }}
        />
      ))}
    </div>
  );
}
