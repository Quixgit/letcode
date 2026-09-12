export interface FormTab {
  id: string;
  label: string;
  icon?: string;
}

interface FormTabsProps {
  tabs: FormTab[];
  active: string;
  onChange: (id: string) => void;
}

/** Visual-only section tabs for long edit forms (OpenCart-style) — all fields stay
 * mounted, this just toggles which section is visible so the form still saves as one whole. */
export function FormTabs({ tabs, active, onChange }: FormTabsProps) {
  return (
    <div className="flex flex-wrap gap-1 border-b border-md-outline-variant">
      {tabs.map((tab) => {
        const isActive = tab.id === active;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            aria-pressed={isActive}
            className={`md-motion -mb-px flex items-center gap-1.5 border-b-2 px-3 py-2 text-[13px] font-medium ${
              isActive
                ? "border-md-primary text-md-on-surface"
                : "border-transparent text-md-on-surface-variant hover:text-md-on-surface"
            }`}
          >
            {tab.icon && <i className={`ti ${tab.icon} text-base`} />}
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
