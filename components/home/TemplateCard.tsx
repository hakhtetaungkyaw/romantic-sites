"use client";

import { Eye } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { CSSProperties, KeyboardEvent, MouseEvent } from "react";

import { useLanguage } from "@/lib/i18n/LanguageContext";

export interface ShowcaseTemplate {
  id: string;
  name: string;
  componentKey: string;
  category: string;
  price: number;
  previewImage: string | null;
}

interface CardAccent {
  border: string;
  borderHover: string;
  glow: string;
  badgeBorder: string;
}

const CARD_ACCENTS: Record<string, CardAccent> = {
  "anniversary-v1": {
    border: "rgba(217,122,95,0.4)",
    borderHover: "rgba(217,122,95,0.85)",
    glow: "rgba(217,122,95,0.4)",
    badgeBorder: "rgba(217,122,95,0.45)",
  },

  "anniversary-v2": {
    border: "rgba(140,51,85,0.45)",
    borderHover: "rgba(212,175,122,0.85)",
    glow: "rgba(212,175,122,0.4)",
    badgeBorder: "rgba(140,51,85,0.5)",
  },

  "birthday-v1": {
    border: "rgba(224, 105, 232, 0.4)",
    borderHover: "rgba(232, 63, 221, 0.85)",
    glow: "rgba(226, 103, 235, 0.4)",
    badgeBorder: "rgba(193, 24, 227, 0.2)",
  },
};

const DEFAULT_ACCENT: CardAccent = {
  border: "rgba(255,255,255,0.1)",
  borderHover: "rgba(99,102,241,0.6)",
  glow: "rgba(99,102,241,0.3)",
  badgeBorder: "rgba(255,255,255,0.15)",
};

interface TemplateCardProps {
  template: ShowcaseTemplate;
  fallbackImage: string;
}

export default function TemplateCard({ template, fallbackImage }: TemplateCardProps) {
  const { t } = useLanguage();
  const router = useRouter();
  const demoUrl = `/preview/${template.componentKey}`;
  const accent = CARD_ACCENTS[template.componentKey] ?? DEFAULT_ACCENT;

  const accentStyle = {
    "--accent-border": accent.border,
    "--accent-border-hover": accent.borderHover,
    "--accent-glow": accent.glow,
    "--accent-badge-border": accent.badgeBorder,
  } as CSSProperties;

  const openDemo = () => {
    router.push(demoUrl);
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

  const handlePreviewClick = (event: MouseEvent<HTMLAnchorElement>) => {
    event.stopPropagation();
  };

  return (
    <div
      role="link"
      tabIndex={0}
      onClick={openDemo}
      onKeyDown={handleKeyDown}
      aria-label={t.showcase.viewDemoAria(template.name)}
      style={accentStyle}
      className="group mx-auto w-full max-w-[380px] cursor-pointer overflow-hidden rounded-lg border border-white/10 bg-white/[0.02] [border-bottom-width:2px] [border-bottom-color:var(--accent-border)] transition-[transform,box-shadow,border-color] duration-300 ease-out hover:-translate-y-1 hover:scale-[1.025] hover:[border-bottom-color:var(--accent-border-hover)] hover:shadow-[0_20px_48px_-18px_var(--accent-glow)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6366f1]"
    >
      <div className="relative w-full aspect-[4/5] max-h-[170px] overflow-hidden">
        <Image
          src={template.previewImage ?? fallbackImage}
          alt={`${template.name} preview`}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 380px"
          className="object-cover"
        />
        <span className="absolute left-2 top-2 rounded-full border border-white/15 bg-black/50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-[#e4e4e7] backdrop-blur-sm [border-color:var(--accent-badge-border)]">
          {t.showcase.filters[template.category as "anniversary" | "birthday"] ??
            template.category}
        </span>
      </div>
      <div className="p-4">
        <Link
          href={demoUrl}
          onClick={handlePreviewClick}
          className="relative z-10 inline-flex items-center gap-1 text-[11px] font-medium text-[#a1a1aa] transition-colors hover:text-[#f4f4f5]"
        >
          <Eye size={12} aria-hidden="true" />
          {t.showcase.previewLabel}
        </Link>
        <h3 className="mt-1.5 text-sm font-semibold text-[#f4f4f5]">{template.name}</h3>
        <button
          type="button"
          onClick={handleOrderClick}
          className="relative z-10 mt-4 w-full rounded-full bg-[#6366f1] px-3 py-2 text-center text-xs font-medium text-white transition-colors hover:bg-[#5457e5]"
        >
          {t.showcase.orderThisStyle}
        </button>
      </div>
    </div>
  );
}
