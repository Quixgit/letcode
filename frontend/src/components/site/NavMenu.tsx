"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { NavItem } from "@/lib/api";
import type { NavMenuTab } from "@/lib/nav-menu-types";
import { PageContainer } from "@/components/site/PageContainer";

// Color lives in the `.site-nav-link` CSS class (globals.css), not here, because hover/open
// states need a real `:hover`/`.site-nav-link--open` selector — inline styles can't express that.
const linkStyle: React.CSSProperties = {
  fontSize: 14,
  textDecoration: "none",
  background: "none",
  border: "none",
  padding: 0,
  font: "inherit",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  gap: 4,
};

// `icon` (a tabler class like "ti-rocket") takes precedence over `url` (an uploaded image) when
// both are set — a plain icon font glyph is the lighter-weight option for a menu row and is what
// the block editor's own icon fields (BlockIcon) already prefer the same way.
function ItemIcon({ icon, url }: { icon?: string | null; url?: string | null }) {
  return (
    <div
      className="site-menu-item-icon"
      style={{
        width: 36,
        height: 36,
        borderRadius: 9,
        background: "var(--site-card-bg, #F7F6F2)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      {icon ? (
        <i className={`ti ${icon}`} style={{ fontSize: 17, color: "var(--site-text-muted, #8A8C93)", transition: "color 180ms ease" }} />
      ) : url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="" style={{ width: 20, height: 20, objectFit: "contain" }} />
      ) : (
        <i className="ti ti-sparkles" style={{ fontSize: 16, color: "var(--site-text, #17181C)" }} />
      )}
    </div>
  );
}

function MegaPanel({ item }: { item: NavItem }) {
  const content = item.menu_content!;
  const tabs = content.tabs.filter((t) => t.items.length > 0 || t.label);
  const [activeTab, setActiveTab] = useState(0);
  const showTabs = tabs.length > 1;
  const tab: NavMenuTab = tabs[Math.min(activeTab, Math.max(tabs.length - 1, 0))] || { label: "", columns: 2, items: [] };

  return (
    <div
      className="site-mega-panel"
      style={{
        position: "absolute",
        top: "100%",
        left: 0,
        right: 0,
        background: "#FFFFFF",
        borderTop: "0.5px solid #EAE8E1",
        borderBottom: "0.5px solid #EAE8E1",
        boxShadow: "0 16px 32px rgba(23, 24, 28, 0.08)",
        zIndex: 30,
      }}
    >
      <PageContainer style={{ padding: "2rem", display: "flex", gap: 40 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {showTabs && (
            <div style={{ display: "flex", gap: 24, borderBottom: "0.5px solid #EAE8E1", marginBottom: 20 }}>
              {tabs.map((t, i) => (
                <button
                  key={i}
                  onClick={() => setActiveTab(i)}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: "0 0 10px",
                    marginBottom: -1,
                    fontSize: 14,
                    fontWeight: 500,
                    color: i === activeTab ? "var(--site-text, #17181C)" : "var(--site-text-muted, #8A8C93)",
                    borderBottom: i === activeTab ? "2px solid var(--site-accent, #17181C)" : "2px solid transparent",
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>
          )}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${tab.columns === 1 ? 1 : 2}, 1fr)`,
              gap: "20px 32px",
            }}
          >
            {tab.items.map((menuItem, i) => (
              <Link
                key={i}
                href={menuItem.url}
                className="site-menu-item"
                style={{ display: "flex", gap: 12, textDecoration: "none", borderRadius: 10, padding: 6 }}
              >
                <ItemIcon icon={menuItem.icon} url={menuItem.icon_url} />
                <div>
                  <p className="site-menu-item-title" style={{ margin: 0, fontSize: 14, fontWeight: 500, color: "var(--site-text, #17181C)", transition: "color 180ms ease" }}>
                    {menuItem.title}
                  </p>
                  {menuItem.description && (
                    <p style={{ margin: "2px 0 0", fontSize: 12.5, color: "var(--site-text-muted, #8A8C93)", lineHeight: 1.5 }}>
                      {menuItem.description}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>

        {content.side_panel && (
          <div style={{ width: 220, flexShrink: 0, borderLeft: "0.5px solid #EAE8E1", paddingLeft: 32 }}>
            <p style={{ margin: "0 0 14px", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.4, color: "var(--site-text-muted, #8A8C93)" }}>
              {content.side_panel.title}
            </p>
            {content.side_panel.text && (
              <p style={{ margin: "-6px 0 14px", fontSize: 12.5, lineHeight: 1.5, color: "var(--site-text-muted, #8A8C93)" }}>
                {content.side_panel.text}
              </p>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {content.side_panel.items.map((sideItem, i) => (
                <Link
                  key={i}
                  href={sideItem.url}
                  style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13.5, color: "var(--site-text, #17181C)", textDecoration: "none" }}
                >
                  {content.side_panel!.style === "icon_links" &&
                    (sideItem.icon_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={sideItem.icon_url} alt="" style={{ width: 16, height: 16, objectFit: "contain" }} />
                    ) : (
                      <i className="ti ti-link" style={{ fontSize: 14, color: "var(--site-text-muted, #8A8C93)" }} />
                    ))}
                  {sideItem.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </PageContainer>
    </div>
  );
}

function MobileAccordionTab({ tab }: { tab: NavMenuTab }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderTop: "0.5px solid #EAE8E1" }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "none",
          border: "none",
          padding: "10px 0",
          fontSize: 13,
          fontWeight: 500,
          color: "var(--site-text, #17181C)",
          cursor: "pointer",
        }}
      >
        {tab.label}
        <i className="ti ti-chevron-down" style={{ fontSize: 14, transform: open ? "rotate(180deg)" : "none", transition: "transform 150ms" }} />
      </button>
      {open && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, paddingBottom: 12 }}>
          {tab.items.map((menuItem, i) => (
            <Link key={i} href={menuItem.url} style={{ display: "flex", gap: 10, textDecoration: "none", paddingLeft: 8 }}>
              <ItemIcon url={menuItem.icon_url} />
              <div>
                <p style={{ margin: 0, fontSize: 13.5, fontWeight: 500, color: "var(--site-text, #17181C)" }}>{menuItem.title}</p>
                {menuItem.description && <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--site-text-muted, #8A8C93)" }}>{menuItem.description}</p>}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function MobileMenuItem({ item }: { item: NavItem }) {
  const [open, setOpen] = useState(false);
  const hasMenu = item.menu_type !== "link" && item.menu_content;

  if (!hasMenu) {
    return (
      <Link href={item.url} style={{ display: "block", padding: "12px 0", fontSize: 14, color: "var(--site-text, #17181C)", textDecoration: "none" }}>
        {item.label}
      </Link>
    );
  }

  const content = item.menu_content!;
  const tabs = content.tabs.filter((t) => t.items.length > 0 || t.label);
  const showTabs = tabs.length > 1;

  return (
    <div>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "none",
          border: "none",
          padding: "12px 0",
          fontSize: 14,
          color: "var(--site-text, #17181C)",
          cursor: "pointer",
        }}
      >
        {item.label}
        <i className="ti ti-chevron-down" style={{ fontSize: 15, transform: open ? "rotate(180deg)" : "none", transition: "transform 150ms" }} />
      </button>
      {open && (
        <div style={{ paddingBottom: 8 }}>
          {showTabs ? (
            tabs.map((tab, i) => <MobileAccordionTab key={i} tab={tab} />)
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10, paddingBottom: 8 }}>
              {(tabs[0]?.items || []).map((menuItem, i) => (
                <Link key={i} href={menuItem.url} style={{ display: "flex", gap: 10, textDecoration: "none", paddingLeft: 8 }}>
                  <ItemIcon url={menuItem.icon_url} />
                  <div>
                    <p style={{ margin: 0, fontSize: 13.5, fontWeight: 500, color: "var(--site-text, #17181C)" }}>{menuItem.title}</p>
                    {menuItem.description && <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--site-text-muted, #8A8C93)" }}>{menuItem.description}</p>}
                  </div>
                </Link>
              ))}
            </div>
          )}
          {content.side_panel && (
            <div style={{ borderTop: "0.5px solid #EAE8E1", paddingTop: 10, marginTop: 4 }}>
              <p style={{ margin: "0 0 8px", fontSize: 11.5, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.4, color: "var(--site-text-muted, #8A8C93)" }}>
                {content.side_panel.title}
              </p>
              {content.side_panel.text && (
                <p style={{ margin: "-4px 0 8px", fontSize: 12, lineHeight: 1.5, color: "var(--site-text-muted, #8A8C93)" }}>
                  {content.side_panel.text}
                </p>
              )}
              <div style={{ display: "flex", flexDirection: "column", gap: 8, paddingLeft: 8 }}>
                {content.side_panel.items.map((sideItem, i) => (
                  <Link key={i} href={sideItem.url} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--site-text, #17181C)", textDecoration: "none" }}>
                    {content.side_panel!.style === "icon_links" &&
                      (sideItem.icon_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={sideItem.icon_url} alt="" style={{ width: 15, height: 15, objectFit: "contain" }} />
                      ) : (
                        <i className="ti ti-link" style={{ fontSize: 13, color: "var(--site-text-muted, #8A8C93)" }} />
                      ))}
                    {sideItem.label}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function NavMenu({
  navItems,
  alignment,
}: {
  navItems: NavItem[];
  alignment: "left" | "center" | "right";
}) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpenId(null);
    }
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  function scheduleClose() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpenId(null), 150);
  }
  function cancelClose() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  }

  // Positioning (left/center/right) is now owned by the grid cell NavMenu renders into
  // (see HeaderChrome.tsx) — this stays a plain row regardless of `alignment`.
  const navStyle: React.CSSProperties = { display: "flex", alignItems: "center", gap: 24 };

  return (
    <>
      <div ref={containerRef} className="site-nav-desktop" style={navStyle}>
        {navItems.map((item) => {
          const hasMenu = (item.menu_type === "dropdown" || item.menu_type === "mega_menu") && item.menu_content;
          if (!hasMenu) {
            return (
              <Link key={item.id} href={item.url} className="site-nav-link" style={linkStyle}>
                {item.label}
              </Link>
            );
          }
          const isOpen = openId === item.id;
          // Deliberately no `position` here: MegaPanel is `position:absolute; left:0; right:0`
          // and needs to bind to the <header> (the nearest positioned ancestor once this stays
          // static) to span the header's full width — giving this div its own position would
          // shrink the panel down to this trigger's own width instead.
          return (
            <div key={item.id} onMouseEnter={() => { cancelClose(); setOpenId(item.id); }} onMouseLeave={scheduleClose}>
              <button
                // Deliberately "ensure open", not "toggle": on a real mouse click the trigger's
                // own onMouseEnter has already fired and opened it a moment earlier, so a naive
                // isOpen-based toggle here immediately closed it again right after opening —
                // clicking looked like it did nothing (or briefly flashed the panel shut).
                // Closing is handled entirely by onMouseLeave's delayed close and the
                // click-outside listener above, which also covers touch (no hover there).
                onClick={() => setOpenId(item.id)}
                className={`site-nav-link${isOpen ? " site-nav-link--open" : ""}`}
                style={linkStyle}
                aria-expanded={isOpen}
              >
                {item.label}
                <i className="ti ti-chevron-down" style={{ fontSize: 12, transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 150ms" }} />
              </button>
              {isOpen && <MegaPanel item={item} />}
            </div>
          );
        })}
      </div>

      <button
        className="site-nav-mobile-toggle"
        onClick={() => setMobileOpen((v) => !v)}
        style={{
          marginLeft: "auto",
          background: "none",
          border: "none",
          cursor: "pointer",
          width: 36,
          height: 36,
          alignItems: "center",
          justifyContent: "center",
        }}
        aria-label="Меню"
        aria-expanded={mobileOpen}
      >
        <i className={mobileOpen ? "ti ti-x" : "ti ti-menu-2"} style={{ fontSize: 20, color: "var(--site-text, #17181C)" }} />
      </button>

      {mobileOpen && (
        <div
          className="site-mega-panel site-nav-mobile-panel"
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            maxHeight: "calc(100vh - 64px)",
            overflowY: "auto",
            background: "#FFFFFF",
            borderTop: "0.5px solid #EAE8E1",
            boxShadow: "0 16px 32px rgba(23, 24, 28, 0.08)",
            padding: "0.5rem 1.5rem 1.5rem",
            zIndex: 30,
          }}
        >
          {navItems.map((item) => (
            <MobileMenuItem key={item.id} item={item} />
          ))}
        </div>
      )}
    </>
  );
}
