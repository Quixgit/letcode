"use client";

import { useState } from "react";

export interface HelpQA {
  q: string;
  a: string[];
  image?: string;
  tip?: string;
}

export function HelpAccordionItem({ item, defaultOpen }: { item: HelpQA; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(!!defaultOpen);

  return (
    <div className="overflow-hidden rounded-lg border border-md-outline-variant bg-md-surface-container-low">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
      >
        <span className="md-title-small text-md-on-surface">{item.q}</span>
        <i
          className="ti ti-chevron-down md-motion shrink-0 text-base text-md-on-surface-variant"
          style={{ transform: open ? "rotate(180deg)" : "none" }}
        />
      </button>
      {open && (
        <div className="flex flex-col gap-3 border-t border-md-outline-variant px-4 pb-4 pt-3">
          {item.a.map((p, i) => (
            <p key={i} className="md-body-medium m-0 text-md-on-surface-variant" style={{ lineHeight: 1.7 }}>
              {p}
            </p>
          ))}
          {item.tip && (
            <div className="flex items-start gap-2 rounded-md bg-md-accent-container/40 px-3 py-2">
              <i className="ti ti-bulb mt-0.5 shrink-0 text-sm text-md-on-accent-container" />
              <p className="md-body-small m-0 text-md-on-accent-container" style={{ lineHeight: 1.6 }}>
                {item.tip}
              </p>
            </div>
          )}
          {item.image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.image}
              alt={item.q}
              className="w-full rounded-md border border-md-outline-variant"
              style={{ maxWidth: 760 }}
            />
          )}
        </div>
      )}
    </div>
  );
}
