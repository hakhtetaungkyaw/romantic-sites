"use client";

import { useMemo, useState } from "react";

import Reveal from "@/components/home/Reveal";
import TemplateCard, { type ShowcaseTemplate } from "@/components/home/TemplateCard";

export type { ShowcaseTemplate };

// No dedicated preview screenshots yet — cycle through demo gallery photos.
const FALLBACK_IMAGES = [
  "/demo-assets/photos/couple-04.jpg",
  "/demo-assets/photos/couple-05.jpg",
  "/demo-assets/photos/couple-09.jpg",
];

const FILTERS = [
  { key: "all", label: "All" },
  { key: "anniversary", label: "Anniversary" },
  { key: "birthday", label: "Birthday" },
] as const;

type FilterKey = (typeof FILTERS)[number]["key"];

interface TemplateShowcaseProps {
  templates: ShowcaseTemplate[];
}

export default function TemplateShowcase({ templates }: TemplateShowcaseProps) {
  const [filter, setFilter] = useState<FilterKey>("all");

  const filtered = useMemo(
    () => (filter === "all" ? templates : templates.filter((t) => t.category === filter)),
    [templates, filter],
  );

  return (
    <section id="showcase" className="border-t border-white/5 px-6 py-24 sm:px-10">
      <div className="mx-auto max-w-6xl">
        <Reveal className="mx-auto max-w-xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-[#f4f4f5] sm:text-4xl">
            Choose your style
          </h2>
          <p className="mt-3 text-[#a1a1aa]">
            Every template is fully personalized with your own photos, names, and
            story.
          </p>
        </Reveal>

        <div className="mt-8 flex justify-center gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${filter === f.key
                  ? "border-[#6366f1] bg-[#6366f1]/10 text-[#f4f4f5]"
                  : "border-white/10 text-[#a1a1aa] hover:border-white/25 hover:text-[#f4f4f5]"
                }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <p className="mt-14 text-center text-[#a1a1aa]">
            {filter === "birthday"
              ? "Birthday templates coming soon."
              : "New templates are on the way — check back soon."}
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
