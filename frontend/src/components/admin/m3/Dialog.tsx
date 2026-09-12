"use client";

import { useEffect, type ReactNode } from "react";

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  icon?: string;
  children?: ReactNode;
  actions?: ReactNode;
}

export function Dialog({ open, onClose, title, icon, children, actions }: DialogProps) {
  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="md-dialog-scrim fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ animation: "md-scrim-in var(--md-duration-short) var(--md-easing-standard)" }}
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-sm rounded-xl bg-md-surface-container-high p-6"
        style={{
          boxShadow: "var(--md-elevation-3)",
          animation: "md-dialog-in var(--md-duration-medium) var(--md-easing-emphasized-decelerate)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {icon && (
          <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-md-secondary-container">
            <i className={`ti ${icon} text-lg text-md-on-secondary-container`} />
          </div>
        )}
        <p className="md-headline-small m-0 text-md-on-surface">{title}</p>
        {children && <div className="md-body-medium mt-2 text-md-on-surface-variant">{children}</div>}
        {actions && <div className="mt-6 flex justify-end gap-2">{actions}</div>}
      </div>
    </div>
  );
}
