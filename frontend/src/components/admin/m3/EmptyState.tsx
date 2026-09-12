import type { ReactNode } from "react";
import { Button } from "@/components/admin/m3/Button";

interface EmptyStateProps {
  icon: string;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  actionHref?: string;
  children?: ReactNode;
}

export function EmptyState({ icon, title, description, actionLabel, onAction, actionHref, children }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-md-outline-variant px-6 py-14 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-md-surface-container-high">
        <i className={`ti ${icon} text-2xl text-md-on-surface-variant`} />
      </div>
      <div>
        <p className="md-title-small m-0 text-md-on-surface">{title}</p>
        <p className="md-body-medium mx-auto mt-1 max-w-sm text-md-on-surface-variant">{description}</p>
      </div>
      {actionLabel && (onAction || actionHref) && (
        <Button onClick={onAction} href={actionHref} className="mt-1">
          {actionLabel}
        </Button>
      )}
      {children}
    </div>
  );
}
