import { useState } from "react";

interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  suggestions?: string[];
}

export function TagInput({ value, onChange, suggestions = [] }: TagInputProps) {
  const [draft, setDraft] = useState("");

  function addTag(tag: string) {
    const clean = tag.trim().toLowerCase();
    if (!clean || value.includes(clean)) return;
    onChange([...value, clean]);
    setDraft("");
  }

  function removeTag(tag: string) {
    onChange(value.filter((t) => t !== tag));
  }

  const matches = suggestions.filter((s) => !value.includes(s) && s.includes(draft.toLowerCase())).slice(0, 6);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-md-outline-variant bg-transparent p-2">
        {value.map((tag) => (
          <span
            key={tag}
            className="md-label-medium inline-flex items-center gap-1 rounded-full bg-md-secondary-container px-2.5 py-1 text-md-on-secondary-container"
          >
            {tag}
            <button type="button" onClick={() => removeTag(tag)} aria-label={`Удалить тег ${tag}`}>
              <i className="ti ti-x text-xs" />
            </button>
          </span>
        ))}
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              addTag(draft);
            } else if (e.key === "Backspace" && draft === "" && value.length > 0) {
              removeTag(value[value.length - 1]);
            }
          }}
          placeholder={value.length === 0 ? "Добавить тег..." : ""}
          className="min-w-24 flex-1 bg-transparent px-1 py-0.5 text-sm text-md-on-surface outline-none"
        />
      </div>
      {draft && matches.length > 0 && (
        <div className="mt-1 flex flex-wrap gap-1.5">
          {matches.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => addTag(m)}
              className="md-label-small rounded-full border border-md-outline-variant px-2 py-0.5 text-md-on-surface-variant hover:border-md-primary"
            >
              + {m}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
