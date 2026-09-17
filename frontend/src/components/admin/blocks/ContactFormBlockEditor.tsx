"use client";

import type { FormFieldConfig, GetInTouchConfig, PublicPageBlock } from "@/lib/api";

type ContactFormBlock = Extract<PublicPageBlock, { type: "contact_form" }>;
type Channel = GetInTouchConfig["channels"][number];

const inputClass =
  "block w-full rounded-md border border-md-outline-variant bg-transparent px-2.5 py-1.5 text-[13px] text-md-on-surface outline-none focus:border-md-outline";
// Same field minus `w-full` — see StatsBarBlockEditor's comment: a second width utility on top
// of `w-full` loses to it (stylesheet order, not className order), so a fixed-width sibling
// needs its own class without `w-full` baked in.
const fieldClass =
  "rounded-md border border-md-outline-variant bg-transparent px-2.5 py-1.5 text-[13px] text-md-on-surface outline-none focus:border-md-outline";

const FIELD_TYPES: { value: FormFieldConfig["type"]; label: string }[] = [
  { value: "text", label: "Текст" },
  { value: "email", label: "Email" },
  { value: "tel", label: "Телефон" },
  { value: "textarea", label: "Многострочный текст" },
  { value: "select", label: "Выпадающий список" },
];

function slugify(label: string, fallback: string): string {
  const key = label
    .toLowerCase()
    .trim()
    .replace(/[^a-zA-Zа-яА-ЯёЁ0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return key || fallback;
}

export function ContactFormBlockEditor({ block, onChange }: { block: ContactFormBlock; onChange: (block: ContactFormBlock) => void }) {
  function updateField(i: number, patch: Partial<FormFieldConfig>) {
    const next = [...block.fields];
    const merged = { ...next[i], ...patch };
    // Keep `key` in sync with the label unless it's been knocked out of sync already (i.e. the
    // admin never needs to think about it, but real submissions stay grouped correctly even if
    // they rename the label after the field already has a distinct, deliberately-set key).
    if (patch.label !== undefined && next[i].key === slugify(next[i].label, `field_${i}`)) {
      merged.key = slugify(patch.label, `field_${i}`);
    }
    next[i] = merged;
    onChange({ ...block, fields: next });
  }

  return (
    <div className="flex flex-col gap-3">
      <input
        value={block.title || ""}
        onChange={(e) => onChange({ ...block, title: e.target.value })}
        placeholder="Заголовок (например, «Свяжитесь с нами»)"
        className={inputClass}
      />
      <textarea
        value={block.description || ""}
        onChange={(e) => onChange({ ...block, description: e.target.value })}
        placeholder="Короткое пояснение под заголовком (опционально)"
        rows={2}
        className={inputClass}
      />

      <div>
        <input
          value={block.form_key}
          onChange={(e) => onChange({ ...block, form_key: e.target.value })}
          placeholder="contact-main"
          className={inputClass}
        />
        <p className="mt-1 text-[11px] text-md-on-surface-variant">
          Ключ формы — заявки с этим ключом группируются вместе в разделе «Заявки». Если на сайте несколько форм
          (например, «Заказать звонок» и «Общий вопрос»), дайте им разные ключи.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-[13px] text-md-on-surface-variant">Оформление</span>
        <select
          value={block.layout || "card"}
          onChange={(e) => onChange({ ...block, layout: e.target.value as "card" | "plain" })}
          className={`${fieldClass} w-40`}
        >
          <option value="card">Карточка</option>
          <option value="plain">Без рамки</option>
        </select>
      </div>

      <div className="mt-1 flex flex-col gap-2">
        <p className="text-[13px] font-medium text-md-on-surface-variant">Поля формы</p>
        {block.fields.map((field, i) => (
          <div key={i} className="flex flex-col gap-1.5 rounded-md border border-md-outline-variant p-2">
            <div className="flex items-center gap-2">
              <input
                value={field.label}
                onChange={(e) => updateField(i, { label: e.target.value })}
                placeholder="Название поля (Имя, Email, Сообщение...)"
                className={`${fieldClass} min-w-[120px] flex-1`}
              />
              <select
                value={field.type}
                onChange={(e) => updateField(i, { type: e.target.value as FormFieldConfig["type"] })}
                className={`${fieldClass} w-40 shrink-0`}
              >
                {FIELD_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => onChange({ ...block, fields: block.fields.filter((_, idx) => idx !== i) })}
                className="shrink-0 text-md-on-surface-variant hover:text-md-error"
              >
                <i className="ti ti-x text-sm" />
              </button>
            </div>
            <div className="flex items-center gap-2">
              <input
                value={field.placeholder || ""}
                onChange={(e) => updateField(i, { placeholder: e.target.value })}
                placeholder="Placeholder (опционально)"
                className={`${fieldClass} min-w-[100px] flex-1`}
              />
              {field.type === "select" && (
                <input
                  value={(field.options || []).join(", ")}
                  onChange={(e) => updateField(i, { options: e.target.value.split(",").map((o) => o.trim()).filter(Boolean) })}
                  placeholder="Варианты через запятую"
                  className={`${fieldClass} min-w-[140px] flex-1`}
                />
              )}
              <label className="flex shrink-0 items-center gap-1.5 text-[12px] text-md-on-surface-variant">
                <input type="checkbox" checked={!!field.required} onChange={(e) => updateField(i, { required: e.target.checked })} />
                обязательное
              </label>
              {field.type === "tel" && (
                <label className="flex shrink-0 items-center gap-1.5 text-[12px] text-md-on-surface-variant">
                  <input
                    type="checkbox"
                    checked={!!field.phone_country_code}
                    onChange={(e) => updateField(i, { phone_country_code: e.target.checked })}
                  />
                  код страны
                </label>
              )}
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={() =>
            onChange({
              ...block,
              fields: [...block.fields, { key: slugify("", `field_${block.fields.length}`), label: "", type: "text", required: false }],
            })
          }
          className="w-fit rounded-md border border-md-outline-variant px-3 py-1.5 text-[13px] text-md-on-surface hover:border-md-outline"
        >
          + Добавить поле
        </button>
      </div>

      <div className="flex items-center gap-2">
        <span className="shrink-0 text-[12px] text-md-on-surface-variant">Хотя бы одно из двух полей обязательно:</span>
        <select
          value={block.either_required?.[0] || ""}
          onChange={(e) =>
            onChange({
              ...block,
              either_required: e.target.value ? [e.target.value, block.either_required?.[1] || ""] : undefined,
            })
          }
          className={`${fieldClass} min-w-[100px] flex-1`}
        >
          <option value="">—</option>
          {block.fields.map((f) => (
            <option key={f.key} value={f.key}>
              {f.label || f.key}
            </option>
          ))}
        </select>
        <select
          value={block.either_required?.[1] || ""}
          onChange={(e) =>
            onChange({
              ...block,
              either_required: e.target.value ? [block.either_required?.[0] || "", e.target.value] : undefined,
            })
          }
          className={`${fieldClass} min-w-[100px] flex-1`}
        >
          <option value="">—</option>
          {block.fields.map((f) => (
            <option key={f.key} value={f.key}>
              {f.label || f.key}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-2 rounded-md border border-md-outline-variant p-3">
        <div className="flex items-center justify-between">
          <p className="text-[13px] font-medium text-md-on-surface-variant">Левая колонка «Get in Touch»</p>
          {block.get_in_touch ? (
            <button
              type="button"
              onClick={() => onChange({ ...block, get_in_touch: undefined })}
              className="text-[12px] text-md-on-surface-variant hover:text-md-error"
            >
              Убрать колонку
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onChange({ ...block, get_in_touch: { heading: "Get in Touch", channels: [] } })}
              className="text-[12px] text-md-on-surface hover:underline"
            >
              + Добавить колонку
            </button>
          )}
        </div>

        {block.get_in_touch && (
          <>
            <input
              value={block.get_in_touch.heading || ""}
              onChange={(e) => onChange({ ...block, get_in_touch: { ...block.get_in_touch!, heading: e.target.value } })}
              placeholder="Заголовок (Get in Touch)"
              className={inputClass}
            />
            <textarea
              value={block.get_in_touch.description || ""}
              onChange={(e) => onChange({ ...block, get_in_touch: { ...block.get_in_touch!, description: e.target.value } })}
              placeholder="Короткое пояснение (опционально)"
              rows={2}
              className={inputClass}
            />

            <p className="mt-1 text-[13px] font-medium text-md-on-surface-variant">Каналы связи</p>
            {block.get_in_touch.channels.map((channel, i) => {
              function updateChannel(patch: Partial<Channel>) {
                const channels = [...block.get_in_touch!.channels];
                channels[i] = { ...channels[i], ...patch };
                onChange({ ...block, get_in_touch: { ...block.get_in_touch!, channels } });
              }
              return (
                <div key={i} className="flex flex-col gap-1.5 rounded-md border border-md-outline-variant p-2">
                  <div className="flex items-center gap-2">
                    <input
                      value={channel.icon || ""}
                      onChange={(e) => updateChannel({ icon: e.target.value })}
                      placeholder="ti-mail"
                      className={`${fieldClass} w-24 shrink-0`}
                    />
                    <input
                      value={channel.title}
                      onChange={(e) => updateChannel({ title: e.target.value })}
                      placeholder="Название (General inquiries)"
                      className={`${fieldClass} min-w-[120px] flex-1`}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        onChange({
                          ...block,
                          get_in_touch: { ...block.get_in_touch!, channels: block.get_in_touch!.channels.filter((_, idx) => idx !== i) },
                        })
                      }
                      className="shrink-0 text-md-on-surface-variant hover:text-md-error"
                    >
                      <i className="ti ti-x text-sm" />
                    </button>
                  </div>
                  <input
                    value={channel.description || ""}
                    onChange={(e) => updateChannel({ description: e.target.value })}
                    placeholder="Короткое описание (опционально)"
                    className={inputClass}
                  />
                  <div className="flex items-center gap-2">
                    <input
                      value={channel.email || ""}
                      onChange={(e) => updateChannel({ email: e.target.value })}
                      placeholder="Email (опционально)"
                      className={`${fieldClass} min-w-[100px] flex-1`}
                    />
                    <input
                      value={channel.phone || ""}
                      onChange={(e) => updateChannel({ phone: e.target.value })}
                      placeholder="Телефон (опционально, только реальный)"
                      className={`${fieldClass} min-w-[100px] flex-1`}
                    />
                  </div>
                </div>
              );
            })}
            <button
              type="button"
              onClick={() =>
                onChange({
                  ...block,
                  get_in_touch: { ...block.get_in_touch!, channels: [...block.get_in_touch!.channels, { title: "" }] },
                })
              }
              className="w-fit rounded-md border border-md-outline-variant px-3 py-1.5 text-[13px] text-md-on-surface hover:border-md-outline"
            >
              + Добавить канал
            </button>

            <div className="mt-1 grid grid-cols-2 gap-2">
              <input
                value={block.get_in_touch.office || ""}
                onChange={(e) => onChange({ ...block, get_in_touch: { ...block.get_in_touch!, office: e.target.value } })}
                placeholder="Office (опционально — пусто = не показывать)"
                className={inputClass}
              />
              <input
                value={block.get_in_touch.business_hours || ""}
                onChange={(e) => onChange({ ...block, get_in_touch: { ...block.get_in_touch!, business_hours: e.target.value } })}
                placeholder="Business hours (опционально — пусто = не показывать)"
                className={inputClass}
              />
            </div>
          </>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <input
          value={block.submit_label || ""}
          onChange={(e) => onChange({ ...block, submit_label: e.target.value })}
          placeholder="Текст кнопки (Отправить)"
          className={inputClass}
        />
        <input
          value={block.success_message || ""}
          onChange={(e) => onChange({ ...block, success_message: e.target.value })}
          placeholder="Сообщение после отправки"
          className={inputClass}
        />
      </div>
    </div>
  );
}
