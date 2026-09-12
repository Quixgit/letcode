"use client";

interface FeaturesEditorProps {
  features: string[];
  onChange: (features: string[]) => void;
}

export function FeaturesEditor({ features, onChange }: FeaturesEditorProps) {
  return (
    <div className="flex flex-col gap-2">
      {features.map((feature, i) => (
        <div key={i} className="flex items-center gap-2">
          <input
            value={feature}
            onChange={(e) => {
              const next = [...features];
              next[i] = e.target.value;
              onChange(next);
            }}
            className="block w-full rounded-lg border border-md-outline-variant px-2.5 py-1.5 text-sm text-md-on-surface outline-none focus:border-md-primary"
          />
          <button
            type="button"
            onClick={() => onChange(features.filter((_, idx) => idx !== i))}
            className="text-md-on-surface-variant hover:text-md-error"
          >
            <i className="ti ti-x" />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...features, ""])}
        className="w-fit rounded-lg border border-md-outline-variant px-3 py-1.5 text-[13px] text-md-on-surface hover:border-md-primary"
      >
        + Добавить пункт
      </button>
    </div>
  );
}
