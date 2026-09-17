import type { HTMLAttributes, ReactNode } from "react";

// The one content boundary every public-site block should align to, so section edges line
// up across the whole page instead of each block picking its own max-width. 1200px matches
// the reference site (squareops.com's `.container`) the user asked to match — narrower
// values (960, the old default) read as cramped next to that reference.
export const SITE_CONTENT_WIDTH = 1200;

export function PageContainer({
  children,
  style,
  ...props
}: { children: ReactNode; style?: React.CSSProperties } & HTMLAttributes<HTMLDivElement>) {
  return (
    <div style={{ maxWidth: SITE_CONTENT_WIDTH, margin: "0 auto", padding: "0 2rem", ...style }} {...props}>
      {children}
    </div>
  );
}
