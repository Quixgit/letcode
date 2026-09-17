"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import type { FormFieldConfig, GetInTouchConfig } from "@/lib/api";
import { PageContainer } from "@/components/site/PageContainer";

const fieldStyle: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  padding: "11px 14px",
  borderRadius: 10,
  border: "1px solid #EAE8E1",
  background: "var(--site-page-bg, #FFFFFF)",
  color: "var(--site-text, #17181C)",
  fontSize: 14,
  fontFamily: "inherit",
  outline: "none",
};

// A short fixed list rather than the full ITU table — enough to cover the common cases without
// pulling in a whole country-data dependency for one dropdown.
const COUNTRY_CODES = [
  { code: "+1", label: "US +1" },
  { code: "+44", label: "UK +44" },
  { code: "+91", label: "IN +91" },
  { code: "+61", label: "AU +61" },
  { code: "+49", label: "DE +49" },
  { code: "+33", label: "FR +33" },
  { code: "+34", label: "ES +34" },
  { code: "+39", label: "IT +39" },
  { code: "+31", label: "NL +31" },
  { code: "+971", label: "AE +971" },
  { code: "+65", label: "SG +65" },
  { code: "+81", label: "JP +81" },
];

function ContactChannel({ icon, title, description, email, phone }: GetInTouchConfig["channels"][number]) {
  return (
    <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 10,
          background: "var(--site-card-bg, #F7F6F2)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <i className={`ti ${icon || "ti-mail"}`} style={{ fontSize: 18, color: "var(--site-accent, #E63946)" }} />
      </div>
      <div style={{ minWidth: 0 }}>
        <p style={{ fontSize: 15, fontWeight: 500, color: "var(--site-text, #17181C)", margin: "0 0 4px" }}>{title}</p>
        {description && (
          <p style={{ fontSize: 13, color: "var(--site-text-muted, #8A8C93)", margin: "0 0 6px", lineHeight: 1.6 }}>{description}</p>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {email && (
            <a href={`mailto:${email}`} style={{ fontSize: 13, color: "var(--site-accent, #E63946)", textDecoration: "none" }}>
              {email}
            </a>
          )}
          {phone && (
            <a href={`tel:${phone.replace(/\s+/g, "")}`} style={{ fontSize: 13, color: "var(--site-accent, #E63946)", textDecoration: "none" }}>
              {phone}
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

function GetInTouchColumn({ config, isCard }: { config: GetInTouchConfig; isCard: boolean }) {
  return (
    <div
      style={
        isCard
          ? {
              background: "var(--site-card-bg, #F7F6F2)",
              border: "1px solid #EAE8E1",
              borderRadius: 20,
              padding: "2.5rem",
            }
          : undefined
      }
    >
      {config.heading && (
        <p style={{ fontSize: 24, fontWeight: 500, color: "var(--site-text, #17181C)", margin: "0 0 8px" }}>{config.heading}</p>
      )}
      {config.description && (
        <p style={{ fontSize: 14, color: "var(--site-text-muted, #8A8C93)", margin: "0 0 28px", lineHeight: 1.6 }}>
          {config.description}
        </p>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        {config.channels.map((channel, i) => (
          <ContactChannel key={i} {...channel} />
        ))}
      </div>
      {(config.office || config.business_hours) && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 28, paddingTop: 24, borderTop: "1px solid #EAE8E1" }}>
          {config.office && (
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <i className="ti ti-map-pin" style={{ fontSize: 15, color: "var(--site-text-muted, #8A8C93)" }} />
              <p style={{ fontSize: 13, color: "var(--site-text-muted, #8A8C93)", margin: 0 }}>{config.office}</p>
            </div>
          )}
          {config.business_hours && (
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <i className="ti ti-clock" style={{ fontSize: 15, color: "var(--site-text-muted, #8A8C93)" }} />
              <p style={{ fontSize: 13, color: "var(--site-text-muted, #8A8C93)", margin: 0 }}>{config.business_hours}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function ContactFormBlock({
  formKey,
  title,
  description,
  fields,
  submitLabel = "Отправить",
  successMessage = "Спасибо! Мы получили сообщение и скоро ответим.",
  layout = "card",
  getInTouch,
  eitherRequired,
}: {
  formKey: string;
  title?: string;
  description?: string;
  fields: FormFieldConfig[];
  submitLabel?: string;
  successMessage?: string;
  layout?: "card" | "plain";
  getInTouch?: GetInTouchConfig;
  eitherRequired?: [string, string];
}) {
  const pathname = usePathname();
  const [values, setValues] = useState<Record<string, string>>({});
  const [phoneCodes, setPhoneCodes] = useState<Record<string, string>>({});
  const [website, setWebsite] = useState(""); // honeypot — real visitors never see or fill this
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [eitherError, setEitherError] = useState(false);

  function setValue(key: string, value: string) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function setPhoneValue(field: FormFieldConfig, code: string, number: string) {
    setPhoneCodes((prev) => ({ ...prev, [field.key]: code }));
    setValue(field.key, number ? `${code} ${number}` : "");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (status === "submitting") return;

    if (eitherRequired) {
      const [a, b] = eitherRequired;
      if (!values[a]?.trim() && !values[b]?.trim()) {
        setEitherError(true);
        return;
      }
    }
    setEitherError(false);

    setStatus("submitting");
    try {
      const res = await fetch("/api/forms/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          form_key: formKey,
          form_title: title || "",
          page_path: pathname,
          data: values,
          website,
        }),
      });
      if (!res.ok) throw new Error("request_failed");
      setStatus("success");
    } catch {
      setStatus("error");
    }
  }

  const isCard = layout !== "plain";
  const isSplit = !!getInTouch;

  if (status === "success") {
    return (
      <section style={{ padding: isCard ? "0 0 4rem" : "0 0 2rem" }}>
        <PageContainer style={isCard && !isSplit ? { maxWidth: 640 } : undefined}>
          <div
            style={{
              ...(isCard
                ? {
                    background: "var(--site-card-bg, #F7F6F2)",
                    border: "1px solid #EAE8E1",
                    borderRadius: 20,
                    padding: "3rem 2rem",
                  }
                : {}),
              textAlign: "center",
              animation: "site-form-success-in 320ms ease",
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: "50%",
                background: "var(--site-accent, #17181C)",
                color: "#FFFFFF",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px",
                fontSize: 20,
              }}
            >
              <i className="ti ti-check" />
            </div>
            <p style={{ fontSize: 15, color: "var(--site-text, #17181C)", margin: 0, lineHeight: 1.6 }}>{successMessage}</p>
          </div>
        </PageContainer>
      </section>
    );
  }

  const formEl = (
    <form
      onSubmit={handleSubmit}
      style={
        isCard
          ? {
              background: "var(--site-card-bg, #F7F6F2)",
              border: "1px solid #EAE8E1",
              borderRadius: 20,
              padding: "2.5rem",
            }
          : undefined
      }
    >
      {title && <p style={{ fontSize: 24, fontWeight: 500, color: "var(--site-text, #17181C)", margin: "0 0 8px" }}>{title}</p>}
      {description && (
        <p style={{ fontSize: 14, color: "var(--site-text-muted, #8A8C93)", margin: "0 0 24px", lineHeight: 1.6 }}>{description}</p>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {fields.map((field) => {
          const isEitherField = eitherRequired?.includes(field.key);
          return (
            <div key={field.key}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--site-text, #17181C)", marginBottom: 6 }}>
                {field.label}
                {field.required && <span style={{ color: "#DC2626" }}> *</span>}
              </label>
              {field.type === "textarea" ? (
                <textarea
                  required={field.required}
                  placeholder={field.placeholder}
                  value={values[field.key] || ""}
                  onChange={(e) => setValue(field.key, e.target.value)}
                  rows={4}
                  className="site-form-field"
                  style={{ ...fieldStyle, resize: "vertical" }}
                />
              ) : field.type === "select" ? (
                <select
                  required={field.required}
                  value={values[field.key] || ""}
                  onChange={(e) => setValue(field.key, e.target.value)}
                  className="site-form-field"
                  style={fieldStyle}
                >
                  <option value="" disabled>
                    {field.placeholder || "Выберите вариант"}
                  </option>
                  {(field.options || []).map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              ) : field.type === "tel" && field.phone_country_code ? (
                <div style={{ display: "flex", gap: 8 }}>
                  <select
                    value={phoneCodes[field.key] || COUNTRY_CODES[0].code}
                    onChange={(e) => {
                      const number = (values[field.key] || "").replace(/^\+\d+\s*/, "");
                      setPhoneValue(field, e.target.value, number);
                    }}
                    className="site-form-field"
                    style={{ ...fieldStyle, width: 100, flexShrink: 0, padding: "11px 8px" }}
                  >
                    {COUNTRY_CODES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                  <input
                    type="tel"
                    placeholder={field.placeholder}
                    value={(values[field.key] || "").replace(/^\+\d+\s*/, "")}
                    onChange={(e) => setPhoneValue(field, phoneCodes[field.key] || COUNTRY_CODES[0].code, e.target.value)}
                    className="site-form-field"
                    style={fieldStyle}
                  />
                </div>
              ) : (
                <input
                  type={field.type}
                  required={field.required}
                  placeholder={field.placeholder}
                  value={values[field.key] || ""}
                  onChange={(e) => setValue(field.key, e.target.value)}
                  className="site-form-field"
                  style={fieldStyle}
                />
              )}
              {isEitherField && eitherRequired?.[1] === field.key && (
                <p style={{ fontSize: 12, color: eitherError ? "#DC2626" : "var(--site-text-muted, #8A8C93)", margin: "6px 0 0" }}>
                  * Either Email or Phone is required
                </p>
              )}
            </div>
          );
        })}

        {/* Honeypot: hidden from real visitors (off-screen, unfocusable, unannounced to
            screen readers), so anything filling it in is almost certainly a bot. */}
        <input
          type="text"
          name="website"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          style={{ position: "absolute", left: -9999, width: 1, height: 1, opacity: 0 }}
        />

        <button
          type="submit"
          disabled={status === "submitting"}
          style={{
            width: isCard ? "100%" : "fit-content",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            padding: "12px 28px",
            borderRadius: 8,
            border: "none",
            background: "linear-gradient(135deg, var(--site-accent, #E63946), #B4202C)",
            color: "#FFFFFF",
            fontSize: 14,
            fontWeight: 500,
            cursor: status === "submitting" ? "default" : "pointer",
            opacity: status === "submitting" ? 0.7 : 1,
            marginTop: 4,
          }}
        >
          <i className="ti ti-send" style={{ fontSize: 15 }} />
          {status === "submitting" ? "Отправка..." : submitLabel}
        </button>

        {status === "error" && (
          <p style={{ fontSize: 13, color: "#DC2626", margin: 0 }}>
            Не удалось отправить. Попробуйте ещё раз или напишите напрямую на почту.
          </p>
        )}
      </div>
    </form>
  );

  return (
    <section style={{ padding: isCard ? "0 0 4rem" : "0 0 2rem" }}>
      <PageContainer
        style={
          isSplit
            ? { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 56, alignItems: "start" }
            : isCard
              ? { maxWidth: 640 }
              : undefined
        }
      >
        {isSplit && <GetInTouchColumn config={getInTouch!} isCard={isCard} />}
        {formEl}
      </PageContainer>
    </section>
  );
}
