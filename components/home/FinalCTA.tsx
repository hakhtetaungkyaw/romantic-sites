"use client";

import Image from "next/image";

import Reveal from "@/components/home/Reveal";
import { useLanguage } from "@/lib/i18n/LanguageContext";

const CONTACT_URL = "https://t.me/vowxteam";
const EMAIL_ADDRESS = "vowxteam@gmail.com";

export default function FinalCTA() {
  const { t } = useLanguage();

  return (
    <section
      id="contact"
      className="border-t border-white/5 px-6 py-24 text-center sm:px-10"
    >
      <Reveal className="mx-auto max-w-xl">
        <h2 className="text-3xl font-semibold tracking-tight text-[#f4f4f5] sm:text-4xl">
          {t.finalCta.heading}
        </h2>
        <p className="mt-4 text-[#a1a1aa]">{t.finalCta.subtitle}</p>
        <a
          href={CONTACT_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-8 inline-flex items-center justify-center rounded-full bg-[#6366f1] px-8 py-3.5 text-sm font-medium text-white transition-all hover:-translate-y-0.5 hover:bg-[#5457e5]"
        >
          {t.finalCta.button}
        </a>
        <div className="mt-4">
          <a
            href={`mailto:${EMAIL_ADDRESS}`}
            className="text-sm text-[#a1a1aa] underline decoration-white/20 underline-offset-4 transition-colors hover:text-[#6366f1]"
          >
          </a>
        </div>

        <div className="mt-10 flex flex-col items-center gap-3">
          <div className="flex flex-wrap items-center justify-center gap-4">
            {/* Transparent background — sits directly on the dark page. */}
            <Image
              src="/payment-logo/kbz.webp"
              alt="KBZPay"
              width={200}
              height={200}
              className="h-10 w-10 object-contain"
            />
            {/* Opaque (non-transparent) source file — given a small light
                card so its square edges don't sit raw against the dark
                background, matching the transparent KBZPay logo's footprint. */}
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white p-1.5">
              <Image
                src="/payment-logo/wave.webp"
                alt="Wave Money"
                width={200}
                height={200}
                className="h-full w-full object-contain"
              />
            </div>
          </div>
          <p className="max-w-sm text-xs text-[#71717a]">{t.payment.note}</p>
        </div>
      </Reveal>
    </section>
  );
}
