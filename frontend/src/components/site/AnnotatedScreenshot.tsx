import { SmoothStatChart } from "@/components/site/SmoothStatChart";
import { PageContainer } from "@/components/site/PageContainer";

function DarkMockupFallback() {
  return (
    <div style={{ width: "100%", height: "100%", padding: "1.25rem", display: "flex", flexDirection: "column", boxSizing: "border-box" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
        <span style={{ fontSize: 13, fontWeight: 500, color: "#FFFFFF", display: "flex", alignItems: "center", gap: 4 }}>
          Power
          <i className="ti ti-chevron-down" style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }} />
        </span>
        <span
          style={{
            fontSize: 11,
            color: "rgba(255,255,255,0.8)",
            background: "rgba(255,255,255,0.1)",
            borderRadius: 999,
            padding: "3px 10px",
          }}
        >
          Week 2
        </span>
      </div>

      <div style={{ flex: 1 }}>
        <SmoothStatChart value="172" unit="kWh" trend="up" points={[18, 26, 22, 40, 58, 78]} height={130} />
      </div>
    </div>
  );
}

function Callout({ text, side }: { text: string; side: "left" | "right" }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 0, flexDirection: side === "left" ? "row" : "row-reverse" }}>
      <p
        style={{
          fontSize: 13,
          color: "var(--site-text, #17181C)",
          margin: 0,
          padding: "6px 12px",
          background: "var(--site-card-bg, #F7F6F2)",
          borderRadius: 8,
          whiteSpace: "nowrap",
        }}
      >
        {text}
      </p>
      <div style={{ width: 32, height: 1, background: "var(--site-accent, #EAE8E1)", flexShrink: 0 }} />
      <span
        style={{
          width: 5,
          height: 5,
          borderRadius: "50%",
          background: "var(--site-accent, #EAE8E1)",
          flexShrink: 0,
        }}
      />
    </div>
  );
}

export function AnnotatedScreenshot({
  imageUrl,
  annotations,
}: {
  imageUrl?: string;
  annotations: { text: string; side: "left" | "right"; y_percent: number }[];
}) {
  const left = annotations.filter((a) => a.side === "left");
  const right = annotations.filter((a) => a.side === "right");

  return (
    <section style={{ padding: "0 0 4rem" }}>
      <PageContainer style={{ display: "grid", gridTemplateColumns: "1fr minmax(240px, 420px) 1fr", alignItems: "center", gap: 0 }}>
        <div style={{ position: "relative", height: 280 }}>
          {left.map((a, i) => (
            <div key={i} style={{ position: "absolute", right: 0, top: `${a.y_percent}%`, transform: "translateY(-50%)" }}>
              <Callout text={a.text} side="left" />
            </div>
          ))}
        </div>

        <div
          style={{
            borderRadius: 16,
            border: "0.5px solid #EAE8E1",
            overflow: "hidden",
            background: imageUrl ? "var(--site-card-bg, #F7F6F2)" : "#17181C",
            aspectRatio: "9 / 16",
            maxHeight: 420,
          }}
        >
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <DarkMockupFallback />
          )}
        </div>

        <div style={{ position: "relative", height: 280 }}>
          {right.map((a, i) => (
            <div key={i} style={{ position: "absolute", left: 0, top: `${a.y_percent}%`, transform: "translateY(-50%)" }}>
              <Callout text={a.text} side="right" />
            </div>
          ))}
        </div>
      </PageContainer>
    </section>
  );
}
