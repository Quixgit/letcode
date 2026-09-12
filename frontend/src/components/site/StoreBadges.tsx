const badgeStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 9,
  padding: "6px 14px 6px 12px",
  borderRadius: 8,
  background: "#000000",
  color: "#FFFFFF",
  textDecoration: "none",
  width: "fit-content",
  border: "0.5px solid rgba(255,255,255,0.25)",
};

const labelWrapStyle: React.CSSProperties = { display: "flex", flexDirection: "column", lineHeight: 1.15 };
const eyebrowStyle: React.CSSProperties = { fontSize: 9, fontWeight: 400, letterSpacing: 0.3, opacity: 0.85 };
const titleStyle: React.CSSProperties = { fontSize: 15.5, fontWeight: 600, letterSpacing: 0.2, fontFamily: "Arial, Helvetica, sans-serif" };

export function AppStoreBadge({ href }: { href: string }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" style={badgeStyle}>
      <svg width="20" height="22" viewBox="0 0 24 24" fill="#FFFFFF" aria-hidden>
        <path d="M16.365 1.43c0 1.14-.493 2.27-1.177 3.08-.744.9-1.99 1.57-2.987 1.57-.12 0-.23-.02-.3-.03-.01-.06-.04-.22-.04-.39 0-1.15.572-2.27 1.206-2.98.804-.94 2.142-1.64 3.248-1.68.03.13.05.28.05.43zm4.565 15.71c-.03.07-.463 1.58-1.518 3.12-.945 1.34-1.94 2.71-3.43 2.71-1.517 0-1.9-.88-3.63-.88-1.698 0-2.302.91-3.67.91-1.377 0-2.332-1.26-3.428-2.8-1.287-1.82-2.323-4.63-2.323-7.28 0-4.28 2.797-6.55 5.552-6.55 1.448 0 2.675.95 3.5.95.81 0 2.19-1.01 3.85-1.01.622 0 2.833.06 4.311 2.12-.117.07-2.581 1.51-2.581 4.61 0 3.71 3.221 5.02 3.34 5.08z" />
      </svg>
      <div style={labelWrapStyle}>
        <span style={eyebrowStyle}>Download on the</span>
        <span style={titleStyle}>App Store</span>
      </div>
    </a>
  );
}

export function GooglePlayBadge({ href }: { href: string }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" style={badgeStyle}>
      <svg width="20" height="22" viewBox="0 0 24 24" aria-hidden>
        <defs>
          <linearGradient id="gp-blue" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#00C6FF" />
            <stop offset="1" stopColor="#0072FF" />
          </linearGradient>
          <linearGradient id="gp-green" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#7DE562" />
            <stop offset="1" stopColor="#1DB855" />
          </linearGradient>
          <linearGradient id="gp-yellow" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#FFE000" />
            <stop offset="1" stopColor="#FFA000" />
          </linearGradient>
          <linearGradient id="gp-red" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#FF5B5B" />
            <stop offset="1" stopColor="#E5253F" />
          </linearGradient>
        </defs>
        <path d="M4 2.6c-.4.4-.6.9-.6 1.6v15.6c0 .7.2 1.2.6 1.6l.1.1 8.7-8.7v-.2L4.1 2.5z" fill="url(#gp-blue)" />
        <path d="M15.7 15.8l-2.9-2.9v-.2l2.9-2.9.1.1 3.4 2c1 .5 1 1.4 0 1.9l-3.5 2z" fill="url(#gp-yellow)" />
        <path d="M15.7 15.8L12.8 12.9 4 21.7c.3.4.9.4 1.5.1l10.2-6z" fill="url(#gp-red)" />
        <path d="M15.7 8.2l-10.2-6c-.6-.3-1.2-.3-1.5.1l8.8 8.6 2.9-2.7z" fill="url(#gp-green)" />
      </svg>
      <div style={labelWrapStyle}>
        <span style={eyebrowStyle}>GET IT ON</span>
        <span style={titleStyle}>Google Play</span>
      </div>
    </a>
  );
}
