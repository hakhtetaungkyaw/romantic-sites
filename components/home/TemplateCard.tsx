"use client";

import Image from "next/image";
import type { KeyboardEvent, MouseEvent } from "react";

import { formatPrice } from "@/lib/format";

export interface ShowcaseTemplate {
  id: string;
  name: string;
  componentKey: string;
  category: string;
  price: number;
  previewImage: string | null;
}

const CATEGORY_LABELS: Record<string, string> = {
  anniversary: "Anniversary",
  birthday: "Birthday",
};

interface TemplateCardProps {
  template: ShowcaseTemplate;
  fallbackImage: string;
}

export default function TemplateCard({ template, fallbackImage }: TemplateCardProps) {
  const demoUrl = `/preview/${template.componentKey}`;

  const openDemo = () => {
    window.open(demoUrl, "_blank", "noopener,noreferrer");
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openDemo();
    }
  };

  const handleOrderClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div
      role="link"
      tabIndex={0}
      onClick={openDemo}
      onKeyDown={handleKeyDown}
      aria-label={`View demo of ${template.name} (opens in a new tab)`}
      className="group mx-auto w-full max-w-[380px] cursor-pointer overflow-hidden rounded-lg border border-white/10 bg-white/[0.02] transition-all duration-300 hover:-translate-y-0.5 hover:border-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6366f1]"
    >
      <div className="relative w-full aspect-[4/5] max-h-[170px] overflow-hidden">
        <Image
          src={template.previewImage ?? fallbackImage}
          alt={`${template.name} preview`}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 380px"
          className="object-cover"
        />
        <span className="absolute left-2 top-2 rounded-full border border-white/15 bg-black/50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-[#e4e4e7] backdrop-blur-sm">
          {CATEGORY_LABELS[template.category] ?? template.category}
        </span>
      </div>
      <div className="p-3.5">
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="text-sm font-semibold text-[#f4f4f5]">{template.name}</h3>
          <span className="whitespace-nowrap text-xs font-semibold text-[#6366f1]">
            {formatPrice(template.price)}
          </span>
        </div>
        <button
          type="button"
          onClick={handleOrderClick}
          className="relative z-10 mt-3 w-full rounded-full bg-[#6366f1] px-3 py-2 text-center text-xs font-medium text-white transition-colors hover:bg-[#5457e5]"
        >
          Order This Style
        </button>
      </div>
    </div>
  );
}
