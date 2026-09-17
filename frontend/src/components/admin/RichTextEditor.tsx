"use client";

import { useRef, useState } from "react";
import { MediaPicker } from "@/components/admin/MediaPicker";

interface RichTextEditorProps {
  html: string;
  onChange: (html: string) => void;
}

function ToolbarButton({
  label,
  title,
  active,
  onClick,
}: {
  label: string;
  title: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={`rounded-md px-2 py-1 text-[12px] hover:bg-md-surface-container-low ${
        active ? "bg-md-surface-container-highest text-md-on-surface" : "text-md-on-surface-variant"
      }`}
    >
      {label}
    </button>
  );
}

export function RichTextEditor({ html, onChange }: RichTextEditorProps) {
  const ref = useRef<HTMLDivElement>(null);
  const savedRange = useRef<Range | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  function sync() {
    if (ref.current) onChange(ref.current.innerHTML);
  }

  function exec(command: string, value?: string) {
    ref.current?.focus();
    document.execCommand(command, false, value);
    sync();
  }

  function handleLink() {
    const url = window.prompt("Ссылка (URL):", "https://");
    if (url) exec("createLink", url);
  }

  function saveSelection() {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && ref.current?.contains(sel.anchorNode)) {
      savedRange.current = sel.getRangeAt(0).cloneRange();
    }
  }

  function openImagePicker() {
    saveSelection();
    setPickerOpen(true);
  }

  function insertImage(url: string, alt: string) {
    ref.current?.focus();
    const sel = window.getSelection();
    if (sel && savedRange.current) {
      sel.removeAllRanges();
      sel.addRange(savedRange.current);
    }
    document.execCommand(
      "insertHTML",
      false,
      `<img src="${url}" alt="${alt.replace(/"/g, "&quot;")}" />`
    );
    sync();
    setPickerOpen(false);
  }

  return (
    <div>
      <div className="mb-1.5 flex flex-wrap items-center gap-0.5 rounded-md border border-md-outline-variant bg-md-surface-container-low p-1">
        <ToolbarButton label="H2" title="Заголовок H2" onClick={() => exec("formatBlock", "H2")} />
        <ToolbarButton label="H3" title="Заголовок H3" onClick={() => exec("formatBlock", "H3")} />
        <ToolbarButton label="¶" title="Обычный текст" onClick={() => exec("formatBlock", "P")} />
        <span className="mx-1 h-4 w-px bg-md-outline-variant" />
        <ToolbarButton label="B" title="Жирный" onClick={() => exec("bold")} />
        <ToolbarButton label="I" title="Курсив" onClick={() => exec("italic")} />
        <span className="mx-1 h-4 w-px bg-md-outline-variant" />
        <ToolbarButton label="•" title="Список" onClick={() => exec("insertUnorderedList")} />
        <ToolbarButton label="1." title="Нумерованный список" onClick={() => exec("insertOrderedList")} />
        <span className="mx-1 h-4 w-px bg-md-outline-variant" />
        <ToolbarButton label="Ссылка" title="Вставить ссылку" onClick={handleLink} />
        <ToolbarButton label="Картинка" title="Вставить картинку" onClick={openImagePicker} />
      </div>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onBlur={sync}
        onMouseUp={saveSelection}
        onKeyUp={saveSelection}
        dangerouslySetInnerHTML={{ __html: html }}
        className="admin-richtext-editable min-h-[160px] rounded-md border border-md-outline-variant px-3 py-2.5 outline-none focus:border-md-primary"
        spellCheck={false}
        data-gramm="false"
        data-gramm_editor="false"
        data-enable-grammarly="false"
        data-lt-active="false"
        data-ms-editor="false"
      />
      <MediaPicker open={pickerOpen} onClose={() => setPickerOpen(false)} onSelect={(item) => insertImage(item.url, item.alt_text || "")} />
    </div>
  );
}
