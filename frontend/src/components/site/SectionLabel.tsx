export function SectionLabel({ text }: { text: string }) {
  if (!text) return null;

  return (
    <div style={{ padding: "0 2rem", maxWidth: 1000, margin: "0 auto" }}>
      <p
        style={{
          fontSize: 12,
          fontWeight: 600,
          textAlign: "center",
          textTransform: "uppercase",
          letterSpacing: 1.2,
          color: "var(--site-text-muted, #8A8C93)",
          margin: "0 0 1.5rem",
        }}
      >
        {text}
      </p>
    </div>
  );
}
