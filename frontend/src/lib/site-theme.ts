import type { CSSProperties } from "react";
import type { ThemeConfig } from "@/lib/api";

/** Maps a template's theme_config onto the --site-* CSS custom properties every
 * public component reads (with a hardcoded-hex fallback), so templates without
 * theme_config (minimal, nexus-light) render pixel-identical to before this existed. */
export function siteThemeVars(theme?: ThemeConfig | null): CSSProperties {
  if (!theme) return {};
  const vars: Record<string, string> = {};
  if (theme.accent) vars["--site-accent"] = theme.accent;
  if (theme.text) vars["--site-text"] = theme.text;
  if (theme.text_muted) vars["--site-text-muted"] = theme.text_muted;
  if (theme.card_bg) vars["--site-card-bg"] = theme.card_bg;
  if (theme.page_bg) vars["--site-page-bg"] = theme.page_bg;
  if (theme.section_alt_bg) vars["--site-section-alt-bg"] = theme.section_alt_bg;
  if (theme.footer_bg) vars["--site-footer-bg"] = theme.footer_bg;
  return vars as CSSProperties;
}
