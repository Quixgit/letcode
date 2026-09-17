import { Breadcrumbs, type BreadcrumbItem } from "@/components/site/Breadcrumbs";
import { PageContainer } from "@/components/site/PageContainer";

export function TemplateDefault({
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
      {breadcrumbs && <Breadcrumbs items={breadcrumbs} />}
      {/* Just the title gets an explicit container — `children` is BlockRenderer output, and
          every block type (including plain richtext) already contains itself via PageContainer,
          so wrapping it again here would double the side padding. */}
      <PageContainer style={{ padding: "1.25rem 2rem 0" }}>
        <h1 style={{ fontSize: 28, fontWeight: 500, color: "#17181C", margin: "0 0 1.5rem" }}>{title}</h1>
      </PageContainer>
      {children}
    </div>
  );
}
