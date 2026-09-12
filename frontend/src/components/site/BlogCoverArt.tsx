type Theme = { key: string; match: string[]; icon: string; from: string; to: string };

const THEMES: Theme[] = [
  { key: "oncall", match: ["on-call", "alerting", "incident-response", "devops"], icon: "ti-bell-ringing", from: "#E63946", to: "#1D3557" },
  { key: "privacy", match: ["privacy", "offline-first", "engineering"], icon: "ti-lock", from: "#2A9D8F", to: "#1B3A36" },
  { key: "finance", match: ["subscriptions", "personal-finance", "saas"], icon: "ti-credit-card", from: "#E9C46A", to: "#E76F51" },
  { key: "indie", match: ["indie-software", "product", "philosophy"], icon: "ti-terminal-2", from: "#457B9D", to: "#17181C" },
];

const DEFAULT_THEME: Theme = { key: "default", match: [], icon: "ti-sparkles", from: "#6D597A", to: "#264653" };

function pickTheme(tags: string[]): Theme {
  for (const theme of THEMES) if (tags.some((tag) => theme.match.includes(tag))) return theme;
  return DEFAULT_THEME;
}

/** Hand-drawn SVG editorial cover — gradient field, dot-grid texture, a large watermark icon and a
 * crisp foreground icon chip. Used in place of a raster photo where no real cover has been uploaded. */
export function BlogCoverArt({ tags, height = 160 }: { tags: string[]; height?: number }) {
  const theme = pickTheme(tags);
  const gradId = `bca-${theme.key}`;
  const dotId = `bca-dots-${theme.key}`;

  return (
    <div style={{ width: "100%", height, borderRadius: 12, overflow: "hidden", position: "relative" }}>
      <svg width="100%" height="100%" viewBox="0 0 400 220" preserveAspectRatio="xMidYMid slice" style={{ display: "block" }}>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={theme.from} />
            <stop offset="100%" stopColor={theme.to} />
          </linearGradient>
          <pattern id={dotId} width="18" height="18" patternUnits="userSpaceOnUse">
            <circle cx="1.4" cy="1.4" r="1.4" fill="rgba(255,255,255,0.16)" />
          </pattern>
        </defs>

        <rect width="400" height="220" fill={`url(#${gradId})`} />
        <rect width="400" height="220" fill={`url(#${dotId})`} />

        <circle cx="330" cy="30" r="140" fill="rgba(255,255,255,0.06)" />
        <path d="M-20 190 C 100 140, 300 240, 420 170" stroke="rgba(255,255,255,0.14)" strokeWidth="1.5" fill="none" />

        <foreignObject x="200" y="6" width="220" height="220">
          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", transform: "rotate(-8deg)" }}>
            <i className={`ti ${theme.icon}`} style={{ fontSize: 150, color: "rgba(255,255,255,0.10)" }} />
          </div>
        </foreignObject>

        <foreignObject x="24" y="24" width="72" height="72">
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              background: "rgba(255,255,255,0.14)",
              backdropFilter: "blur(2px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.22)",
            }}
          >
            <i className={`ti ${theme.icon}`} style={{ fontSize: 28, color: "#FFFFFF" }} />
          </div>
        </foreignObject>
      </svg>
    </div>
  );
}
