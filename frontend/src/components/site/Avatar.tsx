const GRADIENTS: [string, string][] = [
  ["#E63946", "#F4A261"],
  ["#457B9D", "#1D3557"],
  ["#6D597A", "#B56576"],
  ["#2A9D8F", "#264653"],
  ["#E9C46A", "#E76F51"],
  ["#3A86FF", "#8338EC"],
];

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return parts.slice(0, 2).map((p) => p[0]!.toUpperCase()).join("");
}

/** Deterministic gradient + initials avatar — same person always gets the same look, no raster image needed. */
export function Avatar({ name, size = 44 }: { name: string; size?: number }) {
  const [from, to] = GRADIENTS[hashString(name) % GRADIENTS.length];
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: `linear-gradient(135deg, ${from}, ${to})`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        boxShadow: "0 2px 8px rgba(23, 24, 28, 0.16), inset 0 0 0 1px rgba(255,255,255,0.15)",
      }}
    >
      <span style={{ color: "#FFFFFF", fontSize: size * 0.36, fontWeight: 600, letterSpacing: 0.3 }}>
        {initialsOf(name)}
      </span>
    </div>
  );
}
