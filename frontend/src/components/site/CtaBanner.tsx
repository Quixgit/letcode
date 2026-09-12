export function CtaBanner({ title, buttonLabel, buttonUrl }: { title: string; buttonLabel: string; buttonUrl: string }) {
  return (
    <section style={{ padding: "0 2rem 4rem", maxWidth: 960, margin: "0 auto" }}>
      <div
        style={{
          background: "var(--site-accent, #17181C)",
          borderRadius: 20,
          padding: "3rem 2rem",
          textAlign: "center",
        }}
      >
        <p style={{ fontSize: 26, fontWeight: 500, color: "#FFFFFF", margin: "0 0 24px", lineHeight: 1.3 }}>{title}</p>
        {buttonUrl && buttonLabel && (
          <a
            href={buttonUrl}
            style={{
              display: "inline-block",
              padding: "10px 24px",
              borderRadius: 8,
              background: "#FFFFFF",
              color: "var(--site-accent, #17181C)",
              fontSize: 14,
              fontWeight: 500,
              textDecoration: "none",
            }}
          >
            {buttonLabel}
          </a>
        )}
      </div>
    </section>
  );
}
