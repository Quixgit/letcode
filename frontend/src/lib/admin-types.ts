import type { PublicPageBlock } from "@/lib/api";
import type { NavMenuType, NavMenuContent } from "@/lib/nav-menu-types";

export type ContentStatus = "draft" | "published" | "archived";

export interface PageListItem {
  id: string;
  slug: string;
  title: string;
  template: string;
  status: ContentStatus;
  meta_title: string | null;
  published_at: string | null;
  scheduled_publish_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PageDetail extends PageListItem {
  content: unknown[];
  meta_description: string | null;
  og_image_url: string | null;
  canonical_url: string | null;
  noindex: boolean;
  structured_data: unknown;
}

export interface PageRevision {
  id: string;
  content: unknown;
  created_at: string;
  created_by_email: string | null;
}

export interface AppListItem {
  id: string;
  slug: string;
  name: string;
  category: string | null;
  status: ContentStatus;
  sort_order: number;
  scheduled_publish_at: string | null;
  created_at: string;
  updated_at: string;
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

export interface AppDetail {
  id: string;
  slug: string;
  name: string;
  category: string | null;
  icon_media_id: string | null;
  short_description: string | null;
  description: string | null;
  features: string[];
  privacy_policy_content: string | null;
  instructions_content: string | null;
  google_play_url: string | null;
  app_store_url: string | null;
  website_url: string | null;
  pricing_note: string | null;
  status: ContentStatus;
  sort_order: number;
  meta_title: string | null;
  meta_description: string | null;
  og_image_url: string | null;
  scheduled_publish_at: string | null;
  screenshots: AppScreenshot[];
  show_on_homepage: boolean;
  rating: number | null;
  rating_count: number | null;
  hero_image_media_id: string | null;
  hero_image_url: string | null;
  feature_sections: FeatureSection[];
  use_case_tabs: UseCaseTab[];
}

export interface MediaItem {
  id: string;
  filename: string;
  url: string;
  mime_type: string;
  size_bytes: number;
  alt_text: string | null;
  created_at: string;
}

export interface RedirectItem {
  id: string;
  from_path: string;
  to_path: string;
  status_code: number;
  created_at: string;
}

export interface AuditLogItem {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  ip_address: string | null;
  created_at: string;
  user_email: string | null;
}

export interface SiteSettings {
  site_name?: string;
  tagline?: string;
  logo_media_id?: string;
  logo_url?: string;
  default_og_image_url?: string;
  favicon_media_id?: string;
  favicon_url?: string;
  analytics_provider?: "none" | "google" | "plausible";
  analytics_id?: string;
  social_twitter?: string;
  social_github?: string;
  social_linkedin?: string;
  footer_copyright?: string;
  llms_txt_content?: string;
  site_mode?: "landing" | "blog" | "full";
  homepage_layout?: "landing" | "blog" | "minimal" | "apps_grid" | "text_focused" | "mixed";
  homepage_apps_position?: "before_content" | "after_content";
  homepage_content_slug?: string;
  homepage_stats?: { value: string; label: string }[];
  homepage_sections?: { hero: boolean; stats: boolean; apps: boolean; testimonials: boolean; blog: boolean };
  homepage_blocks?: PublicPageBlock[];
  footer_app_store_url?: string;
  footer_google_play_url?: string;
  blog_columns?: 1 | 2 | 3;
}

export interface SiteTemplateItem {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  preview_image_media_id: string | null;
  preview_image_url: string | null;
  default_sections: PublicPageBlock[];
  header_config: { menu_alignment?: "left" | "center" | "right"; logo_position?: "left" | "center"; sticky?: boolean; show_cta_button?: boolean };
  footer_config: { menu_alignment?: "left" | "center" | "right" };
  theme_config: {
    accent?: string;
    text?: string;
    text_muted?: string;
    card_bg?: string;
    page_bg?: string;
    section_alt_bg?: string;
    footer_bg?: string;
  };
  is_active: boolean;
}

export interface TestimonialItem {
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

export interface BlogPostListItem {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  status: ContentStatus;
  tags: string[];
  published_at: string | null;
  scheduled_publish_at: string | null;
  created_at: string;
  updated_at: string;
  author_email: string | null;
}

export interface BlogPostDetail extends BlogPostListItem {
  content: unknown;
  cover_image_media_id: string | null;
  cover_image_url: string | null;
  meta_title: string | null;
  meta_description: string | null;
  og_image_url: string | null;
}

export interface AnalyticsSummary {
  total_views: number;
  unique_paths: number;
  top_pages: { path: string; views: number }[];
  top_referrers: { referrer: string; views: number }[];
  views_by_day: { date: string; views: number }[];
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

export interface UserItem {
  id: string;
  email: string;
  name: string | null;
  role_name: string;
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
}
