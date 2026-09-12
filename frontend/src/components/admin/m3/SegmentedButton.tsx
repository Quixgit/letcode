interface Segment<T extends string> {
  value: T;
  label: string;
  icon?: string;
}

interface SegmentedButtonProps<T extends string> {
  segments: Segment<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

export function SegmentedButton<T extends string>({
  segments,
  value,
  onChange,
  className = "",
}: SegmentedButtonProps<T>) {
  return (
    <div className={`inline-flex gap-0.5 rounded-lg bg-md-surface-container-high p-0.5 ${className}`}>
      {segments.map((segment) => {
        const active = segment.value === value;
        return (
          <button
            key={segment.value}
            type="button"
            onClick={() => onChange(segment.value)}
            aria-pressed={active}
            className={`md-motion md-label-large flex items-center gap-1.5 rounded-md px-3 py-1.5 ${
              active
                ? "bg-md-surface-container-lowest text-md-on-surface"
                : "text-md-on-surface-variant hover:text-md-on-surface"
            }`}
          >
            {segment.icon && <i className={`ti ${segment.icon} text-base`} />}
            {segment.label}
          </button>
        );
      })}
    </div>
  );
}
