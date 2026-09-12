import type { Metadata } from "next";
import { Ubuntu } from "next/font/google";
import "./globals.css";

const ubuntu = Ubuntu({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "700"],
  variable: "--font-ubuntu",
  display: "swap",
});

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "lecode",
  url: "https://lecode.tech",
  description: "A collection of focused apps for DevOps engineers, built by one person.",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://lecode.tech"),
  title: "lecode — small tools for infrastructure work",
  description: "A collection of focused apps for DevOps engineers, built by one person.",
  openGraph: {
    title: "lecode — small tools for infrastructure work",
    description: "A collection of focused apps for DevOps engineers, built by one person.",
    siteName: "lecode",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "lecode — small tools for infrastructure work",
    description: "A collection of focused apps for DevOps engineers, built by one person.",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
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
      </head>
      <body className={`${ubuntu.variable} min-h-full flex flex-col`}>{children}</body>
    </html>
  );
}
