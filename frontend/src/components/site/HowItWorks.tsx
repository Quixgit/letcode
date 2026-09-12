import type { BlockIcon } from "@/lib/api";

export function HowItWorks({ steps }: { steps: ({ label: string } & BlockIcon)[] }) {
  if (steps.length === 0) return null;

  return (
    <section style={{ padding: "0 2rem 4rem", maxWidth: 960, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "center" }}>
        {steps.map((step, i) => (
          <div key={i} style={{ display: "flex", alignItems: "flex-start", flex: i === steps.length - 1 ? "0 0 auto" : 1 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, minWidth: 90 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: "50%",
                  background: "var(--site-text, #17181C)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  boxShadow: "0 2px 6px rgba(23, 24, 28, 0.18)",
                }}
              >
                {step.icon_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={step.icon_url} alt="" style={{ width: 22, height: 22, objectFit: "contain" }} />
                ) : (
                  <i className={`ti ${step.icon || "ti-point"}`} style={{ fontSize: 20, color: "#FFFFFF" }} />
                )}
              </div>
              <p style={{ fontSize: 13, fontWeight: 500, color: "var(--site-text, #17181C)", margin: 0, textAlign: "center", maxWidth: 110 }}>
                {step.label}
              </p>
            </div>
            {i < steps.length - 1 && (
              <div style={{ flex: 1, height: 2, background: "var(--site-accent, #EAE8E1)", marginTop: 22, minWidth: 24 }} />
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
