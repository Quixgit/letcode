/** A faint (≈7% opacity) themed node-graph pattern, purely atmospheric — never load-bearing for
 * content, so it's safe to render behind anything. Toggled site-wide via Settings →
 * `show_decorative_backgrounds` (default on); callers pass that value in rather than each
 * re-fetching settings, so it's cheap to drop onto any section. */
export function DecorativeBackground({ color }: { color?: string } = {}) {
  const stroke = color || "var(--site-accent, #17181C)";
  return (
    <svg
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        opacity: 0.07,
        pointerEvents: "none",
      }}
      preserveAspectRatio="xMidYMid slice"
      viewBox="0 0 800 400"
    >
      <g stroke={stroke} strokeWidth="1" fill="none">
        <line x1="40" y1="80" x2="180" y2="40" />
        <line x1="180" y1="40" x2="320" y2="110" />
        <line x1="320" y1="110" x2="480" y2="60" />
        <line x1="480" y1="60" x2="620" y2="130" />
        <line x1="180" y1="40" x2="260" y2="200" />
        <line x1="320" y1="110" x2="420" y2="260" />
        <line x1="480" y1="60" x2="560" y2="220" />
        <line x1="620" y1="130" x2="700" y2="300" />
        <line x1="260" y1="200" x2="420" y2="260" />
        <line x1="420" y1="260" x2="560" y2="220" />
      </g>
      <g fill={stroke}>
        <circle cx="40" cy="80" r="4" />
        <circle cx="180" cy="40" r="4" />
        <circle cx="320" cy="110" r="4" />
        <circle cx="480" cy="60" r="4" />
        <circle cx="620" cy="130" r="4" />
        <circle cx="260" cy="200" r="4" />
        <circle cx="420" cy="260" r="4" />
        <circle cx="560" cy="220" r="4" />
        <circle cx="700" cy="300" r="4" />
      </g>
    </svg>
  );
}
