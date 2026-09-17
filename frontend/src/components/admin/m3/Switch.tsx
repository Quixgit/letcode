interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
}

export function Switch({ checked, onChange, disabled, label }: SwitchProps) {
  const track = (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`md-motion relative inline-flex h-8 w-[52px] shrink-0 items-center rounded-full border disabled:cursor-not-allowed disabled:opacity-50 ${
        checked ? "border-md-accent bg-md-accent" : "border-md-outline bg-md-surface-container-highest"
      }`}
    >
      <span
        className={`md-motion flex items-center justify-center rounded-full ${
          checked
            ? "h-6 w-6 translate-x-[24px] bg-md-on-accent"
            : "h-4 w-4 translate-x-1.5 bg-md-outline"
        }`}
      >
        {checked && <i className="ti ti-check text-xs text-md-accent" />}
      </span>
    </button>
  );

  if (!label) return track;

  return (
    <label className="flex cursor-pointer items-center justify-between gap-3">
      <span className="md-body-medium text-md-on-surface">{label}</span>
      {track}
    </label>
  );
}
