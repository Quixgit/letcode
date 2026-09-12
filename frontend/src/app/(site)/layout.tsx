import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { PageViewTracker } from "@/components/site/PageViewTracker";
import { getActiveTemplate } from "@/lib/api";
import { siteThemeVars } from "@/lib/site-theme";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const template = await getActiveTemplate();

  return (
    <div
      className="site-root"
      style={{
        display: "flex",
        minHeight: "100vh",
        flexDirection: "column",
        background: "var(--site-page-bg, #FFFFFF)",
        ...siteThemeVars(template?.theme_config),
      }}
    >
      <PageViewTracker />
      <Header />
      <div style={{ flex: 1 }}>{children}</div>
      <Footer />
    </div>
  );
}
