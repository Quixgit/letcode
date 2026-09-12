import type { NavMenuType, NavMenuContent } from "@/lib/nav-menu-types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8082";

export interface AppListItem {
  id: string;
  slug: string;
  name: string;
  category: string | null;
  icon_media_id: string | null;
  icon_url: string | null;
  short_description: string | null;
  pricing_note: string | null;
  sort_order: number;
  show_on_homepage: boolean;
  google_play_url: string | null;
  app_store_url: string | null;
  website_url: string | null;
}

export interface AppScreenshot {
  id: string;
  media_id: string;
  url: string;
  sort_order: number;
}

export interface FeatureSection {
  title: string;
  description: string;
  image_media_id: string;
  image_url: string;
  layout: "image_left" | "image_right";
}

export interface UseCaseTab {
  label: string;
  icon_media_id: string;
  icon_url: string;
  title: string;
  description: string;
  screenshot_media_id: string;
  screenshot_url: string;
}

export interface AppDetail extends AppListItem {
  description: string | null;
  features: string[];
  privacy_policy_content: string | null;
  instructions_content: string | null;
  google_play_url: string | null;
  app_store_url: string | null;
  website_url: string | null;
  meta_title: string | null;
  meta_description: string | null;
  og_image_url: string | null;
  screenshots: AppScreenshot[];
  rating: number | null;
  rating_count: number | null;
  hero_image_media_id: string | null;
  hero_image_url: string | null;
  feature_sections: FeatureSection[];
  use_case_tabs: UseCaseTab[];
}

export async function getPublicApps(): Promise<AppListItem[]> {
  const res = await fetch(API_BASE + "/api/apps/public", { next: { revalidate: 60 } });
  if (!res.ok) return [];
  return res.json();
}

export async function getPublicApp(slug: string): Promise<AppDetail | null> {
  const res = await fetch(API_BASE + "/api/apps/public/" + slug, { next: { revalidate: 60 } });
  if (!res.ok) return null;
  return res.json();
}

export interface PublicPageListItem {
  slug: string;
  title: string;
}

export interface PublicImageRef {
  url: string;
  alt?: string;
  media_id?: string;
}

export interface BlockIcon {
  icon?: string;
  icon_media_id?: string;
  icon_url?: string;
}

export type PublicPageBlock =
  | { type: "heading"; text: string; level?: 2 | 3; hidden?: boolean } // legacy, superseded by richtext
  | { type: "text"; text: string; hidden?: boolean } // legacy, rendered as a plain paragraph
  | { type: "paragraph"; html: string; hidden?: boolean } // legacy, superseded by richtext
  | { type: "richtext"; html: string; hidden?: boolean }
  | ({ type: "image" } & PublicImageRef & { caption?: string; hidden?: boolean })
  | { type: "gallery"; images: PublicImageRef[]; hidden?: boolean }
  | { type: "button"; label: string; url: string; style?: "primary" | "secondary"; hidden?: boolean }
  | { type: "columns"; columns: PublicPageBlock[][]; spans?: number[]; hidden?: boolean }
  | { type: "stats_bar"; stats: { value: string; label: string }[]; hidden?: boolean }
  | {
      type: "feature_grid";
      columns: 2 | 3;
      items: ({ title: string; description: string } & BlockIcon)[];
      hidden?: boolean;
    }
  | { type: "how_it_works"; steps: ({ label: string } & BlockIcon)[]; hidden?: boolean }
  | { type: "testimonials_carousel"; app_id?: string; hidden?: boolean }
  | { type: "apps_showcase"; hidden?: boolean }
  | { type: "cta_banner"; title: string; button_label: string; button_url: string; hidden?: boolean }
  | {
      type: "app_mockup_panel";
      compact?: boolean;
      panels: { title: string; description: string; mockup: "list" | "chart" | "toggles" | "dashboard"; dark?: boolean }[];
      hidden?: boolean;
    }
  | { type: "section_label"; text: string; hidden?: boolean }
  | {
      type: "annotated_screenshot";
      image_media_id?: string;
      image_url?: string;
      annotations: { text: string; side: "left" | "right"; y_percent: number }[];
      hidden?: boolean;
    }
  | {
      type: "category_preview_row";
      categories: {
        title: string;
        rows: { label: string; kind: "slider" | "toggle"; value?: number; on?: boolean }[];
      }[];
      hidden?: boolean;
    }
  | { type: "progress_dots"; hidden?: boolean };

export interface PublicPage {
  id: string;
  slug: string;
  title: string;
  template: string;
  content: PublicPageBlock[];
  meta_title: string | null;
  meta_description: string | null;
  og_image_url: string | null;
  canonical_url: string | null;
  noindex: boolean;
  status?: string;
}

export async function getPublicPages(): Promise<PublicPageListItem[]> {
  const res = await fetch(API_BASE + "/api/pages/public", { next: { revalidate: 60 } });
  if (!res.ok) return [];
  return res.json();
}

export async function getPublicPage(slug: string): Promise<PublicPage | null> {
  const res = await fetch(API_BASE + "/api/pages/public/" + slug, { next: { revalidate: 60 } });
  if (!res.ok) return null;
  return res.json();
}

export async function getPreviewPage(id: string): Promise<PublicPage | null> {
  const res = await fetch(API_BASE + "/api/pages/preview/" + id, { cache: "no-store" });
  if (!res.ok) return null;
  return res.json();
}

export interface PublicSiteSettings {
  site_name?: string;
  tagline?: string;
  logo_media_id?: string;
  logo_url?: string;
  social_twitter?: string;
  social_github?: string;
  social_linkedin?: string;
  footer_copyright?: string;
  site_mode?: "landing" | "blog" | "full";
  homepage_layout?: "landing" | "blog" | "minimal" | "apps_grid" | "text_focused" | "mixed";
  homepage_apps_position?: "before_content" | "after_content";
  homepage_content_slug?: string;
  homepage_stats?: HomepageStat[];
  homepage_sections?: HomepageSections;
  homepage_blocks?: PublicPageBlock[];
  footer_app_store_url?: string;
  footer_google_play_url?: string;
  blog_columns?: 1 | 2 | 3;
}

export async function getPublicSettings(): Promise<PublicSiteSettings> {
  const res = await fetch(API_BASE + "/api/settings/public", { next: { revalidate: 60 } });
  if (!res.ok) return {};
  return res.json();
}

export interface NavItem {
  id: string;
  label: string;
  url: string;
  location: "header" | "footer";
  parent_id: string | null;
  sort_order: number;
  menu_type: NavMenuType;
  menu_content: NavMenuContent | null;
}

export interface HeaderConfig {
  menu_alignment?: "left" | "center" | "right";
  logo_position?: "left" | "center";
  sticky?: boolean;
  show_cta_button?: boolean;
}

export interface FooterConfig {
  menu_alignment?: "left" | "center" | "right";
}

export interface ThemeConfig {
  accent?: string;
  text?: string;
  text_muted?: string;
  card_bg?: string;
  page_bg?: string;
  section_alt_bg?: string;
  footer_bg?: string;
}

export interface SiteTemplate {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  preview_image_media_id: string | null;
  preview_image_url: string | null;
  default_sections: PublicPageBlock[];
  header_config: HeaderConfig;
  footer_config: FooterConfig;
  theme_config: ThemeConfig;
  is_active: boolean;
}

export async function getActiveTemplate(): Promise<SiteTemplate | null> {
  const res = await fetch(API_BASE + "/api/templates/active", { next: { revalidate: 60 } });
  if (!res.ok) return null;
  return res.json();
}

export interface Testimonial {
  id: string;
  author_name: string;
  author_title: string | null;
  quote: string;
  rating: number | null;
  app_id: string | null;
  app_slug: string | null;
  sort_order: number;
  is_published: boolean;
}

export async function getPublicTestimonials(): Promise<Testimonial[]> {
  const res = await fetch(API_BASE + "/api/testimonials/public", { next: { revalidate: 60 } });
  if (!res.ok) return [];
  return res.json();
}

export interface HomepageStat {
  value: string;
  label: string;
}

export interface HomepageSections {
  hero: boolean;
  stats: boolean;
  apps: boolean;
  testimonials: boolean;
  blog: boolean;
}

export const DEFAULT_HOMEPAGE_SECTIONS: HomepageSections = {
  hero: true,
  stats: true,
  apps: true,
  testimonials: true,
  blog: true,
};

export async function getPublicNavItems(location: "header" | "footer"): Promise<NavItem[]> {
  const res = await fetch(API_BASE + `/api/nav-items/public?location=${location}`, {
    next: { revalidate: 60 },
  });
  if (!res.ok) return [];
  return res.json();
}

export interface PublicBlogPostListItem {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  cover_image_url: string | null;
  tags: string[];
  published_at: string | null;
  author_email: string | null;
}

export interface PublicBlogPost extends PublicBlogPostListItem {
  content: PublicPageBlock[];
  meta_title: string | null;
  meta_description: string | null;
  og_image_url: string | null;
}

export async function getPublicBlogPosts(opts?: { tag?: string; page?: number }): Promise<PublicBlogPostListItem[]> {
  const params = new URLSearchParams();
  if (opts?.tag) params.set("tag", opts.tag);
  if (opts?.page) params.set("page", String(opts.page));
  const res = await fetch(API_BASE + "/api/blog/public?" + params.toString(), { next: { revalidate: 60 } });
  if (!res.ok) return [];
  return res.json();
}

export async function getPublicBlogPost(slug: string): Promise<PublicBlogPost | null> {
  const res = await fetch(API_BASE + "/api/blog/public/" + slug, { next: { revalidate: 60 } });
  if (!res.ok) return null;
  return res.json();
}
