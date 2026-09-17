/** A circular accent-gradient icon badge with a soft halo glow — built as its own shared
 * component (not tied to `why_choose_us`) specifically so any future block that wants this same
 * treatment reuses it instead of reimplementing the gradient/halo styling.
 *
 * `icon` takes a tabler icon suffix (e.g. "cloud-upload") for blocks whose items are abstract
 * concepts rather than uploadable logos — falls back to "sparkles" when neither `iconUrl` nor
 * `icon` is set, same default as before this prop existed. */
export function GradientIconBadge({ iconUrl, icon, size = 64 }: { iconUrl?: string | null; icon?: string; size?: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: "linear-gradient(135deg, var(--site-accent, #E63946), #FF7A6E)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        // The halo: two extra transparent-to-accent rings layered via box-shadow, cheaper and
        // simpler than a second absolutely-positioned/blurred DOM element for the same look.
        boxShadow: "0 0 0 8px rgba(230, 57, 70, 0.1), 0 0 0 16px rgba(230, 57, 70, 0.05)",
      }}
    >
      {iconUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={iconUrl} alt="" style={{ width: size * 0.46, height: size * 0.46, objectFit: "contain" }} />
      ) : (
        <i className={`ti ti-${icon || "sparkles"}`} style={{ fontSize: size * 0.4, color: "#FFFFFF" }} />
      )}
    </div>
  );
}
