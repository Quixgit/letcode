"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export function PageViewTracker() {
  const pathname = usePathname();

  useEffect(() => {
    // Deliberately a same-origin relative path, NOT `NEXT_PUBLIC_API_URL`: that env var is
    // baked in at build time as the backend's internal Docker hostname (e.g.
    // http://lecode-backend:8082), which only resolves inside the Docker network. This code
    // runs in the visitor's own browser, which can't see that hostname at all — every request
    // silently failed (swallowed by the .catch below), so every page view went untracked and
    // the dashboard always read 0. Caddy already proxies /api/* on the public domain to the
    // backend, so a relative path reaches it correctly.
    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: pathname, referrer: document.referrer }),
      keepalive: true,
    }).catch(() => {});
  }, [pathname]);

  return null;
}
