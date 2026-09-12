export function CharCounter({ length, max }: { length: number; max: number }) {
  const over = length > max;
  return (
    <span className={over ? "text-md-error" : "text-md-on-surface-variant"} style={{ marginLeft: 6 }}>
      {length}/{max}
    </span>
  );
}
