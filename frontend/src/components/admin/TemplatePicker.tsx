interface TemplateOption {
  value: string;
  label: string;
  diagram: React.ReactNode;
}

const box = "block rounded-sm bg-md-on-surface-variant";

const options: TemplateOption[] = [
  {
    value: "default",
    label: "Default",
    diagram: (
      <div className="flex h-16 w-full items-center justify-center bg-md-surface-container-low">
        <div className={box} style={{ width: 28, height: 40 }} />
      </div>
    ),
  },
  {
    value: "landing",
    label: "Landing",
    diagram: (
      <div className="flex h-16 w-full flex-col items-center justify-center gap-1.5 bg-md-surface-container-low px-3">
        <div className={box} style={{ width: 44, height: 8 }} />
        <div className={box} style={{ width: 60, height: 20 }} />
      </div>
    ),
  },
  {
    value: "full-width",
    label: "Full width",
    diagram: (
      <div className="flex h-16 w-full items-center justify-center bg-md-surface-container-low px-1.5">
        <div className={box} style={{ width: "100%", height: 40 }} />
      </div>
    ),
  },
];

export function TemplatePicker({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`md-motion relative overflow-hidden rounded-lg border text-left ${
              active
                ? "border-2 border-md-primary"
                : "border border-md-outline-variant hover:border-md-outline hover:shadow-[var(--md-elevation-1)]"
            }`}
          >
            {active && (
              <div className="absolute right-1.5 top-1.5 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-md-primary">
                <i className="ti ti-check text-xs text-md-on-primary" />
              </div>
            )}
            {opt.diagram}
            <p className="md-label-medium m-0 px-2 py-1.5 text-md-on-surface">{opt.label}</p>
          </button>
        );
      })}
    </div>
  );
}
