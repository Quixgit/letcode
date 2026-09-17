"use client";

import { useEffect, useState, type ReactNode } from "react";
import { PageContainer } from "@/components/site/PageContainer";

/** Owns the header's own visual chrome (background/shadow/position) so the scroll-driven
 * "floating" effect can live in a client component while Header.tsx itself stays an async
 * server component doing the data fetching.
 *
 * The inner row is a 3-cell grid (start/center/end) rather than a single flex row so `logo_position`
 * and `menu_alignment` can each independently land in any cell — a flex row with margin-auto tricks
 * can only ever push ONE group to the far side before it runs out of "auto" slots to fight over. */
export function HeaderChrome({
  sticky,
  floating,
  start,
  center,
  end,
}: {
  sticky: boolean;
  floating: boolean;
  start?: ReactNode;
  center?: ReactNode;
  end?: ReactNode;
}) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (!floating) {
      setScrolled(false);
      return;
    }
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [floating]);

  const isFloatingAndScrolled = floating && scrolled;

  return (
    <header
      style={{
        padding: "1.1rem 0",
        borderBottom: isFloatingAndScrolled ? "0.5px solid transparent" : "0.5px solid #EAE8E1",
        background: isFloatingAndScrolled ? "rgba(255, 255, 255, 0.82)" : "var(--site-page-bg, #FFFFFF)",
        backdropFilter: isFloatingAndScrolled ? "saturate(180%) blur(10px)" : undefined,
        WebkitBackdropFilter: isFloatingAndScrolled ? "saturate(180%) blur(10px)" : undefined,
        boxShadow: isFloatingAndScrolled ? "0 8px 24px rgba(23, 24, 28, 0.1)" : "none",
        transition: "background-color 220ms ease, box-shadow 220ms ease, border-color 220ms ease",
        position: sticky ? "sticky" : "relative",
        top: sticky ? 0 : undefined,
        zIndex: 50,
        isolation: "isolate",
      }}
    >
      <PageContainer style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 24, justifySelf: "start", minWidth: 0 }}>{start}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 24, justifySelf: "center" }}>{center}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 24, justifySelf: "end" }}>{end}</div>
      </PageContainer>
    </header>
  );
}
