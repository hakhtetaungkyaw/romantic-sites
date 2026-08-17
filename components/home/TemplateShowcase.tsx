"use client";

import { useMemo, useState } from "react";

import Reveal from "@/components/home/Reveal";
import TemplateCard, { type ShowcaseTemplate } from "@/components/home/TemplateCard";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export type { ShowcaseTemplate };

// No dedicated preview screenshots yet — cycle through demo gallery photos.
const FALLBACK_IMAGES = [
  "/demo-assets/photos/couple-04.jpg",
  "/demo-assets/photos/couple-05.jpg",
  "/demo-assets/photos/couple-09.jpg",
];

const FILTER_KEYS = ["all", "anniversary", "birthday"] as const;

type FilterKey = (typeof FILTER_KEYS)[number];

interface TemplateShowcaseProps {
  templates: ShowcaseTemplate[];
}

export default function TemplateShowcase({ templates }: TemplateShowcaseProps) {
  const { t } = useLanguage();
  const [filter, setFilter] = useState<FilterKey>("all");

  const filtered = useMemo(
    () =>
      filter === "all" ? templates : templates.filter((template) => template.category === filter),
    [templates, filter],
  );

  return (
    <section id="showcase" className="border-t border-white/5 px-6 py-24 sm:px-10">
      <div className="mx-auto max-w-6xl">
        <Reveal className="mx-auto max-w-xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-[#f4f4f5] sm:text-4xl">
            {t.showcase.heading}
          </h2>
          <p className="mt-3 text-[#a1a1aa]">{t.showcase.subtitle}</p>
        </Reveal>

        <div className="mt-8 flex justify-center gap-2">
          {FILTER_KEYS.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${filter === key
                  ? "border-[#6366f1] bg-[#6366f1]/10 text-[#f4f4f5]"
                  : "border-white/10 text-[#a1a1aa] hover:border-white/25 hover:text-[#f4f4f5]"
                }`}
            >
              {t.showcase.filters[key]}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <p className="mt-14 text-center text-[#a1a1aa]">
            {filter === "birthday" ? t.showcase.emptyBirthday : t.showcase.emptyGeneric}
          </p>
        ) : (
          <div className="mt-10 grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] items-start gap-6">
            {filtered.map((template, index) => (
              <Reveal key={template.id} delay={Math.min(index, 4) * 0.06}>
                <TemplateCard
                  template={template}
                  fallbackImage={FALLBACK_IMAGES[index % FALLBACK_IMAGES.length]}
                />
              </Reveal>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
