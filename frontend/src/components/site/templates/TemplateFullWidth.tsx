export function TemplateFullWidth({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ padding: "3rem 2rem" }}>
      <h1 style={{ fontSize: 28, fontWeight: 500, color: "#17181C", margin: "0 0 1.5rem" }}>{title}</h1>
      {children}
    </div>
  );
}
