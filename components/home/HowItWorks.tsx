import { Gift, ImagePlus, LayoutTemplate, Wand2 } from "lucide-react";

import Reveal from "@/components/home/Reveal";

const steps = [
  {
    number: "01",
    icon: LayoutTemplate,
    title: "Pick your style",
    description: "Browse templates, choose your favorite.",
  },
  {
    number: "02",
    icon: ImagePlus,
    title: "Share your story",
    description: "Send your photos, names, and memories.",
  },
  {
    number: "03",
    icon: Wand2,
    title: "We craft it",
    description: "Your personalized site, built in days.",
  },
  {
    number: "04",
    icon: Gift,
    title: "Get your link",
    description: "A private link, ready to share.",
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="border-t border-white/5 px-6 py-24 sm:px-10">
      <div className="mx-auto max-w-6xl">
        <Reveal className="mx-auto max-w-xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-[#f4f4f5] sm:text-4xl">
            How it works
          </h2>
        </Reveal>

        <div className="relative mt-16 grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
          <div
            className="pointer-events-none absolute inset-x-0 top-[18px] hidden h-px bg-white/10 lg:block"
            aria-hidden="true"
          />

          {steps.map((step, index) => (
            <Reveal key={step.number} delay={index * 0.08} className="relative">
              <div className="relative z-10 flex items-center gap-3 bg-[#0a0a0b] pr-6 lg:pr-8">
                <span className="text-3xl font-bold tracking-tight text-white/15">
                  {step.number}
                </span>
                <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-[#0a0a0b] text-[#6366f1]">
                  <step.icon size={18} aria-hidden="true" />
                </div>
              </div>
              <h3 className="mt-4 text-base font-semibold text-[#f4f4f5]">
                {step.title}
              </h3>
              <p className="mt-1 text-sm text-[#a1a1aa]">{step.description}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
