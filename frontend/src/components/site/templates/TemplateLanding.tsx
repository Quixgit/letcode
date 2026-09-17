import { Breadcrumbs, type BreadcrumbItem } from "@/components/site/Breadcrumbs";

export function TemplateLanding({
  title,
  breadcrumbs,
  children,
}: {
  title: string;
  breadcrumbs?: BreadcrumbItem[];
  children: React.ReactNode;
}) {
  return (
    <div>
      {breadcrumbs && <Breadcrumbs items={breadcrumbs} maxWidth="none" />}
      <div style={{ textAlign: "center", padding: breadcrumbs ? "1.5rem 2rem 2rem" : "4rem 2rem 2rem" }}>
        <h1
          style={{
            fontSize: 40,
            fontWeight: 500,
            color: "#17181C",
            margin: "0 auto",
            maxWidth: 720,
            lineHeight: 1.25,
          }}
        >
          {title}
        </h1>
      </div>
      {/* `children` is BlockRenderer output — every block type contains itself, so no extra
          wrapper here (would double the side padding on top of each block's own). */}
      {children}
    </div>
  );
}
