import type { Metadata } from "next";
import Script from "next/script";
import { Ubuntu } from "next/font/google";
import "./globals.css";
import { getPublicSettings } from "@/lib/api";

const ubuntu = Ubuntu({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "700"],
  variable: "--font-ubuntu",
  display: "swap",
});

const DEFAULT_TITLE = "lecode — small tools for infrastructure work";
const DEFAULT_DESCRIPTION = "A collection of focused apps for DevOps engineers, built by one person.";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getPublicSettings();
  const title = settings.site_name
    ? `${settings.site_name}${settings.tagline ? ` — ${settings.tagline}` : ""}`
    : DEFAULT_TITLE;
  const description = settings.seo_default_meta_description || DEFAULT_DESCRIPTION;

  return {
    metadataBase: new URL("https://lecode.tech"),
    title,
    description,
    openGraph: {
      title,
      description,
      siteName: settings.site_name || "lecode",
      type: "website",
      images: settings.default_og_image_url ? [{ url: settings.default_og_image_url }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    robots: settings.seo_sitewide_noindex ? { index: false, follow: false } : { index: true, follow: true },
    verification: {
      google: settings.google_site_verification || undefined,
      other: {
        ...(settings.bing_site_verification ? { "msvalidate.01": settings.bing_site_verification } : {}),
        ...(settings.yandex_site_verification ? { "yandex-verification": settings.yandex_site_verification } : {}),
      },
    },
  };
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const settings = await getPublicSettings();
  const orgName = settings.seo_organization_name || settings.site_name || "lecode";
  const orgLogo = settings.seo_organization_logo_url || settings.logo_url;
  const sameAs = [settings.social_twitter, settings.social_github, settings.social_linkedin].filter(
    (url): url is string => !!url
  );

  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: orgName,
    url: "https://lecode.tech",
    description: settings.seo_default_meta_description || DEFAULT_DESCRIPTION,
    ...(orgLogo ? { logo: orgLogo } : {}),
    ...(sameAs.length > 0 ? { sameAs } : {}),
  };

  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: orgName,
    url: "https://lecode.tech",
  };

  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/tabler-icons/3.46.0/tabler-icons.min.css"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
        {/* Settings → Analytics: saved here for a while but never actually rendered anywhere,
            so switching a provider on in the admin silently did nothing. */}
        {settings.analytics_provider === "google" && settings.analytics_id && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(settings.analytics_id)}`}
              strategy="afterInteractive"
            />
            <Script id="ga4-init" strategy="afterInteractive">
              {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config',${JSON.stringify(settings.analytics_id)});`}
            </Script>
          </>
        )}
        {settings.analytics_provider === "plausible" && (
          <Script
            defer
            data-domain={settings.analytics_id || "lecode.tech"}
            src="https://plausible.io/js/script.js"
            strategy="afterInteractive"
          />
        )}
      </head>
      <body className={`${ubuntu.variable} min-h-full flex flex-col`}>{children}</body>
    </html>
  );
}
