export function TemplateLanding({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ textAlign: "center", padding: "4rem 2rem 2rem" }}>
        <h1
          style={{
            fontSize: 40,
            fontWeight: 500,
            color: "#17181C",
            margin: "0 auto",
            maxWidth: 720,
            lineHeight: 1.25,
          }}
        >
          {title}
        </h1>
      </div>
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 2rem 4rem" }}>{children}</div>
    </div>
  );
}
