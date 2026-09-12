import type { HTMLAttributes } from "react";

const SHADOWS: Record<number, string> = {
  0: "var(--md-elevation-0)",
  1: "var(--md-elevation-1)",
  2: "var(--md-elevation-2)",
  3: "var(--md-elevation-3)",
  4: "var(--md-elevation-4)",
  5: "var(--md-elevation-5)",
};

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  elevation?: 0 | 1 | 2 | 3 | 4 | 5;
  interactive?: boolean;
  outlined?: boolean;
}

export function Card({
  elevation = 1,
  interactive = false,
  outlined = true,
  className = "",
  style,
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={`rounded-lg bg-md-surface-container-low md-motion ${
        interactive ? "md-card--interactive" : ""
      } ${outlined ? "border border-md-outline-variant" : ""} ${className}`}
      style={{ boxShadow: SHADOWS[elevation], ...style }}
      {...props}
    >
      {children}
    </div>
  );
}
