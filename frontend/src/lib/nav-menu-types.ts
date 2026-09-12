export type NavMenuType = "link" | "dropdown" | "mega_menu";

export interface NavMenuItem {
  icon_media_id?: string | null;
  icon_url?: string | null;
  title: string;
  description?: string | null;
  url: string;
}

export interface NavMenuTab {
  label: string;
  columns?: 1 | 2;
  items: NavMenuItem[];
}

export interface NavSidePanelItem {
  icon_media_id?: string | null;
  icon_url?: string | null;
  label: string;
  url: string;
}

export interface NavSidePanel {
  title: string;
  style: "text_links" | "icon_links";
  items: NavSidePanelItem[];
}

export interface NavMenuContent {
  tabs: NavMenuTab[];
  side_panel?: NavSidePanel | null;
}

export function emptyMenuContent(): NavMenuContent {
  return { tabs: [{ label: "", columns: 2, items: [] }], side_panel: null };
}
