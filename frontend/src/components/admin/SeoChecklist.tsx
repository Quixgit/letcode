interface SeoCheckInput {
  title: string;
  metaTitle: string;
  metaDescription: string;
  slug: string;
  hasOgImage: boolean;
  noindex?: boolean;
}

interface CheckResult {
  label: string;
  ok: boolean;
  hint?: string;
}

function computeChecks(input: SeoCheckInput): CheckResult[] {
  const title = input.metaTitle || input.title;
  const titleLen = title.length;
  const descLen = input.metaDescription.length;

  const checks: CheckResult[] = [
    {
      label: "Meta title в пределах 30–60 символов",
      ok: titleLen >= 30 && titleLen <= 60,
      hint: titleLen === 0 ? "Не задан" : titleLen < 30 ? `Слишком короткий (${titleLen})` : `Слишком длинный (${titleLen}), обрежется в выдаче`,
    },
    {
      label: "Meta description в пределах 120–160 символов",
      ok: descLen >= 120 && descLen <= 160,
      hint: descLen === 0 ? "Не задано" : descLen < 120 ? `Коротковато (${descLen})` : `Слишком длинное (${descLen}), обрежется в выдаче`,
    },
    { label: "Есть OG-изображение для соцсетей", ok: input.hasOgImage },
    {
      label: "Slug короткий и читаемый",
      ok: input.slug.length > 0 && input.slug.length <= 60,
      hint: input.slug.length > 60 ? "Длиннее 60 символов" : undefined,
    },
  ];

  if (input.noindex) {
    checks.push({ label: "noindex включён — страница не будет индексироваться", ok: false });
  }

  return checks;
}

export function SeoChecklist(input: SeoCheckInput) {
  const checks = computeChecks(input);
  const passed = checks.filter((c) => c.ok).length;

  return (
    <div className="rounded-lg border border-md-outline-variant p-3">
      <p className="m-0 mb-2 text-[13px] font-medium text-md-on-surface">
        SEO-чеклист <span className="text-md-on-surface-variant">({passed}/{checks.length})</span>
      </p>
      <ul className="m-0 flex flex-col gap-1.5 p-0" style={{ listStyle: "none" }}>
        {checks.map((c, i) => (
          <li key={i} className="flex items-start gap-2 text-[12.5px]">
            <i
              className={`ti ${c.ok ? "ti-circle-check text-md-primary" : "ti-alert-circle text-md-error"} mt-0.5 shrink-0 text-sm`}
            />
            <span className={c.ok ? "text-md-on-surface-variant" : "text-md-on-surface"}>
              {c.label}
              {!c.ok && c.hint ? <span className="text-md-on-surface-variant"> — {c.hint}</span> : null}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
