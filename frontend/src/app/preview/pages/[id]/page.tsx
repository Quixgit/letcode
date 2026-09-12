import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getPreviewPage } from "@/lib/api";
import { BlockRenderer } from "@/components/site/BlockRenderer";
import { TemplateDefault } from "@/components/site/templates/TemplateDefault";
import { TemplateLanding } from "@/components/site/templates/TemplateLanding";
import { TemplateFullWidth } from "@/components/site/templates/TemplateFullWidth";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export const metadata: Metadata = { robots: { index: false, follow: false } };

function PreviewBanner({ status }: { status: string }) {
  return (
    <div
      style={{
        background: "#17181C",
        color: "#FFFFFF",
        textAlign: "center",
        padding: "8px 16px",
        fontSize: 13,
      }}
    >
      Предпросмотр черновика · статус: {status} · это не публичный URL страницы
    </div>
  );
}

export default async function PagePreview({ params }: Props) {
  const { id } = await params;
  const page = await getPreviewPage(id);
  if (!page) notFound();

  const body = <BlockRenderer blocks={page.content} />;
  const banner = <PreviewBanner status={page.status || "unknown"} />;

  if (page.template === "landing") {
    return (
      <>
        {banner}
        <TemplateLanding title={page.title}>{body}</TemplateLanding>
      </>
    );
  }

  if (page.template === "full-width") {
    return (
      <>
        {banner}
        <TemplateFullWidth title={page.title}>{body}</TemplateFullWidth>
      </>
    );
  }

  return (
    <>
      {banner}
      <TemplateDefault title={page.title}>{body}</TemplateDefault>
    </>
  );
}
