import type { BlockIcon } from "@/lib/api";
import { GradientIconBadge } from "@/components/site/GradientIconBadge";
import { PageContainer } from "@/components/site/PageContainer";

type Step = { label: string; description?: string } & BlockIcon;

function CompactSteps({ steps }: { steps: Step[] }) {
  return (
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
  );
}

// Used when any step has a `description` — a full paragraph doesn't fit the compact
// connected-dot row, so this switches to a straightforward card grid instead.
function StepCards({ steps }: { steps: Step[] }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 20, textAlign: "left" }}>
      {steps.map((step, i) => (
        <div
          key={i}
          className="site-hover-card"
          style={{ borderRadius: 16, border: "1px solid #EAE8E1", background: "var(--site-card-bg, #FFFFFF)", padding: "1.5rem" }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <span
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 24,
                height: 24,
                borderRadius: "50%",
                background: "var(--site-text, #17181C)",
                color: "#FFFFFF",
                fontSize: 12,
                fontWeight: 600,
                flexShrink: 0,
              }}
            >
              {i + 1}
            </span>
            {/* step.icon is the full "ti-xxx" class (set via IconField in the admin editor, same
                convention CompactSteps above already uses) — GradientIconBadge expects the bare
                suffix and prepends "ti-" itself. */}
            <GradientIconBadge icon={step.icon?.replace(/^ti-/, "")} iconUrl={step.icon_url} size={36} />
          </div>
          <p style={{ fontSize: 15.5, fontWeight: 600, color: "var(--site-text, #17181C)", margin: "0 0 8px" }}>{step.label}</p>
          {step.description && (
            <p style={{ fontSize: 13.5, color: "var(--site-text-muted, #8A8C93)", margin: 0, lineHeight: 1.7 }}>{step.description}</p>
          )}
        </div>
      ))}
    </div>
  );
}

export function HowItWorks({ heading, description, steps }: { heading?: string; description?: string; steps: Step[] }) {
  if (steps.length === 0) return null;
  const hasDescriptions = steps.some((s) => s.description);

  return (
    <section style={{ padding: "4rem 0", textAlign: "center" }}>
      <PageContainer>
        {heading && (
          <p style={{ fontSize: 26, fontWeight: 500, color: "var(--site-text, #17181C)", margin: "0 0 12px" }}>{heading}</p>
        )}
        {description && (
          <p
            style={{
              fontSize: 14.5,
              color: "var(--site-text-muted, #8A8C93)",
              maxWidth: 560,
              margin: "0 auto 2.5rem",
              lineHeight: 1.7,
            }}
          >
            {description}
          </p>
        )}
        {hasDescriptions ? <StepCards steps={steps} /> : <CompactSteps steps={steps} />}
      </PageContainer>
    </section>
  );
}
