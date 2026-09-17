import { Breadcrumbs, type BreadcrumbItem } from "@/components/site/Breadcrumbs";

export function TemplateFullWidth({
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
      <div style={{ padding: "1.25rem 2rem 3rem" }}>
        <h1 style={{ fontSize: 28, fontWeight: 500, color: "#17181C", margin: "0 0 1.5rem" }}>{title}</h1>
        {children}
      </div>
    </div>
  );
}
