import type { ButtonHTMLAttributes } from "react";
import Link from "next/link";

type Variant = "filled" | "tonal" | "outlined" | "text" | "destructive";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  href?: string;
}

const VARIANTS: Record<Variant, string> = {
  filled: "bg-md-accent text-md-on-accent md-elevation-1 hover:opacity-90 active:opacity-80",
  tonal: "bg-md-secondary-container text-md-on-secondary-container hover:bg-md-surface-container-highest active:brightness-95",
  outlined: "border border-md-outline-variant text-md-on-surface hover:border-md-accent hover:text-md-accent active:bg-md-surface-container-high",
  text: "text-md-on-surface-variant hover:text-md-on-surface hover:underline underline-offset-4 active:opacity-70",
  destructive: "bg-md-error text-md-on-error hover:opacity-90 active:opacity-80",
};

export function Button({ variant = "filled", href, className = "", children, ...props }: ButtonProps) {
  const classes = `md-label-large md-motion inline-flex items-center justify-center gap-1.5 rounded-md px-4 py-2 disabled:cursor-not-allowed disabled:opacity-50 ${VARIANTS[variant]} ${className}`;

  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button type="button" className={classes} {...props}>
      {children}
    </button>
  );
}
