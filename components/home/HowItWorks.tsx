"use client";

import { Gift, ImagePlus, LayoutTemplate, Wand2 } from "lucide-react";

import Reveal from "@/components/home/Reveal";
import { useLanguage } from "@/lib/i18n/LanguageContext";

const STEP_META = [
  { number: "01", icon: LayoutTemplate },
  { number: "02", icon: ImagePlus },
  { number: "03", icon: Wand2 },
  { number: "04", icon: Gift },
];

export default function HowItWorks() {
  const { t } = useLanguage();

  return (
    <section id="how-it-works" className="border-t border-white/5 px-6 py-24 sm:px-10">
      <div className="mx-auto max-w-6xl">
        <Reveal className="mx-auto max-w-xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-[#f4f4f5] sm:text-4xl">
            {t.howItWorks.heading}
          </h2>
        </Reveal>

        <div className="relative mt-16 grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
          <div
            className="pointer-events-none absolute inset-x-0 top-[18px] hidden h-px bg-white/10 lg:block"
            aria-hidden="true"
          />

          {STEP_META.map((meta, index) => {
            const step = t.howItWorks.steps[index];
            return (
              <Reveal key={meta.number} delay={index * 0.08} className="relative">
                <div className="relative z-10 flex items-center gap-3 bg-[#0a0a0b] pr-6 lg:pr-8">
                  <span className="text-3xl font-bold tracking-tight text-white/15">
                    {meta.number}
                  </span>
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-[#0a0a0b] text-[#6366f1]">
                    <meta.icon size={18} aria-hidden="true" />
                  </div>
                </div>
                <h3 className="mt-4 text-base font-semibold text-[#f4f4f5]">
                  {step.title}
                </h3>
                <p className="mt-1 text-sm text-[#a1a1aa]">{step.description}</p>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
