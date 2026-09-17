"use client";

import { useMemo, useState } from "react";
import { useIsAdmin } from "@/lib/role-context";
import { FormTabs } from "@/components/admin/m3/FormTabs";
import { HelpAccordionItem } from "@/components/admin/HelpAccordionItem";
import { HELP_CATEGORIES } from "./content";

export default function HelpPage() {
  const isAdmin = useIsAdmin();
  const categories = useMemo(() => HELP_CATEGORIES.filter((c) => !c.adminOnly || isAdmin), [isAdmin]);
  const [activeId, setActiveId] = useState(categories[0].id);
  const [query, setQuery] = useState("");

  const active = categories.find((c) => c.id === activeId) || categories[0];

  const filteredItems = useMemo(() => {
    if (!query.trim()) return active.items;
    const q = query.trim().toLowerCase();
    return active.items.filter((item) => item.q.toLowerCase().includes(q) || item.a.some((p) => p.toLowerCase().includes(q)));
  }, [active, query]);

  return (
    <div>
      <div className="mb-5">
        <h1 className="md-headline-small mb-1 text-md-on-surface">Помощь</h1>
        <p className="md-body-medium m-0 text-md-on-surface-variant">
          Подробный разбор каждого раздела админки — что за что отвечает и как наполнять сайт контентом.
        </p>
      </div>

      <FormTabs
        tabs={categories.map((c) => ({ id: c.id, label: c.label, icon: c.icon }))}
        active={activeId}
        onChange={(id) => {
          setActiveId(id);
          setQuery("");
        }}
      />

      <div className="mt-5 flex flex-col gap-4">
        <div className="rounded-lg border border-md-outline-variant bg-md-surface-container-low p-4">
          <p className="md-body-medium m-0 text-md-on-surface-variant" style={{ lineHeight: 1.7 }}>
            {active.intro}
          </p>
        </div>

        <div className="relative">
          <i className="ti ti-search absolute left-3 top-1/2 -translate-y-1/2 text-base text-md-on-surface-variant" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Поиск по разделу «${active.label}»...`}
            className="block w-full rounded-lg border border-md-outline-variant bg-transparent py-2 pl-9 pr-3 text-sm text-md-on-surface outline-none focus:border-md-primary"
          />
        </div>

        <div className="flex flex-col gap-2.5">
          {filteredItems.length === 0 ? (
            <p className="md-body-medium text-md-on-surface-variant">Ничего не найдено по запросу «{query}».</p>
          ) : (
            filteredItems.map((item, i) => <HelpAccordionItem key={item.q} item={item} defaultOpen={filteredItems.length === 1 && i === 0} />)
          )}
        </div>
      </div>
    </div>
  );
}
