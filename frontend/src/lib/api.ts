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
  canonical_url?: string | null;
  noindex?: boolean;
  structured_data?: Record<string, unknown> | null;
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
      heading?: string;
      description?: string;
      columns: 2 | 3;
      items: ({ title: string; description: string } & BlockIcon)[];
      hidden?: boolean;
    }
  | {
      type: "how_it_works";
      heading?: string;
      description?: string;
      /** When any step has a `description`, the component renders as a 5-card grid (icon,
       * title, full paragraph) instead of the compact connected-dot row. */
      steps: ({ label: string; description?: string } & BlockIcon)[];
      hidden?: boolean;
    }
  | { type: "testimonials_carousel"; app_id?: string; hidden?: boolean }
  | { type: "apps_showcase"; hidden?: boolean }
  | { type: "blog_showcase"; count?: number; hidden?: boolean }
  | { type: "cta_banner"; title: string; button_label: string; button_url: string; hidden?: boolean }
  | {
      type: "app_mockup_panel";
      compact?: boolean;
      panels: {
        title: string;
        description: string;
        mockup: "list" | "chart" | "toggles" | "dashboard" | "status_list";
        /** "status_list" only. */
        status_label?: string;
        status_color?: "success" | "neutral" | "warning";
        /** "status_list" only — each row gets its own icon and a short status pill. */
        items?: { icon?: string; title: string; subtitle?: string; status_text?: string }[];
        /** "status_list" only — a closing line under a divider, e.g. "Build, release and
         * operations under one team". */
        footer_text?: string;
        dark?: boolean;
      }[];
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
  | { type: "progress_dots"; hidden?: boolean }
  | {
      type: "hero_slider";
      interval_ms?: number;
      full_width?: boolean;
      height?: "small" | "medium" | "large";
      slides: {
        image_media_id?: string;
        image_url?: string;
        title: string;
        subtitle?: string;
        button_label?: string;
        button_url?: string;
      }[];
      hidden?: boolean;
    }
  | {
      type: "hero_split_diagram";
      eyebrow?: string;
      heading_line1?: string;
      heading_line2_accent?: string;
      subtext?: string;
      primary_cta?: { label: string; url: string };
      secondary_cta?: { label: string; url: string };
      platform_badges?: { icon_key?: string; icon_media_id?: string; icon_url?: string; label: string }[];
      stats?: { value: string; label: string }[];
      diagram?: {
        window_title?: string;
        tag_label?: string;
        groups: { label: string; items: { title: string; subtitle?: string }[] }[];
        caption?: string;
      };
      callouts?: { icon?: string; icon_media_id?: string; icon_url?: string; title: string; description: string }[];
      hidden?: boolean;
    }
  | {
      type: "why_choose_us";
      heading?: string;
      description?: string;
      items: {
        icon_media_id?: string;
        icon_url?: string;
        stat: string;
        label: string;
      }[];
      hidden?: boolean;
    }
  | {
      type: "faq_accordion";
      heading?: string;
      description?: string;
      columns?: 1 | 2;
      items: { question: string; answer: string }[];
      hidden?: boolean;
    }
  | {
      type: "platform_grid";
      /** Defaults to "dark" when unset — preserves the original "Platforms We Support" look for
       * blocks saved before this field existed. */
      theme?: "dark" | "light";
      heading?: string;
      description?: string;
      items: {
        icon_key?: string;
        icon_media_id?: string;
        icon_url?: string;
        tag_label?: string;
        title: string;
        subtitle?: string;
        featured?: boolean;
      }[];
      hidden?: boolean;
    }
  | {
      type: "core_services_grid";
      heading?: string;
      description?: string;
      items: {
        icon?: string;
        icon_media_id?: string;
        icon_url?: string;
        tag_label?: string;
        title: string;
        description?: string;
        featured?: boolean;
        /** 2-4 items, revealed on hover; ignored when `featured` is true. */
        bullets?: string[];
        /** Where the card's "Learn more" link goes, e.g. /services/cloud-migration. Card renders
         * without a link (not clickable) when unset. */
        url?: string;
      }[];
      hidden?: boolean;
    }
  | {
      type: "logo_marquee";
      /** Leave empty if you don't want to state a specific customer count. */
      heading?: string;
      items: {
        logo_media_id?: string;
        logo_url?: string;
        company_name: string;
        url?: string | null;
      }[];
      speed?: "slow" | "medium" | "fast";
      /** Defaults to true when unset. */
      pause_on_hover?: boolean;
      hidden?: boolean;
    }
  | {
      type: "contact_form";
      /** Groups submissions in the admin's Заявки inbox — keep stable once real submissions
       * exist under it, otherwise old and new leads split across two keys. */
      form_key: string;
      title?: string;
      description?: string;
      fields: FormFieldConfig[];
      submit_label?: string;
      success_message?: string;
      /** "card" (default): boxed, centered, own background — reads as a distinct module.
       * "plain": no box, sits directly in the page's content flow. */
      layout?: "card" | "plain";
      /** When set, renders a "Get in Touch" left column next to the form (2-col layout).
       * Absent (undefined) keeps today's single-column form, unchanged. */
      get_in_touch?: GetInTouchConfig;
      /** Two field `key`s (typically an email field and a tel field) where at least one must
       * be filled for the form to submit — neither is individually `required`. Client-side only. */
      either_required?: [string, string];
      hidden?: boolean;
    }
  | {
      type: "service_hero_banner";
      eyebrow?: string;
      heading_line1: string;
      /** Rendered in the site accent color, on its own line under heading_line1. */
      heading_line2_accent: string;
      subtext?: string;
      cta?: { label: string; url: string };
      tech_pills?: string[];
      hidden?: boolean;
    }
  | {
      type: "lifecycle_feature_list";
      heading?: string;
      description?: string;
      items: ({
        /** Short label rendered as a small kicker above the title, e.g. "ASSESS". */
        phase_tag?: string;
        title: string;
        description?: string;
        /** Optional "In practice: ..." link — leave both empty until there's a real case to link. */
        case_link_label?: string;
        case_link_url?: string;
      } & BlockIcon)[];
      hidden?: boolean;
    }
  | {
      type: "challenge_solution_grid";
      heading?: string;
      description?: string;
      items: {
        number?: string;
        problem_title: string;
        problem_description?: string;
        solution_text: string;
        case_link_label?: string;
        case_link_url?: string;
      }[];
      hidden?: boolean;
    }
  | {
      type: "related_services_grid";
      heading?: string;
      items: ({ title: string; description?: string; url: string } & BlockIcon)[];
      hidden?: boolean;
    };

export interface GetInTouchConfig {
  heading?: string;
  description?: string;
  channels: { icon?: string; title: string; description?: string; email?: string; phone?: string }[];
  /** Free text, e.g. "Remote — Worldwide". Omit to hide the Office row entirely. */
  office?: string;
  /** Free text. Omit to hide the Business Hours row entirely. */
  business_hours?: string;
}

export interface FormFieldConfig {
  /** Stable key the submitted value is stored under — not shown to visitors. */
  key: string;
  label: string;
  type: "text" | "email" | "tel" | "textarea" | "select";
  required?: boolean;
  placeholder?: string;
  /** "select" only. */
  options?: string[];
  /** "tel" only: renders a small fixed-list country-code dropdown next to the input, combined
   * into one stored value. */
  phone_country_code?: boolean;
}

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
  structured_data?: Record<string, unknown> | null;
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

export interface RedirectLookup {
  to_path: string;
  status_code: number;
}

// Checked by the catch-all page route whenever a path doesn't resolve to real content, so
// admin-configured redirects (Redirects section) actually take effect on the public site.
export async function lookupRedirect(path: string): Promise<RedirectLookup | null> {
  const res = await fetch(API_BASE + "/api/redirects/lookup?path=" + encodeURIComponent(path), {
    next: { revalidate: 60 },
  });
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
  homepage_layout?: "landing" | "blog" | "marketplace" | "minimal" | "apps_grid" | "text_focused" | "mixed";
  homepage_apps_position?: "before_content" | "after_content";
  homepage_content_slug?: string;
  homepage_stats?: HomepageStat[];
  homepage_sections?: HomepageSections;
  homepage_blocks?: PublicPageBlock[];
  footer_app_store_url?: string;
  footer_google_play_url?: string;
  blog_columns?: 1 | 2 | 3;
  show_decorative_backgrounds?: boolean;
  contact_phone?: string;
  contact_email?: string;
  contact_address?: string;
  footer_certifications?: { media_id?: string; image_url?: string; caption: string }[];

  analytics_provider?: "none" | "google" | "plausible";
  analytics_id?: string;

  // SEO defaults (admin "SEO" page)
  default_og_image_url?: string;
  seo_title_template?: string;
  seo_default_meta_description?: string;
  google_site_verification?: string;
  bing_site_verification?: string;
  yandex_site_verification?: string;
  seo_sitewide_noindex?: boolean;
  seo_organization_name?: string;
  seo_organization_logo_url?: string;
  seo_show_breadcrumbs?: boolean;
  seo_json_ld_enabled?: boolean;
}

export async function getPublicSettings(): Promise<PublicSiteSettings> {
  // Wrapped in try/catch (unlike this file's other getPublic* helpers) because this one is now
  // also called from the root layout, which wraps every route including statically-prerendered
  // ones (e.g. /_not-found) — those run during `next build`, when the backend isn't reachable
  // yet, so a network-level failure here must not fail the whole production build.
  try {
    const res = await fetch(API_BASE + "/api/settings/public", { next: { revalidate: 60 } });
    if (!res.ok) return {};
    return await res.json();
  } catch {
    return {};
  }
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
  logo_position?: "left" | "right";
  sticky?: boolean;
  /** Only meaningful when `sticky` is true. "fixed" (default): solid header, same look always.
   * "floating": header stays put but turns translucent + gets a soft shadow once the page has
   * scrolled past the top, and reverts to solid/shadowless right at scrollY 0. */
  sticky_style?: "fixed" | "floating";
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
  canonical_url?: string | null;
  noindex?: boolean;
  structured_data?: Record<string, unknown> | null;
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
