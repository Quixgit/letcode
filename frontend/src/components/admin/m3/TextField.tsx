import { useId, type InputHTMLAttributes, type TextareaHTMLAttributes } from "react";

interface BaseProps {
  label: string;
  error?: string;
  containerClassName?: string;
}

const FIELD_BASE =
  "block w-full rounded-md border bg-transparent px-3 py-2 text-md-on-surface outline-none md-body-large";

function fieldClasses(hasError?: string) {
  return `${FIELD_BASE} ${hasError ? "border-md-error focus:border-md-error" : "border-md-outline-variant focus:border-md-outline"}`;
}

type TextFieldProps = BaseProps & InputHTMLAttributes<HTMLInputElement>;

export function TextField({ label, error, containerClassName = "", id, className = "", ...props }: TextFieldProps) {
  const generatedId = useId();
  const fieldId = id || generatedId;

  return (
    <div className={containerClassName}>
      <label htmlFor={fieldId} className="md-body-small mb-1.5 block text-md-on-surface-variant">
        {label}
      </label>
      <input id={fieldId} className={`${fieldClasses(error)} ${className}`} {...props} />
      {error && <p className="md-body-small mt-1 text-md-error">{error}</p>}
    </div>
  );
}

type TextAreaFieldProps = BaseProps & TextareaHTMLAttributes<HTMLTextAreaElement>;

export function TextAreaField({
  label,
  error,
  containerClassName = "",
  id,
  className = "",
  ...props
}: TextAreaFieldProps) {
  const generatedId = useId();
  const fieldId = id || generatedId;

  return (
    <div className={containerClassName}>
      <label htmlFor={fieldId} className="md-body-small mb-1.5 block text-md-on-surface-variant">
        {label}
      </label>
      <textarea id={fieldId} className={`${fieldClasses(error)} ${className}`} {...props} />
      {error && <p className="md-body-small mt-1 text-md-error">{error}</p>}
    </div>
  );
}
