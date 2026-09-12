"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { adminFetch } from "@/lib/admin-api";

export function CategoryAutocomplete({
  value,
  onChange,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  const [focused, setFocused] = useState(false);

  const { data: categories } = useQuery({
    queryKey: ["app-categories"],
    queryFn: () => adminFetch<string[]>("api/apps/categories"),
  });

  const matches = (categories || []).filter(
    (c) => c.toLowerCase() !== value.trim().toLowerCase() && c.toLowerCase().includes(value.trim().toLowerCase())
  );

  return (
    <div className="relative">
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setTimeout(() => setFocused(false), 150)}
        placeholder="Например, Productivity"
        className={className}
      />
      {focused && matches.length > 0 && (
        <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-lg border border-md-outline-variant bg-md-surface-container-high shadow-md">
          {matches.slice(0, 6).map((c) => (
            <button
              key={c}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => onChange(c)}
              className="block w-full px-3 py-1.5 text-left text-[13px] text-md-on-surface hover:bg-md-surface-container-highest"
            >
              {c}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
