import type { HTMLAttributes } from "react";

type Tone = "neutral" | "primary" | "success" | "warning" | "error";
type Variant = "filled" | "outlined";

interface ChipProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
  variant?: Variant;
  icon?: string;
}

const FILLED: Record<Tone, string> = {
  neutral: "bg-md-surface-variant text-md-on-surface-variant",
  primary: "bg-md-primary-container text-md-on-primary-container",
  success: "bg-md-success-container text-md-on-success-container",
  warning: "bg-md-warning-container text-md-on-warning-container",
  error: "bg-md-error-container text-md-on-error-container",
};

const OUTLINED: Record<Tone, string> = {
  neutral: "border border-md-outline text-md-on-surface-variant",
  primary: "border border-md-primary text-md-primary",
  success: "border border-md-success text-md-success",
  warning: "border border-md-warning text-md-warning",
  error: "border border-md-error text-md-error",
};

export function Chip({
  tone = "neutral",
  variant = "filled",
  icon,
  className = "",
  children,
  ...props
}: ChipProps) {
  const tone_classes = variant === "filled" ? FILLED[tone] : OUTLINED[tone];
  return (
    <span
      className={`md-label-large inline-flex items-center gap-1 rounded-full px-3 py-1 capitalize ${tone_classes} ${className}`}
      {...props}
    >
      {icon && <i className={`ti ${icon} text-sm`} />}
      {children}
    </span>
  );
}
