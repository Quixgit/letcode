"use client";

import { useRef } from "react";
import type { PublicPageBlock } from "@/lib/api";

type ParagraphBlock = Extract<PublicPageBlock, { type: "paragraph" }>;

export function ParagraphBlockEditor({
  block,
  onChange,
}: {
  block: ParagraphBlock;
  onChange: (block: ParagraphBlock) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  function exec(command: string, value?: string) {
    ref.current?.focus();
    document.execCommand(command, false, value);
    if (ref.current) onChange({ ...block, html: ref.current.innerHTML });
  }

  function handleLink() {
    const url = window.prompt("Ссылка (URL):", "https://");
    if (url) exec("createLink", url);
  }

  return (
    <div>
      <div className="mb-1.5 flex items-center gap-1">
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => exec("bold")}
          className="rounded-md px-2 py-1 text-[12px] font-bold text-md-on-surface hover:bg-md-surface-container-low"
        >
          B
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => exec("italic")}
          className="rounded-md px-2 py-1 text-[12px] italic text-md-on-surface hover:bg-md-surface-container-low"
        >
          I
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={handleLink}
          className="rounded-md px-2 py-1 text-[12px] text-md-on-surface hover:bg-md-surface-container-low"
        >
          Ссылка
        </button>
      </div>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onBlur={() => {
          if (ref.current) onChange({ ...block, html: ref.current.innerHTML });
        }}
        dangerouslySetInnerHTML={{ __html: block.html }}
        className="min-h-[60px] rounded-md border border-md-outline-variant px-2.5 py-2 text-[13px] text-md-on-surface outline-none focus:border-md-primary"
      />
    </div>
  );
}
