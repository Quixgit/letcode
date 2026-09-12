"use client";

import { Button } from "@/components/admin/m3/Button";

const fieldInputClass =
  "block rounded-md border border-md-outline-variant bg-md-surface px-2 py-1.5 text-[12px] text-md-on-surface outline-none focus:border-md-primary";

export function FilterBar({
  children,
  hasActiveFilters,
  onApply,
  onClear,
}: {
  children: React.ReactNode;
  hasActiveFilters: boolean;
  onApply: () => void;
  onClear: () => void;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-end gap-3 rounded-lg border border-md-outline-variant bg-md-surface-container-low p-3">
      {children}
      <div className="flex items-center gap-2">
        <Button onClick={onApply} className="px-3 py-1.5 text-[12px]">
          Filter
        </Button>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onClear}
            className="text-[12px] text-md-on-surface-variant hover:text-md-on-surface"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
}

export function FilterField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-[11px] text-md-on-surface-variant">
      {label}
      <div className="mt-1">{children}</div>
    </label>
  );
}

export function FilterInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${fieldInputClass} ${props.className || ""}`} />;
}

export function FilterSelect(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`${fieldInputClass} ${props.className || ""}`} />;
}
