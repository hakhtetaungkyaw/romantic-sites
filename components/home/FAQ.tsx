"use client";

import { useState } from "react";

import Reveal from "@/components/home/Reveal";
import { useLanguage } from "@/lib/i18n/LanguageContext";

// Bootstrap Icons' "chevron-down" glyph, inlined as raw path data rather
// than pulling in the bootstrap-icons package for a single icon — same
// visual result, no new dependency.
function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      width={18}
      height={18}
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path
        fillRule="evenodd"
        d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z"
      />
    </svg>
  );
}

export default function FAQ() {
  const { t } = useLanguage();
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="border-t border-white/5 px-6 py-24 sm:px-10">
      <div className="mx-auto max-w-3xl">
        <Reveal className="text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-[#f4f4f5] sm:text-4xl">
            {t.faq.heading}
          </h2>
        </Reveal>

        <div className="mt-10 divide-y divide-white/10 border-y border-white/10">
          {t.faq.items.map((item, index) => {
            const open = openIndex === index;
            return (
              <div key={item.question}>
                <button
                  type="button"
                  onClick={() => setOpenIndex(open ? null : index)}
                  aria-expanded={open}
                  className="flex w-full items-center justify-between gap-4 py-5 text-left text-sm font-medium text-[#f4f4f5] transition-colors hover:text-[#6366f1] sm:text-base"
                >
                  {item.question}
                  <ChevronIcon
                    className={`shrink-0 text-[#a1a1aa] transition-transform duration-300 ${
                      open ? "rotate-180" : ""
                    }`}
                  />
                </button>
                <div
                  className={`grid transition-[grid-template-rows] duration-300 ease-out ${
                    open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                  }`}
                >
                  <div className="overflow-hidden">
                    <p className="pb-5 pr-8 text-sm leading-relaxed text-[#a1a1aa]">
                      {item.answer}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
