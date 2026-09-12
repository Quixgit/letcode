import Link from "next/link";

interface Crumb {
  label: string;
  href?: string;
}

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav className="md-body-small mb-2 flex items-center gap-1.5 text-md-on-surface-variant">
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1.5">
          {i > 0 && <i className="ti ti-chevron-right text-xs" />}
          {item.href ? (
            <Link href={item.href} className="hover:text-md-on-surface hover:underline">
              {item.label}
            </Link>
          ) : (
            <span className="text-md-on-surface">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
